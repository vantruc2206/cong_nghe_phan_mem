from abc import ABC, abstractmethod
from typing import List, Optional, Any
from infrastructure.models.app_tin_nhan_chatbot_model import TinNhanChatbotModel
from infrastructure.models.app_khach_hang_model import KhachHangModel

class IChatbotRepository(ABC):
    session: Any

    @abstractmethod
    def save_message(self, message: TinNhanChatbotModel) -> TinNhanChatbotModel:
        pass

    @abstractmethod
    def get_history_by_customer_id(self, ma_kh: str) -> List[TinNhanChatbotModel]:
        pass

    @abstractmethod
    def check_customer_exists(self, ma_kh: str) -> Optional[KhachHangModel]:
        pass

