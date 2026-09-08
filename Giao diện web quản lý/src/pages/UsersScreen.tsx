import { useEffect, useState } from 'react'
import { listUsers, createUserApi, updateUserApi, deleteUserApi, UserInfo } from '../api'
import { Icon } from '../components/Icons'
import { RoleBadge } from '../components/Badges'

interface UsersScreenProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

function formatDate(raw?: string): string {
  if (!raw) return '—'
  try {
    const d = new Date(String(raw).replace(' ', 'T'))
    if (isNaN(d.getTime())) return '—'
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
  } catch {
    return '—'
  }
}

export function UsersScreen({ showToast }: UsersScreenProps) {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Modal states
  const [showAdd, setShowAdd] = useState(false)
  const [editUser, setEditUser] = useState<UserInfo | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('dispatcher')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await listUsers()
      setUsers(data || [])
    } catch (err) {
      console.error('Lỗi tải người dùng:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const openAddModal = () => {
    setName('')
    setEmail('')
    setRole('dispatcher')
    setPhone('')
    setPassword('')
    setShowAdd(true)
  }

  const openEditModal = (u: UserInfo) => {
    const rawRole = typeof u.vai_tro === 'object' ? (u.vai_tro as any)?.ten_vai_tro : u.vai_tro
    const roleKey = (rawRole || 'dispatcher').toLowerCase()
    
    setEditUser(u)
    setName(u.ho_ten || '')
    setEmail(u.email || '')
    setPhone((u as any).so_dien_thoai || '')
    setPassword('')
    setRole(roleKey.includes('admin') ? 'admin' : roleKey.includes('dispatch') ? 'dispatcher' : roleKey.includes('operator') ? 'operator' : roleKey.includes('manager') ? 'manager' : 'customer')
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return
    setSubmitting(true)
    try {
      await createUserApi({
        ho_ten: name,
        email: email,
        vai_tro: role,
        mat_khau: password || '123456',
        so_dien_thoai: phone,
      })
      setShowAdd(false)
      showToast(`Đã thêm mới tài khoản vào Database: ${name} (${email})`, 'success')
      await loadUsers()
    } catch (err: any) {
      showToast(err.message || 'Lỗi thêm mới tài khoản', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser || !name || !email) return
    setSubmitting(true)
    try {
      await updateUserApi(editUser.ma_nguoi_dung, {
        ho_ten: name,
        email: email,
        vai_tro: role,
        so_dien_thoai: phone,
        mat_khau: password || undefined,
      })
      setEditUser(null)
      showToast(`Đã cập nhật thông tin tài khoản Database thành công: ${name}`, 'success')
      await loadUsers()
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật tài khoản', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (u: UserInfo) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${u.ho_ten}" (${u.email}) khỏi Database?`)) return
    try {
      await deleteUserApi(u.ma_nguoi_dung)
      showToast(`Đã xóa tài khoản "${u.ho_ten}" khỏi Database`, 'success')
      await loadUsers()
    } catch (err: any) {
      showToast(err.message || 'Lỗi xóa tài khoản', 'error')
    }
  }

  const filtered = users.filter(u =>
    (u.ho_ten || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{Icon.search}</span>
          <input className="input" style={{ paddingLeft: 34 }} placeholder="Tìm thành viên, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-outline" onClick={loadUsers}>Làm mới</button>
        <button className="btn btn-primary" onClick={openAddModal}>{Icon.plus} Đăng ký thành viên</button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Đang tải danh sách tài khoản từ Database...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Không có tài khoản phù hợp trong Database</div>
        ) : (
          <table className="data-table">
            <thead><tr>
              <th>Mã</th><th>Thành viên</th><th>Địa chỉ Email</th><th>Vai trò</th><th>Ngày tạo</th><th>Hành động</th>
            </tr></thead>
            <tbody>
              {filtered.map(u => {
                const rawRole = typeof u.vai_tro === 'object' ? (u.vai_tro as any)?.ten_vai_tro : u.vai_tro
                const roleKey = (rawRole || 'Customer').toLowerCase().trim()
                const dateStr = formatDate(u.created_at || (u as any).ngay_tao)

                return (
                  <tr key={u.ma_nguoi_dung}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#64748b' }}>#{u.ma_nguoi_dung}</span></td>
                    <td style={{ fontWeight: 550, color: '#1e293b' }}>{u.ho_ten}</td>
                    <td style={{ color: '#64748b', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{u.email}</td>
                    <td><RoleBadge role={roleKey} /></td>
                    <td style={{ color: '#64748b', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{dateStr}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" title="Chỉnh sửa tài khoản" onClick={() => openEditModal(u)}>{Icon.edit}</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} title="Xóa tài khoản" onClick={() => handleDelete(u)}>{Icon.trash}</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '24px 20px', width: '100%', maxWidth: 420, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#1e293b', marginBottom: 12 }}>Đăng ký tài khoản hệ thống (Database)</h3>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>Họ và tên *</label>
                <input className="input" placeholder="Ví dụ: Nguyễn Văn A..." value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>Email *</label>
                <input className="input" type="email" placeholder="example@smartdrone.vn" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>Số điện thoại</label>
                <input className="input" placeholder="0987654321..." value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>Mật khẩu (mặc định 123456)</label>
                <input className="input" type="password" placeholder="Nhập mật khẩu..." value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>Phân vai trò</label>
                <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="dispatcher">Dispatcher (Điều phối viên)</option>
                  <option value="operator">Station Operator (Vận hành trạm)</option>
                  <option value="manager">Logistics Manager (Quản lý hệ thống)</option>
                  <option value="admin">Admin (Quản trị viên)</option>
                  <option value="customer">Khách hàng (Customer)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button className="btn btn-outline btn-sm" type="button" onClick={() => setShowAdd(false)}>Hủy</button>
                <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>
                  {submitting ? 'Đang lưu CSDL...' : 'Đăng ký thành viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '24px 20px', width: '100%', maxWidth: 420, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#1e293b', marginBottom: 12 }}>Chỉnh sửa tài khoản #{editUser.ma_nguoi_dung}</h3>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>Họ và tên *</label>
                <input className="input" placeholder="Ví dụ: Nguyễn Văn A..." value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>Email *</label>
                <input className="input" type="email" placeholder="example@smartdrone.vn" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>Số điện thoại</label>
                <input className="input" placeholder="0987654321..." value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>Mật khẩu mới (bỏ trống nếu giữ nguyên)</label>
                <input className="input" type="password" placeholder="Nhập mật khẩu mới..." value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 605, color: '#374151', marginBottom: 4 }}>Phân vai trò</label>
                <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="dispatcher">Dispatcher (Điều phối viên)</option>
                  <option value="operator">Station Operator (Vận hành trạm)</option>
                  <option value="manager">Logistics Manager (Quản lý hệ thống)</option>
                  <option value="admin">Admin (Quản trị viên)</option>
                  <option value="customer">Khách hàng (Customer)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button className="btn btn-outline btn-sm" type="button" onClick={() => setEditUser(null)}>Hủy</button>
                <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>
                  {submitting ? 'Đang cập nhật CSDL...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default UsersScreen
