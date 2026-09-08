import sys
import os

src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "src"))
if src_path not in sys.path:
    sys.path.append(src_path)

from infrastructure.databases.postgres import session
from infrastructure.models.app_vai_tro_model import VaiTroModel
from infrastructure.models.app_nguoi_dung_model import NguoiDungModel
from werkzeug.security import generate_password_hash

def seed_admin():
    print("=== SEEDING ADMIN ACCOUNT ===")
    try:
        admin_role = session.query(VaiTroModel).filter_by(ten_vai_tro='Admin').first()
        if not admin_role:
            print("Creating Admin role...")
            admin_role = VaiTroModel(ten_vai_tro='Admin')
            session.add(admin_role)
            session.commit()
            session.refresh(admin_role)
            
        admin_user = session.query(NguoiDungModel).filter_by(email='admin@smartdrone.vn').first()
        if not admin_user:
            print("Creating admin@smartdrone.vn...")
            admin_user = NguoiDungModel(
                ma_vai_tro=admin_role.ma_vai_tro,
                ho_ten="Hệ Thống Admin",
                email="admin@smartdrone.vn",
                so_dien_thoai="0123456789",
                mat_khau_hash=generate_password_hash("123456")
            )
            session.add(admin_user)
            session.commit()
            print("Admin user seeded successfully!")
        else:
            print("Admin user already exists. Updating password...")
            admin_user.mat_khau_hash = generate_password_hash("123456")
            session.commit()
            print("Admin user updated successfully!")
    except Exception as e:
        print(f"Error seeding admin: {e}")

if __name__ == '__main__':
    seed_admin()
