from domain.models.istation_repository import IStationRepository
from infrastructure.models.app_tram_ha_canh_model import TramHaCanhModel
from typing import List, Optional

class StationService:
    def __init__(self, repository: IStationRepository):
        self.repository = repository

    def get_all(self) -> List[TramHaCanhModel]:
        return self.repository.get_all()

    def get_by_id(self, ma_tram: str) -> Optional[TramHaCanhModel]:
        return self.repository.get_by_id(ma_tram)

    def create(self, data: dict) -> TramHaCanhModel:
        station = TramHaCanhModel(
            ten_tram=data['ten_tram'],
            dia_chi_tram=data['dia_chi_tram'],
            lat=data['lat'],
            lng=data['lng'],
            cong_suat_toi_da=data.get('cong_suat_toi_da', 10),
            trang_thai_hoat_dong=data.get('trang_thai_hoat_dong', 'Đang hoạt động')
        )
        return self.repository.create(station)

    def update(self, ma_tram: str, data: dict) -> Optional[TramHaCanhModel]:
        station = self.repository.get_by_id(ma_tram)
        if not station:
            return None
            
        station.ten_tram = data['ten_tram']
        station.dia_chi_tram = data['dia_chi_tram']
        station.lat = data['lat']
        station.lng = data['lng']
        station.cong_suat_toi_da = data.get('cong_suat_toi_da', station.cong_suat_toi_da)
        station.trang_thai_hoat_dong = data.get('trang_thai_hoat_dong', station.trang_thai_hoat_dong)
        
        self.repository.update()
        return station

    def delete(self, ma_tram: str) -> bool:
        station = self.repository.get_by_id(ma_tram)
        if not station:
            return False
        self.repository.delete(station)
        return True

    def receive_package(self, ma_don_hang: str) -> Optional[dict]:
        return self.repository.receive_package(ma_don_hang)

    def dispatch_delivery(self, ma_giao_hang: str) -> Optional[dict]:
        return self.repository.dispatch_delivery(ma_giao_hang)
