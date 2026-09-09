import { useEffect, useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Screen } from '../types'
import { Icon } from '../components/Icons'
import { Badge } from '../components/Badges'
import { listOrders, approveOrder, rejectOrder, Order } from '../api'

interface DashboardScreenProps {
  onNav: (s: Screen) => void
}

export function DashboardScreen({ onNav }: DashboardScreenProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await listOrders()
      setOrders(data)
    } catch (err) {
      console.error('Failed to load dashboard orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      await approveOrder(id)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Lỗi duyệt đơn hàng')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Nhập lý do từ chối đơn hàng:')
    if (!reason) return
    setActionLoading(id)
    try {
      await rejectOrder(id, reason)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Lỗi từ chối đơn hàng')
    } finally {
      setActionLoading(null)
    }
  }

  // Status categorization helpers for Vietnamese and English status strings
  const isPending = (status: string) => {
    const s = (status || '').toLowerCase().trim()
    return ['pending', 'chờ duyệt', 'cho_duyet', 'chờ xử lý', 'cho_xuly'].some(st => s.includes(st))
  }

  const isDelivering = (status: string) => {
    const s = (status || '').toLowerCase().trim()
    return ['delivering', 'đang giao', 'dang_giao', 'in_transit', 'assigned', 'đã lên lịch', 'da_len_lich', 'scheduled', 'đã duyệt', 'da_duyet', 'approved'].some(st => s.includes(st))
  }

  const isCompleted = (status: string) => {
    const s = (status || '').toLowerCase().trim()
    return ['completed', 'hoàn thành', 'hoan_thanh', 'hoàn tất', 'hoan_tat', 'delivered', 'đã giao', 'giao thành công'].some(st => s.includes(st))
  }

  const isFailed = (status: string) => {
    const s = (status || '').toLowerCase().trim()
    return ['failed', 'thất bại', 'that_bai', 'cancelled', 'đã hủy', 'da_huy', 'rejected', 'bị từ chối', 'bi_tu_choi', 'từ chối', 'tu_choi'].some(st => s.includes(st))
  }

  const pendingOrders = orders.filter(o => isPending(o.trang_thai || ''))
  const deliveringOrders = orders.filter(o => isDelivering(o.trang_thai || ''))
  const completedOrders = orders.filter(o => isCompleted(o.trang_thai || ''))
  const failedOrders = orders.filter(o => isFailed(o.trang_thai || ''))

  const kpis = [
    { label: 'Tổng đơn hệ thống', value: orders.length.toString(), sub: 'Thời gian thực', color: '#1E3A5F', bg: '#EFF6FF', trend: 'up' },
    { label: 'Đang giao', value: deliveringOrders.length.toString(), sub: 'Drone đang vận hành', color: '#2563EB', bg: '#EFF6FF', trend: 'up' },
    { label: 'Hoàn tất', value: completedOrders.length.toString(), sub: `Tỷ lệ: ${orders.length ? Math.round((completedOrders.length / orders.length) * 100) : 0}%`, color: '#15803D', bg: '#F0FDF4', trend: 'up' },
    { label: 'Cần xử lý / Hủy', value: (pendingOrders.length + failedOrders.length).toString(), sub: `${pendingOrders.length} chờ phê duyệt`, color: '#B91C1C', bg: '#FEF2F2', trend: 'down' },
  ]

  const statusDonut = [
    { name: 'Đang giao', value: deliveringOrders.length, color: '#3B82F6' },
    { name: 'Hoàn tất', value: completedOrders.length, color: '#22C55E' },
    { name: 'Chờ duyệt', value: pendingOrders.length, color: '#F97316' },
    { name: 'Thất bại/Hủy', value: failedOrders.length, color: '#EF4444' },
  ]

  const hourlyCounts: Record<string, number> = { '06h': 0, '08h': 0, '10h': 0, '12h': 0, '14h': 0, '16h': 0, '18h': 0 }
  if (orders.length > 0) {
    orders.forEach((o, index) => {
      let hKey = ''
      if (o.created_at) {
        const d = new Date(o.created_at)
        if (!isNaN(d.getTime())) {
          const h = d.getHours()
          if (h <= 7) hKey = '06h'
          else if (h <= 9) hKey = '08h'
          else if (h <= 11) hKey = '10h'
          else if (h <= 13) hKey = '12h'
          else if (h <= 15) hKey = '14h'
          else if (h <= 17) hKey = '16h'
          else hKey = '18h'
        }
      }
      if (!hKey) {
        const keys = ['06h', '08h', '10h', '12h', '14h', '16h', '18h']
        hKey = keys[index % keys.length]
      }
      hourlyCounts[hKey] = (hourlyCounts[hKey] || 0) + 1
    })
  }

  const hourlyData = Object.keys(hourlyCounts).map(hour => ({
    hour,
    orders: hourlyCounts[hour]
  }))

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} className="kpi-card" style={{ borderLeft: `4px solid ${k.color}` }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: k.trend === 'up' ? '#22C55E' : '#EF4444', marginTop: 6 }}>
              {k.trend === 'up' ? '▲' : '▼'} {k.sub}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: '#1e293b', marginBottom: 16 }}>
            Thống kê đơn hàng
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="orders" fill="#3B82F6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: '#1e293b', marginBottom: 4 }}>
            Tỷ lệ trạng thái
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusDonut} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" stroke="none">
                {statusDonut.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 4 }}>
            {statusDonut.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                {d.name}: <b style={{ color: '#1e293b' }}>{d.value}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: '#1e293b' }}>
            Đơn hàng cần xử lý ({pendingOrders.length} đơn chờ duyệt)
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => onNav('orders')}>Xem tất cả</button>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Đang tải dữ liệu đơn hàng...</div>
        ) : pendingOrders.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Không có đơn hàng nào chờ phê duyệt</div>
        ) : (
          <table className="data-table">
            <thead><tr>
              <th>Mã đơn</th><th>Khách nhận</th><th>Địa chỉ giao</th><th>Trạng thái</th><th>Trọng lượng</th><th>Hành động</th>
            </tr></thead>
            <tbody>
              {pendingOrders.slice(0, 5).map(o => (
                <tr key={o.ma_don_hang}>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#3B82F6', fontWeight: 600 }}>{o.ma_van_don || o.ma_don_hang}</span></td>
                  <td style={{ fontWeight: 500 }}>{o.ten_nguoi_nhan || o.ten_khach_hang}</td>
                  <td style={{ color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.dia_chi_giao}</td>
                  <td><Badge status={o.trang_thai || 'pending'} /></td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>{o.trong_luong} kg</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button 
                        className="btn btn-success btn-sm" 
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
                        disabled={actionLoading === o.ma_don_hang}
                        onClick={() => handleApprove(o.ma_don_hang)}
                      >
                        {Icon.check} Duyệt
                      </button>
                      <button 
                        className="btn btn-outline btn-sm" 
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#EF4444', borderColor: '#FCA5A5', padding: '4px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
                        disabled={actionLoading === o.ma_don_hang}
                        onClick={() => handleReject(o.ma_don_hang)}
                      >
                        {Icon.x} Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
export default DashboardScreen
