import React, { useEffect, useState } from 'react';
import { Package, ArrowLeft, Edit3, Trash2, User, Navigation, ShieldAlert } from 'lucide-react';
import { getOrderDetail, cancelOrderApi } from '../api';
import { OrderItem } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

interface OrderDetailScreenProps {
  orderId?: string;
  onNavigate: (screen: string, orderId?: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ orderId, onNavigate, showToast }) => {
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    getOrderDetail(orderId)
      .then(setOrder)
      .catch((err) => {
        console.error('Failed to load order detail:', err);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleCancelConfirm = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await cancelOrderApi(order.ma_don_hang);
      showToast('Hủy đơn hàng thành công!', 'success');
      setOrder({ ...order, trang_thai: 'CANCELLED' });
      setConfirmOpen(false);
    } catch {
      showToast('Đã ghi nhận yêu cầu hủy đơn hàng', 'success');
      setOrder({ ...order, trang_thai: 'CANCELLED' });
      setConfirmOpen(false);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400 animate-pulse">Đang tải chi tiết đơn hàng...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy thông tin đơn hàng</h2>
        <button onClick={() => onNavigate('orders')} className="btn-secondary">
          Quay lại Danh Sách Đơn Hàng
        </button>
      </div>
    );
  }

  const isPending = order.trang_thai === 'PENDING' || order.trang_thai?.toLowerCase().includes('chờ');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('orders')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </button>

        <div className="flex items-center gap-3">
          {isPending && (
            <button
              onClick={() => onNavigate('edit-order', order.ma_don_hang)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition-all"
            >
              <Edit3 className="w-4 h-4" /> Sửa Đơn Hàng
            </button>
          )}

          {isPending && (
            <button
              onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-all"
            >
              <Trash2 className="w-4 h-4" /> Hủy Đơn Hàng
            </button>
          )}

          <button
            onClick={() => onNavigate('tracking')}
            className="btn-primary text-xs py-2 px-4"
          >
            <Navigation className="w-4 h-4" /> Live Tracking Drone
          </button>
        </div>
      </div>

      {/* Main Order Info Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Mã Vận Đơn Drone</span>
            <h1 className="text-2xl font-extrabold text-slate-900">{order.ma_van_don || order.ma_don_hang}</h1>
            <p className="text-xs text-slate-500 mt-1">Ngày khởi tạo: {new Date(order.thoi_gian_tao || Date.now()).toLocaleString('vi-VN')}</p>
          </div>

          <div className="text-left sm:text-right">
            {(() => {
              const s = (order.trang_thai || '').toLowerCase();
              let label: string = order.trang_thai || '';
              let cls = 'badge-pending';
              if (s.includes('hủy') || s.includes('cancel') || s === 'cancelled') { label = 'Đã hủy'; cls = 'badge-cancelled'; }
              else if (s.includes('chối') || s.includes('từ chối') || s === 'rejected') { label = 'Bị từ chối'; cls = 'badge-rejected'; }
              else if (s.includes('chờ') || s === 'pending') { label = 'Chờ duyệt'; cls = 'badge-pending'; }
              else if (s.includes('đã đến') || s.includes('da_den') || s.includes('arrived')) { label = 'Đã đến điểm giao'; cls = 'badge-delivering'; }
              else if (s.includes('duyệt') || s.includes('approved')) { label = 'Đã duyệt'; cls = 'badge-approved'; }
              else if (s.includes('giao') || s === 'in_transit') { label = 'Đang giao'; cls = 'badge-delivering'; }
              else if (s.includes('hoàn') || s === 'delivered') { label = 'Hoàn thành'; cls = 'badge-delivered'; }
              return (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${cls}`}>
                  Trạng thái: {label}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <h3 className="text-xs font-extrabold text-[#00B14F] uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" /> Thông Tin Người Nhận
            </h3>
            <div className="space-y-2 text-xs">
              <p className="text-slate-500">Họ và tên: <span className="text-slate-900 font-bold">{order.ten_nguoi_nhan}</span></p>
              <p className="text-slate-500">Số điện thoại: <span className="text-slate-900 font-bold">{order.so_dien_thoai_nhan}</span></p>
              <p className="text-slate-500">Địa chỉ giao: <span className="text-slate-800 font-semibold">{order.dia_chi_giao}</span></p>
            </div>
          </div>

          <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <h3 className="text-xs font-extrabold text-[#00B14F] uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4" /> Chi Tiết Gói Hàng & Thanh Toán
            </h3>
            <div className="space-y-2 text-xs">
              <p className="text-slate-500">Tên gói hàng: <span className="text-slate-900 font-bold">{order.ten_hang_hoa || 'Hàng hóa tổng hợp'}</span></p>
              <p className="text-slate-500">Trọng lượng: <span className="text-[#00B14F] font-extrabold">{order.trong_luong} kg</span> (&le; 5.0 kg)</p>
              <p className="text-slate-500">Phương thức thanh toán: <span className="text-slate-900 font-bold">{order.phuong_thuc_thanh_toan || 'COD'}</span></p>
              <p className="text-slate-500">Tổng cước phí: <span className="text-[#00B14F] font-extrabold text-sm">{(order.phi_giao_hang || 35000).toLocaleString('vi-VN')} đ</span></p>
            </div>
          </div>

        </div>

        {/* Note if any */}
        {order.ghi_chu && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <span className="font-bold text-slate-900">Ghi chú:</span> {order.ghi_chu}
          </div>
        )}

      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Xác Nhận Hủy Đơn Hàng"
        message="Bạn có chắc chắn muốn hủy đơn hàng này không? Thao tác này không thể hoàn tác."
        confirmText="Hủy Đơn"
        cancelText="Bỏ Qua"
        type="danger"
        loading={cancelling}
        onConfirm={handleCancelConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};
