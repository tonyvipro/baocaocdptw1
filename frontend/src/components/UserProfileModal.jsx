import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle, X } from 'lucide-react';
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
      setStatusMessage({ type: 'success', text: 'Cập nhật thông tin hồ sơ thành công!' });
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
      setStatusMessage({ type: 'success', text: 'Đổi mật khẩu tài khoản thành công!' });
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Lỗi đổi mật khẩu.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-slate-900 px-6 pt-6 pb-4 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700 uppercase tracking-wider">
              {currentUser.role || 'Thành viên'}
            </span>
          </div>
          <h3 className="text-base font-bold uppercase tracking-wider">
            {activeTab === 'profile' ? 'CẬP NHẬT HỒ SƠ' : 'QUẢN LÝ MẬT KHẨU'}
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            {activeTab === 'profile' ? 'Quản lý thông tin tài khoản cá nhân' : 'Vui lòng nhập mật khẩu mới.'}
          </p>

          {/* Tab Switcher */}
          <div className="mt-4 flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => { setActiveTab('profile'); setStatusMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                activeTab === 'profile' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Hồ Sơ Cá Nhân
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('password'); setStatusMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                activeTab === 'password' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Đổi Mật Khẩu
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className={`mx-6 mt-3.5 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          {activeTab === 'profile' ? (
            <form onSubmit={handleUpdateProfile} className="space-y-3.5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Họ & Tên:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Nhập họ và tên"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email (Cố định):
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={currentUser.email || ''}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 text-slate-500 border border-slate-200 rounded-lg cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Số Điện Thoại:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="09xx xxx xxx"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Đang Lưu...' : 'LƯU THAY ĐỔI'}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('password')}
                    className="text-red-600 font-semibold hover:underline cursor-pointer"
                  >
                    Đổi Mật Khẩu?
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Đóng lại
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 text-center">
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                >
                  Đăng xuất khỏi hệ thống
                </button>
              </div>

            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mật Khẩu Hiện Tại:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                    className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Xác Nhận Mật Khẩu Mới:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    required
                    value={passwordForm.password_confirmation}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Đang Cập Nhật...' : 'CẬP NHẬT MẬT KHẨU'}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="text-red-600 font-semibold hover:underline cursor-pointer"
                  >
                    Đóng lại
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
