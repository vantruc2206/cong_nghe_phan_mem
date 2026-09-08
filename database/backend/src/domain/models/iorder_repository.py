from abc import ABC, abstractmethod
from typing import List, Optional
from infrastructure.models.app_don_hang_model import DonHangModel
from infrastructure.models.app_goi_hang_model import GoiHangModel

class IOrderRepository(ABC):
    @abstractmethod
    def get_all_orders(self) -> List[DonHangModel]:
        pass

    @abstractmethod
    def get_order_by_id(self, ma_don_hang: str) -> Optional[DonHangModel]:
        pass

    @abstractmethod
    def create_order(self, order: DonHangModel) -> DonHangModel:
        pass

    @abstractmethod
    def update(self) -> None:
        pass

    @abstractmethod
    def get_all_packages(self) -> List[GoiHangModel]:
        pass

    @abstractmethod
    def get_packages_by_order_id(self, ma_don_hang: str) -> List[GoiHangModel]:
        pass

    @abstractmethod
    def get_package_by_id(self, ma_goi_hang: str) -> Optional[GoiHangModel]:
        pass

    @abstractmethod
    def create_package(self, package: GoiHangModel) -> GoiHangModel:
        pass

    @abstractmethod
    def delete_package(self, package: GoiHangModel) -> None:
        pass

    @abstractmethod
    def check_customer_exists(self, ma_kh: str) -> bool:
        pass

    @abstractmethod
    def check_address_exists(self, ma_dia_chi: str) -> bool:
        pass

    @abstractmethod
    def check_station_exists(self, ma_tram: str) -> Optional[object]:
        pass

    @abstractmethod
    def check_drone_exists(self, ma_drone: str) -> Optional[object]:
        pass

    @abstractmethod
    def check_user_exists(self, ma_nguoi_dung: str) -> bool:
        pass

    @abstractmethod
    def create_delivery(self, delivery: object) -> object:
        pass
