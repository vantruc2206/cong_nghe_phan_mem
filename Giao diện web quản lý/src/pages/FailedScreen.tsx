import { useEffect, useState } from 'react'
import { Badge } from '../components/Badges'
import { Icon } from '../components/Icons'
import { listOrders, rejectOrder, Order } from '../api'

interface FailedScreenProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

export function FailedScreen({ showToast }: FailedScreenProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [action, setAction] = useState('retry')
  const [reason, setReason] = useState('battery')
  const [submitting, setSubmitting] = useState(false)

  const loadFailedOrders = async () => {
    setLoading(true)
    try {
      const data = await listOrders()
      setOrders(data.filter(o => o.trang_thai === 'failed' || o.trang_thai === 'cancelled'))
    } catch (err) {
      console.error('Lỗi tải đơn sự cố:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFailedOrders()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return
    setSubmitting(true)
    try {
      await rejectOrder(selectedOrder, `Hành động: ${action}, Nguyên nhân: ${reason}`)
      showToast(`Đã ghi nhận hướng xử lý sự cố cho đơn ${selectedOrder}`, 'info')
      setSelectedOrder(null)
      await loadFailedOrders()
    } catch (err: any) {
      showToast(err.message || 'Lỗi xử lý sự cố', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* Failed Orders */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 16, color: '#1e293b' }}>
              Đơn hàng sự cố / Hủy
            </h3>
            <button className="btn btn-outline btn-sm" onClick={loadFailedOrders}>Làm mới</button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
              Đang tải danh sách đơn sự cố...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
              Không có sự cố giao hàng nào cần xử lý.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orders.map(o => (
                <div key={o.ma_don_hang} onClick={() => setSelectedOrder(o.ma_don_hang)} style={{
                  padding: 12, borderRadius: 10, border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                  background: selectedOrder === o.ma_don_hang ? '#FEF2F2' : 'white',
                  borderColor: selectedOrder === o.ma_don_hang ? '#EF4444' : '#e2e8f0',
                  boxShadow: selectedOrder === o.ma_don_hang ? '0 4px 6px -1px rgba(239,68,68,0.1)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: '#EF4444' }}>
                      {o.ma_van_don || o.ma_don_hang}
                    </span>
                    <Badge status={o.trang_thai || 'failed'} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 550, color: '#374151' }}>{o.ten_nguoi_nhan || o.ten_khach_hang}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{o.dia_chi_giao}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8', marginTop: 6, borderTop: '1px dashed #f1f5f9', paddingTop: 6 }}>
                    <span>Trạm: <b>{o.ten_tram}</b></span>
                    <span>Tạo lúc: <b>{o.created_at}</b></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 16, color: '#1e293b', marginBottom: 12 }}>Hướng xử lý sự cố</h3>
          {selectedOrder ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 10, background: '#FEF2F2', borderRadius: 8, border: '1px solid #FCA5A5', fontSize: 13 }}>
                <span style={{ color: '#B91C1C', fontWeight: 600 }}>Sự cố đơn chọn:</span>
                <div style={{ fontWeight: 700, color: '#1e293b', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{selectedOrder}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>Nguyên nhân lỗi</label>
                <select className="input" value={reason} onChange={e => setReason(e.target.value)}>
                  <option value="battery">Drone hết pin trước khi tới đích</option>
                  <option value="wind">Tốc độ gió quá cao</option>
                  <option value="gps">GPS mất kết nối hoặc sai lệch tọa độ</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>Hành động khắc phục</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <input type="radio" name="failed_action" checked={action === 'retry'} onChange={() => setAction('retry')} />
                    <div>
                      <div>Lập lịch giao lại ngay lập tức</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Chỉ định một Drone thay thế khác</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <input type="radio" name="failed_action" checked={action === 'cancel'} onChange={() => setAction('cancel')} />
                    <div>
                      <div>Hủy đơn hàng và hoàn tiền</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Hoàn trả hàng về kho trạm</div>
                    </div>
                  </label>
                </div>
              </div>

              <button className="btn btn-primary" type="submit" disabled={submitting} style={{ justifyContent: 'center', marginTop: 8 }}>
                {Icon.check} {submitting ? 'Đang cập nhật...' : 'Thực thi hướng xử lý'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>
              Vui lòng chọn đơn hàng lỗi bên trái để cấu hình hướng giải quyết.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default FailedScreen
