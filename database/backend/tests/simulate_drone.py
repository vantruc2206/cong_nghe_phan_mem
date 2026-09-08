import sys
import os
import time

# Ensure python can import from backend/src
src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if src_path not in sys.path:
    sys.path.append(src_path)

from infrastructure.databases.postgres import session
from infrastructure.models.app_giao_hang_model import GiaoHangModel
from infrastructure.models.app_tram_ha_canh_model import TramHaCanhModel
from infrastructure.models.app_don_hang_model import DonHangModel

def run_simulation():
    print("=== SMARTDRONE LOCATION SIMULATOR ===")
    
    # 1. Find an active delivery trip in status 'Đang giao'
    delivery = session.query(GiaoHangModel).filter_by(trang_thai_giao_hang='Đang giao').first()
    if not delivery:
        print("Không tìm thấy chuyến giao hàng nào ở trạng thái 'Đang giao'!")
        print("Các bước cần thực hiện trước:")
        print("1. Duyệt đơn hàng: POST /orders/<ma_don_hang>/approve")
        print("2. Lập lịch giao hàng: POST /orders/<ma_don_hang>/schedule")
        print("3. Trạm nhận kiện hoặc dispatch để chuyển trạng thái sang 'Đang giao'.")
        return
        
    order = delivery.don_hang
    if not order:
        print("Không tìm thấy đơn hàng tương ứng của chuyến giao hàng này!")
        return
        
    address = order.dia_chi
    if not address or address.lat is None or address.lng is None:
        print("Địa chỉ giao hàng bị thiếu tọa độ Lat/Lng!")
        return
        
    # Get landing station details
    station = None
    if order.goi_hang and order.goi_hang[0].ma_tram:
        station = order.goi_hang[0].tram_ha_canh
        
    if not station or station.lat is None or station.lng is None:
        start_lat, start_lng = 21.0285, 105.8542
        print(f"Không tìm thấy trạm hạ cánh hoặc trạm thiếu tọa độ. Sử dụng tọa độ mặc định Hà Nội: ({start_lat}, {start_lng})")
    else:
        start_lat, start_lng = station.lat, station.lng
        print(f"Điểm xuất phát (Trạm hạ cánh): ({start_lat}, {start_lng})")
        
    end_lat, end_lng = address.lat, address.lng
    print(f"Điểm đến (Địa chỉ giao hàng): ({end_lat}, {end_lng})")
    
    # Simulate 20 steps
    steps = 20
    print(f"Bắt đầu mô phỏng drone cất cánh và di chuyển trong {steps} bước...")
    
    for i in range(steps + 1):
        ratio = i / steps
        curr_lat = start_lat + (end_lat - start_lat) * ratio
        curr_lng = start_lng + (end_lng - start_lng) * ratio
        
        # Update delivery trip location
        delivery.vi_tri_hien_tai_lat = curr_lat
        delivery.vi_tri_hien_tai_lng = curr_lng
        session.commit()
        
        print(f"Bước {i:02d}/{steps:02d} -> Drone đang ở tọa độ: ({curr_lat:.6f}, {curr_lng:.6f})")
        time.sleep(2)
        
    print("Mô phỏng hoàn tất! Drone đã đến điểm hạ cánh thành công.")

if __name__ == '__main__':
    run_simulation()
