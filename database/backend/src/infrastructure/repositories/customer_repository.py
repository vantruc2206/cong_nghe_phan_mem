from domain.models.icustomer_repository import ICustomerRepository
from typing import List, Optional
from infrastructure.databases.postgres import session
from infrastructure.models.app_khach_hang_model import KhachHangModel
from infrastructure.models.app_dia_chi_model import DiaChiModel
from sqlalchemy.orm import Session

class CustomerRepository(ICustomerRepository):
    def __init__(self, session: Session = session):
        self.session = session

    def get_all_customers(self) -> List[KhachHangModel]:
        return self.session.query(KhachHangModel).all()

    def get_customer_by_id(self, ma_kh: str) -> Optional[KhachHangModel]:
        return self.session.query(KhachHangModel).filter_by(ma_kh=ma_kh).first()

    def create_customer(self, customer: KhachHangModel) -> KhachHangModel:
        self.session.add(customer)
        self.session.commit()
        self.session.refresh(customer)
        return customer

    def update(self) -> None:
        self.session.commit()

    def delete_customer(self, customer: KhachHangModel) -> None:
        self.session.delete(customer)
        self.session.commit()

    def get_all_addresses(self) -> List[DiaChiModel]:
        return self.session.query(DiaChiModel).all()

    def get_addresses_by_customer_id(self, ma_kh: str) -> List[DiaChiModel]:
        return self.session.query(DiaChiModel).filter_by(ma_kh=ma_kh).all()

    def get_address_by_id(self, ma_dia_chi: str) -> Optional[DiaChiModel]:
        return self.session.query(DiaChiModel).filter_by(ma_dia_chi=ma_dia_chi).first()

    def create_address(self, address: DiaChiModel) -> DiaChiModel:
        self.session.add(address)
        self.session.commit()
        self.session.refresh(address)
        return address

    def delete_address(self, address: DiaChiModel) -> None:
        self.session.delete(address)
        self.session.commit()
