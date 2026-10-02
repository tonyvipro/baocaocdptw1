import React, { useState, useEffect } from 'react';
import { Home, Search, Heart, SlidersHorizontal, PhoneCall, Building2, MapPin, Database, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
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
  onRefreshData
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);

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
      setMigrationStatus({ type: 'success', message: `Migrate & Seed thành công! (${res.property_count || 'N/A'} BĐS)` });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setMigrationStatus({ type: 'error', message: err.message || 'Lỗi kết nối Laravel Backend' });
    } finally {
      setMigrating(false);
      setTimeout(() => setMigrationStatus(null), 5000);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'glass-panel shadow-lg shadow-emerald-950/5 py-3' : 'bg-white/95 backdrop-blur-md py-4 border-b border-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900">3TV</span>
                <span className="text-2xl font-extrabold text-emerald-600">Land</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase tracking-wider ml-1">ReactJS</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium -mt-1 tracking-wide">Báo Cáo Chuyên Đề Phát Triển Web 1</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'all' 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Tất Cả Nhà Đất
            </button>
            <button
              onClick={() => setActiveTab('rent')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'rent' 
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Cho Thuê Căn Hộ
            </button>
            <button
              onClick={() => setActiveTab('sale')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'sale' 
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Mua Bán Bất Động Sản
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Backend Sync Indicator */}
            <button
              onClick={handleRunMigration}
              disabled={migrating}
              title="Đồng bộ CSDL Backend Laravel (migrate:fresh & seed)"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/70 text-xs font-semibold transition-all"
            >
              <Database className={`w-3.5 h-3.5 ${migrating ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
              <span>{migrating ? 'Đang Seed...' : 'Backend DB'}</span>
              <span className={`w-2 h-2 rounded-full ${dataSource === 'backend' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-amber-400'}`} />
            </button>

            {/* Compare Button */}
            {compareCount > 0 && (
              <button
                onClick={openCompare}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/70 text-xs font-semibold transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>So sánh ({compareCount})</span>
              </button>
            )}

            {/* Favorites Button */}
            <button
              onClick={openFavorites}
              className="relative p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60 transition-all"
              title="Danh sách yêu thích"
            >
              <Heart className="w-5 h-5 fill-rose-500/20" />
              {favoriteCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center shadow-md animate-bounce">
                  {favoriteCount}
                </span>
              )}
            </button>

            {/* Contact Hotline */}
            <button
              onClick={() => openContactModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PhoneCall className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">Tư Vấn Miễn Phí</span>
            </button>
          </div>

        </div>

        {/* Migration Status Toast */}
        {migrationStatus && (
          <div className={`mt-3 py-2 px-4 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
            migrationStatus.type === 'success' 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {migrationStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
            <span>{migrationStatus.message}</span>
          </div>
        )}

      </div>
    </header>
  );
}
