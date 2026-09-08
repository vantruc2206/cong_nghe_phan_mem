import { useEffect, useState } from 'react'
import { Badge } from '../components/Badges'
import { Icon } from '../components/Icons'
import { getOrder, approveOrder, rejectOrder, Order } from '../api'
import AdminTrackingMap from '../components/AdminTrackingMap'

interface OrderDetailScreenProps {
  orderId?: string
  onBack: () => void
  onNav?: (screen: any) => void
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

export function OrderDetailScreen({ orderId, onBack, onNav, showToast }: OrderDetailScreenProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showApprove, setShowApprove] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadOrderDetail = async () => {
    if (!orderId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getOrder(orderId)
      setOrder(data)
    } catch (err) {
      console.error('Lỗi tải chi tiết đơn hàng:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrderDetail()
  }, [orderId])

  const handleApprove = async () => {
    if (!orderId) return
    setActionLoading(true)
    try {
      await approveOrder(orderId)
      setShowApprove(false)
      showToast(`Phê duyệt đơn hàng ${orderId} thành công! Bạn có thể chuyển sang Lập lịch giao hàng ngay.`, 'success')
      await loadOrderDetail()
    } catch (err: any) {
      showToast(err.message || 'Lỗi duyệt đơn hàng', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!orderId) return
    setActionLoading(true)
    try {
      await rejectOrder(orderId, rejectReason || 'Không có lý do cụ thể')
      setShowReject(false)
      showToast(`Đã từ chối đơn hàng ${orderId}. Lý do: "${rejectReason || 'Không có lý do'}"`, 'info')
      await loadOrderDetail()
    } catch (err: any) {
      showToast(err.message || 'Lỗi từ chối đơn hàng', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu chi tiết từ Database...</div>
  }

  const displayOrder = order || {
    ma_don_hang: orderId || 'ORD-2024-001',
    ma_van_don: orderId || 'ORD-2024-001',
    ten_khach_hang: 'Khách hàng',
    ten_nguoi_nhan: 'Người nhận',
    so_dien_thoai: '0912 345 678',
    dia_chi_giao: 'TP. Hồ Chí Minh',
    trong_luong: 2.5,
    ten_tram: 'Trạm Hạ Cánh Q.1',
    trang_thai: 'pending',
    created_at: new Date().toLocaleString('vi-VN'),
  }

  const isApproved = ['approved', 'đã duyệt'].some(k => displayOrder.trang_thai?.toLowerCase().includes(k))
  const isPending = ['pending', 'chờ', 'chờ duyệt'].some(k => displayOrder.trang_thai?.toLowerCase().includes(k))

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-outline btn-sm" onClick={onBack}>← Quay lại danh sách</button>
        {onNav && (
          <button className="btn btn-primary btn-sm" onClick={() => onNav('scheduling')}>
            📅 Chuyển đến Lập lịch giao hàng (UC-05) →
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Main info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Chi tiết đơn hàng thực tế</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#1e293b', marginTop: 2 }}>
                  {displayOrder.ma_van_don || displayOrder.ma_don_hang}
                </h2>
              </div>
              <Badge status={displayOrder.trang_thai || 'pending'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px 24px', fontSize: 14 }}>
              <div>
                <span style={{ color: '#64748b', fontSize: 12 }}>KHÁCH HÀNG</span>
                <div style={{ fontWeight: 550, color: '#1e293b', marginTop: 2 }}>{displayOrder.ten_nguoi_nhan || displayOrder.ten_khach_hang}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 12 }}>SỐ ĐIỆN THOẠI</span>
                <div style={{ fontWeight: 550, color: '#1e293b', marginTop: 2 }}>{(displayOrder as any).so_dien_thoai_nhan || (displayOrder as any).so_dien_thoai || 'N/A'}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>ĐỊA CHỈ GIAO HÀNG</span>
                <div style={{ fontWeight: 550, color: '#1e293b', marginTop: 2 }}>{displayOrder.dia_chi_giao}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 12 }}>TRỌNG LƯỢNG HÀNG</span>
                <div style={{ fontWeight: 550, color: '#1e293b', marginTop: 2 }}>{displayOrder.trong_luong} kg</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 12 }}>TRẠM PHÁT</span>
                <div style={{ fontWeight: 550, color: displayOrder.ten_tram && displayOrder.trang_thai !== 'pending' && displayOrder.trang_thai !== 'Chờ duyệt' ? '#1e293b' : '#94a3b8', marginTop: 2 }}>
                  {displayOrder.trang_thai !== 'pending' && displayOrder.trang_thai !== 'Chờ duyệt' && displayOrder.ten_tram ? displayOrder.ten_tram : 'Chưa phân trạm'}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: '#1e293b', marginBottom: 12 }}>
              Bản đồ lộ trình bay Leaflet thực tế
            </div>
            <div style={{ height: 260, borderRadius: 12, overflow: 'hidden' }}>
              <AdminTrackingMap orders={[displayOrder]} />
            </div>
          </div>
        </div>

        {/* Status panel */}
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Hành động điều phối real</div>
            {isPending ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                <button className="btn btn-success" onClick={() => setShowApprove(true)} style={{ justifyContent: 'center' }}>
                  {Icon.check} Phê duyệt đơn hàng
                </button>
                <button className="btn btn-outline" onClick={() => setShowReject(true)} style={{ justifyContent: 'center', color: '#EF4444', borderColor: '#FCA5A5' }}>
                  {Icon.x} Từ chối đơn hàng
                </button>
              </div>
            ) : isApproved ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                <div style={{ padding: 10, borderRadius: 8, background: '#D1FAE5', color: '#065F46', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                  ✅ Đơn hàng đã được duyệt!
                </div>
                {onNav && (
                  <button className="btn btn-primary" onClick={() => onNav('scheduling')} style={{ justifyContent: 'center', padding: '10px' }}>
                    📅 Lập lịch & Phân trạm ngay (UC-05) →
                  </button>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: '#f8fafc', color: '#64748b', fontSize: 13, textAlign: 'center' }}>
                Trạng thái: <b>{displayOrder.trang_thai}</b>
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9' }} />

          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Nhật ký tiến trình đơn</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F97316', display: 'inline-block', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <b>Khởi tạo đơn thành công</b>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{displayOrder.created_at}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Duyệt đơn */}
      {showApprove && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '24px 20px', width: '100%', maxWidth: 400, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#1e293b', marginBottom: 8 }}>Xác nhận phê duyệt</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, marginBottom: 16 }}>
              Bạn có chắc chắn muốn phê duyệt đơn hàng này trong cơ sở dữ liệu Supabase?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowApprove(false)}>Hủy</button>
              <button className="btn btn-success btn-sm" disabled={actionLoading} onClick={handleApprove}>Phê duyệt</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ chối đơn */}
      {showReject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '24px 20px', width: '100%', maxWidth: 400, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#1e293b', marginBottom: 8 }}>Từ chối đơn hàng</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Lý do từ chối</label>
              <input className="input" placeholder="Ví dụ: Địa chỉ ngoài vùng phủ sóng..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowReject(false)}>Hủy</button>
              <button className="btn btn-sm" style={{ background: '#EF4444', color: 'white', border: 'none' }} disabled={actionLoading} onClick={handleReject}>Xác nhận từ chối</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default OrderDetailScreen
