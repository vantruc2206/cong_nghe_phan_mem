import { useState, useEffect, useRef } from 'react'
import { listDrones, listOrders, listStations, Drone, Order, Station } from '../api'
import { Badge } from '../components/Badges'
import AdminTrackingMap from '../components/AdminTrackingMap'

export function TrackingScreen() {
  const [drones, setDrones] = useState<Drone[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null)
  const selectedDroneRef = useRef<string | null>(null)

  // Keep ref synchronized with state to avoid closure staleness in setInterval
  useEffect(() => {
    selectedDroneRef.current = selectedDrone
  }, [selectedDrone])

  const loadTrackingData = async () => {
    try {
      const [dList, oList, sList] = await Promise.all([listDrones(), listOrders(), listStations()])
      setDrones(dList)
      setOrders(oList)
      setStations(sList)

      // Only set initial default drone if user hasn't selected any drone yet
      if (dList.length > 0 && !selectedDroneRef.current) {
        const defaultId = dList[0].id || (dList[0] as any).ma_drone
        setSelectedDrone(defaultId)
        selectedDroneRef.current = defaultId
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu telemetry:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrackingData()
    const t = setInterval(() => {
      loadTrackingData()
    }, 5000)
    return () => clearInterval(t)
  }, [])

  const [selectedStationFilter, setSelectedStationFilter] = useState<string>('ALL')

  const filteredDrones = drones.filter(d => {
    if (selectedStationFilter === 'ALL') return true
    const stId = (d as any).ma_tram_hien_tai || (d as any).ma_tram
    return String(stId) === String(selectedStationFilter)
  })

  const activeDrone = drones.find(d => d.id === selectedDrone || (d as any).ma_drone === selectedDrone) || drones[0]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, height: 'calc(100vh - 120px)' }}>
      {/* Simulation Map using Leaflet */}
      <div className="card" style={{ padding: 12, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 8px 8px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 15, color: '#1e293b' }}>
              Bản đồ giám sát không phận thời gian thực
            </h3>
            <span style={{ fontSize: 11, color: '#22c55e' }}>● Nhận tín hiệu GPS telemetry live từ đội bay Drone & Trạm hạ cánh</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={loadTrackingData}>Làm mới telemetry</button>
        </div>

        {/* Leaflet Real Interactive Map */}
        <div style={{ flex: 1, marginTop: 12, borderRadius: 10, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', fontWeight: 600 }}>
              Đang đồng bộ telemetry từ Server...
            </div>
          ) : (
            <AdminTrackingMap
              stations={stations}
              drones={drones}
              orders={orders}
              selectedDroneId={selectedDrone || undefined}
            />
          )}
        </div>
      </div>

      {/* Control panel & Drone list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {/* Selected Drone Status Detail */}
        {activeDrone && (
          <div className="card" style={{ padding: 16, flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Chi tiết Drone đang chọn</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
                {(activeDrone as any).ten_drone || (activeDrone as any).name || activeDrone.id || (activeDrone as any).ma_drone}
              </div>
              <Badge status={activeDrone.trang_thai || (activeDrone as any).status || 'Sẵn sàng'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, fontSize: 12 }}>
              <div style={{ background: '#f8fafc', padding: 8, borderRadius: 6 }}>
                <span style={{ color: '#64748b' }}>Dung lượng Pin</span>
                <div style={{ fontWeight: 700, color: '#10B981', fontSize: 14 }}>
                  {(activeDrone as any).cong_suat_pin ?? (activeDrone as any).dung_luong_pin ?? (activeDrone as any).battery ?? 95}%
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: 8, borderRadius: 6 }}>
                <span style={{ color: '#64748b' }}>Sức tải tối đa</span>
                <div style={{ fontWeight: 700, color: '#3B82F6', fontSize: 14 }}>
                  {activeDrone.tai_trong_toi_da || (activeDrone as any).payload || '5.0'} kg
                </div>
              </div>
            </div>

            {((activeDrone as any).order || (activeDrone as any).ma_don_hang) && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Đơn hàng đảm nhận:</span>
                <div style={{ fontWeight: 600, color: '#1E3A5F', marginTop: 2 }}>
                  {(activeDrone as any).order || (activeDrone as any).ma_don_hang}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Drone Fleet List */}
        <div className="card" style={{ padding: 16, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 650, color: '#1e293b', marginBottom: 6 }}>
              Danh sách đội bay ({filteredDrones.length}/{drones.length})
            </div>
            <select
              value={selectedStationFilter}
              onChange={(e) => setSelectedStationFilter(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 8,
                border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 600, color: '#334155',
                background: '#f8fafc', cursor: 'pointer'
              }}
            >
              <option value="ALL">🏢 Tất cả các trạm ({stations.length} trạm)</option>
              {stations.map(st => {
                const sId = st.ma_tram || st.id
                const count = drones.filter(d => String((d as any).ma_tram_hien_tai || (d as any).ma_tram) === String(sId)).length
                return (
                  <option key={sId} value={sId}>
                    🏢 {st.ten_tram || st.name} ({count} Drone)
                  </option>
                )
              })}
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
            {filteredDrones.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                Không có Drone nào thuộc trạm này
              </div>
            ) : (
              filteredDrones.map(d => {
                const droneKey = d.id || (d as any).ma_drone
                const isSelected = selectedDrone === d.id || selectedDrone === (d as any).ma_drone
                const battery = (d as any).cong_suat_pin ?? (d as any).dung_luong_pin ?? (d as any).battery ?? 95
                const name = (d as any).ten_drone || (d as any).name || d.id || (d as any).ma_drone

                return (
                  <div
                    key={droneKey}
                    onClick={() => {
                      setSelectedDrone(droneKey)
                      selectedDroneRef.current = droneKey
                    }}
                    style={{
                      padding: 10, borderRadius: 8, border: isSelected ? '2px solid #3B82F6' : '1px solid #e2e8f0',
                      background: isSelected ? '#EFF6FF' : 'white', cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 2px 8px rgba(59,130,246,0.2)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                      <span style={{ color: isSelected ? '#1D4ED8' : '#1e293b' }}>🛸 {name}</span>
                      <span style={{ fontSize: 11, color: battery < 20 ? '#EF4444' : '#10B981' }}>⚡ {battery}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Model: {d.model || 'SkyCarrier X1'}</span>
                      <Badge status={d.trang_thai || (d as any).status || 'Sẵn sàng'} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default TrackingScreen
