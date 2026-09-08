from abc import ABC, abstractmethod
from typing import List, Optional
from infrastructure.models.app_tram_ha_canh_model import TramHaCanhModel

class IStationRepository(ABC):
    @abstractmethod
    def get_all(self) -> List[TramHaCanhModel]:
        pass

    @abstractmethod
    def get_by_id(self, ma_tram: str) -> Optional[TramHaCanhModel]:
        pass

    @abstractmethod
    def create(self, station: TramHaCanhModel) -> TramHaCanhModel:
        pass

    @abstractmethod
    def update(self) -> None:
        pass

    @abstractmethod
    def delete(self, station: TramHaCanhModel) -> None:
        pass

    @abstractmethod
    def receive_package(self, ma_don_hang: str) -> Optional[dict]:
        pass

    @abstractmethod
    def dispatch_delivery(self, ma_giao_hang: str) -> Optional[dict]:
        pass
