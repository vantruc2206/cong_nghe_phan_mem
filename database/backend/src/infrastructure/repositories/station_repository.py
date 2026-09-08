from domain.models.istation_repository import IStationRepository
from typing import List, Optional
from infrastructure.databases.postgres import session
from infrastructure.models.app_tram_ha_canh_model import TramHaCanhModel
from infrastructure.models.app_don_hang_model import DonHangModel
from infrastructure.models.app_giao_hang_model import GiaoHangModel
from infrastructure.models.app_drone_model import DroneModel
from sqlalchemy.orm import Session

class StationRepository(IStationRepository):
    def __init__(self, session: Session = session):
        self.session = session

    def get_all(self) -> List[TramHaCanhModel]:
        return self.session.query(TramHaCanhModel).all()

    def get_by_id(self, ma_tram: str) -> Optional[TramHaCanhModel]:
        return self.session.query(TramHaCanhModel).filter_by(ma_tram=ma_tram).first()

    def create(self, station: TramHaCanhModel) -> TramHaCanhModel:
        self.session.add(station)
        self.session.commit()
        self.session.refresh(station)
        return station

    def update(self) -> None:
        self.session.commit()

    def delete(self, station: TramHaCanhModel) -> None:
        self.session.delete(station)
        self.session.commit()

    def receive_package(self, ma_don_hang: str) -> Optional[dict]:
        order = self.session.query(DonHangModel).filter_by(ma_don_hang=ma_don_hang).first()
        if not order:
            return None
        if not order.goi_hang:
            return {'error': 'Order has no packages'}
            
        order.trang_thai_don_hang = 'Đang giao'
        delivery = self.session.query(GiaoHangModel).filter_by(ma_don_hang=ma_don_hang).first()
        if delivery:
            delivery.trang_thai_giao_hang = 'Đang giao'
        self.session.commit()
        return {'trang_thai_don_hang': order.trang_thai_don_hang}

    def dispatch_delivery(self, ma_giao_hang: str) -> Optional[dict]:
        delivery = self.session.query(GiaoHangModel).filter_by(ma_giao_hang=ma_giao_hang).first()
        if not delivery:
            return None
            
        delivery.trang_thai_giao_hang = 'Đang giao'
        if delivery.ma_drone:
            drone = self.session.query(DroneModel).filter_by(ma_drone=delivery.ma_drone).first()
            if drone:
                drone.trang_thai_drone = 'Đang giao'
        self.session.commit()
        return {'trang_thai_giao_hang': delivery.trang_thai_giao_hang}
