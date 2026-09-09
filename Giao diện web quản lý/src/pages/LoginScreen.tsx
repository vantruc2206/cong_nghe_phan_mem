import { useState } from 'react'
import * as API from '../api'
import { Role } from '../types'

// Maps vai_tro (role name from backend) to frontend Role type
function mapRole(user?: API.UserInfo | any, vaiTro?: string): Role {
  const v = (typeof vaiTro === 'string' && vaiTro ? vaiTro : (typeof user?.vai_tro === 'string' ? user.vai_tro : user?.vai_tro?.ten_vai_tro || '')).toLowerCase()
  const email = (user?.email || '').toLowerCase()
  if (v.includes('admin') || v.includes('quản trị') || email.includes('admin') || email === 'ivantruc@gmail.com') return 'admin'
  if (v.includes('dispatch') || v.includes('điều phối')) return 'dispatcher'
  if (v.includes('operator') || v.includes('vận hành')) return 'operator'
  if (v.includes('manager') || v.includes('quản lý')) return 'manager'
  return 'admin'
}

interface LoginScreenProps {
  onLogin: (role: Role, user: API.UserInfo) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await API.login(email, password)
      API.setToken(res.token)
      localStorage.setItem('sdd_user', JSON.stringify(res.user))
      const vaiTroName = typeof res.user.vai_tro === 'object' ? (res.user.vai_tro as any)?.ten_vai_tro : res.user.vai_tro
      const role = mapRole(res.user, vaiTroName)
      onLogin(role, res.user)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định'
      setError(`MSG-004: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg,#1E3A5F 0%,#254872 60%,#1a3250 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.1) 0%, transparent 50%)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 20, padding: '40px 40px', width: '100%', maxWidth: 420, boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#1E3A5F,#3B82F6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>
            <svg viewBox="0 0 24 24" fill="white" style={{width:28,height:28}}><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM4 4H2v4h2V6h2V4H4zm16 0h-2v2h2v2h2V4h-2zm-2 16h2v-4h-2v2h-2v2h2zm-14 0h2v-2H4v-2H2v4h2z"/></svg>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#1E3A5F' }}>SmartDroneDelivery</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Hệ thống quản lý giao hàng bằng Drone</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</label>
          <input className="input" type="email" placeholder="email@smartdrone.vn" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Mật khẩu</label>
          <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, marginTop: 8, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <div style={{ marginTop: 18, padding: '10px 14px', background: '#FFF7ED', borderRadius: 8, fontSize: 11, color: '#92400E', borderLeft: '3px solid #F97316' }}>
          ⚡ Đăng nhập bằng tài khoản thật từ database. Backend phải đang chạy tại <b>localhost:9999</b>.
        </div>
      </div>
    </div>
  )
}
export default LoginScreen
