import React, { useState, useEffect, useRef } from 'react';
import { Camera, Eye, EyeOff, CheckCircle2, XCircle, Lock, User, Phone, Sparkles } from 'lucide-react';
import { updateProfile, changePassword } from '../services/api';

export default function UserProfileModal({ isOpen, onClose, currentUser, onUserUpdated, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
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
  
  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
             setProfileForm({ ...profileForm, avatar: reader.result });
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14161a]/80 backdrop-blur-sm animate-fadeIn transition-all duration-300">
      <div className="relative w-full max-w-[700px] bg-[#22252a] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-10 overflow-hidden font-sans">
        
        {/* Status Toast */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-semibold flex items-center gap-3 shadow-sm transform transition-all duration-300 ${
            statusMessage.type === 'success' 
              ? 'bg-[#1b2f21] text-[#a7d3a6] border border-[#2d5236]' 
              : 'bg-[#3b1c1c] text-[#d99090] border border-[#6b3131]'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[#a7d3a6]" /> : <XCircle className="w-5 h-5 text-[#d99090]" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {activeTab === 'profile' ? (
          <form onSubmit={handleUpdateProfile} className="flex flex-col">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*"
                 onChange={handleFileChange}
              />
              <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden bg-transparent border border-[#c3a275] shadow-[0_0_20px_rgba(195,162,117,0.15)] transition-transform duration-300 group-hover:scale-105">
                  {profileForm.avatar && profileForm.avatar.startsWith('data:') ? (
                      <img src={profileForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                      <Camera className="w-8 h-8 text-[#c3a275]" strokeWidth={1.5} />
                  )}
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleAvatarClick}
                className="mt-3 text-[14px] font-medium text-[#c3a275] hover:text-[#e0c298] transition-colors"
              >
                Đổi ảnh
              </button>
            </div>

            {/* Header Text */}
            <div className="text-center mb-10">
              <h2 className="text-[28px] md:text-[32px] font-medium tracking-wide text-[#c3a275] mb-2 uppercase">Cập nhật hồ sơ</h2>
              <p className="text-[15px] text-[#8c9096] font-light">Quản lý ảnh đại diện và thông tin của bạn</p>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
              <div className="relative group flex items-center bg-[#181a1f] border border-[#c3a275]/50 focus-within:border-[#c3a275] rounded-xl px-4 py-3.5 transition-colors">
                <User className="w-5 h-5 text-[#8c9096] group-focus-within:text-[#c3a275] transition-colors mr-3" strokeWidth={1.5} />
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Nguyễn Quản Trị (Admin)"
                  className="w-full bg-transparent text-[15px] text-[#e4e4e4] placeholder-[#8c9096] focus:outline-none"
                />
              </div>
              <div className="relative group flex items-center bg-[#181a1f] border border-[#c3a275]/50 focus-within:border-[#c3a275] rounded-xl px-4 py-3.5 transition-colors">
                <Phone className="w-5 h-5 text-[#8c9096] group-focus-within:text-[#c3a275] transition-colors mr-3" strokeWidth={1.5} />
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="0901234567"
                  className="w-full bg-transparent text-[15px] text-[#e4e4e4] placeholder-[#8c9096] focus:outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:flex-[2.5] py-4 px-8 rounded-xl bg-[#9a141b] hover:bg-[#b91c24] text-white font-bold text-[15px] uppercase shadow-[0_10px_35px_-5px_rgba(154,20,27,0.8)] transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     Đang Lưu...
                  </span>
                ) : 'LƯU HỒ SƠ'}
              </button>
              
              <div className="w-full md:flex-[1.5] flex justify-center md:justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('password')}
                  className="text-[15px] font-semibold text-[#c3a275] hover:text-[#e0c298] transition-colors whitespace-nowrap"
                >
                  Đổi Mật Khẩu?
                </button>
              </div>
            </div>

          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="flex flex-col">
            <div className="text-center mb-10">
              <h2 className="text-[28px] md:text-[32px] font-medium tracking-wide text-[#c3a275] mb-2 uppercase">ĐỔI MẬT KHẨU</h2>
              <p className="text-[15px] text-[#8c9096] font-light">Bảo vệ tài khoản với một mật khẩu an toàn</p>
            </div>

            <div className="space-y-5 mb-10">
              <div className="relative group flex items-center bg-[#181a1f] border border-[#c3a275]/50 focus-within:border-[#c3a275] rounded-xl px-4 py-3.5 transition-colors">
                <Lock className="w-5 h-5 text-[#8c9096] group-focus-within:text-[#c3a275] transition-colors mr-3" strokeWidth={1.5} />
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  required
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  placeholder="Mật khẩu hiện tại"
                  className="w-full bg-transparent text-[15px] text-[#e4e4e4] placeholder-[#8c9096] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="text-[#8c9096] hover:text-[#c3a275] transition-colors ml-2"
                >
                  {showCurrentPw ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
                </button>
              </div>

              <div className="relative group flex items-center bg-[#181a1f] border border-[#c3a275]/50 focus-within:border-[#c3a275] rounded-xl px-4 py-3.5 transition-colors">
                <Lock className="w-5 h-5 text-[#8c9096] group-focus-within:text-[#c3a275] transition-colors mr-3" strokeWidth={1.5} />
                <input
                  type={showNewPw ? 'text' : 'password'}
                  required
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  placeholder="Mật khẩu mới (Tối thiểu 8 ký tự)"
                  className="w-full bg-transparent text-[15px] text-[#e4e4e4] placeholder-[#8c9096] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="text-[#8c9096] hover:text-[#c3a275] transition-colors ml-2"
                >
                  {showNewPw ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
                </button>
              </div>

              <div className="relative group flex items-center bg-[#181a1f] border border-[#c3a275]/50 focus-within:border-[#c3a275] rounded-xl px-4 py-3.5 transition-colors">
                <Lock className="w-5 h-5 text-[#8c9096] group-focus-within:text-[#c3a275] transition-colors mr-3" strokeWidth={1.5} />
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  required
                  value={passwordForm.password_confirmation}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                  placeholder="Xác nhận mật khẩu mới"
                  className="w-full bg-transparent text-[15px] text-[#e4e4e4] placeholder-[#8c9096] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="text-[#8c9096] hover:text-[#c3a275] transition-colors ml-2"
                >
                  {showConfirmPw ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-8 mb-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-8 rounded-xl bg-[#9a141b] hover:bg-[#b91c24] text-white font-bold text-[15px] uppercase shadow-[0_10px_35px_-5px_rgba(154,20,27,0.8)] transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                   <span className="flex items-center justify-center gap-2">
                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     Đang Cập Nhật...
                  </span>
                ) : 'CẬP NHẬT MẬT KHẨU'}
              </button>
            </div>
          </form>
        )}

        {/* Bottom Section */}
        <div className="relative mt-8 pt-4 flex justify-center">
          <button
            type="button"
            onClick={activeTab === 'password' ? () => setActiveTab('profile') : onClose}
            className="text-[14px] text-[#8c9096] hover:text-[#c3a275] transition-colors cursor-pointer"
          >
            Quay lại
          </button>
          
        </div>

      </div>
    </div>
  );
}
