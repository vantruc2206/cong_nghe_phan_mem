from domain.models.ichatbot_repository import IChatbotRepository
from infrastructure.models.app_tin_nhan_chatbot_model import TinNhanChatbotModel
from typing import List, Optional
import os
import json
import http.client


class ChatbotService:
    def __init__(self, repository: IChatbotRepository):
        self.repository = repository

    def get_history_by_customer_id(self, ma_kh: str) -> List[TinNhanChatbotModel]:
        return self.repository.get_history_by_customer_id(ma_kh)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _status_display(self, stt: str) -> str:
        """Chuyển mã trạng thái thành văn bản thân thiện."""
        mapping = {
            'Đang giao': '🛸 Đang giao hàng bằng Drone',
            'IN_TRANSIT': '🛸 Đang giao hàng bằng Drone',
            'ASSIGNED':  '🛸 Đang giao hàng bằng Drone',
            'Đã giao':   '✅ Đã giao hàng thành công',
            'DELIVERED': '✅ Đã giao hàng thành công',
            'Đang xử lý': '🟡 Đang chờ duyệt đơn',
            'PENDING':   '🟡 Đang chờ duyệt đơn',
            'Chờ duyệt': '🟡 Đang chờ duyệt đơn',
            'Đã duyệt':  '🔵 Đã duyệt - Đang điều drone',
            'APPROVED':  '🔵 Đã duyệt - Đang điều drone',
            'Đã hủy':    '❌ Đã hủy đơn',
            'CANCELLED': '❌ Đã hủy đơn',
        }
        return mapping.get(stt, stt or 'Đang xử lý')

    def _build_db_context(self, customer) -> str:
        """
        Query nhiều bảng DB và tổng hợp thành đoạn context
        giàu thông tin cho LLM.
        """
        from infrastructure.models.app_don_hang_model import DonHangModel
        from infrastructure.models.app_goi_hang_model import GoiHangModel
        from infrastructure.models.app_dia_chi_model import DiaChiModel
        from infrastructure.models.app_giao_hang_model import GiaoHangModel
        from infrastructure.models.app_drone_model import DroneModel
        from infrastructure.models.app_tram_ha_canh_model import TramHaCanhModel

        session = self.repository.session
        lines = []

        # === 1. Đơn hàng của khách ===
        try:
            orders = session.query(DonHangModel).filter_by(
                ma_kh=customer.ma_kh
            ).order_by(DonHangModel.ngay_dat_hang.desc()).limit(10).all()

            if orders:
                lines.append(f"=== ĐƠN HÀNG CỦA KHÁCH ({len(orders)} đơn gần nhất) ===")
                for o in orders:
                    short_id = str(o.ma_don_hang)[:8].upper()
                    stt = self._status_display(o.trang_thai_don_hang or '')

                    # Gói hàng
                    pkg = session.query(GoiHangModel).filter_by(
                        ma_don_hang=o.ma_don_hang
                    ).first()
                    pkg_desc = (
                        f"{pkg.loai_hang_hoa} ({pkg.can_nang}kg)"
                        if pkg else "Kiện hàng"
                    )

                    # Địa chỉ
                    addr = session.query(DiaChiModel).filter_by(
                        ma_dia_chi=o.ma_dia_chi
                    ).first()
                    addr_desc = (addr.dia_chi_cu_the if addr
                                 else "Địa chỉ không rõ")

                    # Giao hàng thực tế (drone, người phụ trách)
                    gh = session.query(GiaoHangModel).filter_by(
                        ma_don_hang=o.ma_don_hang
                    ).first()
                    drone_info = ""
                    if gh and gh.ma_drone:
                        d = session.query(DroneModel).filter_by(
                            ma_drone=gh.ma_drone
                        ).first()
                        if d:
                            drone_info = (f", Drone phụ trách: {d.ten_drone or d.model or str(d.ma_drone)[:8].upper()}"
                                          f" (pin {d.cong_suat_pin}%)")
                    delivery_time = ""
                    if gh and gh.thoi_gian_giao:
                        delivery_time = f", Thời gian giao: {gh.thoi_gian_giao.strftime('%d/%m/%Y %H:%M')}"

                    tong_tien = f" | Tổng tiền: {o.tong_tien:,.0f} VNĐ" if o.tong_tien else ""
                    date_str = o.ngay_dat_hang.strftime('%d/%m/%Y') if o.ngay_dat_hang else ""

                    lines.append(
                        f"- [SD-{short_id}] {pkg_desc} → {addr_desc}"
                        f" | Trạng thái: {stt}{drone_info}{delivery_time}"
                        f"{tong_tien} | Ngày đặt: {date_str}"
                    )
            else:
                lines.append("=== ĐƠN HÀNG: Khách chưa có đơn hàng nào ===")
        except Exception as e:
            lines.append(f"=== ĐƠN HÀNG: Lỗi truy vấn — {e} ===")

        # === 2. Tổng quan hệ thống Drone ===
        try:
            all_drones = session.query(DroneModel).all()
            if all_drones:
                ready = [d for d in all_drones if 'Sẵn sàng' in (d.trang_thai_drone or '')]
                flying = [d for d in all_drones if any(
                    k in (d.trang_thai_drone or '') for k in ['Đang bay', 'Giao hàng', 'Flying']
                )]
                lines.append(
                    f"\n=== HỆ THỐNG DRONE (tổng {len(all_drones)} chiếc)"
                    f" — Sẵn sàng: {len(ready)} | Đang bay: {len(flying)} ==="
                )
                for d in all_drones[:8]:  # tối đa 8 drone
                    pin = d.cong_suat_pin or 0
                    lines.append(
                        f"  • {d.ten_drone or d.model or str(d.ma_drone)[:8].upper()}"
                        f" [{d.trang_thai_drone}] pin={pin}%"
                        f" tải_tối_đa={d.tai_trong_toi_da}kg"
                    )
        except Exception:
            pass

        # === 3. Trạm hạ cánh ===
        try:
            trams = session.query(TramHaCanhModel).all()
            if trams:
                active_trams = [t for t in trams if t.trang_thai_hoat_dong == 'Đang hoạt động']
                lines.append(
                    f"\n=== TRẠM HẠ CÁNH (tổng {len(trams)} trạm"
                    f", đang hoạt động: {len(active_trams)}) ==="
                )
                for t in trams:
                    lines.append(
                        f"  • {t.ten_tram} — {t.dia_chi_tram}"
                        f" [{t.trang_thai_hoat_dong}] sức chứa: {t.cong_suat_toi_da} drone"
                    )
        except Exception:
            pass

        return "\n".join(lines)

    def _build_history_messages(self, ma_kh: str, limit: int = 6) -> list:
        """
        Lấy tối đa `limit` tin nhắn gần nhất từ DB và chuyển thành
        định dạng messages[] của Groq API để AI nhớ context hội thoại.
        """
        try:
            history = (
                self.repository.session
                .query(TinNhanChatbotModel)
                .filter_by(ma_kh=ma_kh)
                .order_by(TinNhanChatbotModel.thoi_gian.desc())
                .limit(limit)
                .all()
            )
            history = list(reversed(history))  # cũ → mới
            msgs = []
            for msg in history:
                if msg.noi_dung:
                    msgs.append({"role": "user", "content": msg.noi_dung})
                if msg.phan_hoi:
                    msgs.append({"role": "assistant", "content": msg.phan_hoi})
            return msgs
        except Exception:
            return []

    # ------------------------------------------------------------------
    # Main
    # ------------------------------------------------------------------
    def send_message(self, data: dict) -> Optional[TinNhanChatbotModel]:
        customer = self.repository.check_customer_exists(data['ma_kh'])
        if not customer:
            return None

        user_content = data['noi_dung']
        ai_response = data.get('phan_hoi')

        if not ai_response:
            api_key = os.environ.get("GROQ_API_KEY") or ""
            cust_name = (
                f"{customer.ho} {customer.ten}".strip()
                if (customer and customer.ten) else "bạn"
            )

            # --- Thu thập dữ liệu thật từ DB ---
            try:
                db_context = self._build_db_context(customer)
            except Exception as e:
                db_context = f"Không thể kết nối CSDL: {e}"

            # --- Lấy lịch sử hội thoại ---
            history_msgs = self._build_history_messages(str(customer.ma_kh))

            # --- System prompt ---
            system_prompt = f"""Bạn là trợ lý AI của dịch vụ giao hàng bằng drone tự động SmartDrone Delivery.

QUY TẮC QUAN TRỌNG:
- Luôn trả lời bằng tiếng Việt, tự nhiên và thân thiện.
- Dựa HOÀN TOÀN vào số liệu thực tế từ CSDL được cung cấp bên dưới, KHÔNG bịa ra dữ liệu.
- Không dùng câu mẫu cứng nhắc hay template. Hãy phân tích câu hỏi và trả lời thông minh.
- Nếu câu hỏi không liên quan đến dữ liệu hiện có, hãy nói thật là bạn không có thông tin đó.
- Nhớ ngữ cảnh hội thoại trước đó để trả lời nhất quán.

THÔNG TIN HỆ THỐNG:
- Giờ vận hành: 07:00–21:00 hàng ngày | Hotline: 1900-DRONE
- Phí cơ bản: 25.000 VNĐ (dưới 2km), +5.000 VNĐ/km tiếp
- Drone SkyCarrier X1: tải tối đa 5kg, tốc độ 45–60km/h, bán kính 15km, giao hàng 10–20 phút
- Khách hàng đang chat: {cust_name}

DỮ LIỆU THỰC TẾ TỪ DATABASE (cập nhật real-time):
{db_context}"""

            # --- Xây dựng messages[] cho Groq ---
            messages = [{"role": "system", "content": system_prompt}]
            messages.extend(history_msgs)         # lịch sử hội thoại
            messages.append({"role": "user", "content": user_content})  # câu hỏi hiện tại

            # --- Gọi Groq API ---
            models_to_try = [
                "llama-3.3-70b-versatile",
                "llama-3.1-8b-instant",
                "mixtral-8x7b-32768",
            ]
            for model_name in models_to_try:
                try:
                    conn = http.client.HTTPSConnection("api.groq.com", timeout=15)
                    headers = {
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    }
                    payload = {
                        "model": model_name,
                        "messages": messages,
                        "temperature": 0.85,
                        "max_tokens": 1024,
                    }
                    conn.request(
                        "POST",
                        "/openai/v1/chat/completions",
                        json.dumps(payload),
                        headers,
                    )
                    res = conn.getresponse()
                    if res.status == 200:
                        resp_json = json.loads(res.read().decode("utf-8"))
                        ai_response = resp_json["choices"][0]["message"]["content"]
                        break
                    conn.close()
                except Exception:
                    continue

            # --- Fallback khi Groq không khả dụng ---
            if not ai_response:
                ai_response = (
                    f"Xin chào {cust_name}! Hiện tôi đang không thể kết nối đến AI server."
                    f" Đây là dữ liệu đơn hàng của bạn từ hệ thống:\n\n{db_context}\n\n"
                    f"Bạn cần hỗ trợ thêm gì không? Hotline: 1900-DRONE"
                )

        message = TinNhanChatbotModel(
            ma_kh=customer.ma_kh if customer else data.get('ma_kh'),
            noi_dung=user_content,
            phan_hoi=ai_response,
        )
        return self.repository.save_message(message)
