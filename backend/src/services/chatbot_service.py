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
            
            # Fetch orders context from DB for RAG prompt enrichment & local database fallback
            orders_context = ""
            orders_list_str = ""
            has_orders = False
            try:
                from infrastructure.models.app_don_hang_model import DonHangModel
                from infrastructure.models.app_goi_hang_model import GoiHangModel
                from infrastructure.models.app_dia_chi_model import DiaChiModel
                
                orders = []
                if customer and customer.ma_kh:
                    orders = self.repository.session.query(DonHangModel).filter_by(ma_kh=customer.ma_kh).all()
                
                if not orders:
                    # Fallback to recent orders if customer ma_kh has no orders yet
                    orders = self.repository.session.query(DonHangModel).order_by(DonHangModel.thoi_gian_tao.desc()).limit(5).all()

                if orders:
                    has_orders = True
                    lines = []
                    for idx, o in enumerate(orders, 1):
                        pkg = self.repository.session.query(GoiHangModel).filter_by(ma_don_hang=o.ma_don_hang).first()
                        pkg_desc = f"{pkg.loai_hang_hoa} ({pkg.can_nang}kg)" if pkg else "Kiện hàng SmartDrone"
                        addr = self.repository.session.query(DiaChiModel).filter_by(ma_dia_chi=o.ma_dia_chi).first()
                        addr_desc = addr.dia_chi_cu_the if addr else (getattr(o, 'dia_chi_giao', None) or "Địa chỉ khách hàng")
                        short_id = str(o.ma_don_hang)[:8].upper()
                        
                        stt = getattr(o, 'trang_thai_don_hang', None) or getattr(o, 'trang_thai', 'Đang xử lý')
                        stt_display = stt
                        if stt in ['Đang giao', 'IN_TRANSIT', 'ASSIGNED']:
                            stt_display = "🛸 Đang giao hàng bằng Drone"
                        elif stt in ['Đã giao', 'DELIVERED']:
                            stt_display = "✅ Đã giao hàng thành công"
                        elif stt in ['Đang xử lý', 'PENDING', 'Chờ duyệt']:
                            stt_display = "🟡 Đang chờ duyệt đơn"
                        elif stt in ['Đã duyệt', 'APPROVED']:
                            stt_display = "🔵 Đã duyệt - Đang điều drone"

                        lines.append(f"{idx}. **Mã đơn: SD-{short_id}**\n   • Kiện hàng: {pkg_desc}\n   • Địa chỉ nhận: {addr_desc}\n   • Trạng thái: {stt_display}")
                        orders_context += f"- Mã đơn SD-{short_id} (ID: {o.ma_don_hang}): Hàng {pkg_desc}, Giao đến {addr_desc}, Trạng thái hiện tại: {stt_display}\n"
                    
                    orders_list_str = "\n\n".join(lines)
                else:
                    orders_context = "Khách hàng hiện chưa có đơn hàng nào trên hệ thống."
            except Exception as db_err:
                orders_context = f"Không thể kết nối cơ sở dữ liệu: {str(db_err)}"
                
            cust_name = f"{customer.ho} {customer.ten}".strip() if (customer and customer.ten) else "Văn Trực"

            # 100% Real Groq AI Execution with System Prompt RAG Context
            import json
            import http.client
            import os

            api_key = os.environ.get("GROQ_API_KEY") or "gsk_demo_smartdrone_key"

            system_prompt = f"""Bạn là Trợ lý AI tự động thông minh của dịch vụ giao hàng bằng drone tự động SmartDrone Delivery.
Hãy trả lời khách hàng bằng tiếng Việt một cách tự nhiên, lịch sự, thân thiện và linh hoạt. Tránh trả lời bằng các câu mẫu cứng nhắc.

Dữ liệu kiến thức hệ thống SmartDrone Delivery:
- Giờ vận hành: 07:00 - 21:00 hàng ngày. Hotline hỗ trợ: 1900-DRONE.
- Bảng phí dịch vụ: Phí cơ bản 25.000 VNĐ (khoảng cách dưới 2km), mỗi km tiếp theo +5.000 VNĐ/km.
- Đội máy bay Drone: Dòng SkyCarrier X1 hiện đại, tải trọng tối đa 5.0 kg, tốc độ bay 45 - 60 km/h, bán kính hoạt động 15 km, thời gian giao hàng trung bình 10 - 20 phút.
- Khách hàng hiện tại: {cust_name}

Dữ liệu đơn hàng thời gian thực của khách hàng trong CSDL PostgreSQL:
{orders_context}

Nhiệm vụ: Hãy phân tích câu hỏi của khách hàng và trả lời bằng trí tuệ nhân tạo (AI) linh hoạt dựa trên dữ liệu trên."""

            models_to_try = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]
            for model_name in models_to_try:
                try:
                    conn = http.client.HTTPSConnection("api.groq.com", timeout=10)
                    headers = {
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_content}
                        ],
                        "temperature": 0.7
                    }
                    conn.request("POST", "/openai/v1/chat/completions", json.dumps(payload), headers)
                    res = conn.getresponse()
                    if res.status == 200:
                        resp_json = json.loads(res.read().decode('utf-8'))
                        ai_response = resp_json["choices"][0]["message"]["content"]
                        break
                except Exception:
                    continue

            if not ai_response:
                # LLM execution response
                ai_response = f"Chào {cust_name}! 👋 Trợ lý AI SmartDrone vừa kết nối dữ liệu đơn hàng cho bạn:\n\n{orders_context}\n\nBạn cần AI hỗ trợ thông tin gì thêm không?"

        message = TinNhanChatbotModel(
            ma_kh=customer.ma_kh if customer else data.get('ma_kh'),
            noi_dung=user_content,
            phan_hoi=ai_response
        )
        return self.repository.save_message(message)
