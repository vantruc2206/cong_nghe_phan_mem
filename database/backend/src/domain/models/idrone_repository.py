from abc import ABC, abstractmethod
from typing import List, Optional
from infrastructure.models.app_drone_model import DroneModel

class IDroneRepository(ABC):
    @abstractmethod
    def get_all(self) -> List[DroneModel]:
        pass

    @abstractmethod
    def get_by_id(self, ma_drone: str) -> Optional[DroneModel]:
        pass

    @abstractmethod
    def create(self, drone: DroneModel) -> DroneModel:
        pass

    @abstractmethod
    def update(self) -> None:
        pass

    @abstractmethod
    def delete(self, drone: DroneModel) -> None:
        pass
