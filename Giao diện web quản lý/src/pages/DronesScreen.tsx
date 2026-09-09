import { useState, useEffect, useMemo } from 'react'
import { listDrones, listStations, createDrone, updateDrone, deleteDrone, Drone, Station } from '../api'
import { Badge } from '../components/Badges'
import { Icon } from '../components/Icons'

interface DronesScreenProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

const STATUS_OPTIONS = ['available', 'in_flight', 'charging', 'maintenance', 'offline']
const STATUS_LABELS: Record<string, string> = {
  available: 'Sẵn sàng',
  in_flight: 'Đang bay',
  charging: 'Đang sạc',
  maintenance: 'Bảo trì',
  offline: 'Offline',
}

function statusStyle(status: string) {
  const value = (status || '').toLowerCase()
  if (value.includes('sẵn') || value.includes('available') || value.includes('hoạt')) return { background: '#dcfce7', color: '#15803d' }
  if (value.includes('bay') || value.includes('flight')) return { background: '#ffedd5', color: '#c2410c' }
  if (value.includes('bảo') || value.includes('sạc') || value.includes('charging') || value.includes('maintenance')) return { background: '#fef3c7', color: '#b45309' }
  return { background: '#fee2e2', color: '#b91c1c' }
}

export function DronesScreen({ showToast }: DronesScreenProps) {
  const [drones, setDrones] = useState<Drone[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [editDrone, setEditDrone] = useState<Drone | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    ten_drone: '',
    model: 'SkyCarrier X1',
    dung_luong_pin: 100,
    tai_trong_toi_da: 5.0,
    trang_thai: 'available',
    ma_tram: '',
  })

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [dList, sList] = await Promise.all([listDrones(), listStations()])
      setDrones(dList)
      setStations(sList)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể tải dữ liệu Drone'
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const openCreate = () => {
    setEditDrone(null)
    setForm({ ten_drone: '', model: 'SkyCarrier X1', dung_luong_pin: 100, tai_trong_toi_da: 5.0, trang_thai: 'available', ma_tram: '' })
    setShowModal(true)
  }

  const openEdit = (d: Drone) => {
    setEditDrone(d)
    setForm({
      ten_drone: d.ten_drone || '',
      model: d.model || 'SkyCarrier X1',
      dung_luong_pin: d.dung_luong_pin ?? d.cong_suat_pin ?? 100,
      tai_trong_toi_da: d.tai_trong_toi_da ?? 5.0,
      trang_thai: d.trang_thai || d.trang_thai_drone || d.status || 'available',
      ma_tram: d.ma_tram_hien_tai || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.ten_drone.trim()) { showToast('Vui lòng nhập tên drone', 'error'); return }
    setSaving(true)
    try {
      const payload: any = {
        ten_drone: form.ten_drone,
        model: form.model,
        dung_luong_pin: Number(form.dung_luong_pin),
        tai_trong_toi_da: Number(form.tai_trong_toi_da),
        trang_thai: form.trang_thai,
        ma_tram_hien_tai: form.ma_tram || null,
      }

      if (editDrone) {
        await updateDrone(editDrone.ma_drone, payload)
        showToast(`Cập nhật drone "${form.ten_drone}" thành công`, 'success')
      } else {
        await createDrone(payload)
        showToast(`Đã đăng ký drone mới "${form.ten_drone}"`, 'success')
      }
      setShowModal(false)
      await loadData()
    } catch (err: any) {
      showToast(err.message || 'Lỗi lưu thông tin drone', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (d: Drone) => {
    if (!confirm(`Bạn có chắc muốn xóa drone "${d.ten_drone || d.ma_drone}"?`)) return
    try {
      await deleteDrone(d.ma_drone)
      showToast(`Đã xóa drone "${d.ten_drone || d.ma_drone}"`, 'info')
      await loadData()
    } catch (err: any) {
      showToast(err.message || 'Lỗi xóa drone', 'error')
    }
  }

  const isAvailableStatus = (status: string) => {
    const s = (status || '').toLowerCase().trim()
    return ['available', 'sẵn sàng', 'san_sang', 'rảnh', 'idle'].some(st => s.includes(st))
  }

  const isInFlightStatus = (status: string) => {
    const s = (status || '').toLowerCase().trim()
    return ['in_flight', 'đang bay', 'dang_bay', 'flying', 'delivering', 'giao hàng'].some(st => s.includes(st))
  }

  const isMaintenanceStatus = (status: string) => {
    const s = (status || '').toLowerCase().trim()
    return ['maintenance', 'charging', 'offline', 'bảo trì', 'bao_tri', 'đang sạc', 'dang_sac', 'hỏng'].some(st => s.includes(st))
  }

  const filteredDrones = useMemo(() => {
    const sTerm = search.trim().toLowerCase()
    return drones.filter(d => {
      const matchSearch = !sTerm || (d.ten_drone || d.ma_drone).toLowerCase().includes(sTerm) || (d.model || '').toLowerCase().includes(sTerm)
      const st = (d.trang_thai || d.trang_thai_drone || d.status || '').toLowerCase().trim()
      let matchStatus = true
      if (filterStatus === 'available') matchStatus = isAvailableStatus(st)
      else if (filterStatus === 'in_flight') matchStatus = isInFlightStatus(st)
      else if (filterStatus === 'maintenance') matchStatus = isMaintenanceStatus(st)
      else if (filterStatus === 'charging') matchStatus = st.includes('charging') || st.includes('sạc')
      else if (filterStatus === 'offline') matchStatus = st.includes('offline') || st.includes('tắt')
      else if (filterStatus !== 'all') matchStatus = st.includes(filterStatus.toLowerCase())
      return matchSearch && matchStatus
    })
  }, [drones, search, filterStatus])

  // Stats
  const inFlightCount = drones.filter(d => isInFlightStatus(d.trang_thai || d.trang_thai_drone || '')).length
  const maintenanceCount = drones.filter(d => isMaintenanceStatus(d.trang_thai || d.trang_thai_drone || '')).length
  const readyCount = drones.filter(d => isAvailableStatus(d.trang_thai || d.trang_thai_drone || '') || (!isInFlightStatus(d.trang_thai || '') && !isMaintenanceStatus(d.trang_thai || ''))).length
  const averageBattery = drones.length ? Math.round(drones.reduce((total, drone) => total + (drone.dung_luong_pin ?? drone.cong_suat_pin ?? 0), 0) / drones.length) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 700 }}>Quản lý Đội bay Drone</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Theo dõi vị trí, dung lượng pin và đăng ký thiết bị Drone mới</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => void loadData()} disabled={loading}>
            {Icon.refresh} Làm mới dữ liệu
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            {Icon.plus} Đăng ký Drone mới
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        {[
          { label: 'Tổng số Drone', value: drones.length, color: '#3B82F6' },
          { label: 'Sẵn sàng bay', value: readyCount, color: '#10B981' },
          { label: 'Đang làm nhiệm vụ', value: inFlightCount, color: '#F97316' },
          { label: 'Pin trung bình', value: `${averageBattery}%`, color: '#D97706' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '14px 16px', borderLeft: `4px solid ${stat.color}` }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>{stat.label}</div>
            <strong style={{ display: 'block', fontSize: 24, color: '#0f172a', marginTop: 4 }}>{stat.value}</strong>
          </div>
        ))}
      </div>

      {/* Main Content: Toolbar + Table */}
      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 14, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="Tìm theo tên, mã hoặc model..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
            <select className="input" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          {loading ? (
            <p style={{ padding: 24, color: '#64748b' }}>Đang tải dữ liệu Drone...</p>
          ) : error ? (
            <p style={{ padding: 24, color: '#b91c1c' }}>Lỗi dữ liệu: {error}</p>
          ) : filteredDrones.length === 0 ? (
            <p style={{ padding: 24, color: '#64748b' }}>Không tìm thấy Drone phù hợp. Nhấn "+ Đăng ký Drone mới" để tạo thêm.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>Mã & Tên Drone</th>
                    <th style={{ padding: '10px 14px' }}>Trạng thái</th>
                    <th style={{ padding: '10px 14px' }}>Pin</th>
                    <th style={{ padding: '10px 14px' }}>Tải max</th>
                    <th style={{ padding: '10px 14px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrones.map(drone => {
                    const status = drone.trang_thai_drone || drone.trang_thai || drone.status || 'Sẵn sàng'
                    const battery = drone.dung_luong_pin ?? drone.cong_suat_pin ?? 100
                    const batteryColor = battery < 20 ? '#EF4444' : battery < 50 ? '#F59E0B' : '#10B981'
                    return (
                      <tr key={drone.ma_drone} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{drone.ten_drone || drone.ma_drone}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{drone.ma_drone}</div>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span className="badge" style={statusStyle(status)}>{status}</span>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 42, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${battery}%`, height: '100%', background: batteryColor }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: batteryColor }}>{battery}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#475569' }}>{drone.tai_trong_toi_da ?? 5.0} kg</td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-outline btn-sm" style={{ padding: '3px 8px' }} onClick={() => openEdit(drone)} title="Sửa">✏️</button>
                            <button className="btn btn-sm" style={{ padding: '3px 8px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5' }} onClick={() => handleDelete(drone)} title="Xóa">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#1e293b', marginBottom: 16 }}>
              {editDrone ? '✏️ Cập nhật Drone' : '🛸 Đăng ký Drone mới'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Tên Drone *</label>
                <input className="input" placeholder="Ví dụ: SkyCarrier-01..." value={form.ten_drone} onChange={e => setForm(prev => ({ ...prev, ten_drone: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Model</label>
                  <input className="input" placeholder="SkyCarrier X1" value={form.model} onChange={e => setForm(prev => ({ ...prev, model: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Tải trọng tối đa (kg)</label>
                  <input className="input" type="number" step="0.5" min="1" max="10" value={form.tai_trong_toi_da} onChange={e => setForm(prev => ({ ...prev, tai_trong_toi_da: parseFloat(e.target.value) }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Dung lượng pin (%)</label>
                  <input className="input" type="number" min="0" max="100" value={form.dung_luong_pin} onChange={e => setForm(prev => ({ ...prev, dung_luong_pin: parseInt(e.target.value) }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Trạng thái</label>
                  <select className="input" value={form.trang_thai} onChange={e => setForm(prev => ({ ...prev, trang_thai: e.target.value }))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Gán vào trạm (tuỳ chọn)</label>
                <select className="input" value={form.ma_tram} onChange={e => setForm(prev => ({ ...prev, ma_tram: e.target.value }))}>
                  <option value="">— Không gán trạm —</option>
                  {stations.map(s => <option key={s.ma_tram || s.id} value={s.ma_tram || s.id}>{s.ten_tram || s.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? 'Đang lưu...' : editDrone ? 'Lưu thay đổi' : 'Đăng ký Drone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DronesScreen