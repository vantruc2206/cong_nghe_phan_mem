import { useState, useEffect } from 'react'
import * as API from './api'
import { Screen, Role, Toast } from './types'

// Share components
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ToastComp from './components/Toast'

// Page components
import LoginScreen from './pages/LoginScreen'
import DashboardScreen from './pages/DashboardScreen'
import OrdersScreen from './pages/OrdersScreen'
import OrderDetailScreen from './pages/OrderDetailScreen'
import SchedulingScreen from './pages/SchedulingScreen'
import FailedScreen from './pages/FailedScreen'
import StationOpsScreen from './pages/StationOpsScreen'
import TrackingScreen from './pages/TrackingScreen'
import DronesScreen from './pages/DronesScreen'
import StationsScreen from './pages/StationsScreen'
import ReportsScreen from './pages/ReportsScreen'
import AIEtaScreen from './pages/AIEtaScreen'
import UsersScreen from './pages/UsersScreen'


function mapRole(vaiTro?: string): Role {
  if (!vaiTro) return 'dispatcher'
  const v = vaiTro.toLowerCase()
  if (v.includes('admin') || v.includes('quản trị')) return 'admin'
  if (v.includes('dispatch') || v.includes('điều phối')) return 'dispatcher'
  if (v.includes('operator') || v.includes('vận hành')) return 'operator'
  if (v.includes('manager') || v.includes('quản lý')) return 'manager'
  return 'dispatcher'
}

export function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [role, setRole] = useState<Role>('dispatcher')
  const [currentUser, setCurrentUser] = useState<API.UserInfo | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined)

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type })
  }

  // Auto-login from localStorage token
  useEffect(() => {
    const token = localStorage.getItem('sdd_token') || ''
    const userStr = localStorage.getItem('sdd_user')
    if (token && userStr) {
      API.setToken(token)
      try {
        const u = JSON.parse(userStr) as API.UserInfo
        setCurrentUser(u)
        const vaiTro = typeof u.vai_tro === 'object' ? u.vai_tro?.ten_vai_tro : (u.vai_tro as string | undefined)
        const mapped = mapRole(vaiTro)
        setRole(mapped)
        setScreen(mapped === 'operator' ? 'station-ops' : 'dashboard')
      } catch {
        // ignore
      }
    }
  }, [])

  const handleLogin = (newRole: Role, user: API.UserInfo) => {
    setCurrentUser(user)
    setRole(newRole)
    setScreen(newRole === 'operator' ? 'station-ops' : 'dashboard')
    showToast(`Đăng nhập thành công! Chào mừng ${user.ho_ten}.`, 'success')
  }

  const handleLogout = () => {
    API.clearToken()
    setCurrentUser(null)
    setRole('dispatcher')
    setScreen('login')
  }

  const handleViewOrderDetail = (orderId?: string) => {
    setSelectedOrderId(orderId)
    setScreen('order-detail')
  }

  if (screen === 'login') {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F8FAFC' }}>
      <Sidebar
        screen={screen}
        onNav={setScreen}
        role={role}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header screen={screen} role={role} onLogout={handleLogout} />

        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {screen === 'dashboard'    && <DashboardScreen onNav={setScreen} />}
          {screen === 'orders'       && <OrdersScreen onDetail={handleViewOrderDetail} />}
          {screen === 'order-detail' && <OrderDetailScreen orderId={selectedOrderId} onBack={() => setScreen('orders')} onNav={setScreen} showToast={showToast} />}
          {screen === 'scheduling'   && <SchedulingScreen showToast={showToast} />}
          {screen === 'failed'       && <FailedScreen showToast={showToast} />}
          {screen === 'station-ops'  && <StationOpsScreen showToast={showToast} />}
          {screen === 'tracking'     && <TrackingScreen />}
          {screen === 'drones'       && <DronesScreen showToast={showToast} />}
          {screen === 'stations'     && <StationsScreen showToast={showToast} />}
          {screen === 'reports'      && <ReportsScreen />}
          {screen === 'ai-eta'       && <AIEtaScreen />}
          {screen === 'users'        && <UsersScreen showToast={showToast} />}
        </main>
      </div>

      {toast && <ToastComp toast={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
export default App
