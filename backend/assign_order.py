import sys
import os

src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "src"))
if src_path not in sys.path:
    sys.path.append(src_path)

from infrastructure.databases.postgres import session
from infrastructure.models.app_don_hang_model import DonHangModel
from infrastructure.models.app_goi_hang_model import GoiHangModel
from infrastructure.models.app_tram_ha_canh_model import TramHaCanhModel

def assign_order():
    print("=== ASSIGNING STATION TO ORDER ===")
    try:
        # 1. Find station containing 'Bách Khoa'
        station = session.query(TramHaCanhModel).filter(TramHaCanhModel.ten_tram.like('%Bách Khoa%')).first()
        if not station:
            station = session.query(TramHaCanhModel).first()
        
        if not station:
            print("No station found in database!")
            return
            
        print(f"Using station: {station.ten_tram} ({station.ma_tram})")
        
        # 2. Find order
        order = session.query(DonHangModel).filter_by(ma_don_hang='2b13d462-bba5-43a5-8a2d-22bcc9dc4451').first()
        if not order:
            print("Order 2b13d462-bba5-43a5-8a2d-22bcc9dc4451 not found!")
            return
            
        print(f"Found order: {order.ma_don_hang}, current status: {order.trang_thai_don_hang}")
        
        # 3. Update order status to 'Đang giao'
        order.trang_thai_don_hang = 'Đang giao'
        
        # 4. Find package and update ma_tram
        pkg = session.query(GoiHangModel).filter_by(ma_don_hang=order.ma_don_hang).first()
        if pkg:
            pkg.ma_tram = station.ma_tram
            print(f"Assigned package {pkg.ma_goi_hang} to station {station.ten_tram}")
        else:
            print("No package found for this order!")
            
        session.commit()
        print("Successfully updated database!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    assign_order()
