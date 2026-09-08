from domain.models.icustomer_repository import ICustomerRepository
from infrastructure.models.app_khach_hang_model import KhachHangModel
from infrastructure.models.app_dia_chi_model import DiaChiModel
from typing import List, Optional

class CustomerService:
    def __init__(self, repository: ICustomerRepository):
        self.repository = repository

    # Customer operations
    def get_all_customers(self) -> List[KhachHangModel]:
        return self.repository.get_all_customers()

    def get_customer_by_id(self, ma_kh: str) -> Optional[KhachHangModel]:
        return self.repository.get_customer_by_id(ma_kh)

    def create_customer(self, data: dict) -> KhachHangModel:
        customer = KhachHangModel(
            ten=data['ten'],
            ten_dem=data.get('ten_dem'),
            ho=data['ho'],
            gioi_tinh=data.get('gioi_tinh'),
            so_dien_thoai=data.get('so_dien_thoai'),
            email=data.get('email'),
            ngay_sinh=data.get('ngay_sinh')
        )
        return self.repository.create_customer(customer)

    def update_customer(self, ma_kh: str, data: dict) -> Optional[KhachHangModel]:
        customer = self.repository.get_customer_by_id(ma_kh)
        if not customer:
            return None
            
        customer.ten = data['ten']
        customer.ten_dem = data.get('ten_dem')
        customer.ho = data['ho']
        customer.gioi_tinh = data.get('gioi_tinh')
        customer.so_dien_thoai = data.get('so_dien_thoai')
        customer.email = data.get('email')
        customer.ngay_sinh = data.get('ngay_sinh')
        
        self.repository.update()
        return customer

    def delete_customer(self, ma_kh: str) -> bool:
        customer = self.repository.get_customer_by_id(ma_kh)
        if not customer:
            return False
        self.repository.delete_customer(customer)
        return True

    # Address operations
    def get_all_addresses(self) -> List[DiaChiModel]:
        return self.repository.get_all_addresses()

    def get_addresses_by_customer_id(self, ma_kh: str) -> List[DiaChiModel]:
        return self.repository.get_addresses_by_customer_id(ma_kh)

    def get_address_by_id(self, ma_dia_chi: str) -> Optional[DiaChiModel]:
        return self.repository.get_address_by_id(ma_dia_chi)

    def create_address(self, data: dict) -> Optional[DiaChiModel]:
        customer = self.repository.get_customer_by_id(data['ma_kh'])
        if not customer:
            return None
            
        address = DiaChiModel(
            ma_kh=data['ma_kh'],
            dia_chi_cu_the=data['dia_chi_cu_the'],
            thanh_pho=data['thanh_pho'],
            lat=data['lat'],
            lng=data['lng']
        )
        return self.repository.create_address(address)

    def update_address(self, ma_dia_chi: str, data: dict) -> Optional[DiaChiModel]:
        address = self.repository.get_address_by_id(ma_dia_chi)
        if not address:
            return None
            
        address.ma_kh = data['ma_kh']
        address.dia_chi_cu_the = data['dia_chi_cu_the']
        address.thanh_pho = data['thanh_pho']
        address.lat = data['lat']
        address.lng = data['lng']
        
        self.repository.update()
        return address

    def delete_address(self, ma_dia_chi: str) -> bool:
        address = self.repository.get_address_by_id(ma_dia_chi)
        if not address:
            return False
        self.repository.delete_address(address)
        return True
