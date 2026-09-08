import React, { useEffect, useState } from 'react';
import { fetchCustomerOrders } from '../api';
import { OrderItem, UserProfile } from '../types';

interface DashboardScreenProps {
  user: UserProfile | null;
  onNavigate: (screen: string, orderId?: string) => void;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function getStatusInfo(status: string) {
  const s = status?.toLowerCase() || '';
  if (s.includes('chối') || s.includes('từ chối') || s === 'rejected') return { label: 'Bị từ chối', cls: 'badge-rejected', dot: '#EF4444' };
  if (s.includes('hủy') || s.includes('cancel') || s === 'cancelled') return { label: 'Đã hủy', cls: 'badge-cancelled', dot: '#EF4444' };
  if (s.includes('chờ') || s === 'pending') return { label: 'Chờ duyệt', cls: 'badge-pending', dot: '#F59E0B' };
  if (s.includes('đã đến') || s.includes('da_den') || s.includes('arrived')) return { label: 'Đã đến', cls: 'badge-delivering', dot: '#10B981' };
  if (s.includes('duyệt') || s.includes('approved')) return { label: 'Đã duyệt', cls: 'badge-approved', dot: '#10B981' };
  if (s.includes('giao') || s === 'in_transit' || s === 'delivering') return { label: 'Đang giao', cls: 'badge-delivering', dot: '#3B82F6' };
  if (s.includes('hoàn') || s === 'delivered') return { label: 'Hoàn thành', cls: 'badge-delivered', dot: '#10B981' };
  if (s.includes('thất') || s === 'failed') return { label: 'Thất bại', cls: 'badge-failed', dot: '#EF4444' };
  return { label: status, cls: 'badge-pending', dot: '#9CA3AF' };
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onNavigate }) => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
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

  useEffect(() => { loadData(); }, [user]);

  const pendingCount = orders.filter(o => {
    const s = o.trang_thai?.toLowerCase();
    return s === 'pending' || s?.includes('chờ');
  }).length;
  const inTransitCount = orders.filter(o => {
    const s = o.trang_thai?.toLowerCase();
    return s === 'in_transit' || s === 'assigned' || s?.includes('giao');
  }).length;
  const completedCount = orders.filter(o => {
    const s = o.trang_thai?.toLowerCase();
    return s === 'delivered' || s?.includes('hoàn');
  }).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '🌅 Chào buổi sáng' : hour < 18 ? '☀️ Chào buổi chiều' : '🌙 Chào buổi tối';

  return (
    <div className="page-container animate-fade-up">

      {/* ─── Hero Banner ─── */}
      <div className="hero-banner mb-3">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginBottom: 2 }}>{greeting}</p>
          <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 2, lineHeight: 1.2 }}>
            {user?.ho_ten?.split(' ').slice(-1)[0] || 'Khách hàng'} 👋
          </h1>
          <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 12 }}>
            Bạn có <strong>{orders.length}</strong> đơn hàng trong hệ thống
          </p>
          <button
            onClick={() => onNavigate('create-order')}
            style={{
              background: 'white',
              color: '#00B14F',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
            }}
          >
            + Tạo đơn hàng mới
          </button>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#FEF3C7' }}>
            <span style={{ fontSize: 15 }}>⏳</span>
          </div>
          <div className="metric-value" style={{ color: '#D97706' }}>{pendingCount}</div>
          <div className="metric-label">Chờ duyệt</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#DBEAFE' }}>
            <span style={{ fontSize: 15 }}>🚁</span>
          </div>
          <div className="metric-value" style={{ color: '#2563EB' }}>{inTransitCount}</div>
          <div className="metric-label">Đang giao</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#D1FAE5' }}>
            <span style={{ fontSize: 15 }}>✅</span>
          </div>
          <div className="metric-value" style={{ color: '#059669' }}>{completedCount}</div>
          <div className="metric-label">Hoàn thành</div>
        </div>
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="card mb-3">
        <p className="section-header" style={{ fontSize: 14, marginBottom: 10 }}>Thao tác nhanh</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { icon: '📦', label: 'Đơn hàng', screen: 'orders' },
            { icon: '🗺️', label: 'Theo dõi', screen: 'tracking' },
            { icon: '🤖', label: 'AI Chat', screen: 'chatbot' },
            { icon: '👤', label: 'Tài khoản', screen: 'profile' },
          ].map(item => (
            <div key={item.screen} className="quick-action" onClick={() => onNavigate(item.screen)}>
              <div className="quick-action-icon" style={{ background: '#F0F9F4', border: '1px solid #C6F0D8' }}>
                {item.icon}
              </div>
              <span className="quick-action-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Recent Orders ─── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p className="section-header" style={{ fontSize: 16, marginBottom: 0 }}>Đơn hàng gần đây</p>
          <button
            onClick={() => onNavigate('orders')}
            style={{ fontSize: 13, color: '#00B14F', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Xem tất cả →
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ fontWeight: 700, color: '#374151', marginBottom: 6 }}>Chưa có đơn hàng nào</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Tạo đơn ngay để trải nghiệm giao hàng Drone!</p>
            <button
              onClick={() => onNavigate('create-order')}
              className="btn-primary"
            >
              Tạo đơn hàng đầu tiên
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([...orders]
              .sort((a, b) => new Date(b.thoi_gian_tao || 0).getTime() - new Date(a.thoi_gian_tao || 0).getTime())
              .slice(0, 5)
            ).map((order) => {
              const status = getStatusInfo(order.trang_thai || '');
              return (
                <div
                  key={order.ma_don_hang}
                  className="list-item"
                  onClick={() => onNavigate('order-detail', order.ma_don_hang)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: '#F0F9F4', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18, flexShrink: 0,
                  }}>
                    🚁
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      #{order.ma_van_don?.slice(0, 8) || order.ma_don_hang?.slice(0, 8)}
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {order.ten_nguoi_nhan || 'Khách hàng'} · {order.dia_chi_giao || 'Địa chỉ giao'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span className={`badge ${status.cls}`}>{status.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}>{formatDate(order.thoi_gian_tao || (order as any).ngay_tao)}</span>
                      <span style={{ fontWeight: 800, fontSize: 12, color: '#00B14F' }}>
                        {(order.phi_giao_hang || 35000).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
