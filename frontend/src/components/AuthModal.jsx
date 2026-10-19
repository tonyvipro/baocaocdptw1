import React, { useState } from 'react';
import { 
  Mail, Lock, Eye, EyeOff, User, Phone, CheckCircle2, 
  XCircle, X, ArrowRight, ShieldCheck, Sparkles, AlertTriangle 
} from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Status Modal popup (Hình 7 & Hình 8)
  const [statusModal, setStatusModal] = useState(null); // { type: 'success' | 'error', title: '', message: '' }

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    remember: true
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser({
        email: formData.email,
        password: formData.password,
        remember: formData.remember
      });

      setStatusModal({
        type: 'success',
        title: 'Đăng Nhập Thành Công',
        message: `Chào mừng bạn quay trở lại, ${res.user.name}!`
      });

      setTimeout(() => {
        setStatusModal(null);
        onAuthSuccess(res.user, res.token);
        onClose();
      }, 1200);

    } catch (err) {
      setStatusModal({
        type: 'error',
        title: 'Lỗi Đăng Nhập',
        message: err.message || 'Email hoặc mật khẩu không chính xác!'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      setStatusModal({
        type: 'error',
        title: 'Lỗi Xác Thực',
        message: 'Mật khẩu xác nhận không trùng khớp! Vui lòng nhập lại.'
      });
      return;
    }

    if (formData.password.length < 8) {
      setStatusModal({
        type: 'error',
        title: 'Mật Khẩu Quá Ngắn',
        message: 'Mật khẩu phải chứa ít nhất 8 ký tự.'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        password_confirmation: formData.password_confirmation
      });

      // Hình 7: Khi Đăng ký thành công
      setStatusModal({
        type: 'success',
        title: 'Đăng Ký Thành Công',
        message: res.message || 'Tài khoản của bạn đã được tạo thành công!'
      });

      setTimeout(() => {
        setStatusModal(null);
        onAuthSuccess(res.user);
        onClose();
      }, 1500);

    } catch (err) {
      // Hình 8: Đăng ký bị lỗi
      setStatusModal({
        type: 'error',
        title: 'Lỗi Hệ Thống',
        message: err.message || 'Đã xảy ra lỗi trong quá trình xử lý, vui lòng thử lại sau.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn">
      {/* Modal Card */}
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
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-600 text-white mb-2 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold uppercase tracking-wider">
            {mode === 'login' ? 'ĐĂNG NHẬP HỆ THỐNG' : 'ĐĂNG KÝ TÀI KHOẢN'}
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            {mode === 'login' 
              ? 'Nhập email và mật khẩu của bạn để tiếp tục.' 
              : 'Đăng ký tài khoản để lưu tin và nhận tư vấn trực tiếp.'}
          </p>

          {/* Tab Switcher */}
          <div className="mt-4 flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => { setMode('login'); setStatusModal(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                mode === 'login' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setStatusModal(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                mode === 'register' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Đăng Ký Mới
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {mode === 'login' ? (
            /* ================= FORM ĐĂNG NHẬP ================= */
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Đăng Nhập
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Mật Khẩu
                  </label>
                  <button 
                    type="button" 
                    onClick={() => alert('Vui lòng liên hệ Hotline 1900 6868 hoặc quản trị viên để đặt lại mật khẩu.')}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold hover:underline"
                  >
                    Quên Mật Khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                    className="w-3.5 h-3.5 rounded text-red-600 focus:ring-red-600 border-slate-300"
                  />
                  <span className="text-xs text-slate-600">Ghi nhớ đăng nhập</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loading ? 'Đang Đăng Nhập...' : 'ĐĂNG NHẬP NGAY'}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setStatusModal(null); }}
                    className="font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                  >
                    Đăng ký tài khoản mới
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* ================= FORM ĐĂNG KÝ (Hình 6) ================= */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Họ và tên đầy đủ:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Vui lòng nhập họ và tên của bạn"
                    className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Vui lòng nhập địa chỉ email của bạn"
                    className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Số điện thoại:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Vui lòng nhập số điện thoại"
                    className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mật khẩu:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Vui lòng nhập mật khẩu (ít nhất 8 ký tự)"
                    className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Mật khẩu phải chứa ít nhất 8 ký tự</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Xác nhận mật khẩu:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="password_confirmation"
                    required
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    placeholder="Vui lòng nhập lại mật khẩu"
                    className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loading ? 'Đang Xử Lý...' : 'ĐĂNG KÝ TÀI KHOẢN'}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setStatusModal(null); }}
                    className="font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                  >
                    Đăng nhập ngay
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Status Modal Overlay */}
        {statusModal && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
            {statusModal.type === 'success' ? (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800">{statusModal.title}</h4>
                <p className="text-xs text-slate-600 max-w-xs">{statusModal.message}</p>
                <div className="pt-2">
                  <button
                    onClick={() => setStatusModal(null)}
                    className="px-6 py-2 rounded-lg bg-slate-900 text-white font-bold text-xs uppercase hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Xác Nhận
                  </button>
                </div>
              </div>
            ) : (
              /* Hình 8: Đăng ký bị lỗi */
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-inner">
                  <XCircle className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-extrabold text-rose-700">{statusModal.title}</h4>
                <p className="text-xs text-slate-600 max-w-xs">{statusModal.message}</p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setStatusModal(null)}
                    className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md hover:bg-rose-700 transition-all"
                  >
                    Thử lại
                  </button>
                  <button
                    onClick={() => { setStatusModal(null); onClose(); }}
                    className="px-5 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-300 transition-all"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
