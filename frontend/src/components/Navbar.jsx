import React, { useState, useEffect } from 'react';
import { 
  Building2, Heart, SlidersHorizontal, Phone, Database, 
  User, LogIn, UserPlus, LogOut, ChevronDown, PlusCircle,
  MapPin, Clock
} from 'lucide-react';
import { triggerDatabaseMigration } from '../services/api';

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
  onLogout,
  recentCount = 0,
  openRecent,
  onOpenAdmin,
  onOpenPostProperty,
  onOpenUserListings
}) {
  const [migrating, setMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

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
    <header className="sticky top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Utility Bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-red-500" />
              <span>Hotline 24/7: <strong className="text-white">1900 6868</strong> (Miễn phí)</span>
            </span>
            <span className="hidden md:flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Khu vực hỗ trợ: TP. Hồ Chí Minh & Hà Nội</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Laravel DB Status */}
            <button
              onClick={handleRunMigration}
              disabled={migrating}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
              title="Đồng bộ dữ liệu với Laravel Backend"
            >
              <Database className={`w-3 h-3 ${migrating ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
              <span>{migrating ? 'Đang đồng bộ...' : 'Kết nối Backend'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${dataSource === 'backend' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Dự án môn học CDPTW1</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo Brand */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none" 
            onClick={() => { setActiveTab('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">3TV</span>
                <span className="text-xl font-extrabold text-red-600 tracking-tight">LAND</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium -mt-1 tracking-wider uppercase">Sàn Giao Dịch Bất Động Sản</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-md text-sm font-semibold transition-colors ${
                activeTab === 'all' 
                  ? 'text-red-600 bg-red-50/80 font-bold' 
                  : 'text-slate-700 hover:text-red-600 hover:bg-slate-50'
              }`}
            >
              Tất Cả Nhà Đất
            </button>
            <button
              onClick={() => setActiveTab('sale')}
              className={`px-3.5 py-2 rounded-md text-sm font-semibold transition-colors ${
                activeTab === 'sale' 
                  ? 'text-red-600 bg-red-50/80 font-bold' 
                  : 'text-slate-700 hover:text-red-600 hover:bg-slate-50'
              }`}
            >
              Nhà Đất Bán
            </button>
            <button
              onClick={() => setActiveTab('rent')}
              className={`px-3.5 py-2 rounded-md text-sm font-semibold transition-colors ${
                activeTab === 'rent' 
                  ? 'text-red-600 bg-red-50/80 font-bold' 
                  : 'text-slate-700 hover:text-red-600 hover:bg-slate-50'
              }`}
            >
              Nhà Đất Cho Thuê
            </button>
          </nav>

          {/* Action Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Recent Viewed */}
            {openRecent && (
              <button
                onClick={openRecent}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
                title="Bất động sản đã xem gần đây"
              >
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Đã xem</span>
                {recentCount > 0 && (
                  <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {recentCount}
                  </span>
                )}
              </button>
            )}

            {/* Compare Button */}
            {compareCount > 0 && (
              <button
                onClick={openCompare}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">So sánh</span>
                <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {compareCount}
                </span>
              </button>
            )}

            {/* Favorites Button */}
            <button
              onClick={openFavorites}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-700 hover:text-red-600 hover:bg-red-50/50 text-xs font-semibold transition-colors"
              title="Tin đăng đã lưu"
            >
              <Heart className={`w-4 h-4 ${favoriteCount > 0 ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Đã lưu</span>
              {favoriteCount > 0 && (
                <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {favoriteCount}
                </span>
              )}
            </button>

            {/* Post Property Button (Standard real estate portal action) */}
            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth('login');
                } else {
                  if (onOpenPostProperty) onOpenPostProperty();
                }
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Đăng Tin</span>
            </button>

            {/* User Profile / Auth Area */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 text-xs font-semibold transition-colors border border-slate-200"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                  <span className="hidden sm:inline text-slate-800 font-bold max-w-[100px] truncate">
                    {currentUser.name || currentUser.username}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                    <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50">
                      <p className="font-bold text-slate-900 truncate">{currentUser.name || currentUser.username}</p>
                      <p className="text-slate-500 truncate text-[11px]">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Thông tin tài khoản</span>
                    </button>

                    {currentUser && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onOpenUserListings) onOpenUserListings();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>Quản lý tin đăng</span>
                      </button>
                    )}

                    {currentUser && (currentUser.role_id === 1 || currentUser.role_id === 2) && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onOpenAdmin) onOpenAdmin();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <Database className="w-4 h-4 text-slate-400" />
                        <span>{currentUser.role_id === 1 ? 'Trang hệ thống' : 'Quản lý lịch hẹn'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 border-t border-slate-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 rounded-md text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  Đăng ký
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Migration Notification */}
      {migrationStatus && (
        <div className={`py-1.5 px-4 text-xs font-semibold text-center text-white ${
          migrationStatus.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {migrationStatus.message}
        </div>
      )}
    </header>
  );
}
