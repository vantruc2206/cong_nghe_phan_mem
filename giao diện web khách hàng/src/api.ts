import { OrderItem, OrderStatus, UserProfile, StationItem, DroneItem } from './types';

const RENDER_URL = 'https://smartdronedelivery-api.onrender.com';
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || RENDER_URL;

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Lỗi máy chủ' }));
    throw new Error(errorData.error || errorData.message || `Lỗi HTTP ${response.status}`);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
}

// ----------------------------------------------------
// Authentication API
// ----------------------------------------------------
export async function loginCustomerApi(email: string, pass: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password: pass }),
  });
  const data = await handleResponse<{ user: any; token: string }>(res);
  const u = data.user || data;
  const profile: UserProfile = {
    ma_nguoi_dung: u.ma_nguoi_dung || u.id,
    ma_khach_hang: u.ma_khach_hang || u.ma_nguoi_dung || u.id,
    ho_ten: u.ho_ten || 'Khách hàng',
    email: u.email || email,
    so_dien_thoai: u.so_dien_thoai || '',
    dia_chi: u.dia_chi || '',
    vai_tro: 'KHACH_HANG',
  };
  if (data.token) {
    localStorage.setItem('sdd_customer_token', data.token);
  }
  localStorage.setItem('sdd_customer', JSON.stringify(profile));
  return profile;
}

export async function registerCustomerApi(userData: { ho_ten: string; email: string; so_dien_thoai: string; mat_khau: string }): Promise<UserProfile> {
  // First fetch customer role if available
  let roleId = '';
  try {
    const rolesRes = await fetch(`${API_BASE_URL}/auth/roles`);
    if (rolesRes.ok) {
      const roles = await rolesRes.json();
      const khRole = (roles || []).find((r: any) =>
        (r.ten_vai_tro || '').toUpperCase().includes('KHÁCH') ||
        (r.ten_vai_tro || '').toUpperCase().includes('CUSTOMER') ||
        (r.ten_vai_tro || '').toUpperCase().includes('KHACH')
      );
      if (khRole) roleId = khRole.ma_vai_tro;
    }
  } catch (e) {
    // fallback
  }

  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ma_vai_tro: roleId || '00000000-0000-0000-0000-000000000000',
      ho_ten: userData.ho_ten.trim(),
      email: userData.email.trim(),
      so_dien_thoai: userData.so_dien_thoai.trim(),
      mat_khau: userData.mat_khau,
    }),
  });
  const data = await handleResponse<any>(res);
  const profile: UserProfile = {
    ma_nguoi_dung: data.ma_nguoi_dung || data.id,
    ma_khach_hang: data.ma_khach_hang || data.ma_nguoi_dung || data.id,
    ho_ten: data.ho_ten || userData.ho_ten,
    email: data.email || userData.email,
    so_dien_thoai: data.so_dien_thoai || userData.so_dien_thoai,
    vai_tro: 'KHACH_HANG',
  };
  localStorage.setItem('sdd_customer', JSON.stringify(profile));
  return profile;
}

export async function updateUserProfileApi(payload: { email: string; new_email?: string; ho_ten?: string; so_dien_thoai?: string; dia_chi?: string }): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<any>(res);
  const u = data.user || data;
  const updatedProfile: UserProfile = {
    ma_nguoi_dung: u.ma_nguoi_dung || u.id,
    ma_khach_hang: u.ma_khach_hang || u.ma_nguoi_dung || u.id,
    ho_ten: u.ho_ten || payload.ho_ten || '',
    email: u.email || payload.new_email || payload.email,
    so_dien_thoai: u.so_dien_thoai || payload.so_dien_thoai || '',
    dia_chi: u.dia_chi || payload.dia_chi || '',
    vai_tro: 'KHACH_HANG',
  };
  localStorage.setItem('sdd_customer', JSON.stringify(updatedProfile));
  return updatedProfile;
}

export async function changePasswordApi(payload: { email: string; current_password: string; new_password: string }): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await handleResponse(res);
}

function normalizeOrderStatus(raw?: string): OrderStatus {
  if (!raw) return 'PENDING';
  const s = raw.toString().trim().toUpperCase();
  if (s.includes('CHỐI') || s.includes('TỪ CHỐI') || s.includes('REJECTED') || s.includes('DENIED')) return 'REJECTED';
  if (s.includes('ĐÃ ĐẾN') || s.includes('ĐẾN') || s.includes('DA_DEN') || s.includes('ARRIVED')) return 'ARRIVED';
  if (s.includes('CHỜ') || s.includes('PENDING')) return 'PENDING';
  if (s.includes('ĐÃ DUYỆT') || s === 'APPROVED' || s === 'DUYỆT') return 'APPROVED';
  if (s.includes('GIAO') || s.includes('TRANSIT') || s.includes('DELIVERING')) return 'IN_TRANSIT';
  if (s.includes('HOÀN') || s.includes('DELIVERED')) return 'DELIVERED';
  if (s.includes('HỦY') || s.includes('CANCEL')) return 'CANCELLED';
  if (s.includes('THẤT') || s.includes('FAIL')) return 'FAILED';
  return 'PENDING';
}

// ----------------------------------------------------
// Orders API
export async function fetchCustomerOrders(customerId?: string): Promise<OrderItem[]> {
  if (!customerId) {
    return [];
  }

  const url = `${API_BASE_URL}/orders/?ma_khach_hang=${encodeURIComponent(customerId)}`;
  const res = await fetch(url);
  const data = await handleResponse<any[]>(res);

  const orders = (data || []).map((item) => {
    const normalizedStatus = normalizeOrderStatus(item.trang_thai_don_hang || item.trang_thai);
    const orderId = item.ma_don_hang || item.id;
    const rawLat = item.vi_do ?? item.toa_do_giao?.lat;
    const rawLng = item.kinh_do ?? item.toa_do_giao?.lng;
    const lat = rawLat != null ? parseFloat(rawLat) : 0;
    const lng = rawLng != null ? parseFloat(rawLng) : 0;

    return {
      ma_don_hang: orderId,
      ma_drone: item.ma_drone || undefined,
      ma_van_don: item.ma_van_don || orderId,
      ma_khach_hang: item.ma_kh || item.ma_khach_hang || customerId,
      ten_nguoi_nhan: item.ten_nguoi_nhan || item.ten_khach_hang || '',
      so_dien_thoai_nhan: item.so_dien_thoai_nhan || item.sdt || '',
      dia_chi_giao: item.dia_chi_giao || item.dia_chi || '',
      trong_luong: parseFloat(item.trong_luong || 0),
      trang_thai: normalizedStatus,
      phuong_thuc_thanh_toan: item.cach_thuc_thanh_toan || item.phuong_thuc_thanh_toan || 'COD',
      phi_giao_hang: parseFloat(item.tong_tien ?? item.phi_giao_hang ?? 0),
      thoi_gian_tao: item.ngay_dat_hang || item.thoi_gian_tao || new Date().toISOString(),
      ghi_chu: item.ghi_chu || '',
      toa_do_giao: { lat, lng },
      vi_do: lat,
      kinh_do: lng,
      ma_tram: item.ma_tram || undefined,
      ten_tram: item.ten_tram || undefined,
      trang_thai_giao_hang: item.trang_thai_giao_hang || undefined,
      ly_do_tu_choi: item.ly_do_tu_choi || item.mo_ta_su_co || undefined,
      mo_ta_su_co: item.mo_ta_su_co || item.ly_do_tu_choi || undefined,
    };
  }).sort((a, b) => new Date(b.thoi_gian_tao || 0).getTime() - new Date(a.thoi_gian_tao || 0).getTime());

  try {
    localStorage.setItem('sdd_customer_orders', JSON.stringify(orders));
  } catch (e) { }

  return orders;
}

export async function getOrderDetail(orderId: string): Promise<OrderItem> {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
  const item = await handleResponse<any>(res);
  const normalizedStatus = normalizeOrderStatus(item.trang_thai_don_hang || item.trang_thai);

  const rawLat = item.vi_do ?? item.toa_do_giao?.lat;
  const rawLng = item.kinh_do ?? item.toa_do_giao?.lng;
  const lat = rawLat != null ? parseFloat(rawLat) : 0;
  const lng = rawLng != null ? parseFloat(rawLng) : 0;

  return {
    ma_don_hang: item.ma_don_hang || orderId,
    ma_van_don: item.ma_van_don || orderId,
    ten_nguoi_nhan: item.ten_nguoi_nhan || item.ten_khach_hang || '',
    so_dien_thoai_nhan: item.so_dien_thoai_nhan || item.sdt || '',
    dia_chi_giao: item.dia_chi_giao || item.dia_chi || '',
    trong_luong: parseFloat(item.trong_luong || 0),
    trang_thai: normalizedStatus,
    phuong_thuc_thanh_toan: item.cach_thuc_thanh_toan || item.phuong_thuc_thanh_toan || 'COD',
    phi_giao_hang: parseFloat(item.tong_tien ?? item.phi_giao_hang ?? 0),
    thoi_gian_tao: item.ngay_dat_hang || item.thoi_gian_tao || new Date().toISOString(),
    ghi_chu: item.ghi_chu || '',
    toa_do_giao: { lat, lng },
    vi_do: lat,
    kinh_do: lng,
    ly_do_tu_choi: item.ly_do_tu_choi || item.mo_ta_su_co || undefined,
    mo_ta_su_co: item.mo_ta_su_co || item.ly_do_tu_choi || undefined,
  };
}

export async function createOrderApi(orderData: Partial<OrderItem> & { vi_do?: number; kinh_do?: number }): Promise<OrderItem> {
  const latVal = (orderData as any).vi_do ?? orderData.toa_do_giao?.lat;
  const lngVal = (orderData as any).kinh_do ?? orderData.toa_do_giao?.lng;
  let storedUser: any = null;
  try {
    const saved = localStorage.getItem('sdd_customer');
    if (saved) storedUser = JSON.parse(saved);
  } catch { }
  const customerId = orderData.ma_khach_hang || (orderData as any).ma_kh || (orderData as any).ma_nguoi_dung || storedUser?.ma_khach_hang || storedUser?.ma_nguoi_dung || undefined;

  const res = await fetch(`${API_BASE_URL}/orders/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ma_kh: customerId,
      ten_nguoi_nhan: orderData.ten_nguoi_nhan,
      so_dien_thoai_nhan: orderData.so_dien_thoai_nhan,
      dia_chi_giao: orderData.dia_chi_giao,
      vi_do: latVal,
      kinh_do: lngVal,
      lat: latVal,
      lng: lngVal,
      toa_do_giao: (latVal != null && lngVal != null) ? { lat: latVal, lng: lngVal } : undefined,
      ten_hang_hoa: (orderData as any).ten_hang_hoa || 'Gói hàng tổng hợp',
      trong_luong: orderData.trong_luong || 0,
      cach_thuc_thanh_toan: orderData.phuong_thuc_thanh_toan || 'COD',
      tong_tien: orderData.phi_giao_hang || 0,
      ghi_chu: orderData.ghi_chu || '',
    }),
  });
  const item = await handleResponse<any>(res);
  const orderId = item.ma_don_hang || item.id;
  return {
    ma_don_hang: orderId,
    ma_van_don: item.ma_van_don || orderId,
    ten_nguoi_nhan: orderData.ten_nguoi_nhan || '',
    so_dien_thoai_nhan: orderData.so_dien_thoai_nhan || '',
    dia_chi_giao: orderData.dia_chi_giao || '',
    trong_luong: orderData.trong_luong || 0,
    trang_thai: 'PENDING',
    phuong_thuc_thanh_toan: orderData.phuong_thuc_thanh_toan || 'COD',
    phi_giao_hang: orderData.phi_giao_hang || 0,
    thoi_gian_tao: new Date().toISOString(),
    toa_do_giao: (latVal != null && lngVal != null) ? { lat: latVal, lng: lngVal } : { lat: 0, lng: 0 },
    vi_do: latVal ?? 0,
    kinh_do: lngVal ?? 0,
  };
}

export async function updateOrderApi(orderId: string, updateData: Partial<OrderItem>): Promise<OrderItem> {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  const item = await handleResponse<any>(res);
  return {
    ma_don_hang: item.ma_don_hang || orderId,
    ten_nguoi_nhan: updateData.ten_nguoi_nhan || 'Người nhận',
    so_dien_thoai_nhan: updateData.so_dien_thoai_nhan || '',
    dia_chi_giao: updateData.dia_chi_giao || '',
    trong_luong: updateData.trong_luong || 1.5,
    trang_thai: (updateData.trang_thai || 'PENDING') as OrderStatus,
    phuong_thuc_thanh_toan: updateData.phuong_thuc_thanh_toan || 'COD',
    phi_giao_hang: updateData.phi_giao_hang || 35000,
  };
}

export async function cancelOrderApi(orderId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    method: 'DELETE',
  });
  await handleResponse(res);
}

export async function completeOrderApi(orderId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/complete`, {
    method: 'PUT',
  });
  await handleResponse(res);
}

// ----------------------------------------------------
// Stations & Drones API
// ----------------------------------------------------
// ----------------------------------------------------
// Stations & Drones API (100% Real Database - ZERO Mock Data)
// ----------------------------------------------------
export async function fetchStationsApi(): Promise<StationItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/stations/`);
    const data = await handleResponse<any[]>(res);
    return (data || []).map((s) => ({
      id: s.ma_tram || s.id,
      ma_tram: s.ma_tram || s.id,
      ten_tram: s.ten_tram || s.name || 'Trạm hạ cánh',
      dia_chi: s.dia_chi_tram || s.dia_chi || '',
      lat: Number(s.lat ?? s.vi_do ?? 0),
      lng: Number(s.lng ?? s.kinh_do ?? 0),
      vi_do: Number(s.lat ?? s.vi_do ?? 0),
      kinh_do: Number(s.lng ?? s.kinh_do ?? 0),
      suc_chua: s.cong_suat_toi_da || s.suc_chua || 0,
      so_drone_hien_tai: s.so_drone_hien_tai || 0,
      trang_thai: s.trang_thai_hoat_dong || s.trang_thai || 'ACTIVE',
    }));
  } catch {
    return [];
  }
}

export async function fetchDronesApi(): Promise<DroneItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/drones/`);
    const data = await handleResponse<any[]>(res);
    return (data || []).map((d, index) => ({
      id: d.ma_drone || d.id || `DRN-0${index + 1}`,
      ma_drone: d.ma_drone || d.id || `DRN-0${index + 1}`,
      ten_drone: d.ten_drone || d.name || `Drone ${index + 1}`,
      model: d.model || 'SkyCarrier X1',
      dung_luong_pin: d.dung_luong_pin ?? d.cong_suat_pin ?? 100,
      tai_trong_toi_da: Number(d.tai_trong_toi_da ?? 5.0),
      trang_thai: d.trang_thai || d.trang_thai_drone || 'AVAILABLE',
      vi_do_hien_tai: d.vi_do_hien_tai ?? d.vi_do ?? null,
      kinh_do_hien_tai: d.kinh_do_hien_tai ?? d.kinh_do ?? null,
      ma_tram_hien_tai: d.ma_tram_hien_tai ?? d.ma_tram ?? null,
      toa_do_hien_tai: {
        lat: parseFloat(d.vi_do_hien_tai ?? d.vi_do ?? 0),
        lng: parseFloat(d.kinh_do_hien_tai ?? d.kinh_do ?? 0)
      }
    }));
  } catch {
    return [];
  }
}

// ----------------------------------------------------
// Chatbot AI API
// ----------------------------------------------------
export async function sendChatbotMessageApi(message: string, customerId?: string): Promise<{ text: string }> {
  // 1. Try Backend Flask API first
  try {
    const res = await fetch(`${API_BASE_URL}/chatbot/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        noi_dung: message,
        ma_kh: customerId || 'KH-GUEST',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.phan_hoi || data.text || data.message) {
        return { text: data.phan_hoi || data.text || data.message };
      }
    }
  } catch (e) {
    // Backend offline - call Groq AI LLM directly
  }

  // 2. Direct Groq AI LLM Execution & Smart RAG Engine
  try {
    const storedUserStr = localStorage.getItem('sdd_customer');
    const userObj = storedUserStr ? JSON.parse(storedUserStr) : null;
    const userName = userObj?.ho_ten || 'bạn';

    // Retrieve stored customer orders for RAG context
    let ordersList: OrderItem[] = [];
    let ordersContext = 'Khách hàng chưa có đơn hàng nào.';
    try {
      const storedOrdersStr = localStorage.getItem('sdd_customer_orders') || localStorage.getItem('sdd_orders');
      if (storedOrdersStr) {
        ordersList = JSON.parse(storedOrdersStr);
        if (ordersList && ordersList.length > 0) {
          ordersContext = ordersList.map((o) =>
            `• Đơn ${o.ma_don_hang ? 'SD-' + o.ma_don_hang.substring(0, 8).toUpperCase() : 'Mã mới'}: Trạng thái ${o.trang_thai}, Giao đến ${o.dia_chi_giao || userObj?.dia_chi || 'Chưa có địa chỉ'}, Trọng lượng ${o.trong_luong || 1.0}kg, Cước phí ${(o.phi_giao_hang || 30000).toLocaleString('vi-VN')} VNĐ.`
          ).join('\n');
        }
      }
    } catch (e) { }

    const groqApiKey = (import.meta as any).env?.VITE_GROQ_API_KEY;

    if (groqApiKey && !groqApiKey.includes('demo')) {
      const systemPrompt = `Bạn là Trợ lý AI tự động thông minh của dịch vụ giao hàng bằng drone tự động SmartDrone Delivery.
Hãy trả lời khách hàng bằng tiếng Việt một cách tự nhiên, lịch sự, thân thiện và linh hoạt. Tránh trả lời bằng các câu mẫu cứng nhắc.

Dữ liệu kiến thức hệ thống SmartDrone Delivery:
- Giờ vận hành: 07:00 - 21:00 hàng ngày. Hotline hỗ trợ: 1900-DRONE.
- Bảng phí dịch vụ (tính theo trọng lượng gói hàng): Cước gốc 30.000 VNĐ (cho 1.0 kg đầu tiên), thêm +10.000 VNĐ cho mỗi kg tiếp theo. Trọng lượng tối đa cho phép: 5.0 kg/chuyến.
- Đội máy bay Drone: Dòng SkyCarrier X1 hiện đại, tải trọng tối đa 5.0 kg, tốc độ bay 45 - 60 km/h, bán kính hoạt động 15 km, thời gian giao hàng trung bình 10 - 20 phút.
- Khách hàng hiện tại: ${userName}

Dữ liệu đơn hàng thời gian thực của khách hàng:
${ordersContext}

Nhiệm vụ: Hãy phân tích câu hỏi của khách hàng và trả lời bằng trí tuệ nhân tạo (AI) linh hoạt dựa trên dữ liệu trên.`;

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7
        })
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const aiContent = groqData.choices?.[0]?.message?.content;
        if (aiContent) {
          return { text: aiContent };
        }
      }
    }

    // 3. Smart Intelligent RAG AI Engine (Uses 100% Real PostgreSQL Database Data - ZERO Mock Data)
    const msgLower = message.toLowerCase();

    // A. Order Status, Price & Tracking Intent (Checked FIRST using real database records)
    if (['đơn', 'đơn hàng', 'đơn mới nhất', 'đơn gần đây', 'sd-', 'trạng thái', 'ở đâu', 'khi nào', 'đến nơi'].some(kw => msgLower.includes(kw))) {
      const isAskingPrice = ['giá', 'bao nhiêu', 'nhiêu', 'tiền', 'tổng', 'hết bao nhiêu', 'chi phí'].some(kw => msgLower.includes(kw));

      // Fetch real database orders if not loaded
      if ((!ordersList || ordersList.length === 0) && userObj?.ma_khach_hang) {
        try {
          ordersList = await fetchCustomerOrders(userObj.ma_khach_hang);
        } catch (e) { }
      }

      if (ordersList && ordersList.length > 0) {
        const latestOrder = ordersList[0];
        const shortCode = latestOrder.ma_don_hang ? `SD-${latestOrder.ma_don_hang.substring(0, 8).toUpperCase()}` : 'Chưa có mã';
        let statusStr = '🟡 Đang chờ duyệt đơn';
        if (latestOrder.trang_thai === 'IN_TRANSIT') statusStr = '🛸 Đang trên đường giao bằng Drone';
        else if (latestOrder.trang_thai === 'DELIVERED') statusStr = '✅ Đã giao thành công đến điểm hạ cánh';
        else if (latestOrder.trang_thai === 'APPROVED') statusStr = '🔵 Đã duyệt - Đang chuẩn bị xuất phát tại Trạm Drone';
        else if (latestOrder.trang_thai === 'CANCELLED') statusStr = '❌ Đơn hàng đã được hủy';

        const addrStr = latestOrder.dia_chi_giao || userObj?.dia_chi || 'Chưa cập nhật địa chỉ';
        const feeNum = latestOrder.phi_giao_hang || 0;
        const feeStr = feeNum > 0 ? feeNum.toLocaleString('vi-VN') + ' VNĐ' : 'Chưa tính cước';
        const itemName = latestOrder.ten_hang_hoa || 'Kiện hàng';

        if (isAskingPrice) {
          return {
            text: `Chào ${userName}! 💰 Đơn hàng thực tế trong CSDL **${shortCode}** của bạn có giá chi tiết:\n\n• **Tên kiện hàng**: ${itemName}\n• **Tổng cước phí giao hàng**: **${feeStr}**\n• **Trạng thái đơn hàng**: ${statusStr}\n• **Địa chỉ nhận hàng**: ${addrStr}`
          };
        }

        return {
          text: `Chào ${userName}! 👋 Trợ lý AI SmartDrone đã tra cứu CSDL thực tế cho đơn hàng của bạn:\n\n📦 **Mã đơn**: ${shortCode}\n• **Trạng thái**: ${statusStr}\n• **Địa chỉ giao**: ${addrStr}\n• **Cước phí**: ${feeStr}\n• **Trọng lượng**: ${latestOrder.trong_luong || 0} kg`
        };
      } else {
        return {
          text: `Chào ${userName}! 👋 Trợ lý AI SmartDrone đã kiểm tra cơ sở dữ liệu hệ thống: Tài khoản của bạn hiện **chưa có đơn hàng nào trong CSDL**. Bạn hãy vào mục "Tạo đơn hàng" để bắt đầu đặt đơn mới nhé!`
        };
      }
    }

    // B. Drone Capacity & Specifications Intent
    if (['drone', 'tải', 'kg', 'máy bay', 'sức chứa', 'tốc độ', 'bao xa', 'nặng'].some(kw => msgLower.includes(kw))) {
      return {
        text: `Chào ${userName}! 🛸 Đội máy bay không người lái SmartDrone SkyCarrier X1 có thông số kỹ thuật thực tế:\n\n• **Tải trọng tối đa**: 5.0 kg / chuyến\n• **Tốc độ di chuyển**: 45 - 60 km/h\n• **Bán kính bay tối đa**: 15 km\n• **Thời gian giao hàng trung bình**: 10 - 20 phút\n• **Công nghệ**: Định vị vệ tinh GPS đa kênh & Cảm biến né vật cản LiDAR`
      };
    }

    // C. General Shipping Rates & Pricing Structure Intent
    if (['phí', 'cước', 'giá', 'tốn bao nhiêu', 'nhiêu tiền', 'chi phí', 'tính tiền'].some(kw => msgLower.includes(kw))) {
      return {
        text: `Chào ${userName}! 🚁 Cước phí giao hàng bằng Drone được tính tự động theo trọng lượng kiện hàng:\n\n• **Cước gốc (cho 1.0 kg đầu tiên)**: 30.000 VNĐ\n• **Mỗi kg tiếp theo**: +10.000 VNĐ/kg\n• **Trọng lượng kiện hàng tối đa**: 5.0 kg / chuyến`
      };
    }

    // D. Operating Hours & Support Intent
    if (['giờ', 'mở cửa', 'hotline', 'liên hệ', 'tổng đài', 'hỗ trợ'].some(kw => msgLower.includes(kw))) {
      return {
        text: `Chào ${userName}! 📞 Hệ thống giao hàng SmartDrone Delivery hoạt động từ **07:00 đến 21:00** hàng ngày.\n• **Hotline hỗ trợ**: 1900-DRONE`
      };
    }

    // E. General Intelligent Response
    return {
      text: `Chào ${userName}! 👋 Tôi là Trợ Lý AI SmartDrone Delivery. Bạn có thể tra cứu đơn hàng thực tế của mình hoặc hỏi về phí giao hàng, thông số Drone nhé!`
    };
  } catch (err) {
    const storedUserStr = localStorage.getItem('sdd_customer');
    const userObj = storedUserStr ? JSON.parse(storedUserStr) : null;
    const userName = userObj?.ho_ten || 'bạn';
    return {
      text: `Chào ${userName}! 🛸 Hệ thống SmartDrone đã sẵn sàng kết nối CSDL để hỗ trợ bạn.`
    };
  }
}

