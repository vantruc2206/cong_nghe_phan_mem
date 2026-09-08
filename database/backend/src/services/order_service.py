from domain.models.iorder_repository import IOrderRepository
from infrastructure.models.app_don_hang_model import DonHangModel
from infrastructure.models.app_goi_hang_model import GoiHangModel
from infrastructure.models.app_giao_hang_model import GiaoHangModel
from typing import List, Optional
import math

class OrderService:
    def __init__(self, repository: IOrderRepository):
        self.repository = repository

    def get_all_orders(self) -> List[DonHangModel]:
        return self.repository.get_all_orders()

    def get_order_by_id(self, ma_don_hang: str) -> Optional[DonHangModel]:
        return self.repository.get_order_by_id(ma_don_hang)

    def create_order(self, data: dict) -> Optional[DonHangModel]:
        if not self.repository.check_customer_exists(data['ma_kh']):
            return None
        if not self.repository.check_address_exists(data['ma_dia_chi']):
            return None
            
        order = DonHangModel(
            ma_kh=data['ma_kh'],
            ma_dia_chi=data['ma_dia_chi'],
            trang_thai_don_hang=data.get('trang_thai_don_hang', 'Chờ duyệt'),
            cach_thuc_thanh_toan=data.get('cach_thuc_thanh_toan'),
            tong_tien=data.get('tong_tien', 0)
        )
        return self.repository.create_order(order)

    def update_order(self, ma_don_hang: str, data: dict) -> Optional[DonHangModel]:
        order = self.repository.get_order_by_id(ma_don_hang)
        if not order:
            return None
        if order.trang_thai_don_hang != 'Chờ duyệt':
             return None
             
        if not self.repository.check_customer_exists(data['ma_kh']):
            return None
        if not self.repository.check_address_exists(data['ma_dia_chi']):
            return None
            
        order.ma_kh = data['ma_kh']
        order.ma_dia_chi = data['ma_dia_chi']
        order.trang_thai_don_hang = data.get('trang_thai_don_hang', order.trang_thai_don_hang)
        order.cach_thuc_thanh_toan = data.get('cach_thuc_thanh_toan', order.cach_thuc_thanh_toan)
        order.tong_tien = data.get('tong_tien', order.tong_tien)
        
        self.repository.update()
        return order

    def delete_order(self, ma_don_hang: str) -> Optional[DonHangModel]:
        order = self.repository.get_order_by_id(ma_don_hang)
        if not order:
            return None
        if order.trang_thai_don_hang != 'Chờ duyệt':
            return None
            
        order.trang_thai_don_hang = 'Đã hủy'
        self.repository.update()
        return order

    def get_all_packages(self) -> List[GoiHangModel]:
        return self.repository.get_all_packages()

    def get_packages_by_order_id(self, ma_don_hang: str) -> List[GoiHangModel]:
        return self.repository.get_packages_by_order_id(ma_don_hang)

    def get_package_by_id(self, ma_goi_hang: str) -> Optional[GoiHangModel]:
        return self.repository.get_package_by_id(ma_goi_hang)

    def create_package(self, data: dict) -> Optional[dict]:
        order = self.repository.get_order_by_id(data['ma_don_hang'])
        if not order:
            return {'error': 'Order not found'}
            
        if data.get('ma_tram'):
            station = self.repository.check_station_exists(data['ma_tram'])
            if not station:
                return {'error': 'Station not found'}
            if station.trang_thai_hoat_dong in ['Bảo trì', 'Ngừng']:
                return {'error': 'Trạm hạ cánh đang bảo trì hoặc ngừng hoạt động không thể gán đơn hàng mới'}
                
        package = GoiHangModel(
            ma_don_hang=data['ma_don_hang'],
            ma_tram=data.get('ma_tram'),
            loai_hang_hoa=data['loai_hang_hoa'],
            can_nang=data['can_nang'],
            kich_co=data.get('kich_co'),
            gia_tri_uoc_tinh=data.get('gia_tri_uoc_tinh', 0)
        )
        created = self.repository.create_package(package)
        return {'package': created}

    def update_package(self, ma_goi_hang: str, data: dict) -> Optional[dict]:
        package = self.repository.get_package_by_id(ma_goi_hang)
        if not package:
            return {'error': 'Package not found'}
            
        order = self.repository.get_order_by_id(data['ma_don_hang'])
        if not order:
            return {'error': 'Order not found'}
            
        if data.get('ma_tram'):
            station = self.repository.check_station_exists(data['ma_tram'])
            if not station:
                return {'error': 'Station not found'}
            if station.trang_thai_hoat_dong in ['Bảo trì', 'Ngừng']:
                return {'error': 'Trạm hạ cánh đang bảo trì hoặc ngừng hoạt động không thể gán đơn hàng mới'}
                
        package.ma_don_hang = data['ma_don_hang']
        package.ma_tram = data.get('ma_tram')
        package.loai_hang_hoa = data['loai_hang_hoa']
        package.can_nang = data['can_nang']
        package.kich_co = data.get('kich_co')
        package.gia_tri_uoc_tinh = data.get('gia_tri_uoc_tinh', package.gia_tri_uoc_tinh)
        
        self.repository.update()
        return {'package': package}

    def delete_package(self, ma_goi_hang: str) -> bool:
        package = self.repository.get_package_by_id(ma_goi_hang)
        if not package:
            return False
        self.repository.delete_package(package)
        return True

    def approve_order(self, ma_don_hang: str) -> Optional[dict]:
        order = self.repository.get_order_by_id(ma_don_hang)
        if not order:
            return {'error': 'Order not found'}
        if order.trang_thai_don_hang != 'Chờ duyệt':
            return {'error': 'Chỉ có thể duyệt đơn ở trạng thái Chờ duyệt'}
            
        order.trang_thai_don_hang = 'Đã duyệt'
        self.repository.update()
        return {'order': order}

    def reject_order(self, ma_don_hang: str, reason: str) -> Optional[dict]:
        order = self.repository.get_order_by_id(ma_don_hang)
        if not order:
            return {'error': 'Order not found'}
        if order.trang_thai_don_hang != 'Chờ duyệt':
            return {'error': 'Chỉ có thể từ chối đơn ở trạng thái Chờ duyệt'}
            
        order.trang_thai_don_hang = 'Bị từ chối'
        self.repository.update()
        return {'order': order, 'reason': reason}

    def schedule_order(self, ma_don_hang: str, data: dict) -> Optional[dict]:
        order = self.repository.get_order_by_id(ma_don_hang)
        if not order:
            return {'error': 'Order not found'}
        if order.trang_thai_don_hang not in ['Đã duyệt', 'Chờ duyệt']:
            return {'error': 'Chỉ có thể lập lịch cho đơn đã duyệt hoặc chờ duyệt'}
            
        ma_drone = data.get('ma_drone')
        ma_nguoi_phu_trach = data.get('ma_nguoi_phu_trach')
        thoi_gian_giao = data.get('thoi_gian_giao')
        
        if ma_drone:
            drone = self.repository.check_drone_exists(ma_drone)
            if not drone:
                return {'error': 'Drone not found'}
            if drone.trang_thai_drone in ['Bảo trì', 'Hỏng']:
                return {'error': 'Drone đang bảo trì hoặc hỏng'}
                
        if ma_nguoi_phu_trach:
            if not self.repository.check_user_exists(ma_nguoi_phu_trach):
                return {'error': 'Assignee user not found'}
                
        order.trang_thai_don_hang = 'Đã lên lịch'
        
        delivery = GiaoHangModel(
            ma_don_hang=order.ma_don_hang,
            ma_drone=ma_drone,
            ma_nguoi_phu_trach=ma_nguoi_phu_trach,
            trang_thai_giao_hang='Chờ xử lý',
            thoi_gian_giao=thoi_gian_giao
        )
        self.repository.create_delivery(delivery)
        return {'order': order, 'delivery': delivery}

    def get_order_eta(self, ma_don_hang: str) -> Optional[dict]:
        order = self.repository.get_order_by_id(ma_don_hang)
        if not order:
            return {'error': 'Order not found'}
            
        address = order.dia_chi
        if not address or address.lat is None or address.lng is None:
            return {'error': 'Delivery address coordinates missing'}
            
        packages = order.goi_hang
        if not packages or not packages[0].ma_tram:
            return {'error': 'No landing station assigned to order packages'}
            
        station = packages[0].tram_ha_canh
        if not station or station.lat is None or station.lng is None:
            return {'error': 'Station coordinates missing'}
            
        R = 6371.0
        lat1 = math.radians(station.lat)
        lon1 = math.radians(station.lng)
        lat2 = math.radians(address.lat)
        lon2 = math.radians(address.lng)
        
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance_km = R * c
        
        drone_speed_kmh = 40.0
        travel_time_hours = distance_km / drone_speed_kmh
        travel_time_minutes = int(travel_time_hours * 60)
        
        return {
            'ma_don_hang': str(order.ma_don_hang),
            'distance_km': round(distance_km, 2),
            'speed_kmh': drone_speed_kmh,
            'estimated_duration_minutes': travel_time_minutes,
            'estimated_delivery_time_string': f"{travel_time_minutes} phút"
        }
