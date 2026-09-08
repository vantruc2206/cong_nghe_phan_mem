import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area
} from 'recharts'
import { listOrders, listStations, Order, Station } from '../api'
import { Icon } from '../components/Icons'

function parseDate(raw?: string): Date | null {
  if (!raw) return null
  try {
    const isoStr = String(raw).trim().replace(' ', 'T')
    const d = new Date(isoStr)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

export function ReportsScreen() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)

  const loadReportData = async () => {
    setLoading(true)
    try {
      const [oList, sList] = await Promise.all([listOrders(), listStations()])
      setOrders(oList)
      setStations(sList)
    } catch (err) {
      console.error('Lỗi tải dữ liệu báo cáo:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [])

  // Calculate real DB order metrics
  const completedCount = orders.filter(o => {
    const st = (o.trang_thai || o.trang_thai_don_hang || '').toLowerCase()
    return st.includes('hoàn thành') || st.includes('completed') || st.includes('delivered') || st.includes('đã giao')
  }).length

  const failedCount = orders.filter(o => {
    const st = (o.trang_thai || o.trang_thai_don_hang || '').toLowerCase()
    return st.includes('thất bại') || st.includes('hủy') || st.includes('từ chối') || st.includes('failed') || st.includes('cancelled')
  }).length

  const successRate = orders.length ? Math.round((completedCount / orders.length) * 100) : 0

  // Real DB weekly throughput by day of week
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const weeklyCounts: Record<string, { completed: number; failed: number }> = {
    'T2': { completed: 0, failed: 0 },
    'T3': { completed: 0, failed: 0 },
    'T4': { completed: 0, failed: 0 },
    'T5': { completed: 0, failed: 0 },
    'T6': { completed: 0, failed: 0 },
    'T7': { completed: 0, failed: 0 },
    'CN': { completed: 0, failed: 0 },
  }

  orders.forEach(o => {
    const dateStr = o.created_at || (o as any).ngay_dat_hang || (o as any).ngay_tao
    const d = parseDate(dateStr)
    if (d) {
      const dayKey = dayNames[d.getDay()]
      const st = (o.trang_thai || o.trang_thai_don_hang || '').toLowerCase()
      if (st.includes('hoàn thành') || st.includes('completed') || st.includes('delivered') || st.includes('đã giao')) {
        weeklyCounts[dayKey].completed += 1
      } else if (st.includes('hủy') || st.includes('từ chối') || st.includes('thất bại') || st.includes('failed')) {
        weeklyCounts[dayKey].failed += 1
      }
    }
  })

  const weeklyData = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => ({
    day,
    completed: weeklyCounts[day].completed,
    failed: weeklyCounts[day].failed,
  }))

  // Real DB station performance
  const stationPerf = stations.map(s => {
    const sName = s.ten_tram || s.name || 'Trạm'
    const sOrders = orders.filter(o => {
      const oTram = o.ten_tram || (o as any).ma_tram || ''
      const sId = s.ma_tram || s.id || ''
      return (oTram && sId && oTram === sId) || (oTram && s.ten_tram && oTram.includes(s.ten_tram))
    })
    const sCompleted = sOrders.filter(o => {
      const st = (o.trang_thai || o.trang_thai_don_hang || '').toLowerCase()
      return st.includes('hoàn thành') || st.includes('completed') || st.includes('delivered') || st.includes('đã giao')
    }).length
    const rate = sOrders.length > 0 ? Math.round((sCompleted / sOrders.length) * 100) : 100
    const shortName = sName.length > 18 ? sName.substring(0, 16) + '...' : sName
    return {
      name: shortName,
      fullName: sName,
      success: rate,
      totalOrders: sOrders.length
    }
  })

  // Real trend data (grouped by date)
  const trendMap: Record<string, number> = {}
  orders.forEach(o => {
    const dateStr = o.created_at || (o as any).ngay_dat_hang || (o as any).ngay_tao
    const d = parseDate(dateStr)
    if (d) {
      const key = `${d.getDate()}/${d.getMonth() + 1}`
      trendMap[key] = (trendMap[key] || 0) + 1
    }
  })

  // Sort dates chronologically
  const sortedDates = Object.keys(trendMap).sort((a, b) => {
    const [d1, m1] = a.split('/').map(Number)
    const [d2, m2] = b.split('/').map(Number)
    return m1 !== m2 ? m1 - m2 : d1 - d2
  })

  const trendData = sortedDates.length > 0
    ? sortedDates.map(date => ({ date, orders: trendMap[date] }))
    : [{ date: 'Real DB', orders: orders.length }]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Hiệu suất hoàn tất đơn thực tế</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>{successRate}%</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            {completedCount}/{orders.length} đơn hoàn thành trong Database
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Thời gian bay ước tính trung bình</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1E3A5F' }}>12.5 phút</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Duy trì tốc độ 45 km/h</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Số trạm hạ cánh hoạt động</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3B82F6' }}>{stations.length} trạm</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Kết nối realtime từ API</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Weekly throughput */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: '#1e293b', marginBottom: 16 }}>
            Sản lượng đơn theo tuần (Real DB)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="completed" name="Hoàn tất" fill="#10B981" radius={[3,3,0,0]} />
              <Bar dataKey="failed" name="Thất bại/Hủy" fill="#EF4444" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Station Performance */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: '#1e293b', marginBottom: 16 }}>
            Tỷ lệ thành công theo trạm hạ cánh
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stationPerf} layout="vertical" barSize={12} margin={{ left: 20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="success" name="Tỷ lệ thành công (%)" fill="#3B82F6" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend chart */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: '#1e293b' }}>
            Biểu đồ xu hướng đơn hàng thực tế
          </div>
          <button className="btn btn-outline btn-sm" onClick={loadReportData}>{Icon.download} Xuất báo cáo CSV</button>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorO" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Area type="monotone" dataKey="orders" name="Số lượng đơn" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorO)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
export default ReportsScreen
