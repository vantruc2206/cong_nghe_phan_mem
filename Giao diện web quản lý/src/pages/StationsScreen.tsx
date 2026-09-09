import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { listStations, createStationApi, updateStationApi, deleteStationApi, Station } from '../api'
import { Icon } from '../components/Icons'

interface StationsScreenProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

// Station icon for map picker
const stationPickerIcon = new L.DivIcon({
  html: `<div style="background:#1d4ed8;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 10px rgba(0,0,0,0.4);border:2px solid white">🏢</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

// Sub-component: Clickable Leaflet Map Picker inside modal
function LocationPickerMap({
  lat,
  lng,
  onSelectLocation,
}: {
  lat: number
  lng: number
  onSelectLocation: (newLat: number, newLng: number) => void
}) {
  function MapEvents() {
    useMapEvents({
      click(e) {
        onSelectLocation(e.latlng.lat, e.latlng.lng)
      },
    })
    return null
  }

  function RecenterMap({ center }: { center: [number, number] }) {
    const map = useMap()
    useEffect(() => {
      map.setView(center, map.getZoom())
    }, [center, map])
    return null
  }

  const validCenter: [number, number] = [lat || 10.7769, lng || 106.7009]

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
      <MapContainer center={validCenter} zoom={16} style={{ height: 210, width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents />
        <RecenterMap center={validCenter} />
        <Marker position={validCenter} icon={stationPickerIcon} />
      </MapContainer>
      <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(255,255,255,0.92)', padding: '3px 8px', borderRadius: 4, fontSize: 10, color: '#334155', fontWeight: 600, zIndex: 1000 }}>
        👇 Bấm vào vị trí bất kỳ trên bản đồ để chọn tọa độ Trạm
      </div>
    </div>
  )
}

export function StationsScreen({ showToast }: StationsScreenProps) {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editStation, setEditStation] = useState<Station | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  // Form fields for station creation / edition
  const [tenTram, setTenTram] = useState('')
  const [diaChiTram, setDiaChiTram] = useState('')
  const [lat, setLat] = useState<number | ''>(10.7769)
  const [lng, setLng] = useState<number | ''>(106.7009)
  const [capacity, setCapacity] = useState('10')

  // Address suggestions dropdown state
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceTimer = useRef<any>(null)

  const loadStations = async () => {
    setLoading(true)
    try {
      const data = await listStations()
      setStations(data)
    } catch (err) {
      console.error('Lỗi tải danh sách trạm:', err)
      showToast('Lỗi khi tải danh sách trạm từ máy chủ', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStations()
  }, [])

  const openCreate = () => {
    setEditStation(null)
    setTenTram('')
    setDiaChiTram('')
    setLat(10.7769)
    setLng(106.7009)
    setCapacity('10')
    setSuggestions([])
    setShowSuggestions(false)
    setShowModal(true)
  }

  const openEdit = (s: Station) => {
    setEditStation(s)
    setTenTram(s.ten_tram || s.name || '')
    setDiaChiTram(s.dia_chi || '')
    setLat(Number(s.vi_do) || 10.7769)
    setLng(Number(s.kinh_do) || 106.7009)
    setCapacity(String(s.suc_chua_toi_da || s.capacity || 10))
    setSuggestions([])
    setShowSuggestions(false)
    setShowModal(true)
  }

  // Pure Direct Geocoding search function against OpenStreetMap API
  const fetchNominatimResults = async (queryStr: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=5`,
        { headers: { 'Accept-Language': 'vi,en' } }
      )
      return await res.json()
    } catch (err) {
      console.error('Direct Nominatim API error:', err)
      return []
    }
  }

  // Handle address input change with live suggestions
  const handleAddressInputChange = (value: string) => {
    setDiaChiTram(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    if (value.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceTimer.current = setTimeout(async () => {
      let data = await fetchNominatimResults(value.trim())
      if (!data || data.length === 0) {
        data = await fetchNominatimResults(`${value.trim()}, Việt Nam`)
      }
      if (data && data.length > 0) {
        setSuggestions(data)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 400)
  }

  // Handle selection from suggestions dropdown
  const handleSelectSuggestion = (item: any) => {
    const newLat = parseFloat(item.lat)
    const newLng = parseFloat(item.lon)
    setDiaChiTram(item.display_name)
    setLat(newLat)
    setLng(newLng)
    setSuggestions([])
    setShowSuggestions(false)
    showToast(`📍 Đã định vị chính xác: ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`, 'success')
  }

  // Reverse Geocoding when user clicks on map: Lat/Lng -> Address string
  const handleMapLocationSelect = async (newLat: number, newLng: number) => {
    setLat(newLat)
    setLng(newLng)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': 'vi,en' }
      })
      const data = await res.json()
      if (data && data.display_name) {
        setDiaChiTram(data.display_name)
        showToast(`📍 Đã cập nhật tọa độ & địa chỉ: ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`, 'success')
      }
    } catch (err) {
      console.error('Reverse geocode error:', err)
    }
  }

  // Manual Forward Geocoding button click
  const handleGeocodeAddress = async (rawAddress: string) => {
    if (!rawAddress.trim()) return
    setGeocoding(true)

    try {
      let results = await fetchNominatimResults(rawAddress.trim())
      if (!results || results.length === 0) {
        results = await fetchNominatimResults(`${rawAddress.trim()}, Việt Nam`)
      }

      if (results && results.length > 0) {
        const item = results[0]
        const newLat = parseFloat(item.lat)
        const newLng = parseFloat(item.lon)
        setLat(newLat)
        setLng(newLng)
        showToast(`📍 Đã định vị thành công: ${newLat.toFixed(5)}, ${newLng.toFixed(5)} (${item.display_name.split(',')[0]})`, 'success')
      } else {
        showToast('⚠️ Không tìm thấy vị trí tự động. Bạn có thể BẤM TRỰC TIẾP LÊN BẢN ĐỒ bên dưới để chọn vị trí!', 'info')
      }
    } finally {
      setGeocoding(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenTram.trim() || !diaChiTram.trim()) {
      showToast('Vui lòng nhập Tên trạm và Địa chỉ vật lý', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ten_tram: tenTram.trim(),
        dia_chi_tram: diaChiTram.trim(),
        lat: Number(lat) || 10.7769,
        lng: Number(lng) || 106.7009,
        cong_suat_toi_da: parseInt(capacity) || 10,
      }

      if (editStation) {
        await updateStationApi(editStation.ma_tram || editStation.id, payload)
        showToast(`✅ Đã cập nhật thông tin trạm: "${tenTram}"`, 'success')
      } else {
        await createStationApi(payload)
        showToast(`✅ Đã đăng ký trạm thành công: "${tenTram}"`, 'success')
      }

      setShowModal(false)
      await loadStations()
    } catch (err: any) {
      showToast(`Lỗi lưu trạm: ${err.message || 'Không thể kết nối API'}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async (maTram: string) => {
    try {
      await deleteStationApi(maTram)
      showToast(`Đã xóa trạm khỏi hệ thống`, 'info')
      setDeletingId(null)
      await loadStations()
    } catch (err: any) {
      showToast(`Lỗi xóa trạm: ${err.message || 'Lỗi server'}`, 'error')
    }
  }

  const filtered = stations.filter(s =>
    (s.ten_tram || s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.dia_chi || s.district || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Toolbar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{Icon.search}</span>
          <input
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder="Tìm theo tên trạm, địa chỉ vật lý..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-outline" onClick={loadStations}>{Icon.refresh} Làm mới</button>
        <button className="btn btn-primary" onClick={openCreate}>{Icon.plus} Đăng ký Trạm mới</button>
      </div>

      {/* Grid of Stations */}
      {loading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
          Đang tải danh sách Trạm Hạ Cánh từ Cơ Sở Dữ Liệu...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
          Chưa có trạm nào. Bấm "+ Đăng ký Trạm mới" để thêm trạm vào hệ thống.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(s => {
            const cap = s.capacity || s.suc_chua_toi_da || 10
            const curr = s.current || s.so_drone_hien_tai || 0
            const percent = Math.min(100, Math.round((curr / cap) * 100))
            const isFull = curr >= cap

            return (
              <div key={s.id} className="card" style={{ padding: 18, borderTop: '4px solid #2563eb', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 2 }}>🏢 {s.ten_tram || s.name}</h4>
                      <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>ID: {s.ma_tram || s.id}</span>
                    </div>
                    <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', fontWeight: 600, fontSize: 11 }}>
                      ✅ Hoạt động
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#475569', marginBottom: 14 }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: 11, fontWeight: 600 }}>📍 Địa chỉ vật lý:</span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{s.dia_chi || 'Chưa cập nhật địa chỉ'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: 11 }}>🌐 Tọa độ GPS:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#0f172a' }}>
                        {s.vi_do ? Number(s.vi_do).toFixed(4) : '10.7769'}, {s.kinh_do ? Number(s.kinh_do).toFixed(4) : '106.7009'}
                      </span>
                    </div>

                    <div style={{ marginTop: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                        <span>Sức chứa Drone</span>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{curr} / {cap} drone ({percent}%)</span>
                      </div>
                      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: isFull ? '#EF4444' : '#3B82F6', width: `${percent}%`, borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 10, justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => openEdit(s)}
                    title="Chỉnh sửa thông tin trạm"
                  >
                    ✏️ Chỉnh sửa
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5' }}
                    onClick={() => setDeletingId(s.ma_tram || s.id)}
                    title="Xóa trạm"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Đăng Ký / Chỉnh Sửa Trạm */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#1e293b', marginBottom: 16 }}>
              {editStation ? '✏️ Chỉnh sửa thông tin Trạm Hạ Cánh' : '🏢 Đăng ký trạm hạ cánh mới'}
            </h3>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Tên Trạm Hạ Cánh *</label>
                <input
                  className="input"
                  placeholder="Ví dụ: Trạm Saigonres Plaza Hub, Trạm Thủ Đức..."
                  value={tenTram}
                  onChange={e => setTenTram(e.target.value)}
                  required
                />
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  📍 Địa Chỉ Vật Lý *
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    placeholder="Gõ địa chỉ: Võ Oanh, Pearl Plaza, Nguyễn Huệ..."
                    value={diaChiTram}
                    onChange={e => handleAddressInputChange(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={geocoding || !diaChiTram.trim()}
                    onClick={() => handleGeocodeAddress(diaChiTram)}
                  >
                    {geocoding ? '⌛...' : '🗺️ Định vị'}
                  </button>
                </div>

                {/* Live Autocomplete Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 2000, marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                    {suggestions.map((item, idx) => (
                      <div
                        key={idx}
                        style={{ padding: '8px 12px', fontSize: 12, borderBottom: idx < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8, color: '#1e293b' }}
                        onClick={() => handleSelectSuggestion(item)}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <span style={{ fontSize: 14 }}>📍</span>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.display_name.split(',')[0]}</div>
                          <div style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 420 }}>{item.display_name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 🗺️ Interactive Map Picker inside Modal */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  🗺️ Chọn vị trí trực tiếp trên Bản đồ
                </label>
                <LocationPickerMap
                  lat={Number(lat) || 10.7769}
                  lng={Number(lng) || 106.7009}
                  onSelectLocation={handleMapLocationSelect}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Vĩ độ</label>
                  <input
                    className="input"
                    type="number"
                    step="any"
                    value={lat}
                    onChange={e => setLat(e.target.value ? parseFloat(e.target.value) : '')}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Kinh độ</label>
                  <input
                    className="input"
                    type="number"
                    step="any"
                    value={lng}
                    onChange={e => setLng(e.target.value ? parseFloat(e.target.value) : '')}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Sức chứa tối đa</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="50"
                  value={capacity}
                  onChange={e => setCapacity(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button className="btn btn-outline" type="button" onClick={() => setShowModal(false)}>Hủy</button>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Đang lưu vào DB...' : editStation ? 'Cập nhật trạm' : 'Lưu trạm vào Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Trạm */}
      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#1e293b', marginBottom: 8 }}>
              ⚠️ Xóa Trạm Hạ Cánh
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
              Bạn có chắc chắn muốn xóa vĩnh viễn trạm này khỏi cơ sở dữ liệu? Thao tác này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setDeletingId(null)}>Hủy</button>
              <button
                className="btn"
                style={{ background: '#EF4444', color: 'white', border: 'none' }}
                onClick={() => handleDeleteConfirm(deletingId)}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default StationsScreen
