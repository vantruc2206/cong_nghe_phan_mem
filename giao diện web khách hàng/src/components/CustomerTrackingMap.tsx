import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { StationItem, DroneItem, OrderItem } from '../types'

// Dynamic Map Controller Component to pan/fly map to target coordinates ONLY when selected order ID changes
function MapController({ targetPos, selectedOrderId }: { targetPos: [number, number] | null; selectedOrderId?: string }) {
  const map = useMap()
  const prevOrderIdRef = useRef<string | undefined>(undefined)

  const lat = targetPos && targetPos[0] ? targetPos[0] : 0
  const lng = targetPos && targetPos[1] ? targetPos[1] : 0

  useEffect(() => {
    if (selectedOrderId && selectedOrderId !== prevOrderIdRef.current && lat !== 0 && lng !== 0) {
      prevOrderIdRef.current = selectedOrderId
      map.flyTo([lat, lng], 14, { animate: true, duration: 1.2 })
    }
  }, [selectedOrderId, lat, lng, map])

  return null
}

// Fix default Leaflet marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom DivIcons synchronized with Admin Management Web Portal
export const createStationIcon = (name: string) => new L.DivIcon({
  html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);pointer-events:auto">
    <div style="background:#1d4ed8;color:white;font-size:11px;font-weight:700;padding:3px 9px;border-radius:12px;box-shadow:0 3px 10px rgba(0,0,0,0.35);white-space:nowrap;border:1.5px solid white;margin-bottom:3px">
      🏢 ${name}
    </div>
    <div style="background:#1e40af;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(0,0,0,0.4);border:2.5px solid white">
      🏢
    </div>
  </div>`,
  className: '',
  iconSize: [0, 0],
  iconAnchor: [0, 0],
  popupAnchor: [0, -45],
})

export const stationIcon = createStationIcon('Trạm Hạ Cánh')

export const droneIcon = new L.DivIcon({
  html: `<div style="background:#16a34a;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 10px rgba(0,0,0,0.3);border:2px solid white">🛸</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
})

export const selectedDroneIcon = new L.DivIcon({
  html: `<div style="background:#2563eb;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 15px #3b82f6;border:3px solid #60a5fa;animation:pulse 2s infinite">🛸</div>`,
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -20],
})

export const destinationIcon = new L.DivIcon({
  html: `<div style="background:#dc2626;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 8px rgba(0,0,0,0.3);border:2px solid white"><span style="transform:rotate(45deg);font-size:14px">📍</span></div>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
})

interface CustomerTrackingMapProps {
  stations?: StationItem[]
  drones?: DroneItem[]
  orders?: OrderItem[]
  selectedOrderId?: string
  selectedDroneId?: string
  onSelectDrone?: (droneId: string) => void
}

// Custom Zoom Controls UI Component
function MapZoomControls({ onResetBounds }: { onResetBounds?: () => void }) {
  const map = useMap()
  return (
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomIn(); }}
        title="Phóng to (+)"
        style={{
          width: 36, height: 36, borderRadius: 10, background: '#ffffff',
          border: '1.5px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
          fontSize: 20, fontWeight: 800, cursor: 'pointer', color: '#0f172a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
        }}
      >
        +
      </button>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomOut(); }}
        title="Thu nhỏ (-)"
        style={{
          width: 36, height: 36, borderRadius: 10, background: '#ffffff',
          border: '1.5px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
          fontSize: 20, fontWeight: 800, cursor: 'pointer', color: '#0f172a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
        }}
      >
        −
      </button>
      {onResetBounds && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onResetBounds(); }}
          title="Tự động căn giữa bản đồ (Auto Fit)"
          style={{
            width: 36, height: 36, borderRadius: 10, background: '#ffffff',
            border: '1.5px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
            fontSize: 16, cursor: 'pointer', color: '#2563eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
          }}
        >
          🎯
        </button>
      )}
    </div>
  )
}

// AutoFitBounds Component at Module Level so React preserves its ref and state across renders
function AutoFitBounds({ stations, resetTrigger }: { stations: StationItem[]; resetTrigger?: number }) {
  const map = useMap()
  const hasFittedRef = useRef(false)
  const prevResetTriggerRef = useRef(resetTrigger)

  useEffect(() => {
    const isResetClicked = resetTrigger !== prevResetTriggerRef.current
    if (stations && stations.length > 0 && (!hasFittedRef.current || isResetClicked)) {
      prevResetTriggerRef.current = resetTrigger
      const points = stations
        .map(s => {
          const lat = s.vi_do != null ? Number(s.vi_do) : parseFloat(String(s.lat || ''))
          const lng = s.kinh_do != null ? Number(s.kinh_do) : parseFloat(String(s.lng || ''))
          return [lat, lng] as [number, number]
        })
        .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0)
      if (points.length > 0) {
        const bounds = L.latLngBounds(points)
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
        hasFittedRef.current = true
      }
    }
  }, [stations, map, resetTrigger])
  return null
}

export function CustomerTrackingMap({
  stations = [],
  drones = [],
  orders = [],
  selectedOrderId,
  selectedDroneId,
  onSelectDrone
}: CustomerTrackingMapProps) {
  const [resetTrigger, setResetTrigger] = useState(0)

  // Center map dynamically on active order destination or first station
  const activeOrder = orders.find(o => o.ma_don_hang === selectedOrderId || o.ma_van_don === selectedOrderId) || orders[0]

  const activeDestLat = Number((activeOrder as any)?.vi_do || activeOrder?.toa_do_giao?.lat) || 10.804434
  const activeDestLng = Number((activeOrder as any)?.kinh_do || activeOrder?.toa_do_giao?.lng) || 106.717844

  const mapCenter: [number, number] = activeOrder
    ? [activeDestLat, activeDestLng]
    : (stations.length > 0
        ? [Number(stations[0].vi_do || (stations[0] as any).lat || 10.8048584), Number(stations[0].kinh_do || (stations[0] as any).lng || 106.7167612)]
        : [10.8048584, 106.7167612])

  return (
    <div style={{ position: 'relative', height: 460, width: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <AutoFitBounds stations={stations} resetTrigger={resetTrigger} />
        <MapController targetPos={mapCenter} selectedOrderId={selectedOrderId} />
        <MapZoomControls onResetBounds={() => setResetTrigger(prev => prev + 1)} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 🏢 Real DB Landing Stations */}
        {stations.map((st) => {
          const rawLat = st.vi_do != null ? Number(st.vi_do) : parseFloat(String(st.lat || ''))
          const rawLng = st.kinh_do != null ? Number(st.kinh_do) : parseFloat(String(st.lng || ''))

          const lat = (!isNaN(rawLat) && rawLat !== 0) ? rawLat : 10.8048584
          const lng = (!isNaN(rawLng) && rawLng !== 0) ? rawLng : 106.7167612
          const stName = st.ten_tram || 'Trạm Hạ Cánh'
          return (
            <Marker
              key={st.ma_tram}
              position={[lat, lng]}
              icon={createStationIcon(stName)}
              zIndexOffset={3000}
            >
              <Popup>
                <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                  <b style={{ color: '#1d4ed8' }}>🏢 {stName}</b><br />
                  📍 {st.dia_chi || (st as any).dia_chi_tram || 'Chưa cập nhật địa chỉ'}<br />
                  Sức chứa: <b>{st.so_drone_hien_tai ?? 0} / {st.suc_chua || 10} Drone</b><br />
                  GPS: <code style={{ fontSize: 10 }}>{lat.toFixed(5)}, {lng.toFixed(5)}</code>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* 🛸 Drones: Initial Position = Station Address; Delivery = Flight Vector Simulation */}
        {drones.map((dr, idx) => {
          // 1. Initial position = housing station coordinates
          const assignedStation = stations.find(s =>
            s.ma_tram === (dr as any).ma_tram_hien_tai ||
            s.ma_tram === (dr as any).ma_tram ||
            (s as any).id === (dr as any).ma_tram_hien_tai
          ) || (stations.length > 0 ? stations[idx % stations.length] : null)

          const stationLat = assignedStation ? (Number((assignedStation as any).lat ?? assignedStation.vi_do) || 10.8048584) : 10.8048584
          const stationLng = assignedStation ? (Number((assignedStation as any).lng ?? assignedStation.kinh_do) || 106.7167612) : 106.7167612

          // 2. Check active order delivering
          const matchedOrder = orders.find(o => {
            const oDroneId = String((o as any).ma_drone || '').trim().toLowerCase()
            const drId = String(dr.ma_drone || dr.id || '').trim().toLowerCase()
            return oDroneId !== '' && drId !== '' && oDroneId === drId
          })

          const isDelivering = Boolean(
            matchedOrder &&
            [
              'CHO_GIAO', 'DANG_GIAO', 'IN_TRANSIT', 'DISPATCHED',
              'ĐANG GIAO', 'CHỜ GIAO', 'ĐÃ DUYỆT', 'CHO_DUYET', 'APPROVED', 'SCHEDULED'
            ].some(st => String((matchedOrder as any).trang_thai || (matchedOrder as any).trang_thai_don_hang || '').toUpperCase().includes(st))
          )

          let currentLat = dr.vi_do_hien_tai ? Number(dr.vi_do_hien_tai) : stationLat
          let currentLng = dr.kinh_do_hien_tai ? Number(dr.kinh_do_hien_tai) : stationLng

          let destLat: number | null = null
          let destLng: number | null = null

          if (isDelivering && matchedOrder) {
            const rawLat = (matchedOrder as any).vi_do ?? matchedOrder.toa_do_giao?.lat
            const rawLng = (matchedOrder as any).kinh_do ?? matchedOrder.toa_do_giao?.lng
            destLat = rawLat != null ? Number(rawLat) : null
            destLng = rawLng != null ? Number(rawLng) : null

            // Live DB coordinates calculated from Backend Telemetry Simulator
            currentLat = dr.vi_do_hien_tai ? Number(dr.vi_do_hien_tai) : stationLat
            currentLng = dr.kinh_do_hien_tai ? Number(dr.kinh_do_hien_tai) : stationLng
          }

          const isSelected = selectedDroneId === dr.ma_drone ||
            selectedDroneId === dr.id ||
            selectedDroneId === dr.ten_drone ||
            (activeOrder && (
              activeOrder.ma_drone === dr.ma_drone ||
              activeOrder.ma_drone === dr.id ||
              activeOrder.ma_drone === dr.ten_drone
            ))

          return (
            <React.Fragment key={dr.ma_drone || dr.id}>
              {/* Flight Polyline Path & Destination Pin when delivering */}
              {isDelivering && destLat != null && destLng != null && (
                <>
                  <Polyline
                    positions={[
                      [stationLat, stationLng],
                      [currentLat, currentLng],
                      [destLat, destLng]
                    ]}
                    pathOptions={{ color: '#2563eb', weight: 3, dashArray: '6, 8', opacity: 0.8 }}
                  />
                  <Marker position={[destLat, destLng]} icon={destinationIcon}>
                    <Popup>
                      <div style={{ fontSize: 12 }}>
                        <b style={{ color: '#dc2626' }}>📍 Điểm Giao Hàng</b><br />
                        Mã đơn: <b>{matchedOrder?.ma_don_hang || matchedOrder?.ma_van_don}</b><br />
                        Địa chỉ: {(matchedOrder as any)?.dia_chi_giao || 'Địa chỉ khách hàng'}
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}

              {/* Drone Marker */}
              <Marker
                position={[currentLat, currentLng]}
                icon={isSelected ? selectedDroneIcon : droneIcon}
                eventHandlers={{
                  click: () => onSelectDrone && onSelectDrone(dr.ma_drone)
                }}
              >
                <Popup>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                    <b style={{ color: '#15803d' }}>🛸 {dr.ten_drone || dr.ma_drone}</b> {isSelected && '🌟 (Đang chọn)'}<br />
                    Trạm xuất phát: <b>{assignedStation?.ten_tram || 'Trạm mặc định'}</b><br />
                    Model: {dr.model || 'SkyCarrier X1'}<br />
                    Pin: <b>{dr.dung_luong_pin ?? 100}%</b> | Tải: {dr.tai_trong_toi_da || 5.0} kg<br />
                    Trạng thái: <b style={{ color: isDelivering ? '#2563eb' : '#16a34a' }}>{isDelivering ? '🚀 Đang bay giao hàng' : (dr.trang_thai || 'Sẵn sàng')}</b><br />
                    {isDelivering && matchedOrder && (
                      <div style={{ background: '#f0f9ff', padding: '6px 8px', borderRadius: 6, margin: '4px 0', border: '1px solid #bae6fd' }}>
                        📦 Đơn đang giao: <b style={{ color: '#0284c7' }}>{(matchedOrder as any).ma_don_hang || (matchedOrder as any).ma_van_don}</b><br />
                        👤 Khách nhận: <b>{(matchedOrder as any).ten_khach_hang || 'N/A'}</b><br />
                        📍 Giao tới: <b>{(matchedOrder as any).dia_chi_giao || 'Địa chỉ khách hàng'}</b>
                      </div>
                    )}
                    GPS: <code style={{ fontSize: 10 }}>{currentLat.toFixed(5)}, {currentLng.toFixed(5)}</code>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          )
        })}

        {/* 📍 Customer Selected Active Order Destination & Flight Path Polyline ONLY */}
        {activeOrder && (() => {
          const destLat = Number((activeOrder as any).vi_do || activeOrder.toa_do_giao?.lat) || 10.804434
          const destLng = Number((activeOrder as any).kinh_do || activeOrder.toa_do_giao?.lng) || 106.717844

          // Find Origin Station for this active order
          const originStation = stations.find(s => s.ma_tram === activeOrder.ma_tram)
            || (stations.length > 0 ? stations[0] : null)

          const originPos: [number, number] | null = originStation
            ? [Number(originStation.vi_do || (originStation as any).lat || 10.8048584), Number(originStation.kinh_do || (originStation as any).lng || 106.7167612)]
            : [10.8048584, 106.7167612]

          return (
            <React.Fragment key={activeOrder.ma_don_hang}>
              {/* Destination Pin */}
              <Marker position={[destLat, destLng]} icon={destinationIcon}>
                <Popup>
                  <div style={{ fontSize: 12 }}>
                    <b style={{ color: '#b91c1c' }}>📍 Giao cho: {activeOrder.ten_nguoi_nhan}</b><br />
                    Mã đơn: <b>{activeOrder.ma_van_don || activeOrder.ma_don_hang}</b><br />
                    Địa chỉ: {activeOrder.dia_chi_giao}
                  </div>
                </Popup>
              </Marker>

              {/* Drone Flight Path Polyline connecting Station -> Destination */}
              {originPos && (
                <Polyline
                  positions={[originPos, [destLat, destLng]]}
                  color="#2563eb"
                  weight={4}
                  dashArray="6, 8"
                  opacity={0.9}
                />
              )}
            </React.Fragment>
          )
        })()}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,0.95)',
        padding: '8px 14px', borderRadius: 8, fontSize: 11, color: '#334155', zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>🏢 <b>Trạm Hạ Cánh ({stations.length})</b></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>🛸 <b>Đội Bay Drone ({drones.length})</b></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>📍 <b>Điểm Giao Hàng ({orders.length})</b></div>
      </div>
    </div>
  )
}
export default CustomerTrackingMap
