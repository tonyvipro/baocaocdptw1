import React, { useState, useEffect } from 'react';
import { 
  Building2, Heart, SlidersHorizontal, PhoneCall, Database, 
  CheckCircle2, AlertCircle, User, LogIn, UserPlus, LogOut, Settings, ChevronDown 
} from 'lucide-react';
import { triggerDatabaseMigration, logoutUser } from '../services/api';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  favoriteCount, 
  openFavorites,
  compareCount,
  openCompare,
  openContactModal,
  dataSource,
  onRefreshData,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onLogout
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRunMigration = async () => {
    setMigrating(true);
    setMigrationStatus(null);
    try {
      const res = await triggerDatabaseMigration();
      setMigrationStatus({ 
        type: 'success', 
        message: `Đồng bộ CSDL thành công! (${res.stats?.properties || 0} BĐS, ${res.stats?.users || 0} Users, ${res.stats?.roles || 0} Roles)` 
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setMigrationStatus({ type: 'error', message: err.message || 'Lỗi kết nối Laravel Backend' });
    } finally {
      setMigrating(false);
      setTimeout(() => setMigrationStatus(null), 5000);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      isScrolled ? 'glass-panel shadow-lg shadow-emerald-950/5 py-2.5' : 'bg-white/95 backdrop-blur-md py-3.5 border-b border-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo & Subtitle theo Đề tài */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-800 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-slate-900">3TV</span>
                <span className="text-2xl font-black text-emerald-600">Land</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider ml-1">Nhóm F</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium -mt-1 tracking-wide">Hệ Thống Bất Động Sản Trực Tuyến</p>
            </div>
          </div>

          {/* Navigation Items (Spec Navbar) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all' 
                  ? 'bg-white text-emerald-800 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Trang Chủ / Tất Cả
            </button>
            <button
              onClick={() => setActiveTab('rent')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'rent' 
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Cho Thuê Nhà Đất
            </button>
            <button
              onClick={() => setActiveTab('sale')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'sale' 
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Mua Bán Bất Động Sản
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Backend Sync Button */}
            <button
              onClick={handleRunMigration}
              disabled={migrating}
              title="Đồng bộ CSDL Backend Laravel (Migrate & Seed 25 bảng nghiệp vụ)"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/70 text-xs font-semibold transition-all"
            >
              <Database className={`w-3.5 h-3.5 ${migrating ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
              <span className="hidden md:inline">{migrating ? 'Đang Seed...' : 'Database'}</span>
              <span className={`w-2 h-2 rounded-full ${dataSource === 'backend' ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-400'}`} />
            </button>

            {/* Compare Button */}
            {compareCount > 0 && (
              <button
                onClick={openCompare}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/70 text-xs font-bold transition-all"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>So sánh ({compareCount})</span>
              </button>
            )}

            {/* Favorites Button */}
            <button
              onClick={openFavorites}
              className="relative p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60 transition-all"
              title="Danh sách BĐS yêu thích (Hình 25)"
            >
              <Heart className="w-4 h-4 fill-rose-500/20" />
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                  {favoriteCount}
                </span>
              )}
            </button>

            {/* USER AUTHENTICATION SECTION (Spec Nhóm 1 & Hình 5, 6, 9, 10) */}
            {currentUser ? (
              /* User logged in */
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all text-left"
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt="avatar"
                    className="w-7 h-7 rounded-full object-cover border border-emerald-500"
                  />
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                      {currentUser.name}
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-600 block leading-tight">
                      {currentUser.role || 'Thành viên'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => { setUserDropdownOpen(false); onOpenProfile(); }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>Hồ Sơ & Mật Khẩu</span>
                    </button>

                    <button
                      onClick={() => { setUserDropdownOpen(false); onLogout(); }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Đăng Xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* User not logged in */
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/70 text-xs font-bold transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng Nhập</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Đăng Ký</span>
                </button>
              </div>
            )}

            {/* Contact Hotline Button */}
            <button
              onClick={() => openContactModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">Tư Vấn</span>
            </button>
          </div>

        </div>

        {/* Migration Status Toast */}
        {migrationStatus && (
          <div className={`mt-2.5 py-2 px-4 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
            migrationStatus.type === 'success' 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {migrationStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
            <span className="truncate">{migrationStatus.message}</span>
          </div>
        )}

      </div>
    </header>
  );
}
