from domain.models.ichatbot_repository import IChatbotRepository
from typing import List, Optional
from infrastructure.databases.postgres import session
from infrastructure.models.app_tin_nhan_chatbot_model import TinNhanChatbotModel
from infrastructure.models.app_khach_hang_model import KhachHangModel
from sqlalchemy.orm import Session

class ChatbotRepository(IChatbotRepository):
    def __init__(self, session: Session = session):
        self.session = session

    def save_message(self, message: TinNhanChatbotModel) -> TinNhanChatbotModel:
        self.session.add(message)
        self.session.commit()
        self.session.refresh(message)
        return message

    def get_history_by_customer_id(self, ma_kh: str) -> List[TinNhanChatbotModel]:
        return self.session.query(TinNhanChatbotModel).filter_by(ma_kh=ma_kh).order_by(TinNhanChatbotModel.thoi_gian.asc()).all()

    def check_customer_exists(self, ma_kh: str) -> Optional[KhachHangModel]:
        if not ma_kh:
            return self._get_or_create_default_customer()
            
        import uuid
        # 1. Try UUID lookup
        try:
            val_uuid = uuid.UUID(str(ma_kh))
            kh = self.session.query(KhachHangModel).filter_by(ma_kh=val_uuid).first()
            if kh:
                return kh
        except Exception:
            pass
            
        # 2. Try Email lookup in KhachHangModel
        kh_email = self.session.query(KhachHangModel).filter_by(email=str(ma_kh).strip()).first()
        if kh_email:
            return kh_email

        # 3. Try lookup in NguoiDungModel
        try:
            from infrastructure.models.app_nguoi_dung_model import NguoiDungModel
            user_obj = self.session.query(NguoiDungModel).filter(
                (NguoiDungModel.email == str(ma_kh).strip())
            ).first()
            if user_obj:
                kh = self.session.query(KhachHangModel).filter(
                    (KhachHangModel.email == user_obj.email) | (KhachHangModel.ma_kh == user_obj.ma_nguoi_dung)
                ).first()
                if kh:
                    return kh
        except Exception:
            pass

        # 4. Fallback to any customer in DB or default guest
        try:
            first_kh = self.session.query(KhachHangModel).first()
            if first_kh:
                return first_kh
        except Exception:
            pass
            
        return self._get_or_create_default_customer()

    def _get_or_create_default_customer(self):
        try:
            kh = self.session.query(KhachHangModel).first()
            if kh:
                return kh
            new_kh = KhachHangModel(ho="Khách", ten="Hàng", email="guest@smartdrone.vn", so_dien_thoai="0900000000")
            self.session.add(new_kh)
            self.session.commit()
            self.session.refresh(new_kh)
            return new_kh
        except Exception:
            self.session.rollback()
            return None
