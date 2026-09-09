import React from 'react'
import { Screen, Role } from '../types'
import { Icon } from './Icons'
import { RoleBadge } from './Badges'

const NAV_ITEMS: { screen: Screen; label: string; icon: React.ReactNode; roles: Role[]; section?: string }[] = [
  { screen: 'dashboard',   label: 'Tổng quan',            icon: Icon.grid,     roles: ['admin','dispatcher','manager'], section: 'CHÍNH' },
  { screen: 'orders',      label: 'Quản lý đơn hàng',     icon: Icon.package,  roles: ['admin','dispatcher'], section: '' },
  { screen: 'scheduling',  label: 'Lập lịch giao hàng',   icon: Icon.calendar, roles: ['admin','dispatcher'] },
  { screen: 'failed',      label: 'Xử lý thất bại',       icon: Icon.alert,    roles: ['admin','dispatcher'] },
  { screen: 'station-ops', label: 'Vận hành trạm',        icon: Icon.box,      roles: ['admin','operator'], section: 'VẬN HÀNH' },
  { screen: 'tracking',    label: 'Theo dõi giao hàng',   icon: Icon.map,      roles: ['admin','dispatcher','operator'] },
  { screen: 'drones',      label: 'Quản lý Drone',        icon: Icon.drone,    roles: ['admin','dispatcher','operator'], section: 'QUẢN TRỊ' },
  { screen: 'stations',    label: 'Quản lý trạm',         icon: Icon.station,  roles: ['admin','dispatcher'], section: 'QUẢN TRỊ' },
  { screen: 'reports',     label: 'Báo cáo & Thống kê',   icon: Icon.chart,    roles: ['admin','manager'] },
  { screen: 'users',       label: 'Quản lý người dùng',   icon: Icon.users,    roles: ['admin'] },
]

interface SidebarProps {
  screen: Screen
  onNav: (s: Screen) => void
  role: Role
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ screen, onNav, role, collapsed, onToggle }: SidebarProps) {
  const filtered = NAV_ITEMS.filter(n => n.roles.includes(role))

  return (
    <aside style={{
      width: collapsed ? 58 : 230, minWidth: collapsed ? 58 : 230,
      background: '#1E3A5F',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease, min-width 0.2s ease',
      overflow: 'hidden',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 14px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#3B82F6,#60A5FA)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {Icon.drone}
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1.2 }}>SmartDrone</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em' }}>DELIVERY</div>
          </div>
        )}
        <button onClick={onToggle} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4, flexShrink: 0, display: 'flex' }}>
          {Icon.menu}
        </button>
      </div>

      <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {filtered.map((item, i) => {
          const showSection = item.section !== undefined && !collapsed
          const prevSection = i > 0 ? filtered[i - 1].section : undefined
          const sectionChanged = item.section !== undefined && item.section !== prevSection
          return (
            <div key={item.screen}>
              {showSection && sectionChanged && item.section && (
                <div className="sidebar-section-label">{item.section}</div>
              )}
              <div
                className={`sidebar-item ${screen === item.screen ? 'active' : ''}`}
                onClick={() => onNav(item.screen)}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Role indicator */}
      {!collapsed && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>VAI TRÒ</div>
          <RoleBadge role={role} />
        </div>
      )}
    </aside>
  )
}
export default Sidebar
