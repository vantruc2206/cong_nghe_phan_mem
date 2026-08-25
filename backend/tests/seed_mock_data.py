import sys
import os

# Ensure python can import from backend/src
src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if src_path not in sys.path:
    sys.path.append(src_path)

from infrastructure.databases.postgres import session
from infrastructure.models.app_vai_tro_model import VaiTroModel
from infrastructure.models.app_nguoi_dung_model import NguoiDungModel
from infrastructure.models.app_khach_hang_model import KhachHangModel
from infrastructure.models.app_dia_chi_model import DiaChiModel
from infrastructure.models.app_tram_ha_canh_model import TramHaCanhModel
from infrastructure.models.app_drone_model import DroneModel
from infrastructure.models.app_don_hang_model import DonHangModel
from infrastructure.models.app_goi_hang_model import GoiHangModel
from infrastructure.models.app_giao_hang_model import GiaoHangModel

def seed_data():
    print("=== SEEDING MOCK TEST DATA ===")
    
    # 1. Check or insert Roles
    admin_role = session.query(VaiTroModel).filter_by(ten_vai_tro='Admin').first()
    if not admin_role:
        print("Creating default role: Admin...")
        admin_role = VaiTroModel(ten_vai_tro='Admin')
        session.add(admin_role)
        session.commit()
        
    dispatcher_role = session.query(VaiTroModel).filter_by(ten_vai_tro='Dispatcher').first()
    if not dispatcher_role:
        print("Creating default role: Dispatcher...")
        dispatcher_role = VaiTroModel(ten_vai_tro='Dispatcher')
        session.add(dispatcher_role)
        session.commit()

    # 2. Check or insert User (for dispatching)
    dispatcher_user = session.query(NguoiDungModel).filter_by(email='dispatcher@smartdrone.com').first()
    if not dispatcher_user:
        print("Creating testing dispatcher user...")
        dispatcher_user = NguoiDungModel(
            ma_vai_tro=dispatcher_role.ma_vai_tro,
            ho_ten="Nguyen Tin Thac",
            email="dispatcher@smartdrone.com",
            so_dien_thoai="0123456789",
            mat_khau_hash="pbkdf2:sha256:260000$mock_hash_here" 
        )
        session.add(dispatcher_user)
        session.commit()

    # 3. Check or insert Customer
    customer = session.query(KhachHangModel).filter_by(email='khachhang@gmail.com').first()
    if not customer:
        print("Creating mock Customer...")
        customer = KhachHangModel(
            ten="An",
            ten_dem="Van",
            ho="Nguyen",
            gioi_tinh="Nam",
            so_dien_thoai="0987654321",
            email="khachhang@gmail.com"
        )
        session.add(customer)
        session.commit()
        
    # 4. Check or insert Address (in Hanoi Ba Dinh: 21.0368, 105.8342)
    address = session.query(DiaChiModel).filter_by(ma_kh=customer.ma_kh).first()
    if not address:
        print("Creating mock Customer Address (Ba Dinh, Hanoi)...")
        address = DiaChiModel(
            ma_kh=customer.ma_kh,
            dia_chi_cu_the="Số 10 Hùng Vương, Ba Đình, Hà Nội",
            thanh_pho="Hà Nội",
            lat=21.0368,
            lng=105.8342
        )
        session.add(address)
        session.commit()
        
    # 5. Check or insert Station (in Hanoi Bach Khoa: 21.0065, 105.8431)
    station = session.query(TramHaCanhModel).filter_by(ten_tram="Trạm Bách Khoa").first()
    if not station:
        print("Creating mock Landing Station (Bach Khoa, Hanoi)...")
        station = TramHaCanhModel(
            ten_tram="Trạm Bách Khoa",
            dia_chi_tram="Đại Cồ Việt, Bách Khoa, Hà Nội",
            lat=21.0065,
            lng=105.8431,
            cong_suat_toi_da=10,
            trang_thai_hoat_dong="Đang hoạt động"
        )
        session.add(station)
        session.commit()
        
    # 6. Check or insert Drone (status: Sẵn sàng, pin 100%)
    drone = session.query(DroneModel).filter_by(trang_thai_drone="Sẵn sàng").first()
    if not drone:
        print("Creating mock Drone...")
        drone = DroneModel(
            trang_thai_drone="Sẵn sàng",
            cong_suat_pin=100
        )
        session.add(drone)
        session.commit()
        
    # 7. Create a DonHang (Order in status 'Đang giao')
    order = session.query(DonHangModel).filter_by(ma_kh=customer.ma_kh, trang_thai_don_hang='Đang giao').first()
    if not order:
        print("Creating mock Order in 'Đang giao' state...")
        order = DonHangModel(
            ma_kh=customer.ma_kh,
            ma_dia_chi=address.ma_dia_chi,
            trang_thai_don_hang='Đang giao',
            cach_thuc_thanh_toan="COD",
            tong_tien=150000.00
        )
        session.add(order)
        session.commit()
        
    # 8. Create GoiHang (Package in order)
    package = session.query(GoiHangModel).filter_by(ma_don_hang=order.ma_don_hang).first()
    if not package:
        print("Creating mock Package...")
        package = GoiHangModel(
            ma_don_hang=order.ma_don_hang,
            ma_tram=station.ma_tram,
            loai_hang_hoa="Thiết bị điện tử",
            can_nang=2.5,
            kich_co="Trung bình",
            gia_tri_uoc_tinh=120000.00
        )
        session.add(package)
        session.commit()
        
    # 9. Create GiaoHang (Delivery trip linked to Order and Drone, status 'Đang giao')
    delivery = session.query(GiaoHangModel).filter_by(ma_don_hang=order.ma_don_hang).first()
    if not delivery:
        print("Creating mock Delivery trip in 'Đang giao' state...")
        delivery = GiaoHangModel(
            ma_don_hang=order.ma_don_hang,
            ma_drone=drone.ma_drone,
            ma_nguoi_phu_trach=dispatcher_user.ma_nguoi_dung,
            trang_thai_giao_hang='Đang giao',
            vi_tri_hien_tai_lat=station.lat, 
            vi_tri_hien_tai_lng=station.lng
        )
        session.add(delivery)
        session.commit()
        
    # Make sure drone status is marked as 'Đang giao'
    drone.trang_thai_drone = "Đang giao"
    session.commit()
    
    print("\n=== SEEDING COMPLETED SUCCESSFULLY! ===")
    print(f"Khách hàng: {customer.ten} (ID: {customer.ma_kh})")
    print(f"Địa chỉ: {address.dia_chi_cu_the} ({address.lat}, {address.lng})")
    print(f"Trạm hạ cánh: {station.ten_tram} ({station.lat}, {station.lng})")
    print(f"Drone: {drone.ma_drone} (Trạng thái: {drone.trang_thai_drone})")
    print(f"Đơn hàng ID: {order.ma_don_hang}")
    print(f"Chuyến giao hàng ID: {delivery.ma_giao_hang}")
    print("\nBây giờ bạn có thể chạy giả lập di chuyển Drone:")
    print("python backend/tests/simulate_drone.py")

if __name__ == '__main__':
    seed_data()
