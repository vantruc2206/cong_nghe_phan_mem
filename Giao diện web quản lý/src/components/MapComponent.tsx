import { Drone } from '../api'
import { Icon } from './Icons'

interface MapComponentProps {
  drones: Drone[]
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const result = Number(value)
  return Number.isFinite(result) ? result : null
}

export function MapComponent({ drones }: MapComponentProps) {
  const locatedDrones = drones.filter(drone => toNumber(drone.vi_do_hien_tai) !== null && toNumber(drone.kinh_do_hien_tai) !== null)

  return (
    <section className="card" style={{ padding: 0, overflow: 'hidden', minHeight: 360 }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: 16 }}>Bản đồ vị trí Drone</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>Dữ liệu vị trí từ hệ thống vận hành</p>
        </div>
        <span className="badge" style={{ background: locatedDrones.length ? '#dcfce7' : '#f1f5f9', color: locatedDrones.length ? '#15803d' : '#64748b' }}>{locatedDrones.length}/{drones.length} có tọa độ</span>
      </div>
      <div style={{ minHeight: 292, position: 'relative', backgroundColor: '#eff6ff', backgroundImage: 'linear-gradient(#dbeafe 1px, transparent 1px), linear-gradient(90deg, #dbeafe 1px, transparent 1px)', backgroundSize: '42px 42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {locatedDrones.length === 0 ? (
          <div style={{ textAlign: 'center', maxWidth: 300, padding: 24, color: '#64748b' }}>
            <div style={{ color: '#2563eb', marginBottom: 10 }}>{Icon.map}</div>
            <strong style={{ display: 'block', color: '#334155', marginBottom: 6 }}>Chưa có tọa độ Drone</strong>
            <span style={{ fontSize: 13 }}>Bản đồ sẽ tự hiển thị khi API cung cấp GPS.</span>
          </div>
        ) : locatedDrones.map(drone => {
          const lat = toNumber(drone.vi_do_hien_tai) || 0
          const lng = toNumber(drone.kinh_do_hien_tai) || 0
          const left = `${Math.min(92, Math.max(8, ((lng + 180) / 360) * 100))}%`
          const top = `${Math.min(88, Math.max(8, ((90 - lat) / 180) * 100))}%`
          return <div key={drone.ma_drone} title={drone.ma_drone} style={{ position: 'absolute', left, top, transform: 'translate(-50%, -50%)', width: 34, height: 34, borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.drone}</div>
        })}
      </div>
    </section>
  )
}

export default MapComponent