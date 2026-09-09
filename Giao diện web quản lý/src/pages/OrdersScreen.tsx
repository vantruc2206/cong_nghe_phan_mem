import { useEffect, useState } from 'react'
import { Badge } from '../components/Badges'
import { Icon } from '../components/Icons'
import { listOrders, approveOrder, rejectOrder, startDelivery, Order } from '../api'

interface OrdersScreenProps {
  onDetail: (orderId?: string) => void
}

export function OrdersScreen({ onDetail }: OrdersScreenProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const perPage = 8

  // Custom Modal States (No native window.alert/prompt/confirm)
  const [confirmApproveOrder, setConfirmApproveOrder] = useState<Order | null>(null)
  const [rejectOrderModal, setRejectOrderModal] = useState<Order | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await listOrders()
      setOrders(data)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      showToast('Lỗi kết nối tải dữ liệu từ CSDL', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const executeApprove = async () => {
    if (!confirmApproveOrder) return
    const id = confirmApproveOrder.ma_don_hang
    setActionLoading(id)
    setConfirmApproveOrder(null)
    try {
      await approveOrder(id)
      showToast(`Đã duyệt thành công đơn hàng #${confirmApproveOrder.ma_van_don || id.substring(0, 8)}`, 'success')
      await loadOrders()
    } catch (err: any) {
      showToast(err.message || 'Lỗi duyệt đơn hàng', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const executeReject = async () => {
    if (!rejectOrderModal) return
    if (!rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối đơn hàng', 'error')
      return
    }
    const id = rejectOrderModal.ma_don_hang
    setActionLoading(id)
    const currentOrder = rejectOrderModal
    setRejectOrderModal(null)
    try {
      await rejectOrder(id, rejectReason.trim())
      showToast(`Đã từ chối đơn hàng #${currentOrder.ma_van_don || id.substring(0, 8)}`, 'success')
      setRejectReason('')
      await loadOrders()
    } catch (err: any) {
      showToast(err.message || 'Lỗi từ chối đơn hàng', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const isPendingStatus = (status: string) => {
    const s = (status || '').toString().toLowerCase().trim()
    return ['pending', 'chờ duyệt', 'cho_duyet', 'cho_giao', 'chờ xử lý'].some(st => s.includes(st))
  }

  const filtered = orders.filter(o => {
    const matchSearch =
      (o.ma_don_hang || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.ma_van_don || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.ten_nguoi_nhan || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.ten_khach_hang || '').toLowerCase().includes(search.toLowerCase())
    
    const statusLower = (o.trang_thai || '').toString().toLowerCase().trim()
    let matchStatus = true
    if (filterStatus !== 'all') {
      matchStatus = statusLower.includes(filterStatus.toLowerCase())
    }
    return matchSearch && matchStatus
  })

  const paged = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast Banner Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toastMessage.type === 'success' ? '#10B981' : '#EF4444',
          color: 'white', padding: '12px 20px', borderRadius: 8, fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeIn 0.3s'
        }}>
          <span>{toastMessage.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{Icon.search}</span>
          <input
            className="input"
            style={{ paddingLeft: 34 }}
            placeholder="Tìm mã đơn, tên người nhận, mã vận đơn..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="input"
          style={{ width: 180 }}
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="chờ duyệt">Chờ duyệt (Pending)</option>
          <option value="đã duyệt">Đã duyệt (Approved)</option>
          <option value="đang giao">Đang giao (Delivering)</option>
          <option value="hoàn tất">Hoàn tất (Completed)</option>
          <option value="bị từ chối">Bị từ chối (Rejected)</option>
          <option value="đã hủy">Đã hủy (Cancelled)</option>
        </select>
        <button className="btn btn-outline" onClick={loadOrders} title="Làm mới">
          Làm mới từ DB
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Đang tải danh sách đơn hàng thực tế từ Database PostgreSQL...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Chưa có đơn hàng nào khớp với tìm kiếm từ Database</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Địa chỉ giao</th>
                <th>Cân nặng</th>
                <th>Cước phí</th>
                <th>Trạm gửi</th>
                <th>Trạng thái DB</th>
                <th>Phê duyệt / Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(o => {
                const canApprove = isPendingStatus(o.trang_thai || '')
                return (
                  <tr key={o.ma_don_hang}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#3B82F6', fontWeight: 600 }}>
                        {o.ma_van_don || o.ma_don_hang?.substring(0, 8)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{o.ten_nguoi_nhan || o.ten_khach_hang || 'Khách hàng DB'}</td>
                    <td style={{ color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.dia_chi_giao || 'Địa chỉ đăng ký'}
                    </td>
                    <td style={{ color: '#64748b' }}>{o.trong_luong || 1.5} kg</td>
                    <td style={{ color: '#059669', fontWeight: 600 }}>{(o.phi_giao_hang || 35000).toLocaleString('vi-VN')} đ</td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{o.ten_tram || 'Trạm Trung Tâm'}</td>
                    <td><Badge status={o.trang_thai || 'Chờ duyệt'} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => onDetail(o.ma_don_hang)} title="Xem chi tiết">
                          {Icon.eye}
                        </button>
                        {canApprove && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              disabled={actionLoading === o.ma_don_hang}
                              onClick={() => setConfirmApproveOrder(o)}
                              title="Duyệt đơn hàng"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
                            >
                              {Icon.check} Duyệt
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#EF4444', borderColor: '#FCA5A5', padding: '4px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
                              disabled={actionLoading === o.ma_don_hang}
                              onClick={() => { setRejectOrderModal(o); setRejectReason(''); }}
                              title="Từ chối đơn hàng"
                            >
                              {Icon.x} Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Hiển thị {paged.length}/{filtered.length} đơn hàng thực tế từ PostgreSQL DB</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                style={{
                  width: 30, height: 30, borderRadius: 6, border: '1px solid', cursor: 'pointer',
                  background: page === i + 1 ? '#3B82F6' : 'white',
                  color: page === i + 1 ? 'white' : '#374151',
                  borderColor: page === i + 1 ? '#3B82F6' : '#e2e8f0',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CUSTOM REJECT ORDER MODAL (No window.prompt) ─── */}
      {rejectOrderModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 24, maxWidth: 460, width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0', animation: 'scaleUp 0.2s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#991B1B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🚫</span> Từ chối đơn hàng #{rejectOrderModal.ma_van_don || rejectOrderModal.ma_don_hang?.substring(0, 8)}
              </h3>
              <button onClick={() => setRejectOrderModal(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>✕</button>
            </div>
            
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
              Vui lòng nhập lý do từ chối đơn hàng của <b>{rejectOrderModal.ten_nguoi_nhan || rejectOrderModal.ten_khach_hang}</b> để thông báo cho khách hàng:
            </p>

            <textarea
              rows={4}
              className="input"
              style={{ width: '100%', padding: 10, fontSize: 13, borderRadius: 8, resize: 'vertical' }}
              placeholder="VD: Không đúng địa chỉ giao / Quá trọng lượng quy định / Trạm tạm ngưng tiếp nhận..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              autoFocus
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-outline" onClick={() => setRejectOrderModal(null)}>Hủy bỏ</button>
              <button className="btn" style={{ background: '#EF4444', color: 'white' }} onClick={executeReject}>
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CUSTOM APPROVE ORDER CONFIRMATION MODAL (No window.confirm) ─── */}
      {confirmApproveOrder && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 24, maxWidth: 440, width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0', animation: 'scaleUp 0.2s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#15803D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✅</span> Phê duyệt đơn hàng
              </h3>
              <button onClick={() => setConfirmApproveOrder(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
              Bạn có chắc chắn muốn **PHÊ DUYỆT** đơn hàng <b>#{confirmApproveOrder.ma_van_don || confirmApproveOrder.ma_don_hang?.substring(0, 8)}</b> của khách hàng <b>{confirmApproveOrder.ten_nguoi_nhan || confirmApproveOrder.ten_khach_hang}</b>?
            </p>

            <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 8, fontSize: 12, color: '#166534', marginTop: 12 }}>
              📍 <b>Địa chỉ:</b> {confirmApproveOrder.dia_chi_giao || 'TP. Hồ Chí Minh'}<br />
              📦 <b>Cân nặng:</b> {confirmApproveOrder.trong_luong || 1.5} kg | 💰 <b>Cước phí:</b> {(confirmApproveOrder.phi_giao_hang || 35000).toLocaleString('vi-VN')} đ
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-outline" onClick={() => setConfirmApproveOrder(null)}>Quay lại</button>
              <button className="btn btn-success" onClick={executeApprove}>
                Xác nhận Duyệt đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default OrdersScreen
