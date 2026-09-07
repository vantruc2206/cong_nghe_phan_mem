// ─── API Service Layer for Admin Web Portal ─────────────────────────────────
// Kết nối với SmartDroneDelivery Backend (Flask API)

export const LOCAL_URL = 'http://localhost:9999'
export const RENDER_URL = 'https://smartdronedelivery-api.onrender.com'

// Helper to determine active API URL
export function getBaseUrl(): string {
  const custom = localStorage.getItem('sdd_custom_api_url')
  if (custom) return custom
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return LOCAL_URL
  }
  return (import.meta as any).env?.VITE_API_URL || RENDER_URL
}

export function setBaseUrl(url: string): void {
  if (url) {
    localStorage.setItem('sdd_custom_api_url', url)
  } else {
    localStorage.removeItem('sdd_custom_api_url')
  }
}

// ─── Token helpers ────────────────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem('sdd_token')
}

export function setToken(token: string): void {
  localStorage.setItem('sdd_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('sdd_token')
  localStorage.removeItem('sdd_user')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ─── Generic fetch wrapper with fallback ──────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const urls = [getBaseUrl(), LOCAL_URL, RENDER_URL]
  let lastError: Error | null = null

  for (const baseUrl of Array.from(new Set(urls))) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: authHeaders(),
        ...options,
      })
      
      if (res.status === 204) return {} as T
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`)
      }
      return data as T
    } catch (err: any) {
      lastError = err
    }
  }

  throw lastError || new Error('Không thể kết nối đến Backend API Server')
}

// ─── Auth Interfaces & Methods ────────────────────────────────────────────────
export interface UserInfo {
  ma_nguoi_dung: string
  ho_ten: string
  email: string
  so_dien_thoai?: string
  trang_thai?: string
  vai_tro?: { ten_vai_tro: string } | string
  created_at?: string
}

export interface LoginResponse {
  user: UserInfo
  token: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password, mat_khau: password }),
  })
}

export async function listUsers(): Promise<UserInfo[]> {
  try {
    return await apiFetch<UserInfo[]>('/auth/users')
  } catch (err) {
    return []
  }
}

export async function createUserApi(data: { ho_ten: string; email: string; vai_tro: string; mat_khau?: string; so_dien_thoai?: string }): Promise<UserInfo> {
  return apiFetch<UserInfo>('/auth/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateUserApi(ma_nguoi_dung: string, data: { ho_ten?: string; email?: string; vai_tro?: string; mat_khau?: string; so_dien_thoai?: string }): Promise<UserInfo> {
  return apiFetch<UserInfo>(`/auth/users/${ma_nguoi_dung}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteUserApi(ma_nguoi_dung: string): Promise<any> {
  return apiFetch<any>(`/auth/users/${ma_nguoi_dung}`, {
    method: 'DELETE',
  })
}

// ─── Orders Interfaces & Methods ─────────────────────────────────────────────
export interface Order {
  ma_don_hang: string
  ma_drone?: string
  ma_van_don?: string
  ma_khach_hang?: string
  ten_nguoi_nhan?: string
  ten_khach_hang?: string
  so_dien_thoai_nhan?: string
  dia_chi_giao?: string
  dia_chi_lay?: string
  ten_hang_hoa?: string
  vi_do?: number | string
  kinh_do?: number | string
  trang_thai?: string
  created_at?: string
  thoi_gian_tao?: string
  trong_luong?: number
  phi_giao_hang?: number
  phuong_thuc_thanh_toan?: string
  ghi_chu?: string
  ma_tram_ha_canh?: string
  ten_tram?: string
}

export async function listOrders(): Promise<Order[]> {
  const data = await apiFetch<any[]>('/orders/')
  return (data || []).map((item) => ({
    ma_don_hang: item.ma_don_hang || item.id,
    ma_drone: item.ma_drone || undefined,
    ma_van_don: item.ma_van_don || `VD-${(item.ma_don_hang || '').substring(0, 8)}`,
    ten_khach_hang: item.ten_khach_hang || item.ten_nguoi_nhan || 'Khách hàng DB',
    ten_nguoi_nhan: item.ten_nguoi_nhan || item.ten_khach_hang || 'Khách hàng DB',
    so_dien_thoai_nhan: item.so_dien_thoai_nhan || item.so_dien_thoai || '',
    dia_chi_giao: item.dia_chi_giao || item.dia_chi || '',
    vi_do: item.vi_do,
    kinh_do: item.kinh_do,
    trang_thai: item.trang_thai || item.trang_thai_don_hang || 'Chờ duyệt',
    created_at: item.ngay_dat_hang || item.created_at || item.thoi_gian_tao || new Date().toLocaleString('vi-VN'),
    trong_luong: item.trong_luong || 1.5,
    phi_giao_hang: item.tong_tien || item.phi_giao_hang || 35000,
    phuong_thuc_thanh_toan: item.cach_thuc_thanh_toan || item.phuong_thuc_thanh_toan || 'COD',
    ten_tram: item.ten_tram || 'Trạm Trung Tâm',
  })).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
}

export async function getOrder(id: string): Promise<Order> {
  const item = await apiFetch<any>(`/orders/${id}`)
  return {
    ma_don_hang: item.ma_don_hang || item.id,
    ma_drone: item.ma_drone || undefined,
    ma_van_don: item.ma_van_don || `VD-${(item.ma_don_hang || '').substring(0, 8)}`,
    ten_khach_hang: item.ten_khach_hang || item.ten_nguoi_nhan || 'Khách hàng DB',
    ten_nguoi_nhan: item.ten_nguoi_nhan || item.ten_khach_hang || 'Khách hàng DB',
    so_dien_thoai_nhan: item.so_dien_thoai_nhan || item.so_dien_thoai || '',
    dia_chi_giao: item.dia_chi_giao || item.dia_chi || '',
    vi_do: item.vi_do,
    kinh_do: item.kinh_do,
    trang_thai: item.trang_thai || item.trang_thai_don_hang || 'Chờ duyệt',
    created_at: item.ngay_dat_hang || item.created_at || item.thoi_gian_tao || new Date().toLocaleString('vi-VN'),
    trong_luong: item.trong_luong || 1.5,
    phi_giao_hang: item.tong_tien || item.phi_giao_hang || 35000,
    phuong_thuc_thanh_toan: item.cach_thuc_thanh_toan || item.phuong_thuc_thanh_toan || 'COD',
    ten_tram: item.ten_tram || 'Trạm Trung Tâm',
  }
}

export async function approveOrder(id: string): Promise<{ order: Order }> {
  return apiFetch<{ order: Order }>(`/orders/${id}/approve`, { method: 'POST' })
}

export async function rejectOrder(id: string, reason: string): Promise<{ order: Order; reason: string }> {
  return apiFetch(`/orders/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function scheduleOrder(
  id: string,
  payload: { ma_drone?: string; ma_nguoi_phu_trach?: string; thoi_gian_giao?: string }
): Promise<unknown> {
  return apiFetch(`/orders/${id}/schedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function startDelivery(id: string): Promise<unknown> {
  return apiFetch(`/orders/${id}/start-delivery`, {
    method: 'POST',
  })
}

// ─── Stations Interfaces & Methods ───────────────────────────────────────────
export interface Station {
  id: string
  ma_tram: string
  ten_tram: string
  name: string
  dia_chi?: string
  lat?: number | string
  lng?: number | string
  vi_do?: number | string
  kinh_do?: number | string
  capacity?: number
  suc_chua_toi_da?: number
  suc_chua?: number
  current?: number
  so_drone_hien_tai?: number
  status?: string
  trang_thai?: string
  district?: string
  quan_huyen?: string
}

export async function listStations(): Promise<Station[]> {
  try {
    const data = await apiFetch<any[]>('/stations/')
    return (data || []).map((s) => {
      const latVal = s.lat != null ? Number(s.lat) : (s.vi_do != null ? Number(s.vi_do) : 10.8048584)
      const lngVal = s.lng != null ? Number(s.lng) : (s.kinh_do != null ? Number(s.kinh_do) : 106.7167612)
      return {
        id: s.ma_tram || s.id,
        ma_tram: s.ma_tram || s.id,
        ten_tram: s.ten_tram || s.name || 'Trạm Hạ Cánh',
        name: s.ten_tram || s.name || 'Trạm Hạ Cánh',
        dia_chi: s.dia_chi_tram || s.dia_chi || '',
        lat: latVal,
        lng: lngVal,
        vi_do: latVal,
        kinh_do: lngVal,
        capacity: s.cong_suat_toi_da || s.suc_chua || s.suc_chua_toi_da || 10,
        suc_chua_toi_da: s.cong_suat_toi_da || s.suc_chua || s.suc_chua_toi_da || 10,
        current: s.so_drone_hien_tai ?? 0,
        so_drone_hien_tai: s.so_drone_hien_tai ?? 0,
        status: (s.trang_thai_hoat_dong || s.trang_thai || 'ACTIVE').toLowerCase().includes('hoạt động') ? 'active' : 'maintenance',
        trang_thai: s.trang_thai_hoat_dong || s.trang_thai || 'Đang hoạt động',
        district: s.dia_chi_tram || s.quan_huyen || 'Thành phố Hồ Chí Minh',
      }
    })
  } catch (err) {
    console.error('Lỗi lấy danh sách trạm từ DB:', err)
    return []
  }
}

export async function createStationApi(data: { ten_tram: string; dia_chi_tram: string; lat: number; lng: number; cong_suat_toi_da: number }) {
  return apiFetch<any>('/stations/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateStationApi(ma_tram: string, data: { ten_tram?: string; dia_chi_tram?: string; lat?: number; lng?: number; cong_suat_toi_da?: number }) {
  return apiFetch<any>(`/stations/${ma_tram}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteStationApi(ma_tram: string) {
  return apiFetch<any>(`/stations/${ma_tram}`, {
    method: 'DELETE',
  })
}



// ─── Drones Interfaces & Methods ─────────────────────────────────────────────
export interface Drone {
  id: string
  ma_drone: string
  ten_drone?: string
  model?: string
  dung_luong_pin?: number
  tai_trong_toi_da?: number
  trang_thai?: string
  status?: string
  vi_do_hien_tai?: string
  kinh_do_hien_tai?: string
  ma_tram_hien_tai?: string
  x?: number
  y?: number
  eta?: string
  customer?: string
  orderId?: string
}

export async function listDrones(): Promise<Drone[]> {
  const data = await apiFetch<any[]>('/drones/')
  return (data || []).map((d, index) => ({
    id: d.ma_drone || d.id || `DRN-0${index + 1}`,
    ma_drone: d.ma_drone || d.id || `DRN-0${index + 1}`,
    ten_drone: d.ten_drone || d.name || `Drone ${index + 1}`,
    model: d.model || 'SkyCarrier X1',
    dung_luong_pin: d.dung_luong_pin ?? d.cong_suat_pin ?? 100,
    tai_trong_toi_da: Number(d.tai_trong_toi_da ?? 5.0),
    status: (d.trang_thai || d.trang_thai_drone || 'Sẵn sàng'),
    trang_thai: (d.trang_thai || d.trang_thai_drone || 'Sẵn sàng'),
    vi_do_hien_tai: d.vi_do_hien_tai ?? d.vi_do ?? null,
    kinh_do_hien_tai: d.kinh_do_hien_tai ?? d.kinh_do ?? null,
    ma_tram_hien_tai: d.ma_tram_hien_tai ?? d.ma_tram ?? null,
  }))
}


// ─── Deliveries ───────────────────────────────────────────────────────────────
export interface Delivery {
  ma_giao_hang: string
  ma_don_hang: string
  trang_thai?: string
  thoi_gian_giao?: string
  ma_drone?: string
}

export async function listDeliveries(): Promise<Delivery[]> {
  try {
    return await apiFetch<Delivery[]>('/deliveries/')
  } catch (err) {
    return []
  }
}
