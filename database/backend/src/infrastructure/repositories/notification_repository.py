from domain.models.inotification_repository import INotificationRepository
from typing import List, Optional
from infrastructure.databases.postgres import session
from infrastructure.models.app_thong_bao_model import ThongBaoModel
from infrastructure.models.app_khach_hang_model import KhachHangModel
from infrastructure.models.app_don_hang_model import DonHangModel
from sqlalchemy.orm import Session

class NotificationRepository(INotificationRepository):
    def __init__(self, session: Session = session):
        self.session = session

    def get_all(self) -> List[ThongBaoModel]:
        return self.session.query(ThongBaoModel).all()

    def get_by_customer_id(self, ma_kh: str) -> List[ThongBaoModel]:
        return self.session.query(ThongBaoModel).filter_by(ma_kh=ma_kh).order_by(ThongBaoModel.thoi_gian_gui.desc()).all()

    def get_by_id(self, ma_thong_bao: str) -> Optional[ThongBaoModel]:
        return self.session.query(ThongBaoModel).filter_by(ma_thong_bao=ma_thong_bao).first()

    def create(self, notification: ThongBaoModel) -> ThongBaoModel:
        self.session.add(notification)
        self.session.commit()
        self.session.refresh(notification)
        return notification

    def update(self) -> None:
        self.session.commit()

    def delete(self, notification: ThongBaoModel) -> None:
        self.session.delete(notification)
        self.session.commit()

    def check_customer_exists(self, ma_kh: str) -> bool:
        return self.session.query(KhachHangModel).filter_by(ma_kh=ma_kh).first() is not None

    def check_order_exists(self, ma_don_hang: str) -> bool:
        return self.session.query(DonHangModel).filter_by(ma_don_hang=ma_don_hang).first() is not None
