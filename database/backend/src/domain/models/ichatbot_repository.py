from abc import ABC, abstractmethod
from typing import List, Optional
from infrastructure.models.app_tin_nhan_chatbot_model import TinNhanChatbotModel

class IChatbotRepository(ABC):
    @abstractmethod
    def save_message(self, message: TinNhanChatbotModel) -> TinNhanChatbotModel:
        pass

    @abstractmethod
    def get_history_by_customer_id(self, ma_kh: str) -> List[TinNhanChatbotModel]:
        pass

    @abstractmethod
    def check_customer_exists(self, ma_kh: str) -> Optional[object]:
        pass
