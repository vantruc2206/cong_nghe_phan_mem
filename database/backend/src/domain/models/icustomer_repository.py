from abc import ABC, abstractmethod
from typing import List, Optional
from infrastructure.models.app_khach_hang_model import KhachHangModel
from infrastructure.models.app_dia_chi_model import DiaChiModel

class ICustomerRepository(ABC):
    @abstractmethod
    def get_all_customers(self) -> List[KhachHangModel]:
        pass

    @abstractmethod
    def get_customer_by_id(self, ma_kh: str) -> Optional[KhachHangModel]:
        pass

    @abstractmethod
    def create_customer(self, customer: KhachHangModel) -> KhachHangModel:
        pass

    @abstractmethod
    def update(self) -> None:
        pass

    @abstractmethod
    def delete_customer(self, customer: KhachHangModel) -> None:
        pass

    @abstractmethod
    def get_all_addresses(self) -> List[DiaChiModel]:
        pass

    @abstractmethod
    def get_addresses_by_customer_id(self, ma_kh: str) -> List[DiaChiModel]:
        pass

    @abstractmethod
    def get_address_by_id(self, ma_dia_chi: str) -> Optional[DiaChiModel]:
        pass

    @abstractmethod
    def create_address(self, address: DiaChiModel) -> DiaChiModel:
        pass

    @abstractmethod
    def delete_address(self, address: DiaChiModel) -> None:
        pass
