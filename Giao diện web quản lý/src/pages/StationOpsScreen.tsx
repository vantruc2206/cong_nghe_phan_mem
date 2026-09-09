import { useEffect, useState } from 'react'
import { Badge } from '../components/Badges'
import { Icon } from '../components/Icons'
import { listStations, listOrders, listDrones, startDelivery, Station, Order, Drone } from '../api'

interface StationOpsScreenProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

export function StationOpsScreen({ showToast }: StationOpsScreenProps) {
  const [stations, setStations] = useState<Station[]>([])
  const [selectedStationId, setSelectedStationId] = useState<string>('')
  const [orders, setOrders] = useState<Order[]>([])
  const [drones, setDrones] = useState<Drone[]>([])
  const [loading, setLoading] = useState(true)

  const [scanCode, setScanCode] = useState('')
  const [cargoWeight, setCargoWeight] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadOpsData = async () => {
    setLoading(true)
    try {
      const [sList, oList, dList] = await Promise.all([
        listStations(),
        listOrders(),
        listDrones()
      ])
      setStations(sList)
      setOrders(oList)
      setDrones(dList)

      if (sList.length > 0 && !selectedStationId) {
        setSelectedStationId(sList[0].ma_tram || sList[0].id)
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu vận hành trạm:', err)
      showToast('Không thể tải dữ liệu trạm vận hành từ Database', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOpsData()
  }, [])

  const currentStation = stations.find(s => (s.ma_tram || s.id) === selectedStationId) || stations[0]

  // Filter drones for the selected station
  const stationDrones = drones.filter(d => {
    if (!selectedStationId) return true
    return String(d.ma_tram_hien_tai || d.ma_tram || '') === String(selectedStationId)
  })

  const chargingDrones = stationDrones.filter(d => {
    const pin = d.dung_luong_pin ?? d.cong_suat_pin ?? 100
    const st = (d.status || d.trang_thai || '').toLowerCase()
    return pin < 80 || st.includes('sạc') || st.includes('bảo trì')
  }).length

  const stationCapacity = currentStation?.capacity || currentStation?.suc_chua_toi_da || currentStation?.suc_chua || 10
  const readyPadCount = Math.max(0, stationCapacity - stationDrones.length)

  // Orders associated with current selected station
  const stationOrders = orders.filter(o => {
    if (!selectedStationId) return true
    const stId = String(selectedStationId).toLowerCase()
    const oTram = String(o.ma_tram || o.ma_tram_ha_canh || '').toLowerCase()
    const oTenTram = String(o.ten_tram || '').toLowerCase()
    const curName = String(currentStation?.ten_tram || currentStation?.name || '').toLowerCase()
    
    // If order has explicit station ID or name matching current station
    if (oTram) return oTram === stId
    if (oTenTram && curName) return oTenTram.includes(curName) || curName.includes(oTenTram)
    return true
  })

  const isScheduledStatus = (status: string) => {
    const s = (status || '').toLowerCase().trim()
    return [
      'đã lên lịch', 'da_len_lich', 'scheduled',
      'chờ giao', 'cho_giao',
      'đã duyệt', 'da_duyet', 'approved',
      'sẵn sàng giao', 'ready'
    ].some(st => s.includes(st))
  }

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanCode.trim()) {
      showToast('Vui lòng chọn 1 đơn hàng ở danh sách hoặc nhập/quét mã vận đơn!', 'info')
      return
    }

    setActionLoading(true)
    const code = scanCode.trim().toUpperCase()

    // Find order matching scan code
    const targetOrder = orders.find(o => 
      (o.ma_don_hang && o.ma_don_hang.toUpperCase() === code) ||
      (o.ma_van_don && o.ma_van_don.toUpperCase() === code) ||
      (o.ma_don_hang && o.ma_don_hang.toUpperCase().includes(code))
    )

    try {
      if (targetOrder) {
        if (!isScheduledStatus(targetOrder.trang_thai || '')) {
          showToast(`Đơn hàng #${targetOrder.ma_van_don || targetOrder.ma_don_hang} chưa ở trạng thái "Đã duyệt/Đã lên lịch"!`, 'error')
          return
        }
        await startDelivery(targetOrder.ma_don_hang)
        showToast(`Xác nhận thành công đơn ${targetOrder.ma_van_don || targetOrder.ma_don_hang}! Đã phát lệnh phóng Drone.`, 'success')
      } else {
        showToast(`Đã ghi nhận quét mã đơn ${code}. Trọng lượng thực tế: ${cargoWeight || '1.5'}kg.`, 'info')
      }
      setScanCode('')
      setCargoWeight('')
      await loadOpsData()
    } catch (err: any) {
      showToast(err.message || `Lỗi kích hoạt giao hàng cho đơn ${code}`, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const selectedOrder = scanCode.trim() ? orders.find(o => 
    (o.ma_don_hang && o.ma_don_hang.toUpperCase() === scanCode.trim().toUpperCase()) ||
    (o.ma_van_don && o.ma_van_don.toUpperCase() === scanCode.trim().toUpperCase()) ||
    (o.ma_don_hang && o.ma_don_hang.toUpperCase().includes(scanCode.trim().toUpperCase()))
  ) : null

  const canLaunchSelected = !selectedOrder || isScheduledStatus(selectedOrder.trang_thai || '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Station Selector Bar */}
      <div className="card" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>Chọn Trạm vận hành:</span>
          <select 
            className="input" 
            style={{ width: 280, fontWeight: 500 }} 
            value={selectedStationId} 
            onChange={e => setSelectedStationId(e.target.value)}
          >
            {stations.map(s => (
              <option key={s.id || s.ma_tram} value={s.ma_tram || s.id}>
                {s.ten_tram || s.name} ({s.district || s.dia_chi || 'TP.HCM'})
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadOpsData} disabled={loading}>
          {Icon.refresh} Cập nhật trạng thái Realtime
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Station Status Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 16, color: '#1e293b', marginBottom: 12 }}>
              Thông số hoạt động trạm {currentStation ? `: ${currentStation.ten_tram || currentStation.name}` : ''}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Bệ phóng khả dụng</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1E3A5F', marginTop: 4 }}>
                  {readyPadCount} / {currentStation?.capacity || currentStation?.suc_chua_toi_da || 5}
                </div>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Drone tại trạm / sạc</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#F59E0B', marginTop: 4 }}>
                  {stationDrones.length} ({chargingDrones} sạc)
                </div>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Đơn hàng thuộc trạm</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
                  {stationOrders.length} đơn
                </div>
              </div>
            </div>
          </div>

          {/* Scan Barcode / Input Area */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 16, color: '#1e293b', marginBottom: 12 }}>
              Nhận diện & Quét mã vạch kiện hàng thực tế
            </h3>
            <form onSubmit={handleScanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>
                    Quét hoặc Nhập mã vận đơn / đơn hàng
                  </label>
                  <input 
                    className="input" 
                    placeholder="Ví dụ: VD-12345678 hoặc Mã đơn..." 
                    value={scanCode} 
                    onChange={e => setScanCode(e.target.value)} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>
                    Cân thực tế (kg)
                  </label>
                  <input 
                    className="input" 
                    placeholder="Ví dụ: 1.5" 
                    value={cargoWeight} 
                    onChange={e => setCargoWeight(e.target.value)} 
                  />
                </div>
              </div>
              <button 
                className="btn btn-primary" 
                type="submit" 
                disabled={actionLoading || !canLaunchSelected} 
                style={{ 
                  justifyContent: 'center', 
                  marginTop: 6,
                  background: !canLaunchSelected ? '#94a3b8' : undefined,
                  borderColor: !canLaunchSelected ? '#94a3b8' : undefined,
                  cursor: !canLaunchSelected ? 'not-allowed' : 'pointer'
                }}
              >
                {actionLoading 
                  ? 'Đang kích hoạt...' 
                  : !canLaunchSelected 
                  ? `⚠️ Đơn hàng (${selectedOrder?.trang_thai || 'Không hợp lệ'}) không thể phóng` 
                  : 'Xác nhận kiểm kho & Phóng Drone'}
              </button>
            </form>
          </div>
        </div>

        {/* Cargo confirmation list */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 16, color: '#1e293b', marginBottom: 12 }}>
            Danh sách đơn hàng vận hành (Real DB)
          </h3>
          {loading ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              Đang tải danh sách đơn hàng...
            </div>
          ) : stationOrders.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              Chưa có đơn hàng nào tại trạm.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
              {stationOrders.slice(0, 10).map(o => (
                <div 
                  key={o.ma_don_hang} 
                  onClick={() => setScanCode(o.ma_van_don || o.ma_don_hang)}
                  style={{ 
                    padding: 10, 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 8, 
                    fontSize: 13, 
                    cursor: 'pointer',
                    background: scanCode === (o.ma_van_don || o.ma_don_hang) ? '#EFF6FF' : 'white',
                    borderColor: scanCode === (o.ma_van_don || o.ma_don_hang) ? '#3B82F6' : '#e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#3B82F6' }}>
                      {o.ma_van_don || o.ma_don_hang}
                    </span>
                    <Badge status={o.trang_thai || 'Approved'} />
                  </div>
                  <div style={{ color: '#475569', fontWeight: 500 }}>{o.ten_nguoi_nhan || o.ten_khach_hang}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{o.dia_chi_giao}</span>
                    {isScheduledStatus(o.trang_thai || '') && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ padding: '3px 8px', fontSize: 11, background: '#2563EB', color: 'white' }}
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            await startDelivery(o.ma_don_hang)
                            showToast(`🚀 Đã phát lệnh phóng Drone cho đơn ${o.ma_van_don || o.ma_don_hang}!`, 'success')
                            await loadOpsData()
                          } catch (err: any) {
                            showToast(err.message || 'Lỗi phát lệnh giao hàng', 'error')
                          }
                        }}
                      >
                        🚀 Phóng Drone
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StationOpsScreen
