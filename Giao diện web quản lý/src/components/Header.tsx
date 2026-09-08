import { useState, useRef, useEffect } from 'react'
import { Screen, Role } from '../types'
import { Icon } from './Icons'
import { RoleBadge } from './Badges'
import { getBaseUrl } from '../api'

interface HeaderProps {
  screen: Screen
  role: Role
  onLogout: () => void
}

interface NotificationItem {
  id: string
  title: string
  time: string
  unread: boolean
  type: 'order' | 'drone' | 'system'
}

export function Header({ screen, role, onLogout }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  
  // Profile fields state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [originalEmail, setOriginalEmail] = useState('')
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Password fields state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwMsg, setPwMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [pwLoading, setPwLoading] = useState(false)

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', title: 'Đơn hàng VD-2a8095a5 đang chờ phê duyệt', time: '5 phút trước', unread: true, type: 'order' },
    { id: '2', title: 'Drone DR-03 đã cập nhật vị trí trạm Q.1', time: '12 phút trước', unread: true, type: 'drone' },
    { id: '3', title: 'Trạm Hạ Cánh Q.1 hoạt động bình thường', time: '1 giờ trước', unread: false, type: 'system' },
  ])

  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Load real user data from localStorage (saved at login time)
  function getStoredUser() {
    try {
      const stored = localStorage.getItem('sdd_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  }

  const storedUser = getStoredUser()
  const fallbackName = { admin: 'Trần Quốc Bảo', dispatcher: 'Lê Văn Cường', operator: 'Nguyễn Thị Dung', manager: 'Phạm Minh Hiếu' }[role]
  const fallbackEmail = `${role}@smartdrone.vn`
  const fallbackPhone = { admin: '0901 234 567', dispatcher: '0908 765 432', operator: '0912 345 678', manager: '0933 111 222' }[role]

  // Current display name & email
  const [displayName, setDisplayName] = useState(storedUser?.ho_ten || fallbackName)
  const [displayEmail, setDisplayEmail] = useState(storedUser?.email || fallbackEmail)

  useEffect(() => {
    const u = getStoredUser()
    setFullName(u?.ho_ten || fallbackName)
    setPhone(u?.so_dien_thoai || fallbackPhone)
    setEmail(u?.email || fallbackEmail)
    setOriginalEmail(u?.email || fallbackEmail)
    setDisplayName(u?.ho_ten || fallbackName)
    setDisplayEmail(u?.email || fallbackEmail)
  }, [role])

  const unreadCount = notifications.filter(n => n.unread).length

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch real pending orders from Database for live notifications
  useEffect(() => {
    import('../api').then(({ listOrders }) => {
      listOrders().then(orders => {
        const pending = orders.filter(o => o.trang_thai === 'Chờ duyệt' || o.trang_thai === 'pending')
        if (pending.length > 0) {
          const notifs: NotificationItem[] = pending.map((o, idx) => ({
            id: o.ma_don_hang || `notif-${idx}`,
            title: `Đơn hàng ${o.ma_van_don || o.ma_don_hang} của ${o.ten_nguoi_nhan || o.ten_khach_hang || 'khách hàng'} đang CHỜ PHÊ DUYỆT`,
            time: 'Mới cập nhật từ CSDL',
            unread: true,
            type: 'order'
          }))
          setNotifications(notifs)
        }
      }).catch(() => {})
    })
  }, [])

  const labels: Record<Screen, string> = {
    login: 'Đăng nhập',
    dashboard: 'Tổng quan',
    orders: 'Quản lý đơn hàng',
    'order-detail': 'Chi tiết đơn hàng',
    scheduling: 'Lập lịch giao hàng',
    failed: 'Xử lý thất bại',
    'station-ops': 'Vận hành trạm',
    tracking: 'Theo dõi giao hàng',
    stations: 'Quản lý trạm hạ cánh',
    drones: 'Quản lý Fleet Drone',
    reports: 'Báo cáo & Thống kê',
    'ai-eta': 'AI & Phân tích ETA',
    users: 'Quản lý người dùng',
    'activity-log': 'Nhật ký hoạt động',
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg(null)
    if (!fullName.trim()) {
      setProfileMsg({ text: 'Họ và tên không được để trống.', type: 'error' })
      return
    }
    if (!email.trim()) {
      setProfileMsg({ text: 'Email không được để trống.', type: 'error' })
      return
    }

    setProfileLoading(true)
    try {
      const res = await fetch(`${getBaseUrl()}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: originalEmail,
          new_email: email,
          ho_ten: fullName,
          so_dien_thoai: phone,
        })
      })
      const data = await res.json()
      if (res.ok) {
        setProfileMsg({ text: data.message || 'Cập nhật thông tin thành công!', type: 'success' })
        setDisplayName(fullName)
        setDisplayEmail(email)
        setOriginalEmail(email)
        try {
          const stored = localStorage.getItem('sdd_user')
          const uObj = stored ? JSON.parse(stored) : {}
          localStorage.setItem('sdd_user', JSON.stringify({
            ...uObj,
            ho_ten: fullName,
            email: email,
            so_dien_thoai: phone,
          }))
        } catch {}
      } else {
        setProfileMsg({ text: data.error || 'Lỗi cập nhật thông tin', type: 'error' })
      }
    } catch {
      setProfileMsg({ text: 'Không thể kết nối đến máy chủ backend.', type: 'error' })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    if (!currentPw || !newPw || !confirmPw) {
      setPwMsg({ text: 'Vui lòng điền đầy đủ các trường mật khẩu.', type: 'error' })
      return
    }
    if (newPw !== confirmPw) {
      setPwMsg({ text: 'Mật khẩu mới và xác nhận mật khẩu không khớp.', type: 'error' })
      return
    }
    if (newPw.length < 6) {
      setPwMsg({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự.', type: 'error' })
      return
    }

    setPwLoading(true)
    try {
      const res = await fetch(`${getBaseUrl()}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: originalEmail,
          current_password: currentPw,
          new_password: newPw,
        })
      })
      const data = await res.json()
      if (res.ok) {
        setPwMsg({ text: data.message || 'Đổi mật khẩu thành công!', type: 'success' })
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
      } else {
        setPwMsg({ text: data.error || 'Lỗi đổi mật khẩu', type: 'error' })
      }
    } catch {
      setPwMsg({ text: 'Không thể kết nối đến máy chủ backend.', type: 'error' })
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <header style={{
      background: 'white', borderBottom: '1px solid #f1f5f9',
      padding: '0 24px', height: 56,
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 1 }}>SmartDroneDelivery</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: '#1e293b' }}>{labels[screen]}</div>
      </div>

      {/* Notification Bell Dropdown */}
      <div style={{ position: 'relative' }} ref={notifRef}>
        <button
          onClick={() => {
            setShowNotifications(!showNotifications)
            setShowUserMenu(false)
          }}
          style={{
            position: 'relative', background: showNotifications ? '#f1f5f9' : 'none',
            border: 'none', cursor: 'pointer', color: '#64748b', padding: 8, borderRadius: 8, display: 'flex',
            transition: 'background 0.2s',
          }}
          title="Thông báo hệ thống"
        >
          {Icon.bell}
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: 6, width: 8, height: 8,
              background: '#EF4444', borderRadius: '50%', border: '1.5px solid white'
            }} />
          )}
        </button>

        {showNotifications && (
          <div style={{
            position: 'absolute', right: 0, top: 44, width: 320, background: 'white',
            borderRadius: 12, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0', padding: 12, zIndex: 100,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontWeight: 650, fontSize: 14, color: '#1e293b' }}>Thông báo</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
              {notifications.map(n => (
                <div key={n.id} style={{
                  padding: '8px 10px', borderRadius: 8, background: n.unread ? '#EFF6FF' : '#f8fafc',
                  border: n.unread ? '1px solid #BFDBFE' : '1px solid #f1f5f9', fontSize: 12,
                }}>
                  <div style={{ color: '#1e293b', fontWeight: n.unread ? 600 : 400, lineHeight: 1.3 }}>{n.title}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{n.time}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Avatar Dropdown */}
      <div style={{ position: 'relative' }} ref={userMenuRef}>
        <div
          onClick={() => {
            setShowUserMenu(!showUserMenu)
            setShowNotifications(false)
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, background: showUserMenu ? '#f1f5f9' : 'transparent', transition: 'background 0.2s' }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#3B82F6,#60A5FA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)',
          }}>
            {displayName?.[0] || 'U'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.2 }}>{displayName}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}><RoleBadge role={role} /></div>
          </div>
        </div>

        {showUserMenu && (
          <div style={{
            position: 'absolute', right: 0, top: 48, width: 220, background: 'white',
            borderRadius: 12, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0', padding: 8, zIndex: 100,
          }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{displayName}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Hệ thống Quản trị v1.0</div>
            </div>

            <button
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', fontSize: 13, color: '#334155' }}
              onClick={() => { setShowUserMenu(false); setShowProfileModal(true); }}
            >
              👤 Hồ sơ & Cài đặt
            </button>

            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 4, paddingTop: 4 }}>
              <button
                onClick={() => { setShowUserMenu(false); onLogout(); }}
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', fontSize: 13, color: '#EF4444' }}
              >
                {Icon.logout} <span style={{ marginLeft: 6 }}>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Profile & Password Change Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, padding: 24,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#3b82f6)',
                  color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                }}>
                  {displayName?.[0] || 'U'}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Hồ sơ tài khoản</h3>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{displayEmail}</span>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: activeTab === 'profile' ? '#EFF6FF' : 'transparent',
                  color: activeTab === 'profile' ? '#2563eb' : '#64748b',
                }}
              >
                👤 Thông tin cá nhân
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('password')}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: activeTab === 'password' ? '#EFF6FF' : 'transparent',
                  color: activeTab === 'password' ? '#2563eb' : '#64748b',
                }}
              >
                🔒 Đổi mật khẩu
              </button>
            </div>

            {/* TAB 1: Profile Edit Form */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {profileMsg && (
                  <div style={{
                    padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: profileMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    color: profileMsg.type === 'success' ? '#065F46' : '#991B1B',
                    border: profileMsg.type === 'success' ? '1px solid #A7F3D0' : '1px solid #FECACA',
                  }}>
                    {profileMsg.text}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4, fontWeight: 550 }}>Họ và tên</label>
                  <input
                    type="text"
                    className="input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4, fontWeight: 550 }}>Số điện thoại</label>
                  <input
                    type="text"
                    className="input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0901 234 567..."
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4, fontWeight: 550 }}>Email tài khoản</label>
                  <input
                    type="email"
                    className="input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@smartdrone.vn..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Vai trò: </span>
                    <RoleBadge role={role} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowProfileModal(false)}
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={profileLoading}
                    >
                      {profileLoading ? 'Đang lưu...' : 'Lưu thông tin'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: Password Change Form */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pwMsg && (
                  <div style={{
                    padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: pwMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    color: pwMsg.type === 'success' ? '#065F46' : '#991B1B',
                    border: pwMsg.type === 'success' ? '1px solid #A7F3D0' : '1px solid #FECACA',
                  }}>
                    {pwMsg.text}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4, fontWeight: 550 }}>Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    className="input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4, fontWeight: 550 }}>Mật khẩu mới</label>
                  <input
                    type="password"
                    className="input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="Nhập ít nhất 6 ký tự..."
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4, fontWeight: 550 }}>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    className="input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowProfileModal(false)}
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={pwLoading}
                  >
                    {pwLoading ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
export default Header
