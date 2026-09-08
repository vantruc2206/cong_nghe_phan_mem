import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, AlertOctagon, AlertTriangle } from 'lucide-react';
import { getOrderDetail, updateOrderApi } from '../api';
import { OrderItem } from '../types';

interface EditOrderScreenProps {
  orderId?: string;
  onNavigate: (screen: string, orderId?: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const EditOrderScreen: React.FC<EditOrderScreenProps> = ({ orderId, onNavigate, showToast }) => {
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [packageName, setPackageName] = useState('');
  const [weight, setWeight] = useState<number>(1.5);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    getOrderDetail(orderId)
      .then((data) => {
        setOrder(data);
        setRecipientName(data.ten_nguoi_nhan || '');
        setRecipientPhone(data.so_dien_thoai_nhan || '');
        setDeliveryAddress(data.dia_chi_giao || '');
        setPackageName(data.ten_hang_hoa || '');
        setWeight(data.trong_luong || 1.5);
        setNote(data.ghi_chu || '');
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return <div className="py-20 text-center text-slate-400 animate-pulse">Đang kiểm tra điều kiện chỉnh sửa đơn hàng...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-sm text-slate-500">Không tìm thấy đơn hàng</p>
        <button onClick={() => onNavigate('orders')} className="btn-secondary">Quay lại</button>
      </div>
    );
  }

  const isEditable = order.trang_thai === 'PENDING';
  const shippingFee = Math.max(30000, 30000 + Math.ceil(weight - 1) * 10000);
  const isWeightValid = weight > 0 && weight <= 5.0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditable) {
      showToast('MSG-009: Đơn hàng đã được phê duyệt hoặc đang giao, không thể chỉnh sửa!', 'error');
      return;
    }

    if (!isWeightValid) {
      showToast('Trọng lượng gói hàng phải nhỏ hơn hoặc bằng 5.0 kg', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateOrderApi(order.ma_don_hang, {
        ten_nguoi_nhan: recipientName,
        so_dien_thoai_nhan: recipientPhone,
        dia_chi_giao: deliveryAddress,
        ten_hang_hoa: packageName,
        trong_luong: weight,
        phi_giao_hang: shippingFee,
        ghi_chu: note,
      });

      showToast('Cập nhật thông tin đơn hàng thành công!', 'success');
      onNavigate('order-detail', order.ma_don_hang);
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật thông tin đơn hàng', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 px-2 sm:px-4 animate-fade-up">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <button
              onClick={() => onNavigate('order-detail', order.ma_don_hang)}
              className="text-xs text-[#00B14F] hover:underline flex items-center gap-1 mb-2 font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại chi tiết
            </button>
            <h1 className="text-2xl font-extrabold text-slate-900">Chỉnh Sửa Đơn Hàng</h1>
            <p className="text-xs text-slate-500">Mã đơn: <span className="text-slate-900 font-bold">{order.ma_van_don || order.ma_don_hang}</span></p>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
            isEditable ? 'badge-pending' : 'badge-failed'
          }`}>
            Trạng thái: {order.trang_thai}
          </span>
        </div>

        {!isEditable ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0" />
              <h3 className="font-bold text-base">Cảnh báo Hệ Thống (MSG-009)</h3>
            </div>
            <p className="text-xs leading-relaxed text-rose-700">
              Đơn hàng này đang ở trạng thái <strong className="uppercase">{order.trang_thai}</strong>. Bạn chỉ có thể chỉnh sửa khi đơn hàng ở trạng thái <strong>Chờ duyệt (PENDING)</strong>.
            </p>
            <button onClick={() => onNavigate('orders')} className="btn-secondary text-xs">
              Quay lại Danh Sách Đơn Hàng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#00B14F] uppercase tracking-wider">Thông Tin Sản Phẩm & Trọng Lượng</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Tên gói hàng</label>
                  <input
                    type="text"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="input-label">Trọng lượng (kg) &le; 5.0 kg</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    className={`input-field font-bold ${
                      isWeightValid ? '' : 'border-rose-500 text-rose-600 bg-rose-50'
                    }`}
                  />
                </div>
              </div>

              {!isWeightValid && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Cảnh báo: Trọng lượng vượt quá giới hạn 5.0 kg của Drone.</span>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-[#00B14F] uppercase tracking-wider">Thông Tin Người Nhận</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Tên người nhận</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="input-label">Số điện thoại</label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Địa chỉ giao hàng</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Ghi chú bổ sung</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="input-field"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Cước phí sau cập nhật</p>
                <p className="text-xl font-extrabold text-[#00B14F]">{shippingFee.toLocaleString('vi-VN')} VNĐ</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !isWeightValid}
              className="btn-primary w-full py-3.5"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi Đơn Hàng'}
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
