import time
import threading
import logging
from infrastructure.databases.postgres import session
from infrastructure.models.app_drone_model import DroneModel
from infrastructure.models.app_giao_hang_model import GiaoHangModel
from infrastructure.models.app_tram_ha_canh_model import TramHaCanhModel
from infrastructure.models.app_don_hang_model import DonHangModel
from infrastructure.models.app_goi_hang_model import GoiHangModel

logger = logging.getLogger(__name__)

# Progress cache for active deliveries (delivery_id -> float progress between 0.0 and 1.0)
_delivery_progress = {}

def update_drone_telemetry_loop():
    """
    Background daemon task running every 3 seconds to update drone coordinates in Supabase Postgres DB.
    """
    logger.info("Starting Drone Simulator Background Telemetry Loop...")
    while True:
        try:
            db = session()
            try:
                drones = db.query(DroneModel).all()
                
                # 1. Sync orders in 'Đang giao', 'Đã đến', or 'Đã lên lịch' status into GiaoHangModel
                active_orders = db.query(DonHangModel).filter(
                    DonHangModel.trang_thai_don_hang.in_([
                        'Đang giao', 'DANG_GIAO', 'IN_TRANSIT', 'ĐANG GIAO',
                        'Đã đến', 'DA_DEN', 'ARRIVED', 'ĐÃ ĐẾN',
                        'Đã lên lịch', 'DA_LEN_LICH', 'SCHEDULED', 'Chờ giao', 'CHO_GIAO'
                    ])
                ).all()

                for order in active_orders:
                    deliv = db.query(GiaoHangModel).filter_by(ma_don_hang=order.ma_don_hang).first()
                    if not deliv:
                        deliv = GiaoHangModel(
                            ma_don_hang=order.ma_don_hang,
                            trang_thai_giao_hang=order.trang_thai_don_hang or 'Đang giao'
                        )
                        db.add(deliv)
                        db.flush()
                    elif deliv.trang_thai_giao_hang not in ['Đang giao', 'Đã đến']:
                        deliv.trang_thai_giao_hang = order.trang_thai_don_hang or 'Đang giao'

                active_deliveries = db.query(GiaoHangModel).filter(
                    GiaoHangModel.trang_thai_giao_hang.in_([
                        'Đang giao', 'DANG_GIAO', 'IN_TRANSIT', 'ĐANG GIAO',
                        'Đã đến', 'DA_DEN', 'ARRIVED', 'ĐÃ ĐẾN',
                        'Đã lên lịch', 'DA_LEN_LICH', 'SCHEDULED', 'Chờ giao', 'CHO_GIAO'
                    ])
                ).all()

                # Map assigned drones to deliveries
                delivery_by_drone = {}
                unassigned_deliveries = []

                for deliv in active_deliveries:
                    if deliv.ma_drone:
                        delivery_by_drone[str(deliv.ma_drone)] = deliv
                    else:
                        unassigned_deliveries.append(deliv)

                # Assign unassigned active deliveries 1-to-1 to available drones & persist in DB
                used_drone_ids = set(delivery_by_drone.keys())
                for deliv in unassigned_deliveries:
                    for drone in drones:
                        dr_id = str(drone.ma_drone)
                        if dr_id not in used_drone_ids:
                            deliv.ma_drone = drone.ma_drone
                            drone.trang_thai_drone = deliv.trang_thai_giao_hang or 'Đang giao'
                            delivery_by_drone[dr_id] = deliv
                            used_drone_ids.add(dr_id)
                            break
                db.commit()

                for drone in drones:
                    drone_id_str = str(drone.ma_drone)
                    delivery = delivery_by_drone.get(drone_id_str)

                    # 1. Resolve Home / Housing Station
                    home_station = None
                    if drone.ma_tram_hien_tai:
                        home_station = db.query(TramHaCanhModel).filter_by(ma_tram=drone.ma_tram_hien_tai).first()
                    if not home_station:
                        home_station = db.query(TramHaCanhModel).first()

                    default_start_lat = float(home_station.lat) if (home_station and home_station.lat) else 10.8048584
                    default_start_lng = float(home_station.lng) if (home_station and home_station.lng) else 106.7167612

                    if delivery and delivery.don_hang:
                        order = delivery.don_hang

                        # 2. Resolve Package (GoiHang) -> Station (TramHaCanh)
                        goi_hang = db.query(GoiHangModel).filter_by(ma_don_hang=order.ma_don_hang).first()
                        package_station = None
                        if goi_hang and goi_hang.ma_tram:
                            package_station = db.query(TramHaCanhModel).filter_by(ma_tram=goi_hang.ma_tram).first()

                        dispatch_station = package_station or home_station
                        start_lat = float(dispatch_station.lat) if (dispatch_station and dispatch_station.lat) else default_start_lat
                        start_lng = float(dispatch_station.lng) if (dispatch_station and dispatch_station.lng) else default_start_lng

                        # 3. Resolve Customer Delivery Address (DiaChi)
                        if order.dia_chi and order.dia_chi.lat is not None and order.dia_chi.lng is not None:
                            dest_lat = float(order.dia_chi.lat)
                            dest_lng = float(order.dia_chi.lng)
                        else:
                            dest_lat = start_lat
                            dest_lng = start_lng

                        deliv_key = str(delivery.ma_giao_hang)
                        current_prog = _delivery_progress.get(deliv_key, 0.05)
                        next_prog = current_prog + 0.05

                        if next_prog >= 1.0 or order.trang_thai_don_hang in ['Đã đến', 'DA_DEN', 'ARRIVED']:
                            # Drone arrived at destination coordinates! Set coordinates equal to delivery address & update status to 'Đã đến'
                            drone.vi_do_hien_tai = dest_lat
                            drone.kinh_do_hien_tai = dest_lng
                            delivery.vi_tri_hien_tai_lat = dest_lat
                            delivery.vi_tri_hien_tai_lng = dest_lng
                            
                            order.trang_thai_don_hang = 'Đã đến'
                            delivery.trang_thai_giao_hang = 'Đã đến'
                            drone.trang_thai_drone = 'Đã đến'
                            _delivery_progress[deliv_key] = 1.0
                        else:
                            _delivery_progress[deliv_key] = next_prog
                            curr_lat = start_lat + next_prog * (dest_lat - start_lat)
                            curr_lng = start_lng + next_prog * (dest_lng - start_lng)

                            drone.vi_do_hien_tai = round(curr_lat, 7)
                            drone.kinh_do_hien_tai = round(curr_lng, 7)
                            drone.trang_thai_drone = 'Đang giao'
                            delivery.vi_tri_hien_tai_lat = round(curr_lat, 7)
                            delivery.vi_tri_hien_tai_lng = round(curr_lng, 7)
                            order.trang_thai_don_hang = 'Đang giao'
                            delivery.trang_thai_giao_hang = 'Đang giao'
                    else:
                        # Idle Drones resting at their station
                        drone.vi_do_hien_tai = round(default_start_lat - 0.0008, 7)
                        drone.kinh_do_hien_tai = round(default_start_lng + 0.0008, 7)
                        drone.trang_thai_drone = 'Sẵn sàng'

                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"Error updating drone simulation telemetry: {e}")
            finally:
                try:
                    session.remove()
                except Exception:
                    pass
        except Exception as outer_e:
            logger.error(f"Outer simulator thread error: {outer_e}")

        time.sleep(6)

def start_drone_simulator_thread():
    t = threading.Thread(target=update_drone_telemetry_loop, daemon=True)
    t.start()
    return t
