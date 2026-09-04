import { useEffect, useMemo, useState } from 'react'
import * as API from '../api'
import { Icon } from '../components/Icons'
import MapComponent from '../components/MapComponent'

interface DronesScreenProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

function statusStyle(status: string) {
  const value = status.toLowerCase()
  if (value.includes('sẵn') || value.includes('hoạt')) return { background: '#dcfce7', color: '#15803d' }
  if (value.includes('bảo') || value.includes('sạc')) return { background: '#fef3c7', color: '#b45309' }
  return { background: '#fee2e2', color: '#b91c1c' }
}

export function DronesScreen({ showToast }: DronesScreenProps) {
  const [drones, setDrones] = useState<API.Drone[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDrones = async () => {
    setLoading(true)
    setError('')
    try {
      setDrones(await API.listDrones())
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể tải dữ liệu Drone'
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadDrones() }, [])

  const filteredDrones = useMemo(() => {
    const value = search.trim().toLowerCase()
    return value ? drones.filter(drone => drone.ma_drone.toLowerCase().includes(value) || (drone.trang_thai_drone || '').toLowerCase().includes(value)) : drones
  }, [drones, search])

  const readyCount = drones.filter(drone => (drone.trang_thai_drone || '').toLowerCase().includes('sẵn')).length
  const averageBattery = drones.length ? Math.round(drones.reduce((total, drone) => total + (drone.cong_suat_pin || 0), 0) / drones.length) : 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div><h1 style={{ margin: 0, color: '#0f172a', fontSize: 24 }}>Quản lý Drone</h1><p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>Theo dõi trạng thái Drone từ hệ thống vận hành</p></div>
        <button className="btn btn-outline" onClick={() => void loadDrones()} disabled={loading}>{Icon.refresh} Làm mới dữ liệu</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
        {[['Tổng số Drone', drones.length, '#2563eb'], ['Sẵn sàng', readyCount, '#16a34a'], ['Pin trung bình', `${averageBattery}%`, '#d97706']].map(([label, value, color]) => <div key={String(label)} className="card" style={{ padding: 16, borderLeft: `4px solid ${color}` }}><div style={{ color: '#64748b', fontSize: 12 }}>{label}</div><strong style={{ display: 'block', color: '#0f172a', fontSize: 24, marginTop: 6 }}>{value}</strong></div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(300px, .75fr)', gap: 16, alignItems: 'start' }}>
        <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0' }}><input className="input" placeholder="Tìm theo mã hoặc trạng thái..." value={search} onChange={event => setSearch(event.target.value)} /></div>
          {loading ? <p style={{ padding: 24, color: '#64748b' }}>Đang tải dữ liệu Drone...</p> : error ? <p style={{ padding: 24, color: '#b91c1c' }}>Không tải được dữ liệu: {error}</p> : filteredDrones.length === 0 ? <p style={{ padding: 24, color: '#64748b' }}>Không tìm thấy Drone phù hợp.</p> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}><th style={{ padding: '11px 16px' }}>Mã Drone</th><th style={{ padding: '11px 16px' }}>Trạng thái</th><th style={{ padding: '11px 16px' }}>Pin</th><th style={{ padding: '11px 16px' }}>Bảo trì</th></tr></thead><tbody>{filteredDrones.map(drone => { const status = drone.trang_thai_drone || 'Không rõ'; return <tr key={drone.ma_drone} style={{ borderTop: '1px solid #f1f5f9' }}><td style={{ padding: '13px 16px', fontFamily: 'var(--font-mono)' }}>{drone.ma_drone}</td><td style={{ padding: '13px 16px' }}><span className="badge" style={statusStyle(status)}>{status}</span></td><td style={{ padding: '13px 16px' }}>{drone.cong_suat_pin ?? 0}%</td><td style={{ padding: '13px 16px', color: '#64748b' }}>{drone.ngay_bao_tri_gan_nhat ? new Date(drone.ngay_bao_tri_gan_nhat).toLocaleDateString('vi-VN') : 'Chưa có'}</td></tr> })}</tbody></table></div>}
        </section>
        <MapComponent drones={drones} />
      </div>
    </div>
  )
}

export default DronesScreen