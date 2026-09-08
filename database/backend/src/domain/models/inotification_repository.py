from abc import ABC, abstractmethod
from typing import List, Optional
from infrastructure.models.app_thong_bao_model import ThongBaoModel

class INotificationRepository(ABC):
    @abstractmethod
    def get_all(self) -> List[ThongBaoModel]:
        pass

    @abstractmethod
    def get_by_customer_id(self, ma_kh: str) -> List[ThongBaoModel]:
        pass

    @abstractmethod
    def get_by_id(self, ma_thong_bao: str) -> Optional[ThongBaoModel]:
        pass

    @abstractmethod
    def create(self, notification: ThongBaoModel) -> ThongBaoModel:
        pass

    @abstractmethod
    def update(self) -> None:
        pass

    @abstractmethod
    def delete(self, notification: ThongBaoModel) -> None:
        pass

    @abstractmethod
    def check_customer_exists(self, ma_kh: str) -> bool:
        pass

    @abstractmethod
    def check_order_exists(self, ma_don_hang: str) -> bool:
        pass
