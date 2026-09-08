from domain.models.idelivery_repository import IDeliveryRepository
from infrastructure.models.app_giao_hang_model import GiaoHangModel
from infrastructure.models.app_su_co_giao_hang_model import SuCoGiaoHangModel
from typing import List, Optional

class DeliveryService:
    def __init__(self, repository: IDeliveryRepository):
        self.repository = repository

    def get_all_deliveries(self) -> List[GiaoHangModel]:
        return self.repository.get_all_deliveries()

    def get_delivery_by_id(self, ma_giao_hang: str) -> Optional[GiaoHangModel]:
        return self.repository.get_delivery_by_id(ma_giao_hang)

    def create_delivery(self, data: dict) -> Optional[GiaoHangModel]:
        if not self.repository.check_order_exists(data['ma_don_hang']):
            return None
            
        if data.get('ma_drone'):
            if not self.repository.check_drone_exists(data['ma_drone']):
                return None
                
        if data.get('ma_nguoi_phu_trach'):
            if not self.repository.check_user_exists(data['ma_nguoi_phu_trach']):
                return None
                
        delivery = GiaoHangModel(
            ma_don_hang=data['ma_don_hang'],
            ma_drone=data.get('ma_drone'),
            ma_nguoi_phu_trach=data.get('ma_nguoi_phu_trach'),
            trang_thai_giao_hang=data.get('trang_thai_giao_hang', 'Chờ xử lý'),
            vi_tri_hien_tai_lat=data.get('vi_tri_hien_tai_lat'),
            vi_tri_hien_tai_lng=data.get('vi_tri_hien_tai_lng'),
            thoi_gian_giao=data.get('thoi_gian_giao')
        )
        return self.repository.create_delivery(delivery)

    def update_delivery(self, ma_giao_hang: str, data: dict) -> Optional[GiaoHangModel]:
        delivery = self.repository.get_delivery_by_id(ma_giao_hang)
        if not delivery:
            return None
            
        if not self.repository.check_order_exists(data['ma_don_hang']):
            return None
            
        if data.get('ma_drone'):
            if not self.repository.check_drone_exists(data['ma_drone']):
                return None
                
        if data.get('ma_nguoi_phu_trach'):
            if not self.repository.check_user_exists(data['ma_nguoi_phu_trach']):
                return None
                
        delivery.ma_don_hang = data['ma_don_hang']
        delivery.ma_drone = data.get('ma_drone')
        delivery.ma_nguoi_phu_trach = data.get('ma_nguoi_phu_trach')
        delivery.trang_thai_giao_hang = data.get('trang_thai_giao_hang', delivery.trang_thai_giao_hang)
        delivery.vi_tri_hien_tai_lat = data.get('vi_tri_hien_tai_lat', delivery.vi_tri_hien_tai_lat)
        delivery.vi_tri_hien_tai_lng = data.get('vi_tri_hien_tai_lng', delivery.vi_tri_hien_tai_lng)
        delivery.thoi_gian_giao = data.get('thoi_gian_giao', delivery.thoi_gian_giao)
        
        self.repository.update()
        return delivery

    def delete_delivery(self, ma_giao_hang: str) -> bool:
        delivery = self.repository.get_delivery_by_id(ma_giao_hang)
        if not delivery:
            return False
        self.repository.delete_delivery(delivery)
        return True

    # Incident operations
    def get_all_incidents(self) -> List[SuCoGiaoHangModel]:
        return self.repository.get_all_incidents()

    def get_incidents_by_delivery_id(self, ma_giao_hang: str) -> List[SuCoGiaoHangModel]:
        return self.repository.get_incidents_by_delivery_id(ma_giao_hang)

    def get_incident_by_id(self, ma_van_de: str) -> Optional[SuCoGiaoHangModel]:
        return self.repository.get_incident_by_id(ma_van_de)

    def create_incident(self, data: dict) -> Optional[SuCoGiaoHangModel]:
        if not self.repository.get_delivery_by_id(data['ma_giao_hang']):
            return None
            
        if data.get('ma_tram'):
            if not self.repository.check_station_exists(data['ma_tram']):
                return None
                
        incident = SuCoGiaoHangModel(
            ma_tram=data.get('ma_tram'),
            ma_giao_hang=data['ma_giao_hang'],
            mo_ta_su_co=data['mo_ta_su_co'],
            muc_do_nghiem_trong=data.get('muc_do_nghiem_trong', 'Trung bình')
        )
        return self.repository.create_incident(incident)

    def delete_incident(self, ma_van_de: str) -> bool:
        incident = self.repository.get_incident_by_id(ma_van_de)
        if not incident:
            return False
        self.repository.delete_incident(incident)
        return True

    # Critical UCs
    def fail_delivery(self, ma_giao_hang: str) -> Optional[GiaoHangModel]:
        delivery = self.repository.get_delivery_by_id(ma_giao_hang)
        if not delivery:
            return None
            
        delivery.trang_thai_giao_hang = 'Giao thất bại'
        order = delivery.don_hang
        if order:
            order.trang_thai_don_hang = 'Giao thất bại'
            
        self.repository.update()
        return delivery

    def retry_delivery(self, ma_giao_hang: str) -> Optional[dict]:
        old_delivery = self.repository.get_delivery_by_id(ma_giao_hang)
        if not old_delivery:
            return None
            
        old_delivery.trang_thai_giao_hang = 'Giao thất bại'
        order = old_delivery.don_hang
        if order:
            order.trang_thai_don_hang = 'Đang giao'
            
        new_delivery = GiaoHangModel(
            ma_don_hang=old_delivery.ma_don_hang,
            ma_drone=old_delivery.ma_drone,
            ma_nguoi_phu_trach=old_delivery.ma_nguoi_phu_trach,
            trang_thai_giao_hang='Chờ xử lý',
            vi_tri_hien_tai_lat=old_delivery.vi_tri_hien_tai_lat,
            vi_tri_hien_tai_lng=old_delivery.vi_tri_hien_tai_lng
        )
        created = self.repository.create_delivery(new_delivery)
        return {'old_delivery': old_delivery, 'new_delivery': created}

    def complete_delivery(self, ma_giao_hang: str) -> Optional[GiaoHangModel]:
        delivery = self.repository.get_delivery_by_id(ma_giao_hang)
        if not delivery:
            return None
            
        delivery.trang_thai_giao_hang = 'Đã giao'
        order = delivery.don_hang
        if order:
            order.trang_thai_don_hang = 'Đã giao thành công'
            
        if delivery.ma_drone:
            drone = delivery.drone
            if drone:
                drone.trang_thai_drone = 'Sẵn sàng'
                
        self.repository.update()
        return delivery
