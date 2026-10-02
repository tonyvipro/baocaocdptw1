import React from 'react';
import { Search, MapPin, Building, DollarSign, Sparkles, Filter, CheckCircle } from 'lucide-react';

export default function HeroSection({
  searchKeyword,
  setSearchKeyword,
  selectedProject,
  setSelectedProject,
  selectedType,
  setSelectedType,
  selectedCity,
  setSelectedCity,
  activeTab,
  setActiveTab,
  projectsList,
  citiesList,
  typesList,
  totalResults
}) {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-6 tracking-wide backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>NỀN TẢNG BẤT ĐỘNG SẢN THẾ HỆ MỚI • 3TV REAL ESTATE</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none text-white mb-6">
            Nơi Khởi Đầu Của <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
              Tổ Ấm Hoàn Hảo & Thịnh Vượng
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Tra cứu hơn 1.000+ bất động sản cao cấp từ các chủ đầu tư danh tiếng: Vinhomes, Masterise Homes, Novaland, Khang Điền, Sun Group với thông tin chính xác 100%.
          </p>
        </div>

        {/* Floating Search Box */}
        <div className="max-w-5xl mx-auto bg-white/95 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-2xl shadow-emerald-950/40 border border-white/20 text-slate-800">
          
          {/* Quick Purpose Selector */}
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'all' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setActiveTab('rent')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'rent' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🏢 Căn Hộ Cho Thuê
            </button>
            <button
              onClick={() => setActiveTab('sale')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'sale' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🏡 Mua Bán Nhà Đất
            </button>
          </div>

          {/* Search Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            
            {/* Keyword input */}
            <div className="relative md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Từ Khóa / Tên Dự Án / Địa Chỉ</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Nhập Vinhomes, Landmark 81, Masteri..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Project dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dự Án Nổi Bật</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none transition-all"
                >
                  <option value="all">Tất cả dự án</option>
                  {projectsList.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* City dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Khu Vực / Tỉnh Thành</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none transition-all"
                >
                  <option value="all">Toàn quốc</option>
                  {citiesList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Search Summary & Quick Tags */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Tìm kiếm nhanh:</span>
              <button onClick={() => setSearchKeyword('Vinhomes Grand Park')} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Vinhomes Grand Park</button>
              <button onClick={() => setSearchKeyword('Landmark 81')} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Landmark 81</button>
              <button onClick={() => setSearchKeyword('Sun Group')} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Sun Group</button>
            </div>
            <div className="font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
              Tìm thấy <span className="font-bold text-slate-900">{totalResults}</span> bất động sản phù hợp
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
