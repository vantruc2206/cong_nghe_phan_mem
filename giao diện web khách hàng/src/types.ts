export type OrderStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'ASSIGNED' 
  | 'IN_TRANSIT' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'FAILED'
  | 'REJECTED';

export interface UserProfile {
  ma_nguoi_dung?: string;
  ma_khach_hang?: string;
  ho_ten: string;
  email: string;
  so_dien_thoai?: string;
  dia_chi?: string;
  vai_tro?: string;
  ngay_tao?: string;
}

export interface OrderItem {
  ma_don_hang: string;
  ma_van_don?: string;
  ma_khach_hang?: string;
  ten_nguoi_nhan: string;
  so_dien_thoai_nhan: string;
  dia_chi_giao: string;
  dia_chi_lay?: string;
  ten_hang_hoa?: string;
  trong_luong: number; // in kg <= 5.0
  trang_thai: OrderStatus;
  phuong_thuc_thanh_toan?: 'COD' | 'VIETQR' | 'MOMO';
  phi_giao_hang?: number;
  thoi_gian_tao?: string;
  thoi_gian_du_kien?: string;
  ghi_chu?: string;
  toa_do_giao?: { lat: number; lng: number };
  vi_do?: number;
  kinh_do?: number;
  ma_drone?: string;
  ma_tram?: string;
  ten_tram?: string;
  trang_thai_giao_hang?: string;
  ly_do_tu_choi?: string;
  mo_ta_su_co?: string;
}

export interface StationItem {
  id?: string;
  ma_tram: string;
  ten_tram: string;
  dia_chi: string;
  kinh_do: number;
  vi_do: number;
  lat?: number;
  lng?: number;
  suc_chua: number;
  so_drone_hien_tai: number;
  trang_thai: string;
}

export interface DroneItem {
  id?: string;
  ma_drone: string;
  ten_drone: string;
  model?: string;
  dung_luong_pin: number;
  tai_trong_toi_da: number;
  trang_thai: string;
  ma_tram_hien_tai?: string;
  vi_do_hien_tai?: number | string | null;
  kinh_do_hien_tai?: number | string | null;
  toa_do_hien_tai?: { lat: number; lng: number };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}
