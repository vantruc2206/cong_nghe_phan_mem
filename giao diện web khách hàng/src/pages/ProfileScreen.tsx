import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Save, KeyRound } from 'lucide-react';
import { UserProfile } from '../types';
import { updateUserProfileApi, changePasswordApi } from '../api';

interface ProfileScreenProps {
  user: UserProfile | null;
  onUpdateProfile: (updated: UserProfile) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onUpdateProfile, showToast }) => {
  const [fullName, setFullName] = useState(user?.ho_ten || '');
  const [phone, setPhone] = useState(user?.so_dien_thoai || '');
  const [address, setAddress] = useState(user?.dia_chi || 'Quận 1, TP. Hồ Chí Minh');
  const [saving, setSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setSaving(true);
    try {
      const updated = await updateUserProfileApi({
        email: user.email,
        ho_ten: fullName,
        so_dien_thoai: phone,
        dia_chi: address,
      });
      onUpdateProfile(updated);
      showToast('Cập nhật hồ sơ cá nhân thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật hồ sơ cá nhân', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !currentPw || !newPw) {
      showToast('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới', 'error');
      return;
    }
    setChangingPw(true);
    try {
      await changePasswordApi({
        email: user.email,
        current_password: currentPw,
        new_password: newPw,
      });
      showToast('Đổi mật khẩu mới thành công!', 'success');
      setCurrentPw('');
      setNewPw('');
    } catch (err: any) {
      showToast(err.message || 'Mật khẩu hiện tại không chính xác', 'error');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-2 px-1 sm:px-3 animate-fade-up space-y-4">
      {/* User Info Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        
        <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#00B14F] flex items-center justify-center font-extrabold text-lg border border-emerald-200 flex-shrink-0">
            {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900">{fullName || user?.email || 'Hồ Sơ Khách Hàng'}</h1>
            <p className="text-[11px] text-slate-500">Vai trò: <span className="text-[#00B14F] font-bold">{user?.vai_tro || 'KHACH_HANG'}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="input-label" style={{ fontSize: 12, marginBottom: 4 }}>Họ và tên</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="input-field"
                style={{ paddingLeft: 36, fontSize: 12, paddingTop: 8, paddingBottom: 8 }}
              />
            </div>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: 12, marginBottom: 4 }}>Địa chỉ Email (Cố định tài khoản)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200"
                style={{ paddingLeft: 36, fontSize: 12 }}
              />
            </div>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: 12, marginBottom: 4 }}>Số điện thoại liên hệ</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 36, fontSize: 12 }}
              />
            </div>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: 12, marginBottom: 4 }}>Địa chỉ nhận hàng mặc định</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 36, fontSize: 12 }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full py-2.5 text-xs rounded-xl"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu Thay Đổi Hồ Sơ'}
          </button>
        </form>

      </div>

      {/* Change Password Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#00B14F]" /> Đổi Mật Khẩu
        </h3>

        <form onSubmit={handleChangePw} className="space-y-3">
          <div>
            <label className="input-label" style={{ fontSize: 12, marginBottom: 4 }}>Mật khẩu hiện tại</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
              required
              className="input-field"
              style={{ fontSize: 12, padding: '8px 12px' }}
            />
          </div>

          <div>
            <label className="input-label" style={{ fontSize: 12, marginBottom: 4 }}>Mật khẩu mới</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="••••••••"
              required
              className="input-field"
              style={{ fontSize: 12, padding: '8px 12px' }}
            />
          </div>

          <button
            type="submit"
            disabled={changingPw}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all"
          >
            {changingPw ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

