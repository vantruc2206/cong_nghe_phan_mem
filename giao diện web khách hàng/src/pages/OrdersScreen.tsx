import React, { useEffect, useState } from 'react';
import { fetchCustomerOrders, cancelOrderApi, completeOrderApi } from '../api';
import { OrderItem, UserProfile } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

interface OrdersScreenProps {
  user: UserProfile | null;
  onNavigate: (screen: string, orderId?: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

function getStatusInfo(status: string) {
  const s = status?.toLowerCase() || '';
  if (s.includes('chối') || s.includes('từ chối') || s === 'rejected') return { label: 'Bị từ chối', cls: 'badge-rejected' };
  if (s.includes('đã đến') || s.includes('da_den') || s.includes('arrived') || s === 'arrived') return { label: 'Đã đến điểm giao', cls: 'badge-delivering' };
  if (s.includes('chờ') || s === 'pending') return { label: 'Chờ duyệt', cls: 'badge-pending' };
  if (s.includes('đã duyệt') || s === 'approved') return { label: 'Đã duyệt', cls: 'badge-approved' };
  if (s.includes('giao') || s === 'in_transit' || s === 'delivering') return { label: 'Đang giao', cls: 'badge-delivering' };
  if (s.includes('hoàn') || s === 'delivered') return { label: 'Hoàn thành', cls: 'badge-delivered' };
  if (s.includes('thất') || s === 'failed') return { label: 'Thất bại', cls: 'badge-failed' };
  if (s.includes('hủy') || s === 'cancelled') return { label: 'Đã hủy', cls: 'badge-cancelled' };
  return { label: status, cls: 'badge-pending' };
}

const FILTERS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'IN_TRANSIT', label: 'Đang giao' },
  { key: 'ARRIVED', label: 'Đã đến' },
  { key: 'DELIVERED', label: 'Hoàn thành' },
  { key: 'REJECTED', label: 'Bị từ chối' },
  { key: 'CANCELLED', label: 'Đã hủy' },
];

export const OrdersScreen: React.FC<OrdersScreenProps> = ({ user, onNavigate, showToast }) => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    orderId: string | null;
    actionType: 'complete' | 'cancel' | null;
  }>({
    isOpen: false,
    orderId: null,
    actionType: null,
  });
  const [modalLoading, setModalLoading] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const custId = user?.email || user?.ma_khach_hang || user?.ma_nguoi_dung;
      const data = await fetchCustomerOrders(custId);
      setOrders(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [user]);

  const promptCancel = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    setModalState({ isOpen: true, orderId, actionType: 'cancel' });
  };

  const promptComplete = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    setModalState({ isOpen: true, orderId, actionType: 'complete' });
  };

  const handleModalConfirm = async () => {
    if (!modalState.orderId || !modalState.actionType) return;
    setModalLoading(true);
    try {
      if (modalState.actionType === 'cancel') {
        await cancelOrderApi(modalState.orderId);
        showToast('Đã hủy đơn hàng thành công!', 'success');
      } else if (modalState.actionType === 'complete') {
        await completeOrderApi(modalState.orderId);
        showToast('Đã xác nhận nhận hàng thành công!', 'success');
      }
      setModalState({ isOpen: false, orderId: null, actionType: null });
      loadOrders();
    } catch (err: any) {
      showToast(err.message || 'Không thể cập nhật trạng thái đơn hàng', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'ALL') {
      const info = getStatusInfo(o.trang_thai);
      const isPending = info.label === 'Chờ duyệt';
      const isApproved = info.label === 'Đã duyệt';
      const isInTransit = info.label === 'Đang giao';
      const isArrived = info.label === 'Đã đến điểm giao';
      const isDelivered = info.label === 'Hoàn thành';
      const isRejected = info.label === 'Bị từ chối';
      const isCancelled = info.label === 'Đã hủy';
      if (statusFilter === 'PENDING' && !isPending) return false;
      if (statusFilter === 'APPROVED' && !isApproved) return false;
      if (statusFilter === 'IN_TRANSIT' && !isInTransit) return false;
      if (statusFilter === 'ARRIVED' && !isArrived) return false;
      if (statusFilter === 'DELIVERED' && !isDelivered) return false;
      if (statusFilter === 'REJECTED' && !isRejected) return false;
      if (statusFilter === 'CANCELLED' && !isCancelled) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.ma_don_hang?.toLowerCase().includes(q) ||
        o.ma_van_don?.toLowerCase().includes(q) ||
        o.ten_nguoi_nhan?.toLowerCase().includes(q) ||
        o.dia_chi_giao?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>Đơn Hàng Của Tôi</h1>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>Quản lý và theo dõi toàn bộ đơn hàng giao bằng Drone</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => onNavigate('create-order')}
          style={{ padding: '7px 14px', fontSize: 12, borderRadius: 10 }}
        >
          + Tạo Đơn Hàng Mới
        </button>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="text"
          placeholder="🔍 Tìm mã đơn, người nhận..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid #E5E7EB',
            fontSize: 12, width: '100%', outline: 'none', background: '#F9FAFB',
          }}
        />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              style={{
                padding: '5px 12px', borderRadius: 16, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
                background: statusFilter === f.key ? '#00B14F' : '#F3F4F6',
                color: statusFilter === f.key ? '#fff' : '#4B5563',
                transition: 'all 0.2s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Đang tải danh sách đơn hàng...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="card-flat" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Chưa tìm thấy đơn hàng nào</h3>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            {search ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy tạo đơn hàng đầu tiên để trải nghiệm giao hàng Drone!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredOrders.map(order => {
            const status = getStatusInfo(order.trang_thai);
            const canCancel = ['pending', 'chờ'].some(k => order.trang_thai?.toLowerCase().includes(k));
            const isInTransit = ['giao', 'in_transit', 'delivering'].some(k => order.trang_thai?.toLowerCase().includes(k));
            const isArrivedOrder = ['đến', 'arrived', 'da_den'].some(k => order.trang_thai?.toLowerCase().includes(k));
            return (
              <div
                key={order.ma_don_hang}
                className="card-flat"
                style={{ cursor: 'pointer' }}
                onClick={() => onNavigate('order-detail', order.ma_don_hang)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#111827', whiteSpace: 'nowrap' }}>
                      #{order.ma_van_don?.slice(0, 8) || order.ma_don_hang?.slice(0, 8)}
                    </span>
                    <span className={`badge ${status.cls}`}>{status.label}</span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#00B14F', flexShrink: 0, marginLeft: 4 }}>
                    {(order.phi_giao_hang || 35000).toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <p style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                  <strong>{order.ten_nguoi_nhan}</strong> · {order.so_dien_thoai_nhan}
                </p>
                <p style={{ fontSize: 12, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📍 {order.dia_chi_giao}
                </p>

                {/* 2-Stage Delivery Stepper Bar */}
                {(() => {
                  const s = order.trang_thai?.toLowerCase() || '';
                  const gh = order.trang_thai_giao_hang?.toLowerCase() || '';
                  if (s.includes('chối') || s.includes('từ chối') || s.includes('hủy') || s.includes('thất')) {
                    return null;
                  }

                  let currentStep = 1;
                  if (s.includes('hoàn') || s === 'delivered') currentStep = 5;
                  else if (s.includes('đến') || s === 'arrived' || gh.includes('đã đến')) currentStep = 4;
                  else if (gh.includes('đang giao') || s.includes('giao') || s === 'in_transit') currentStep = 4;
                  else if (gh.includes('đã đến trạm') || gh.includes('đã nhập trạm')) currentStep = 3;
                  else if (gh.includes('đang chuyển') || gh.includes('chuyển đến trạm')) currentStep = 2;
                  else if (s.includes('đã duyệt') || s === 'approved') currentStep = 2;

                  const steps = [
                    { num: 1, title: 'Đặt đơn', icon: '📝' },
                    { num: 2, title: 'Đến trạm', icon: '🚚' },
                    { num: 3, title: 'Tại trạm', icon: '📦' },
                    { num: 4, title: 'Đã đến', icon: '🛸' },
                    { num: 5, title: 'Đã nhận', icon: '✅' },
                  ];

                  return (
                    <div style={{ marginTop: 10, marginBottom: 8, background: '#F9FAFB', padding: '8px 10px', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Tiến trình vận chuyển Drone</span>
                        <span style={{ color: '#00B14F' }}>Bước {currentStep}/5</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                        {steps.map((st) => {
                          const isActive = st.num <= currentStep;
                          const isCurrent = st.num === currentStep;
                          return (
                            <div key={st.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 1 }}>
                              <div
                                style={{
                                  width: 22, height: 22, borderRadius: '50%',
                                  background: isActive ? '#00B14F' : '#E5E7EB',
                                  color: isActive ? '#FFF' : '#9CA3AF',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, fontWeight: 700,
                                  boxShadow: isCurrent ? '0 0 0 3px rgba(0, 177, 79, 0.2)' : 'none',
                                  transition: 'all 0.3s'
                                }}
                              >
                                {st.icon}
                              </div>
                              <span style={{ fontSize: 9, marginTop: 4, color: isActive ? '#111827' : '#9CA3AF', fontWeight: isActive ? 700 : 400 }}>
                                {st.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {(order.ly_do_tu_choi || order.mo_ta_su_co) && (
                  <p style={{ fontSize: 12, color: '#DC2626', background: '#FEF2F2', padding: '6px 10px', borderRadius: 8, marginTop: 6, border: '1px solid #FCA5A5' }}>
                    ⚠️ <strong>Lý do từ chối / Sự cố:</strong> {order.ly_do_tu_choi || order.mo_ta_su_co}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                  {isArrivedOrder ? (
                    <button
                      onClick={e => promptComplete(e, order.ma_don_hang)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 10,
                        background: '#00B14F', color: '#FFF', border: 'none',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 177, 79, 0.3)',
                      }}
                    >
                      ✅ Xác nhận nhận hàng
                    </button>
                  ) : isInTransit ? (
                    <span
                      style={{
                        flex: 1, padding: '8px', borderRadius: 10, textAlign: 'center',
                        background: '#F3F4F6', color: '#9CA3AF',
                        fontSize: 11, fontWeight: 600, display: 'inline-block'
                      }}
                    >
                      🛸 Drone đang trên đường bay...
                    </span>
                  ) : null}
                  {canCancel && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); onNavigate('edit-order', order.ma_don_hang); }}
                        style={{
                          flex: 1, padding: '8px', borderRadius: 10,
                          background: '#FEF3C7', color: '#92400E', border: 'none',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        ✏️ Sửa đơn
                      </button>
                      <button
                        onClick={e => promptCancel(e, order.ma_don_hang)}
                        style={{
                          flex: 1, padding: '8px', borderRadius: 10,
                          background: '#FEE2E2', color: '#991B1B', border: 'none',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        ✕ Hủy đơn
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Confirm Modal */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.actionType === 'complete' ? 'Xác Nhận Đã Nhận Hàng' : 'Xác Nhận Hủy Đơn Hàng'}
        message={
          modalState.actionType === 'complete'
            ? 'Bạn có chắc chắn đã nhận được kiện hàng và muốn hoàn tất đơn này?'
            : 'Bạn có chắc chắn muốn hủy đơn hàng này không? Thao tác này không thể hoàn tác.'
        }
        confirmText={modalState.actionType === 'complete' ? 'Hoàn Tất' : 'Hủy Đơn'}
        cancelText="Bỏ Qua"
        type={modalState.actionType === 'complete' ? 'success' : 'danger'}
        loading={modalLoading}
        onConfirm={handleModalConfirm}
        onCancel={() => setModalState({ isOpen: false, orderId: null, actionType: null })}
      />
    </div>
  );
};
