import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Camera, Lock, Eye, EyeOff, CheckCircle2, XCircle, X, Shield, ArrowLeft } from 'lucide-react';
import { updateProfile, changePassword } from '../services/api';

export default function UserProfileModal({ isOpen, onClose, currentUser, onUserUpdated, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

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
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        avatar: currentUser.avatar || '',
      });
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await updateProfile(profileForm);
      setStatusMessage({ type: 'success', text: 'Lưu thông tin hồ sơ thành công!' });
      if (onUserUpdated) onUserUpdated(res.user);
      setTimeout(() => setStatusMessage(null), 3000);
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

    setLoading(true);
    setStatusMessage(null);
    try {
      await changePassword(passwordForm);
      setStatusMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      setTimeout(() => {
        setStatusMessage(null);
        setActiveTab('profile');
      }, 2000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Đổi mật khẩu thất bại!' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 px-8 pt-7 pb-6 text-white text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 uppercase tracking-wider">
              {currentUser.role || 'Thành viên'}
            </span>
          </div>
          <h3 className="text-xl font-black uppercase tracking-wider">
            {activeTab === 'profile' ? 'CẬP NHẬT HỒ SƠ' : 'QUẢN LÝ MẬT KHẨU'}
          </h3>
          <p className="text-slate-300 text-xs mt-1">
            {activeTab === 'profile' ? 'Quản lý ảnh đại diện và thông tin của bạn' : 'Vui lòng nhập mật khẩu mới.'}
          </p>

          {/* Tab Switcher */}
          <div className="mt-5 flex bg-black/30 p-1 rounded-xl backdrop-blur-sm border border-white/10">
            <button
              type="button"
              onClick={() => { setActiveTab('profile'); setStatusMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'profile' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Hồ Sơ Cá Nhân
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('password'); setStatusMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'password' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Đổi Mật Khẩu
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-7">
          {activeTab === 'profile' ? (
            /* ================= HÌNH 9: CẬP NHẬT HỒ SƠ ================= */
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              
              {/* Avatar Section */}
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="relative group">
                  <img
                    src={profileForm.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border-4 border-emerald-100 shadow-md"
                  />
                  <label className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 text-white rounded-full cursor-pointer hover:bg-emerald-700 shadow transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfileForm(prev => ({ ...prev, avatar: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <span className="text-xs text-slate-500 mt-2 font-medium">Đổi ảnh đại diện</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Họ và Tên:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email (Không đổi):
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={currentUser.email || ''}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Số Điện Thoại:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="09xx xxx xxx"
                    className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {loading ? 'ĐANG LƯU...' : 'LƯU HỒ SƠ'}
                </button>

                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('password')}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Đổi Mật Khẩu?
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    Quay lại
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 text-center">
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
                >
                  Đăng xuất tài khoản
                </button>
              </div>

            </form>
          ) : (
            /* ================= HÌNH 10: QUẢN LÝ MẬT KHẨU ================= */
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mật Khẩu Hiện Tại:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mật Khẩu Mới:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                    className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nhập Lại Mật Khẩu Mới:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    required
                    value={passwordForm.password_confirmation}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {loading ? 'ĐANG CẬP NHẬT...' : 'CẬP NHẬT MẬT KHẨU'}
                </button>

                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    Hủy bỏ?
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Quay lại
                  </button>
                </div>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
