from abc import ABC, abstractmethod
from typing import List, Optional
from infrastructure.models.app_giao_hang_model import GiaoHangModel
from infrastructure.models.app_su_co_giao_hang_model import SuCoGiaoHangModel

class IDeliveryRepository(ABC):
    @abstractmethod
    def get_all_deliveries(self) -> List[GiaoHangModel]:
        pass

    @abstractmethod
    def get_delivery_by_id(self, ma_giao_hang: str) -> Optional[GiaoHangModel]:
        pass

    @abstractmethod
    def create_delivery(self, delivery: GiaoHangModel) -> GiaoHangModel:
        pass

    @abstractmethod
    def update(self) -> None:
        pass

    @abstractmethod
    def delete_delivery(self, delivery: GiaoHangModel) -> None:
        pass

    @abstractmethod
    def get_all_incidents(self) -> List[SuCoGiaoHangModel]:
        pass

    @abstractmethod
    def get_incidents_by_delivery_id(self, ma_giao_hang: str) -> List[SuCoGiaoHangModel]:
        pass

    @abstractmethod
    def get_incident_by_id(self, ma_van_de: str) -> Optional[SuCoGiaoHangModel]:
        pass

    @abstractmethod
    def create_incident(self, incident: SuCoGiaoHangModel) -> SuCoGiaoHangModel:
        pass

    @abstractmethod
    def delete_incident(self, incident: SuCoGiaoHangModel) -> None:
        pass

    @abstractmethod
    def check_order_exists(self, ma_don_hang: str) -> Optional[object]:
        pass

    @abstractmethod
    def check_drone_exists(self, ma_drone: str) -> Optional[object]:
        pass

    @abstractmethod
    def check_user_exists(self, ma_nguoi_dung: str) -> Optional[object]:
        pass

    @abstractmethod
    def check_station_exists(self, ma_tram: str) -> Optional[object]:
        pass
