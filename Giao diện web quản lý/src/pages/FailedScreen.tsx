import { useEffect, useState } from 'react'
import { Badge } from '../components/Badges'
import { Icon } from '../components/Icons'
import {
  listOrders, listDeliveries, listIncidents,
  failDelivery, retryDelivery, reportIncident, acknowledgeIncident,
  Order, Delivery, Incident
} from '../api'

interface FailedScreenProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

type Tab = 'failed_orders' | 'incidents'

export function FailedScreen({ showToast }: FailedScreenProps) {
  const [tab, setTab] = useState<Tab>('failed_orders')

  // ── Failed Orders state ──
  const [failedOrders, setFailedOrders] = useState<Order[]>([])
  const [allCancelledOrders, setAllCancelledOrders] = useState<Order[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Incident resolution controls
  const [action, setAction] = useState<'retry' | 'cancel' | 'escalate'>('retry')
  const [severity, setSeverity] = useState<string>('Trung bình')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── Incidents state ──
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [incLoading, setIncLoading] = useState(false)
  const [ackSubmitting, setAckSubmitting] = useState<string | null>(null)

  // Local persistence for handled/resolved failed orders
  const [handledOrderIds, setHandledOrderIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('handled_failed_order_ids')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  const markOrderHandled = (maDonHang: string) => {
    setHandledOrderIds(prev => {
      const next = new Set(prev)
      next.add(maDonHang)
      try {
        localStorage.setItem('handled_failed_order_ids', JSON.stringify(Array.from(next)))
      } catch {}
      return next
    })
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [orders, del, incList] = await Promise.all([
        listOrders(),
        listDeliveries(),
        listIncidents()
      ])
      setDeliveries(del)
      setIncidents(incList)

      // 📋 Danh sách các đơn đã bị từ chối / hủy để lưu vào Tab 2 (Lịch sử)
      const cancelled = orders.filter(o => {
        const st = (o.trang_thai || '').toLowerCase().trim()
        return ['đã hủy', 'từ chối', 'giao thất bại', 'thất bại', 'cancelled', 'failed', 'declined'].includes(st) || handledOrderIds.has(o.ma_don_hang)
      })
      setAllCancelledOrders(cancelled)

      // 🎯 Chỉ lấy các đơn HÀNG BỊ THẤT BẠI CHƯA ĐƯỢC XỬ LÝ (Active Pending Queue):
      // Đơn đã xử lý hủy/giao lại hoặc đã có incident sẽ tự động biến mất khỏi Tab 1 và vào Tab 2 (Lịch sử).
      const failed = orders.filter(o => {
        if (handledOrderIds.has(o.ma_don_hang)) {
          return false
        }

        const orderStatus = (o.trang_thai || '').toLowerCase().trim()
        const linkedDel = del.find(d => d.ma_don_hang === o.ma_don_hang)
        const hasIncident = linkedDel ? incList.some(i => i.ma_giao_hang === linkedDel.ma_giao_hang) : false

        if (hasIncident) {
          return false
        }

        if (['giao thất bại', 'thất bại', 'failed'].includes(orderStatus)) {
          return true
        }

        if (linkedDel) {
          const delStatus = (linkedDel.trang_thai_giao_hang || linkedDel.trang_thai || '').toLowerCase().trim()
          if (['giao thất bại', 'thất bại', 'failed', 'lỗi'].includes(delStatus)) {
            return true
          }
        }

        return false
      })

      setFailedOrders(failed)
    } finally {
      setLoading(false)
    }
  }

  const loadIncidents = async () => {
    setIncLoading(true)
    try {
      setIncidents(await listIncidents())
    } finally {
      setIncLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (tab === 'incidents') loadIncidents() }, [tab])

  const getDelivery = (order: Order): Delivery | null => {
    return deliveries.find(d => d.ma_don_hang === order.ma_don_hang) || null
  }

  const getIncidentForOrder = (order: Order): Incident | null => {
    const del = getDelivery(order)
    if (!del) return null
    return incidents.find(i => i.ma_giao_hang === del.ma_giao_hang) || null
  }

  // Handle sequence diagram flows (Steps 7a-12a & 7b-14b)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return
    const linkedDel = getDelivery(selectedOrder)

    setSubmitting(true)
    try {
      if (!linkedDel) {
        showToast('Đơn này chưa tạo chuyến giao hàng. Chỉ xử lý sự cố cho các đơn đã có chuyến giao.', 'error')
        return
      }

      // Branch B: Sự cố nghiêm trọng (Mất kiện hàng / Hỏng hóc lớn) -> Steps 7b-14b
      if (severity === 'Nghiêm trọng' || action === 'escalate') {
        await reportIncident({
          ma_giao_hang: linkedDel.ma_giao_hang,
          mo_ta_su_co: description || 'Sự cố nghiêm trọng (Mất kiện hàng / Hỏng hóc lớn)',
          muc_do_nghiem_trong: 'Nghiêm trọng',
        })
        markOrderHandled(selectedOrder.ma_don_hang)
        showToast('🚨 Đã ghi nhận sự cố nghiêm trọng & chuyển cảnh báo đến Quản lý Logistics thành công!', 'success')
      } 
      // Branch A: Sự cố không nghiêm trọng (Nhẹ / Trung bình) -> Steps 7a-12a
      else if (action === 'retry') {
        if (description.trim()) {
          await reportIncident({
            ma_giao_hang: linkedDel.ma_giao_hang,
            mo_ta_su_co: description,
            muc_do_nghiem_trong: severity,
          })
        }
        await retryDelivery(linkedDel.ma_giao_hang)
        markOrderHandled(selectedOrder.ma_don_hang)
        showToast('✅ (Step 11a-12a) Đã cập nhật trạng thái "Đang giao lại" & tạo lịch giao mới thành công!', 'success')
      } else {
        if (description.trim()) {
          await reportIncident({
            ma_giao_hang: linkedDel.ma_giao_hang,
            mo_ta_su_co: description,
            muc_do_nghiem_trong: severity,
          })
        }
        await failDelivery(linkedDel.ma_giao_hang)
        markOrderHandled(selectedOrder.ma_don_hang)
        showToast('❌ (Step 11a-12a) Đã xác nhận hủy đơn & lưu lý do vào Lịch sử!', 'info')
      }

      setSelectedOrder(null)
      setDescription('')
      await loadData()
      if (tab === 'incidents') await loadIncidents()
    } catch (err: any) {
      showToast(err.message || 'Lỗi xử lý sự cố', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Step 10b: Logistics Manager Acknowledgement
  const handleAcknowledge = async (ma_van_de: string) => {
    setAckSubmitting(ma_van_de)
    try {
      await acknowledgeIncident(ma_van_de)
      showToast('📋 (Step 10b) Quản lý Logistics đã xác nhận tiếp nhận xử lý sự cố thành công!', 'success')
      await loadIncidents()
    } catch (err: any) {
      showToast(err.message || 'Lỗi xác nhận tiếp nhận', 'error')
    } finally {
      setAckSubmitting(null)
    }
  }

  const severityColor: Record<string, string> = {
    'Nhẹ': '#22c55e',
    'Trung bình': '#f59e0b',
    'Nghiêm trọng': '#ef4444',
  }

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([
          { key: 'failed_orders', label: '⚠️ Sự cố giao hàng' },
          { key: 'incidents', label: '📋 Lịch sử sự cố và đơn hủy' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={tab === t.key ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Failed Orders ── */}
      {tab === 'failed_orders' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 16 }}>
          {/* List */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 16, color: '#1e293b' }}>
                Danh sách sự cố giao hàng
              </h3>
              <button className="btn btn-outline btn-sm" onClick={loadData}>Làm mới</button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>Đang tải dữ liệu...</div>
            ) : failedOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
                ✅ Không có đơn hàng nào bị sự cố hoặc giao thất bại cần xử lý.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {failedOrders.map(o => {
                  const del = getDelivery(o)
                  const inc = getIncidentForOrder(o)
                  const isSelected = selectedOrder?.ma_don_hang === o.ma_don_hang

                  return (
                    <div
                      key={o.ma_don_hang}
                      onClick={() => { setSelectedOrder(o); setDescription(''); setSeverity(inc?.muc_do_nghiem_trong || 'Trung bình') }}
                      style={{
                        padding: 12, borderRadius: 10, border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                        background: isSelected ? '#FEF2F2' : 'white',
                        borderColor: isSelected ? '#EF4444' : '#e2e8f0',
                        boxShadow: isSelected ? '0 4px 6px -1px rgba(239,68,68,0.1)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: '#EF4444' }}>
                          {o.ma_van_don || o.ma_don_hang?.substring(0, 8)}
                        </span>
                        <Badge status={o.trang_thai || 'failed'} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 550, color: '#374151' }}>{o.ten_nguoi_nhan || o.ten_khach_hang}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{o.dia_chi_giao}</div>
                      
                      {inc ? (
                        <div style={{ marginTop: 6, fontSize: 11, background: '#FFFBEB', padding: '4px 8px', borderRadius: 6, border: '1px solid #FCD34D', color: '#B45309' }}>
                          ⚠️ Sự cố: <strong>{inc.mo_ta_su_co}</strong> - Mức độ {inc.muc_do_nghiem_trong}
                        </div>
                      ) : del ? (
                        <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 6 }}>
                          ✓ Đơn bị giao thất bại - Mã chuyến {del.ma_giao_hang.substring(0, 8)}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Action panel */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 16, color: '#1e293b', marginBottom: 12 }}>
              🔍 Chi tiết và xử lý sự cố
            </h3>

            {selectedOrder ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13 }}>
                  <div style={{ color: '#475569', fontWeight: 600, marginBottom: 4 }}>Chi tiết đơn và chuyến giao:</div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontFamily: 'var(--font-mono)' }}>
                    {selectedOrder.ma_van_don || selectedOrder.ma_don_hang}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    👤 Khách hàng: <strong>{selectedOrder.ten_nguoi_nhan}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    📍 Địa chỉ: {selectedOrder.dia_chi_giao}
                  </div>
                  {getDelivery(selectedOrder) && (
                    <div style={{ fontSize: 11, color: '#2563EB', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                      🛸 Mã chuyến giao: {getDelivery(selectedOrder)?.ma_giao_hang}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>
                    Mô tả nguyên nhân sự cố hoặc lý do hủy *
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Ví dụ: Kiện hàng bị va đập / Drone mất tín hiệu khi hạ cánh / Khách đổi ý..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 6 }}>
                    Mức độ nghiêm trọng
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['Nhẹ', 'Trung bình', 'Nghiêm trọng'] as const).map(s => (
                      <button
                        key={s} type="button"
                        onClick={() => {
                          setSeverity(s)
                          if (s === 'Nghiêm trọng') setAction('escalate')
                          else if (action === 'escalate') setAction('retry')
                        }}
                        style={{
                          flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                          border: `2px solid ${severity === s ? severityColor[s] : '#e2e8f0'}`,
                          background: severity === s ? severityColor[s] + '20' : 'white',
                          color: severity === s ? severityColor[s] : '#64748b',
                          fontWeight: severity === s ? 700 : 400, transition: 'all 0.15s',
                        }}
                      >{s}</button>
                    ))}
                  </div>
                </div>

                {severity === 'Nghiêm trọng' ? (
                  <div style={{ padding: 12, background: '#FEF2F2', borderRadius: 10, border: '1px solid #FCA5A5', fontSize: 12, color: '#B91C1C' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>🚨 Báo cáo sự cố nghiêm trọng</div>
                    <div>Sự cố nghiêm trọng sẽ chuyển tiếp cảnh báo ngay đến <strong>Quản lý Logistics</strong> để xác nhận tiếp nhận xử lý.</div>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 6 }}>
                      Phương án xử lý
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[
                        { value: 'retry' as const, label: '🔄 Giao lại', desc: 'Cập nhật lịch và trạng thái đang giao lại, tạo chuyến mới', color: '#2563EB' },
                        { value: 'cancel' as const, label: '❌ Hủy đơn', desc: 'Cập nhật trạng thái giao thất bại hoặc đã hủy và lưu lý do', color: '#ef4444' },
                      ].map(opt => (
                        <label
                          key={opt.value}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, cursor: 'pointer',
                            padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${action === opt.value ? opt.color : '#e2e8f0'}`,
                            background: action === opt.value ? opt.color + '10' : 'white', transition: 'all 0.15s',
                          }}
                        >
                          <input type="radio" name="failed_action" checked={action === opt.value} onChange={() => setAction(opt.value)} style={{ marginTop: 2 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: action === opt.value ? opt.color : '#374151' }}>{opt.label}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{opt.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={submitting}
                  style={{
                    justifyContent: 'center', marginTop: 4,
                    background: severity === 'Nghiêm trọng' || action === 'escalate' ? '#B91C1C' : action === 'cancel' ? '#ef4444' : '#2563EB',
                    borderColor: severity === 'Nghiêm trọng' || action === 'escalate' ? '#B91C1C' : action === 'cancel' ? '#ef4444' : '#2563EB',
                  }}
                >
                  {submitting 
                    ? 'Đang xử lý...' 
                    : severity === 'Nghiêm trọng' 
                    ? '🚨 Báo cáo và chuyển Quản lý Logistics' 
                    : action === 'retry' 
                    ? '🔄 Xác nhận giao lại' 
                    : '❌ Xác nhận hủy đơn'}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>
                Nhấn vào một đơn hàng sự cố bên trái để xem chi tiết và chọn phương án xử lý.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Incident History ── */}
      {tab === 'incidents' && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 16, color: '#1e293b' }}>
              📋 Lịch sử sự cố và đơn hàng đã hủy
            </h3>
            <button className="btn btn-outline btn-sm" onClick={loadData}>Làm mới</button>
          </div>

          {loading || incLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Đang tải dữ liệu...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Mã đơn hoặc sự cố', 'Mã chuyến giao', 'Lý do từ chối hoặc nguyên nhân', 'Phân loại', 'Trạng thái xử lý', 'Hành động'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 12, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Render Reported Incidents */}
                  {incidents.map((inc, i) => {
                    const isCritical = inc.muc_do_nghiem_trong === 'Nghiêm trọng'
                    const isAcked = inc.trang_thai_xu_ly === 'Đã tiếp nhận xử lý (Logistics)'

                    return (
                      <tr key={inc.ma_van_de} style={{ background: isCritical ? '#FEF2F2' : i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
                          {inc.ma_van_de?.substring(0, 12)}...
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#475569' }}>
                          {inc.ma_giao_hang ? `${inc.ma_giao_hang.substring(0, 12)}...` : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#374151', maxWidth: 260, fontWeight: 500 }}>
                          {inc.mo_ta_su_co || 'Chưa có mô tả'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: (severityColor[inc.muc_do_nghiem_trong] || '#94a3b8') + '20',
                            color: severityColor[inc.muc_do_nghiem_trong] || '#94a3b8',
                          }}>{inc.muc_do_nghiem_trong}</span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12 }}>
                          {isAcked ? (
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Đã tiếp nhận xử lý</span>
                          ) : isCritical ? (
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ Chờ Quản lý tiếp nhận</span>
                          ) : (
                            <span style={{ color: '#64748b' }}>Đã lưu log</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {isCritical && !isAcked ? (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ padding: '3px 10px', fontSize: 11, background: '#16a34a', borderColor: '#16a34a' }}
                              disabled={ackSubmitting === inc.ma_van_de}
                              onClick={() => handleAcknowledge(inc.ma_van_de)}
                            >
                              {ackSubmitting === inc.ma_van_de ? 'Đang gửi...' : '✅ Xác nhận tiếp nhận'}
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Hoàn tất</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Render Cancelled & Declined Orders with Rejection Reasons */}
                  {allCancelledOrders.map((ord, idx) => {
                    const linkedDel = getDelivery(ord)
                    const reason = ord.ly_do_huy || ord.ghi_chu || (ord.trang_thai === 'Từ chối' ? 'Nhân viên từ chối xác nhận đơn' : 'Khách hàng / Hệ thống hủy đơn')

                    return (
                      <tr key={ord.ma_don_hang} style={{ background: (incidents.length + idx) % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                          {ord.ma_van_don || ord.ma_don_hang.substring(0, 12)}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#475569' }}>
                          {linkedDel ? `${linkedDel.ma_giao_hang.substring(0, 12)}...` : 'Chưa giao'}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#374151', maxWidth: 260, fontWeight: 500 }}>
                          {reason}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: '#FEE2E2', color: '#991B1B',
                          }}>{ord.trang_thai || 'Đã hủy'}</span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>
                          Đã ghi nhận hủy
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: '#94a3b8' }}>
                          Hoàn tất
                        </td>
                      </tr>
                    )
                  })}

                  {allCancelledOrders.length === 0 && incidents.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
                        Chưa có lịch sử sự cố hoặc đơn từ chối/hủy nào.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FailedScreen
