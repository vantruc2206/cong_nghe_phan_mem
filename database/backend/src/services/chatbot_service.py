from domain.models.ichatbot_repository import IChatbotRepository
from infrastructure.models.app_tin_nhan_chatbot_model import TinNhanChatbotModel
from typing import List, Optional

class ChatbotService:
    def __init__(self, repository: IChatbotRepository):
        self.repository = repository

    def get_history_by_customer_id(self, ma_kh: str) -> List[TinNhanChatbotModel]:
        return self.repository.get_history_by_customer_id(ma_kh)

    def send_message(self, data: dict) -> Optional[TinNhanChatbotModel]:
        customer = self.repository.check_customer_exists(data['ma_kh'])
        if not customer:
            return None
            
        user_content = data['noi_dung']
        ai_response = data.get('phan_hoi')
        
        if not ai_response:
            import os
            api_key = os.environ.get("GROQ_API_KEY")
            if api_key:
                import json
                import http.client
                try:
                    conn = http.client.HTTPSConnection("api.groq.com", timeout=10)
                    headers = {
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "model": "llama3-8b-8192",
                        "messages": [
                            {
                                "role": "system",
                                "content": f"Bạn là trợ lý ảo hỗ trợ khách hàng của dịch vụ giao hàng bằng drone tự động SmartDroneDelivery. Hãy trả lời thân thiện, ngắn gọn và bằng tiếng Việt. Khách hàng đang trò chuyện với bạn tên là {customer.ho} {customer.ten}."
                            },
                            {
                                "role": "user",
                                "content": user_content
                            }
                        ],
                        "temperature": 0.7
                    }
                    conn.request("POST", "/openai/v1/chat/completions", json.dumps(payload), headers)
                    res = conn.getresponse()
                    if res.status == 200:
                        resp_json = json.loads(res.read().decode('utf-8'))
                        ai_response = resp_json["choices"][0]["message"]["content"]
                    else:
                        ai_response = f"Xin chào {customer.ten}, trạm kết nối Groq trả về mã lỗi HTTP {res.status}. Bạn vừa nói: '{user_content}'."
                except Exception as e:
                    ai_response = f"Xin chào {customer.ten}, lỗi kết nối tới Groq AI: {str(e)}. Bạn vừa nói: '{user_content}'."
            else:
                ai_response = f"Xin chào {customer.ten}, tôi là SmartDrone AI Chatbot (Mock fallback). Bạn vừa nói: '{user_content}'. Tôi có thể giúp gì cho bạn?"
                
        message = TinNhanChatbotModel(
            ma_kh=data['ma_kh'],
            noi_dung=user_content,
            phan_hoi=ai_response
        )
        return self.repository.save_message(message)
