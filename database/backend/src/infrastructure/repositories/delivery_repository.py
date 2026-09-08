from domain.models.idelivery_repository import IDeliveryRepository
from typing import List, Optional
from infrastructure.databases.postgres import session
from infrastructure.models.app_giao_hang_model import GiaoHangModel
from infrastructure.models.app_su_co_giao_hang_model import SuCoGiaoHangModel
from infrastructure.models.app_don_hang_model import DonHangModel
from infrastructure.models.app_drone_model import DroneModel
from infrastructure.models.app_nguoi_dung_model import NguoiDungModel
from infrastructure.models.app_tram_ha_canh_model import TramHaCanhModel
from sqlalchemy.orm import Session

class DeliveryRepository(IDeliveryRepository):
    def __init__(self, session: Session = session):
        self.session = session

    def get_all_deliveries(self) -> List[GiaoHangModel]:
        return self.session.query(GiaoHangModel).all()

    def get_delivery_by_id(self, ma_giao_hang: str) -> Optional[GiaoHangModel]:
        return self.session.query(GiaoHangModel).filter_by(ma_giao_hang=ma_giao_hang).first()

    def create_delivery(self, delivery: GiaoHangModel) -> GiaoHangModel:
        self.session.add(delivery)
        self.session.commit()
        self.session.refresh(delivery)
        return delivery

    def update(self) -> None:
        self.session.commit()

    def delete_delivery(self, delivery: GiaoHangModel) -> None:
        self.session.delete(delivery)
        self.session.commit()

    def get_all_incidents(self) -> List[SuCoGiaoHangModel]:
        return self.session.query(SuCoGiaoHangModel).all()

    def get_incidents_by_delivery_id(self, ma_giao_hang: str) -> List[SuCoGiaoHangModel]:
        return self.session.query(SuCoGiaoHangModel).filter_by(ma_giao_hang=ma_giao_hang).all()

    def get_incident_by_id(self, ma_van_de: str) -> Optional[SuCoGiaoHangModel]:
        return self.session.query(SuCoGiaoHangModel).filter_by(ma_van_de=ma_van_de).first()

    def create_incident(self, incident: SuCoGiaoHangModel) -> SuCoGiaoHangModel:
        self.session.add(incident)
        self.session.commit()
        self.session.refresh(incident)
        return incident

    def delete_incident(self, incident: SuCoGiaoHangModel) -> None:
        self.session.delete(incident)
        self.session.commit()

    def check_order_exists(self, ma_don_hang: str) -> Optional[DonHangModel]:
        return self.session.query(DonHangModel).filter_by(ma_don_hang=ma_don_hang).first()

    def check_drone_exists(self, ma_drone: str) -> Optional[DroneModel]:
        return self.session.query(DroneModel).filter_by(ma_drone=ma_drone).first()

    def check_user_exists(self, ma_nguoi_dung: str) -> Optional[NguoiDungModel]:
        return self.session.query(NguoiDungModel).filter_by(ma_nguoi_dung=ma_nguoi_dung).first()

    def check_station_exists(self, ma_tram: str) -> Optional[TramHaCanhModel]:
        return self.session.query(TramHaCanhModel).filter_by(ma_tram=ma_tram).first()
