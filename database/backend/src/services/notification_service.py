from domain.models.inotification_repository import INotificationRepository
from infrastructure.models.app_thong_bao_model import ThongBaoModel
from typing import List, Optional

class NotificationService:
    def __init__(self, repository: INotificationRepository):
        self.repository = repository

    def get_all(self) -> List[ThongBaoModel]:
        return self.repository.get_all()

    def get_by_customer_id(self, ma_kh: str) -> List[ThongBaoModel]:
        return self.repository.get_by_customer_id(ma_kh)

    def get_by_id(self, ma_thong_bao: str) -> Optional[ThongBaoModel]:
        return self.repository.get_by_id(ma_thong_bao)

    def create(self, data: dict) -> Optional[ThongBaoModel]:
        if not self.repository.check_customer_exists(data['ma_kh']):
            return None
            
        if data.get('ma_don_hang'):
            if not self.repository.check_order_exists(data['ma_don_hang']):
                return None
                
        notification = ThongBaoModel(
            ma_kh=data['ma_kh'],
            ma_don_hang=data.get('ma_don_hang'),
            trang_thai=data.get('trang_thai', 'Chưa đọc'),
            noi_dung=data['noi_dung']
        )
        return self.repository.create(notification)

    def mark_read(self, ma_thong_bao: str) -> Optional[ThongBaoModel]:
        notification = self.repository.get_by_id(ma_thong_bao)
        if not notification:
            return None
            
        notification.trang_thai = 'Đã đọc'
        self.repository.update()
        return notification

    def delete(self, ma_thong_bao: str) -> bool:
        notification = self.repository.get_by_id(ma_thong_bao)
        if not notification:
            return False
        self.repository.delete(notification)
        return True
