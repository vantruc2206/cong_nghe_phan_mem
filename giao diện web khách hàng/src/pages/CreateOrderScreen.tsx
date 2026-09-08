import React, { useState } from 'react';
import { Package, User, DollarSign, ArrowRight, AlertTriangle } from 'lucide-react';
import { createOrderApi } from '../api';
import { UserProfile } from '../types';
import LocationPickerMap from '../components/LocationPickerMap';

interface CreateOrderScreenProps {
  user: UserProfile | null;
  onNavigate: (screen: string, orderId?: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CreateOrderScreen: React.FC<CreateOrderScreenProps> = ({ user, onNavigate, showToast }) => {
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 10.7769, lng: 106.7009 });
  const [pickupAddress] = useState('Trạm Trung Tâm Quận 1, TP.HCM');
  const [weight, setWeight] = useState<number>(1.5);
  const [packageName, setPackageName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VIETQR' | 'MOMO'>('COD');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Weight fee calculation: Base 30,000 VND + 10,000 per kg above 1kg
  const shippingFee = Math.max(30000, 30000 + Math.ceil(weight - 1) * 10000);
  const isWeightValid = weight > 0 && weight <= 5.0;

  const handleLocationSelect = (loc: { address: string; lat: number; lng: number }) => {
    setDeliveryAddress(loc.address);
    setCoords({ lat: loc.lat, lng: loc.lng });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWeightValid) {
      showToast('Trọng lượng gói hàng phải nhỏ hơn hoặc bằng 5.0 kg (Quy chuẩn Drone)', 'error');
      return;
    }

    if (!recipientName || !recipientPhone || !deliveryAddress) {
      showToast('Vui lòng nhập đầy đủ thông tin người nhận và chọn địa chỉ trên bản đồ Leaflet', 'error');
      return;
    }

    setLoading(true);
    try {
      await createOrderApi({
        ma_khach_hang: user?.ma_khach_hang || user?.ma_nguoi_dung || undefined,
        ten_nguoi_nhan: recipientName,
        so_dien_thoai_nhan: recipientPhone,
        dia_chi_giao: deliveryAddress,
        dia_chi_lay: pickupAddress,
        ten_hang_hoa: packageName || 'Gói hàng tổng hợp',
        trong_luong: weight,
        trang_thai: 'PENDING',
        phuong_thuc_thanh_toan: paymentMethod,
        phi_giao_hang: shippingFee,
        ghi_chu: note,
        toa_do_giao: coords,
        vi_do: coords.lat,
        kinh_do: coords.lng,
      } as any);

      showToast('Đặt đơn hàng bằng Drone thành công!', 'success');
      onNavigate('orders');
    } catch (err: any) {
      showToast(err.message || 'Lỗi tạo đơn hàng, vui lòng thử lại', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-2 px-1 sm:px-3 animate-fade-up">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-5">
        
        {/* Header */}
        <div className="border-b border-slate-100 pb-4 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#00B14F] text-[10px] font-bold border border-emerald-200">
            📦 Quy Trình Đặt Đơn Hàng Mới & Định Vị Bản Đồ
          </div>
          <h1 className="text-base font-extrabold text-slate-900 mt-1">Tạo Đơn Hàng Giao Bằng Drone</h1>
          <p className="text-[11px] text-slate-500">
            Chọn địa chỉ bằng tìm kiếm hoặc nhấp trực tiếp trên Bản đồ Leaflet OpenStreetMap.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Section 1: Package Info & Weight Check */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-[#00B14F] uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> 1. Thông Tin Gói Hàng & Trọng Lượng
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="input-label" style={{ fontSize: 11, marginBottom: 3 }}>Tên sản phẩm / Gói hàng</label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="Ví dụ: Tài liệu, Hộp quà"
                  className="input-field"
                  style={{ fontSize: 12, padding: '7px 12px' }}
                />
              </div>

              <div>
                <label className="input-label" style={{ fontSize: 11, marginBottom: 3 }}>
                  Trọng lượng gói hàng (kg) <span className="text-rose-500">*Tối đa 5.0 kg</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  required
                  className={`input-field font-bold ${
                    isWeightValid ? '' : 'border-rose-500 text-rose-600 bg-rose-50'
                  }`}
                  style={{ fontSize: 12, padding: '7px 12px' }}
                />
              </div>
            </div>

            {!isWeightValid && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Cảnh báo: Trọng lượng vượt quá giới hạn 5.0 kg của Drone. Vui lòng giảm trọng lượng.</span>
              </div>
            )}
          </div>

          {/* Section 2: Recipient Details & Leaflet Geocoding Map */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-extrabold text-[#00B14F] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> 2. Người Nhận & Định Vị Địa Chỉ Giao (Leaflet Map)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="input-label" style={{ fontSize: 11, marginBottom: 3 }}>Tên người nhận *</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nguyễn Văn B"
                  required
                  className="input-field"
                  style={{ fontSize: 12, padding: '7px 12px' }}
                />
              </div>

              <div>
                <label className="input-label" style={{ fontSize: 11, marginBottom: 3 }}>Số điện thoại người nhận *</label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="0912345678"
                  required
                  className="input-field"
                  style={{ fontSize: 12, padding: '7px 12px' }}
                />
              </div>
            </div>

            <div>
              <label className="input-label" style={{ fontSize: 11, marginBottom: 3 }}>
                Bản đồ chọn vị trí giao hàng thực tế (Leaflet + Nominatim Geocoder) *
              </label>
              <LocationPickerMap
                initialAddress={deliveryAddress}
                initialLat={coords.lat}
                initialLng={coords.lng}
                onLocationSelect={handleLocationSelect}
              />
            </div>

            <div>
              <label className="input-label" style={{ fontSize: 11, marginBottom: 3 }}>Ghi chú cho phi công / hệ thống</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Giao giờ hành chính, gọi trước khi đáp..."
                rows={2}
                className="input-field"
                style={{ fontSize: 12, padding: '7px 12px' }}
              />
            </div>
          </div>

          {/* Section 3: Payment Method & Fee Calculation */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-extrabold text-[#00B14F] uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> 3. Phương Thức Thanh Toán & Cước Phí
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`py-2 px-1 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${
                  paymentMethod === 'COD'
                    ? 'bg-emerald-50 border-[#00B14F] text-[#00B14F] shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                💵 Tiền Mặt
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('VIETQR')}
                className={`py-2 px-1 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${
                  paymentMethod === 'VIETQR'
                    ? 'bg-emerald-50 border-[#00B14F] text-[#00B14F] shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                🏦 VietQR
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('MOMO')}
                className={`py-2 px-1 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${
                  paymentMethod === 'MOMO'
                    ? 'bg-emerald-50 border-[#00B14F] text-[#00B14F] shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                📱 Ví MoMo
              </button>
            </div>

            {/* Fee summary card */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Tổng Cước Dự Kiến</p>
                <p className="text-base font-extrabold text-[#00B14F]">{shippingFee.toLocaleString('vi-VN')} VNĐ</p>
              </div>
              <div className="text-right text-[10px] text-slate-500 leading-tight">
                <p className="font-semibold text-slate-700">Tải trọng: {weight} kg</p>
                <p>Cước gốc: 30.000đ</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isWeightValid}
            className="btn-primary w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            {loading ? 'Đang tạo đơn hàng...' : 'Xác Nhận Đặt Đơn Drone'}
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

      </div>
    </div>
  );
};
