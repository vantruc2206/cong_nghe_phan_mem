from domain.models.iorder_repository import IOrderRepository
from typing import List, Optional
from infrastructure.databases.postgres import session
from infrastructure.models.app_don_hang_model import DonHangModel
from infrastructure.models.app_goi_hang_model import GoiHangModel
from infrastructure.models.app_khach_hang_model import KhachHangModel
from infrastructure.models.app_dia_chi_model import DiaChiModel
from infrastructure.models.app_tram_ha_canh_model import TramHaCanhModel
from infrastructure.models.app_drone_model import DroneModel
from infrastructure.models.app_nguoi_dung_model import NguoiDungModel
from infrastructure.models.app_giao_hang_model import GiaoHangModel
from sqlalchemy.orm import Session

class OrderRepository(IOrderRepository):
    def __init__(self, session: Session = session):
        self.session = session

    def get_all_orders(self) -> List[DonHangModel]:
        return self.session.query(DonHangModel).all()

    def get_order_by_id(self, ma_don_hang: str) -> Optional[DonHangModel]:
        return self.session.query(DonHangModel).filter_by(ma_don_hang=ma_don_hang).first()

    def create_order(self, order: DonHangModel) -> DonHangModel:
        self.session.add(order)
        self.session.commit()
        self.session.refresh(order)
        return order

    def update(self) -> None:
        self.session.commit()

    def get_all_packages(self) -> List[GoiHangModel]:
        return self.session.query(GoiHangModel).all()

    def get_packages_by_order_id(self, ma_don_hang: str) -> List[GoiHangModel]:
        return self.session.query(GoiHangModel).filter_by(ma_don_hang=ma_don_hang).all()

    def get_package_by_id(self, ma_goi_hang: str) -> Optional[GoiHangModel]:
        return self.session.query(GoiHangModel).filter_by(ma_goi_hang=ma_goi_hang).first()

    def create_package(self, package: GoiHangModel) -> GoiHangModel:
        self.session.add(package)
        self.session.commit()
        self.session.refresh(package)
        return package

    def delete_package(self, package: GoiHangModel) -> None:
        self.session.delete(package)
        self.session.commit()

    def check_customer_exists(self, ma_kh: str) -> bool:
        return self.session.query(KhachHangModel).filter_by(ma_kh=ma_kh).first() is not None

    def check_address_exists(self, ma_dia_chi: str) -> bool:
        return self.session.query(DiaChiModel).filter_by(ma_dia_chi=ma_dia_chi).first() is not None

    def check_station_exists(self, ma_tram: str) -> Optional[TramHaCanhModel]:
        return self.session.query(TramHaCanhModel).filter_by(ma_tram=ma_tram).first()

    def check_drone_exists(self, ma_drone: str) -> Optional[DroneModel]:
        return self.session.query(DroneModel).filter_by(ma_drone=ma_drone).first()

    def check_user_exists(self, ma_nguoi_dung: str) -> bool:
        return self.session.query(NguoiDungModel).filter_by(ma_nguoi_dung=ma_nguoi_dung).first() is not None

    def create_delivery(self, delivery: GiaoHangModel) -> GiaoHangModel:
        self.session.add(delivery)
        self.session.commit()
        self.session.refresh(delivery)
        return delivery
