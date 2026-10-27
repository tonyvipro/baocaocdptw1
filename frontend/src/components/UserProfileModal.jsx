import { useConfirm } from './forms/ConfirmProvider';
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Eye, EyeOff, CheckCircle2, XCircle, Lock, User, Phone, ShieldCheck, Save, X } from 'lucide-react';
import { updateProfile, changePassword, resolveAvatarUrl, getMe } from '../services/api';

export default function UserProfileModal({ isOpen, onClose, currentUser, onUserUpdated, onLogout }) {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  
  const fileInputRef = useRef(null);

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    avatar: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setRevision(null);
    setStatusMessage(null);
    setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
    getMe().then(response => {
      if (!active) return;
      if (!response?.user) throw new Error('Vui lòng đăng nhập lại.');
      const user = response.user;
      setProfileForm({ name: user.name || '', phone: user.phone || '', avatar: user.avatar || '' });
      setRevision(user.version);
    }).catch(error => { if (active) setStatusMessage({ type: 'error', text: error.message || 'Không thể tải hồ sơ.' }); });
    return () => { active = false; };
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    // Ràng buộc số điện thoại 10 - 11 số
    if (profileForm.phone) {
      const phoneDigits = profileForm.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        setStatusMessage({ type: 'error', text: 'Số điện thoại phải từ 10 đến 11 chữ số (ví dụ: 0901234567).' });
        return;
      }
    }

    if (true && !(await confirm({ title: 'Xác nhận cập nhật', message: "Lưu các thay đổi trong hồ sơ của bạn?" }))) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const payload = {
        ...profileForm,
        version: revision,
        user_id: currentUser?.id,
        email: currentUser?.email,
      };
      const res = await updateProfile(payload);
      setRevision(res.user?.version);
      setStatusMessage({ type: 'success', text: 'Cập nhật thông tin hồ sơ thành công!' });
      if (onUserUpdated && res?.user) onUserUpdated(res.user);
      import('../services/tabSync').then(({ broadcastDataChange }) => {
        broadcastDataChange({ entity: 'profile', action: 'update', user: res?.user, timestamp: Date.now() });
      }).catch(() => {});
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Lỗi cập nhật hồ sơ.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.password_confirmation) {
      setStatusMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
      return;
    }
    if (passwordForm.password.length < 8) {
      setStatusMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
      return;
    }

    if (true && !(await confirm({ title: 'Xác nhận cập nhật', message: "Xác nhận đổi mật khẩu tài khoản của bạn?" }))) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      const payload = {
        ...passwordForm,
        version: revision,
        user_id: currentUser?.id,
        email: currentUser?.email,
      };
      const response = await changePassword(payload);
      setRevision(response.version);
      setStatusMessage({ type: 'success', text: 'Đổi mật khẩu tài khoản thành công!' });
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      setTimeout(() => {
        setStatusMessage(null);
        setActiveTab('profile');
      }, 2000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Lỗi đổi mật khẩu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Nén ảnh đại diện trước khi lưu (Client-side Compression)
  const compressImage = (file, maxWidth = 320, maxHeight = 320, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Nén thành JPEG chất lượng 0.85: siêu nhẹ (~20KB - 35KB)
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(event.target.result);
        img.src = event.target.result;
      };
      reader.onerror = () => {
        const directReader = new FileReader();
        directReader.onloadend = () => resolve(directReader.result);
        directReader.readAsDataURL(file);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressedBase64 = await compressImage(file, 320, 320, 0.85);
        setProfileForm(prev => ({ ...prev, avatar: compressedBase64 }));
      } catch (err) {
        console.warn('Compress error', err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  return (
    <div className="app-dialog-layer fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="account-dialog-title" className="form-surface giang-dialog giang-profile w-full">
        <header className="giang-dialog-heading flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/15 bg-white/5"><ShieldCheck size={23} /></span>
            <div><div className="giang-eyebrow">3TV LAND / TÀI KHOẢN</div>
              <h2 id="account-dialog-title">{activeTab === 'profile' ? 'Hồ sơ cá nhân' : 'Bảo mật tài khoản'}</h2>
              <p className="mt-1 text-xs">Cập nhật thông tin và quản lý tài khoản của bạn.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng hồ sơ cá nhân" className="shrink-0 p-2"><X size={18} /></button>
        </header>
        <nav className="giang-profile-tabs" aria-label="Thông tin tài khoản">
          <button type="button" aria-pressed={activeTab === 'profile'} onClick={() => setActiveTab('profile')} className="inline-flex items-center gap-2"><User size={15} />Hồ sơ cá nhân</button>
          <button type="button" aria-pressed={activeTab === 'password'} onClick={() => setActiveTab('password')} className="inline-flex items-center gap-2"><Lock size={15} />Đổi mật khẩu</button>
        </nav>
        <div className="giang-dialog-body p-5 sm:p-6">
          {statusMessage && <div role={statusMessage.type === 'error' ? 'alert' : 'status'} className={'mb-5 flex items-start gap-2 border p-3 text-sm ' + (statusMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800')}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <XCircle size={18} className="shrink-0" />}{statusMessage.text}
          </div>}
          {activeTab === 'profile' ? <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="flex flex-wrap items-center gap-4 border border-slate-200 bg-white p-4">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} aria-label="Chọn ảnh đại diện" />
              <button type="button" onClick={handleAvatarClick} disabled={isCompressing} aria-label="Đổi ảnh đại diện" className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-slate-100 text-slate-500">
                {isCompressing ? <span className="text-xs">Đang nén...</span> : profileForm.avatar ? <img src={resolveAvatarUrl(profileForm.avatar)} alt="Ảnh đại diện" className="h-full w-full object-cover" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <Camera size={28} />}
                <span className="absolute bottom-0 right-0 bg-slate-900 p-1 text-white"><Camera size={13} /></span>
              </button>
              <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold text-slate-800">{profileForm.name || 'Ảnh đại diện'}</p><p className="mt-1 text-xs leading-5 text-slate-500">Chọn ảnh rõ nét để mọi người dễ nhận ra bạn.</p>
                <button type="button" disabled={isCompressing} onClick={handleAvatarClick} className="mt-2 text-xs font-semibold text-red-700 hover:underline">{isCompressing ? 'Đang xử lý ảnh...' : 'Thay đổi ảnh'}</button>
              </div>
            </div>
            <section className="giang-form-section">
              <h3 className="giang-form-section-title"><User size={17} />Thông tin liên hệ</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="giang-profile-field"><span>Họ và tên <span className="text-red-600">*</span></span><input type="text" autoComplete="name" required maxLength={250} value={profileForm.name} onChange={event => setProfileForm({ ...profileForm, name: event.target.value.slice(0, 250) })} placeholder="Nhập họ và tên" /></label>
                <label className="giang-profile-field"><span>Số điện thoại</span><input type="tel" autoComplete="tel" inputMode="numeric" pattern="[0-9]{10,11}" maxLength={11} value={profileForm.phone} onChange={event => setProfileForm({ ...profileForm, phone: event.target.value.replace(/\D/g, '').slice(0, 11) })} placeholder="10–11 chữ số" /></label>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-slate-500">Thông tin liên hệ giúp bạn nhận tư vấn và các cập nhật từ 3TV LAND.</p>
            </section>
            <footer className="flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button type="button" onClick={onClose} className="border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600">Đóng</button>
              <button type="submit" disabled={loading || revision == null || isCompressing} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm"><Save size={16} />{loading ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
            </footer>
          </form> : <form onSubmit={handleChangePassword} className="space-y-5">
            <div className="flex items-start gap-3 border border-slate-200 bg-white p-4"><Lock size={20} className="shrink-0 text-red-700" /><div><p className="text-sm font-semibold text-slate-800">Tăng cường bảo mật</p><p className="mt-1 text-xs leading-5 text-slate-500">Mật khẩu mới từ 8–32 ký tự. Hãy chọn mật khẩu riêng cho tài khoản này.</p></div></div>
            <section className="giang-form-section space-y-4">
              {[
                ['current_password', 'Mật khẩu hiện tại', showCurrentPw, setShowCurrentPw],
                ['password', 'Mật khẩu mới', showNewPw, setShowNewPw],
                ['password_confirmation', 'Xác nhận mật khẩu mới', showConfirmPw, setShowConfirmPw],
              ].map(([name, label, visible, setVisible]) => <label key={name} className="giang-profile-field"><span>{label} <span className="text-red-600">*</span></span>
                <span className="relative block"><input type={visible ? 'text' : 'password'} autoComplete={name === 'current_password' ? 'current-password' : 'new-password'} required minLength={name === 'current_password' ? undefined : 8} maxLength={name === 'current_password' ? 250 : 32} value={passwordForm[name]} onChange={event => setPasswordForm({ ...passwordForm, [name]: event.target.value.slice(0, name === 'current_password' ? 250 : 32) })} placeholder={label} style={{ paddingRight: '3rem' }} />
                  <button type="button" aria-label={(visible ? 'Ẩn ' : 'Hiện ') + label.toLowerCase()} onClick={() => setVisible(!visible)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </span>
              </label>)}
            </section>
            <footer className="flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button type="button" onClick={() => setActiveTab('profile')} className="border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600">Quay lại</button>
              <button type="submit" disabled={loading || revision == null} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm"><Lock size={16} />{loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</button>
            </footer>
          </form>}
        </div>
      </section>
    </div>
  );
}
