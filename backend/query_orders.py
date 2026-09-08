import sys
import os

src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'src'))
if src_path not in sys.path:
    sys.path.insert(0, src_path)

from app import create_app  # type: ignore
from infrastructure.databases.postgres import session  # type: ignore
from infrastructure.models.app_don_hang_model import DonHangModel  # type: ignore

app = create_app()
with app.app_context():
    print("--- Orders in DB ---")
    orders = session.query(DonHangModel).all()
    print(f"Total orders: {len(orders)}")
    for o in orders:
        print(f"ID={o.ma_don_hang}, CUST_ID={o.ma_kh}, STATUS={o.trang_thai_don_hang}, AMT={o.tong_tien}")
