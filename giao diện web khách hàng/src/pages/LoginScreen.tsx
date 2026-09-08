import React, { useState } from 'react';
import { loginCustomerApi, registerCustomerApi } from '../api';
import { UserProfile } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, showToast }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { showToast('Điền đầy đủ Email và Mật khẩu', 'error'); return; }
    setLoading(true);
    try {
      if (isRegister) {
        if (!fullName || !phone) { showToast('Điền đầy đủ Họ tên và SĐT', 'error'); setLoading(false); return; }
        const u = await registerCustomerApi({ ho_ten: fullName, email, so_dien_thoai: phone, mat_khau: password });
        showToast('Đăng ký thành công! Đã đăng nhập.', 'success');
        onLoginSuccess(u);
      } else {
        const u = await loginCustomerApi(email, password);
        showToast(`Chào mừng ${u.ho_ten || u.email}! 🎉`, 'success');
        onLoginSuccess(u);
      }
    } catch (err: any) {
      showToast(err.message || 'Đăng nhập không thành công. Trí vui lòng kiểm tra lại email/mật khẩu', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100svh',
      background: 'linear-gradient(160deg, #00B14F 0%, #009140 35%, #FFFFFF 35%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top green area */}
      <div style={{ padding: '48px 24px 80px', color: 'white' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🚁</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>SmartDrone</h1>
        <p style={{ fontSize: 14, opacity: 0.85 }}>Giao hàng nhanh bằng Drone tự động</p>
      </div>

      {/* White card */}
      <div style={{
        flex: 1,
        background: 'white',
        borderRadius: '24px 24px 0 0',
        marginTop: -40,
        padding: '32px 24px 40px',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.1)',
      }}>
        {/* Tab */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: '#F3F4F6', borderRadius: 12, padding: 4 }}>
          {['Đăng nhập', 'Đăng ký'].map((label, i) => (
            <button
              key={label}
              onClick={() => setIsRegister(i === 1)}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: (i === 1) === isRegister ? 'white' : 'transparent',
                color: (i === 1) === isRegister ? '#111827' : '#9CA3AF',
                fontWeight: 700, fontSize: 14,
                boxShadow: (i === 1) === isRegister ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isRegister && (
            <>
              <div>
                <label className="input-label">Họ và tên</label>
                <input className="input-field" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="input-label">Số điện thoại</label>
                <input className="input-field" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901 234 567" />
              </div>
            </>
          )}

          <div>
            <label className="input-label">Email</label>
            <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required />
          </div>

          <div>
            <label className="input-label">Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-field"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9CA3AF',
                }}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: 8, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '⏳ Đang xử lý...' : isRegister ? '🚀 Tạo tài khoản' : '✓ Đăng nhập'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 24 }}>
          Bằng cách đăng nhập, bạn đồng ý với{' '}
          <span style={{ color: '#00B14F', fontWeight: 600 }}>Điều khoản sử dụng</span>{' '}
          của SmartDrone
        </p>
      </div>
    </div>
  );
};
