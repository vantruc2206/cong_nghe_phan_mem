import React, { useEffect, useState } from 'react';
import { Package, ArrowLeft, Edit3, Trash2, User, Navigation, ShieldAlert, CheckCircle2, Copy, Check } from 'lucide-react';
import { getOrderDetail, cancelOrderApi, completeOrderApi } from '../api';
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
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchDetail = async (isInitial = false) => {
    if (!orderId) return;
    if (isInitial) setLoading(true);
    try {
      const data = await getOrderDetail(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Failed to load order detail:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail(true);

    // Auto-poll status every 4 seconds for real-time tracking
    const timer = setInterval(() => {
      fetchDetail(false);
    }, 4000);

    return () => clearInterval(timer);
  }, [orderId]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('Đã chép mã đơn hàng', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancelConfirm = async () => {
    if (!order) return;
    setActionLoading(true);
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
      setActionLoading(false);
    }
  };

  const handleCompleteConfirm = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      await completeOrderApi(order.ma_don_hang);
      showToast('Xác nhận nhận hàng thành công!', 'success');
      setOrder({ ...order, trang_thai: 'DELIVERED' });
      setConfirmCompleteOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Không thể cập nhật trạng thái đơn hàng', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 animate-pulse text-sm">
        🛸 Đang tải chi tiết đơn hàng...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Không tìm thấy thông tin đơn hàng</h2>
        <button onClick={() => onNavigate('orders')} className="btn-secondary text-xs px-4 py-2">
          Quay lại Danh Sách Đơn Hàng
        </button>
      </div>
    );
  }

  const statusRaw = (order.trang_thai || '').toUpperCase();
  const isPending = statusRaw === 'PENDING' || statusRaw.includes('CHỜ');
  const isArrived = statusRaw === 'ARRIVED' || statusRaw.includes('ĐẾN') || statusRaw.includes('DA_DEN');

  // Status Badge Helper
  const getStatusBadge = () => {
    const s = statusRaw;
    if (s.includes('THẤT') || s.includes('FAIL')) {
      return { label: 'Giao thất bại', cls: 'badge-failed' };
    }
    if (s === 'ARRIVED' || s.includes('ĐẾN') || s.includes('DA_DEN')) {
      return { label: 'Đã đến điểm giao', cls: 'bg-emerald-500 text-white shadow-sm' };
    }
    if (s === 'IN_TRANSIT' || s.includes('GIAO') || s.includes('TRANSIT')) {
      return { label: 'Đang giao bằng Drone', cls: 'badge-delivering' };
    }
    if (s === 'APPROVED' || s.includes('DUYỆT')) {
      return { label: 'Đã duyệt', cls: 'badge-approved' };
    }
    if (s === 'DELIVERED' || s.includes('HOÀN')) {
      return { label: 'Hoàn thành', cls: 'badge-delivered' };
    }
    if (s === 'CANCELLED' || s.includes('HỦY')) {
      return { label: 'Đã hủy', cls: 'badge-cancelled' };
    }
    if (s === 'REJECTED' || s.includes('CHỐI')) {
      return { label: 'Bị từ chối', cls: 'badge-rejected' };
    }
    return { label: 'Chờ duyệt', cls: 'badge-pending' };
  };

  const statusBadge = getStatusBadge();

  // 5-Stage Stepper Progression
  const getStepProgress = () => {
    if (statusRaw.includes('CANCEL') || statusRaw.includes('HỦY') || statusRaw.includes('REJECT') || statusRaw.includes('CHỐI') || statusRaw.includes('THẤT') || statusRaw.includes('FAIL')) {
      return 0;
    }
    if (statusRaw === 'DELIVERED' || statusRaw.includes('HOÀN')) return 5;
    if (isArrived) return 4;
    if (statusRaw === 'IN_TRANSIT' || statusRaw.includes('GIAO')) return 4;
    if (statusRaw === 'APPROVED' || statusRaw.includes('DUYỆT')) return 2;
    return 1;
  };
  const currentStep = getStepProgress();

  const steps = [
    { num: 1, title: 'Đặt đơn' },
    { num: 2, title: 'Đã duyệt' },
    { num: 3, title: 'Tại trạm' },
    { num: 4, title: 'Đã đến' },
    { num: 5, title: 'Đã nhận' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-up">
      
      {/* Top Header & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => onNavigate('orders')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {isArrived && (
            <button
              onClick={() => setConfirmCompleteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00B14F] text-white hover:bg-[#009643] text-xs font-bold transition-all shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Xác Nhận Nhận Hàng
            </button>
          )}

          {isPending && (
            <button
              onClick={() => onNavigate('edit-order', order.ma_don_hang)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" /> Sửa Đơn
            </button>
          )}

          {isPending && (
            <button
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hủy Đơn
            </button>
          )}

          <button
            onClick={() => onNavigate('tracking')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00B14F] text-white hover:bg-[#009643] text-xs font-bold transition-all shadow-xs"
          >
            <Navigation className="w-3.5 h-3.5" /> Live Tracking Drone
          </button>
        </div>
      </div>

      {/* Main Order Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mã Đơn Hàng</span>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-base sm:text-lg font-bold font-mono text-slate-900 break-all select-all">
                {order.ma_van_don || order.ma_don_hang}
              </h1>
              <button
                onClick={() => handleCopyCode(order.ma_van_don || order.ma_don_hang)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Sao chép mã"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Khởi tạo: {new Date(order.thoi_gian_tao || Date.now()).toLocaleString('vi-VN')}
            </p>
          </div>

          <div className="sm:text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusBadge.cls}`}>
              Trạng thái: {statusBadge.label}
            </span>
          </div>
        </div>

        {/* Delivery Progress Bar */}
        {currentStep > 0 && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
              <span>Tiến trình vận chuyển Drone</span>
              <span className="text-[#00B14F]">Bước {currentStep}/5</span>
            </div>
            <div className="flex items-center justify-between relative pt-1">
              {steps.map((st) => {
                const isActive = st.num <= currentStep;
                const isCurrent = st.num === currentStep;
                return (
                  <div key={st.num} className="flex flex-col items-center flex-1 z-10">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isActive
                          ? 'bg-[#00B14F] text-white shadow-xs'
                          : 'bg-slate-200 text-slate-500'
                      } ${isCurrent ? 'ring-2 ring-[#00B14F]/30 ring-offset-1' : ''}`}
                    >
                      {st.num}
                    </div>
                    <span className={`text-[10px] mt-1 ${isActive ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                      {st.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="space-y-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <h3 className="text-xs font-extrabold text-[#00B14F] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Thông Tin Người Nhận
            </h3>
            <div className="space-y-1.5 text-xs">
              <p className="text-slate-500">Họ và tên: <span className="text-slate-900 font-bold">{order.ten_nguoi_nhan}</span></p>
              <p className="text-slate-500">Số điện thoại: <span className="text-slate-900 font-bold">{order.so_dien_thoai_nhan}</span></p>
              <p className="text-slate-500">Địa chỉ giao: <span className="text-slate-800 font-semibold">{order.dia_chi_giao}</span></p>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <h3 className="text-xs font-extrabold text-[#00B14F] uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Chi Tiết Gói Hàng & Thanh Toán
            </h3>
            <div className="space-y-1.5 text-xs">
              <p className="text-slate-500">Tên kiện hàng: <span className="text-slate-900 font-bold">{order.ten_hang_hoa || 'Hàng hóa tổng hợp'}</span></p>
              <p className="text-slate-500">Trọng lượng: <span className="text-[#00B14F] font-extrabold">{order.trong_luong} kg</span> (&le; 5.0 kg)</p>
              <p className="text-slate-500">Thanh toán: <span className="text-slate-900 font-bold">{order.phuong_thuc_thanh_toan || 'COD'}</span></p>
              <p className="text-slate-500">Tổng cước phí: <span className="text-[#00B14F] font-extrabold text-sm">{(order.phi_giao_hang || 35000).toLocaleString('vi-VN')} đ</span></p>
            </div>
          </div>

        </div>

        {/* Note if any */}
        {order.ghi_chu && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
            <span className="font-bold text-slate-900">Ghi chú:</span> {order.ghi_chu}
          </div>
        )}

        {/* Rejection / Issue reason if any */}
        {(order.ly_do_tu_choi || order.mo_ta_su_co) && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <span className="font-bold">⚠️ Lý do từ chối / Sự cố:</span>
            <p>{order.ly_do_tu_choi || order.mo_ta_su_co}</p>
          </div>
        )}

      </div>

      {/* Confirm Cancel Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Xác Nhận Hủy Đơn Hàng"
        message="Bạn có chắc chắn muốn hủy đơn hàng này không? Thao tác này không thể hoàn tác."
        confirmText="Hủy Đơn"
        cancelText="Bỏ Qua"
        type="danger"
        loading={actionLoading}
        onConfirm={handleCancelConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Confirm Complete Modal */}
      <ConfirmModal
        isOpen={confirmCompleteOpen}
        title="Xác Nhận Đã Nhận Hàng"
        message="Bạn có chắc chắn đã nhận được kiện hàng từ Drone và muốn hoàn tất đơn này?"
        confirmText="Hoàn Tất"
        cancelText="Bỏ Qua"
        type="success"
        loading={actionLoading}
        onConfirm={handleCompleteConfirm}
        onCancel={() => setConfirmCompleteOpen(false)}
      />
    </div>
  );
};
