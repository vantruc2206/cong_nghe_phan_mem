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
        return self.session.query(KhachHangModel).filter_by(ma_kh=ma_kh).first()
