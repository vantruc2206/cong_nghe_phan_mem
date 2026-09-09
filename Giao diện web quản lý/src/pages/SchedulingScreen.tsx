import { useEffect, useState } from 'react'
import { Badge } from '../components/Badges'
import { Icon } from '../components/Icons'
import { listOrders, listStations, listDrones, scheduleOrder, Order, Station, Drone } from '../api'

interface SchedulingScreenProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

export function SchedulingScreen({ showToast }: SchedulingScreenProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [drones, setDrones] = useState<Drone[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [stationId, setStationId] = useState<string>('')
  const [droneId, setDroneId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [oList, sList, dList] = await Promise.all([listOrders(), listStations(), listDrones()])
      setOrders(oList)
      setStations(sList)
      setDrones(dList)
      if (sList.length > 0) setStationId(sList[0].id || sList[0].ma_tram)
      if (dList.length > 0) setDroneId(dList[0].id || dList[0].ma_drone)
    } catch (err) {
      console.error('Lỗi tải dữ liệu lập lịch:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const isApprovedStatus = (status: string) => {
    const s = (status || '').toString().toLowerCase().trim()
    return ['approved', 'đã duyệt', 'da_duyet'].some(st => s.includes(st))
  }

  const schedulerOrders = orders.filter(o => isApprovedStatus(o.trang_thai || ''))

  const filteredDrones = drones.filter(d => {
    if (!stationId) return true
    return String(d.ma_tram_hien_tai || '') === String(stationId)
  })

  // Auto select first drone of station when stationId changes or drones loaded
  useEffect(() => {
    if (filteredDrones.length > 0) {
      if (!filteredDrones.some(d => (d.id || d.ma_drone) === droneId)) {
        setDroneId(filteredDrones[0].id || filteredDrones[0].ma_drone)
      }
    } else {
      setDroneId('')
    }
  }, [stationId, drones])

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return
    setSubmitting(true)
    try {
      await scheduleOrder(selectedOrder, {
        ma_drone: droneId,
        thoi_gian_giao: new Date().toISOString(),
      })
      showToast(`Đã xếp lịch đơn hàng ${selectedOrder} bằng Drone ${droneId} từ trạm ${stationId}`, 'success')
      setSelectedOrder(null)
      await loadData()
    } catch (err: any) {
      showToast(err.message || 'Lỗi xếp lịch đơn hàng', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* Available Approved Orders */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 16, color: '#1e293b' }}>
              Đơn hàng chờ xếp lịch giao (Database Real)
            </h3>
            <button className="btn btn-outline btn-sm" onClick={loadData}>Làm mới</button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
              Đang tải danh sách đơn hàng chờ lập lịch...
            </div>
          ) : schedulerOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
              Không có đơn hàng nào cần lập lịch tại thời điểm này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {schedulerOrders.map(o => (
                <div key={o.ma_don_hang} onClick={() => setSelectedOrder(o.ma_don_hang)} style={{
                  padding: 12, borderRadius: 10, border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                  background: selectedOrder === o.ma_don_hang ? '#EFF6FF' : 'white',
                  borderColor: selectedOrder === o.ma_don_hang ? '#3B82F6' : '#e2e8f0',
                  boxShadow: selectedOrder === o.ma_don_hang ? '0 4px 6px -1px rgba(59,130,246,0.1)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: '#3B82F6' }}>
                      {o.ma_van_don || o.ma_don_hang}
                    </span>
                    <Badge status={o.trang_thai || 'approved'} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 550, color: '#374151' }}>{o.ten_nguoi_nhan || o.ten_khach_hang}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{o.dia_chi_giao}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8', marginTop: 6, borderTop: '1px dashed #f1f5f9', paddingTop: 6 }}>
                    <span>Trọng lượng: <b>{o.trong_luong} kg</b></span>
                    <span>Phí: <b>{(o.phi_giao_hang || 35000).toLocaleString('vi-VN')} VNĐ</b></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule Form */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 16, color: '#1e293b', marginBottom: 12 }}>Cấu hình thiết bị giao</h3>
          {selectedOrder ? (
            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Đơn hàng chọn:</span>
                <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{selectedOrder}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>Chọn trạm phát</label>
                <select className="input" value={stationId} onChange={e => setStationId(e.target.value)}>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.ten_tram || s.name} ({s.current}/{s.capacity} drone rảnh)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>Chọn thiết bị Drone thuộc trạm</label>
                <select className="input" value={droneId} onChange={e => setDroneId(e.target.value)} disabled={filteredDrones.length === 0}>
                  {filteredDrones.length === 0 ? (
                    <option value="">-- Trạm này hiện chưa có Drone sẵn sàng --</option>
                  ) : (
                    filteredDrones.map(d => (
                      <option key={d.id} value={d.id}>{d.ten_drone} ({d.model}) - Pin: {d.dung_luong_pin}%</option>
                    ))
                  )}
                </select>
              </div>

              <button className="btn btn-primary" type="submit" disabled={submitting} style={{ justifyContent: 'center', marginTop: 8 }}>
                {Icon.calendar} {submitting ? 'Đang lập lịch...' : 'Xếp lịch bay thực tế'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>
              Vui lòng chọn đơn hàng ở danh sách bên trái để thiết lập thiết bị và trạm giao.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default SchedulingScreen
