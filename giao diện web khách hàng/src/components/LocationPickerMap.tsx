import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon issue in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom Station Marker Icon
export const stationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Custom Delivery Destination Marker Icon
export const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Custom Drone Marker Icon
export const droneIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface LocationPickerProps {
  initialLat?: number
  initialLng?: number
  initialAddress?: string
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void
}

// Component to handle map clicks and move center
function MapEventsHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap()
  const lat = center[0]
  const lng = center[1]
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map])
  return null
}

function geocodeVietnameseAddress(addressText: string): { lat: number; lng: number; fullAddr?: string } {
  const addr = addressText.toLowerCase();

  // Landmark / Specific street matches
  if (addr.includes('d3') || addr.includes('angst') || addr.includes('trường vinh')) {
    return { lat: 10.8042, lng: 106.7170, fullAddr: 'Số 289 Đường D3, Phường Thạnh Mỹ Tây, Bình Thạnh, TP.HCM' };
  }
  if (addr.includes('d5') || addr.includes('lá mía')) {
    return { lat: 10.8095, lng: 106.7142, fullAddr: '47B Đường D5, Phường Thạnh Mỹ Tây, Bình Thạnh, TP.HCM' };
  }
  if (addr.includes('võ oanh') || addr.includes('uth')) {
    return { lat: 10.8048, lng: 106.7167, fullAddr: 'Trường Đại học GTVT (UTH), Đường Võ Oanh, Bình Thạnh, TP.HCM' };
  }
  if (addr.includes('lê lợi') || addr.includes('bến thành')) {
    return { lat: 10.7721, lng: 106.6983, fullAddr: 'Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM' };
  }
  if (addr.includes('nguyễn huệ')) {
    return { lat: 10.7745, lng: 106.7032, fullAddr: 'Phố đi bộ Nguyễn Huệ, Quận 1, TP.HCM' };
  }
  if (addr.includes('điện biên phủ')) {
    return { lat: 10.7801, lng: 106.6872, fullAddr: 'Đường Điện Biên Phủ, TP.HCM' };
  }
  if (addr.includes('hùng vương')) {
    return { lat: 10.7582, lng: 106.6785, fullAddr: 'Đường Hùng Vương, Quận 5, TP.HCM' };
  }
  if (addr.includes('cộng hòa')) {
    return { lat: 10.8014, lng: 106.6543, fullAddr: 'Đường Cộng Hòa, Quận Tân Bình, TP.HCM' };
  }

  // District matches
  if (addr.includes('bình thạnh')) return { lat: 10.8044, lng: 106.7178 };
  if (addr.includes('quận 1') || addr.includes('q1')) return { lat: 10.7769, lng: 106.7009 };
  if (addr.includes('quận 3') || addr.includes('q3')) return { lat: 10.7801, lng: 106.6872 };
  if (addr.includes('quận 4') || addr.includes('q4')) return { lat: 10.7582, lng: 106.7012 };
  if (addr.includes('quận 5') || addr.includes('q5')) return { lat: 10.7582, lng: 106.6785 };
  if (addr.includes('quận 7') || addr.includes('q7')) return { lat: 10.7326, lng: 106.7023 };
  if (addr.includes('quận 10') || addr.includes('q10')) return { lat: 10.7702, lng: 106.6698 };
  if (addr.includes('thủ đức') || addr.includes('quận 9') || addr.includes('quận 2')) return { lat: 10.8012, lng: 106.7456 };
  if (addr.includes('tân bình')) return { lat: 10.8014, lng: 106.6543 };
  if (addr.includes('phú nhuận')) return { lat: 10.7981, lng: 106.6854 };

  // Hash fallback
  let hash = 0;
  for (let i = 0; i < addressText.length; i++) {
    hash = (hash << 5) - hash + addressText.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const latSign = (absHash % 2 === 0) ? 1 : -1;
  const lngSign = ((Math.floor(absHash / 2)) % 2 === 0) ? 1 : -1;
  const latStep = ((absHash % 30) + 5) * 0.001;
  const lngStep = (((Math.floor(absHash / 30)) % 30) + 5) * 0.001;

  return {
    lat: parseFloat((10.7769 + (latSign * latStep)).toFixed(6)),
    lng: parseFloat((106.7009 + (lngSign * lngStep)).toFixed(6)),
  };
}

// Custom Zoom Controls Component
function MapZoomControls() {
  const map = useMap()
  return (
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomIn(); }}
        title="Phóng to (+)"
        style={{
          width: 32, height: 32, borderRadius: 8, background: '#ffffff',
          border: '1.5px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: 18, fontWeight: 800, cursor: 'pointer', color: '#0f172a',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        +
      </button>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomOut(); }}
        title="Thu nhỏ (-)"
        style={{
          width: 32, height: 32, borderRadius: 8, background: '#ffffff',
          border: '1.5px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: 18, fontWeight: 800, cursor: 'pointer', color: '#0f172a',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        −
      </button>
    </div>
  )
}

export function LocationPickerMap({
  initialLat = 10.7769,
  initialLng = 106.7009,
  initialAddress = '',
  onLocationSelect
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng])
  const [searchAddress, setSearchAddress] = useState(initialAddress)
  const [loading, setLoading] = useState(false)
  const [reverseAddress, setReverseAddress] = useState(initialAddress || 'Đã chọn tọa độ trên bản đồ')

  // Reverse geocode lat, lng to address string via Nominatim
  const handleReverseGeocode = async (lat: number, lng: number) => {
    setPosition([lat, lng])
    setLoading(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`, {
        headers: { 'User-Agent': 'SmartDroneDelivery/1.0' }
      })
      const data = await res.json()
      const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setReverseAddress(address)
      setSearchAddress(address)
      onLocationSelect({ address, lat, lng })
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setReverseAddress(fallback)
      onLocationSelect({ address: searchAddress || fallback, lat, lng })
    } finally {
      setLoading(false)
    }
  }

  // Forward geocode search input to (lat, lng) with API + Smart Local Geocoder fallback
  const handleSearchSubmit = async (e?: React.SyntheticEvent | React.FormEvent) => {
    e?.preventDefault()
    if (!searchAddress.trim()) return
    setLoading(true)
    
    let resolved = false;
    try {
      const cleanedQuery = searchAddress
        .replace(/số\s+\d+[a-z]?/gi, '')
        .replace(/khu phố\s+\d+/gi, '')
        .replace(/tổ\s+\d+/gi, '')
        .trim();

      const query = cleanedQuery.toLowerCase().includes('hồ chí minh') || cleanedQuery.toLowerCase().includes('hcm')
        ? cleanedQuery
        : `${cleanedQuery}, Hồ Chí Minh, Việt Nam`

      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=vi`, {
        headers: { 'User-Agent': 'SmartDroneDelivery/1.0' }
      })
      const data = await res.json()
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        const fullAddr = data[0].display_name || searchAddress
        setPosition([lat, lng])
        setReverseAddress(fullAddr)
        onLocationSelect({ address: searchAddress, lat, lng })
        resolved = true;
      }
    } catch (err) {
      console.warn('Nominatim API network error, falling back to local geocoder:', err)
    }

    if (!resolved) {
      const fallback = geocodeVietnameseAddress(searchAddress);
      setPosition([fallback.lat, fallback.lng]);
      setReverseAddress(fallback.fullAddr || searchAddress);
      onLocationSelect({ address: searchAddress, lat: fallback.lat, lng: fallback.lng });
    }

    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      {/* Address Search Bar */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="text"
          style={{
            flex: 1,
            minWidth: 0,
            padding: '7px 12px',
            fontSize: 12,
            fontWeight: 500,
            color: '#0f172a',
            backgroundColor: '#ffffff',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            outline: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
          placeholder="Nhập địa chỉ (VD: 120 Lê Lợi, Q1)..."
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearchSubmit(e);
            }
          }}
        />
        <button
          type="button"
          onClick={handleSearchSubmit}
          className="btn-primary"
          disabled={loading}
          style={{
            padding: '7px 12px',
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            borderRadius: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          {loading ? 'Đang tìm...' : '🔍 Tìm Tọa Độ'}
        </button>
      </div>

      {/* Interactive Map Container */}
      <div style={{ position: 'relative', height: 210, width: '100%', borderRadius: 10, overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.05)' }}>
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <ChangeView center={position} />
          <MapZoomControls />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventsHandler onSelect={handleReverseGeocode} />
          <Marker position={position} icon={destinationIcon}>
            <Popup>
              <div style={{ fontSize: 11, lineHeight: 1.4 }}>
                <b>Điểm giao hàng đã chọn</b><br />
                {reverseAddress}<br />
                <span style={{ fontSize: 10, color: '#64748b' }}>Lat: {position[0].toFixed(5)}, Lng: {position[1].toFixed(5)}</span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
        <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', padding: '3px 8px', borderRadius: 4, fontSize: 10, color: '#334155', zIndex: 1000, pointerEvents: 'none' }}>
          💡 Nhấp vào bản đồ để chọn điểm giao hàng
        </div>
      </div>

      {/* Selected Coordinates info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, background: '#f8fafc', padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
        <span style={{ color: '#64748b' }}>Tọa độ định vị:</span>
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2563eb' }}>
          {position[0].toFixed(5)}° N, {position[1].toFixed(5)}° E
        </span>
      </div>
    </div>
  )
}
export default LocationPickerMap
