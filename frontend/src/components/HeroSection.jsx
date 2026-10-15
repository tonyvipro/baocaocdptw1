import React from 'react';
import { Search, MapPin, Building, DollarSign, Maximize2, Tag, ArrowRight } from 'lucide-react';

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
  const trendingTags = [
    'Vinhomes Central Park',
    'Masteri Thảo Điền',
    'Landmark 81',
    'The Sun Avenue',
    'Safira Khang Điền'
  ];

  return (
    <section className="relative py-16 md:py-24 text-white overflow-hidden border-b border-slate-800">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-105"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
        Trình duyệt của bạn không hỗ trợ thẻ video.
      </video>
      
      {/* Overlay mờ để làm nổi bật nội dung (Chữ & Search Box) */}
      <div className="absolute inset-0 bg-slate-900/50 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-900/90" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title & Slogan */}
        <div className="max-w-3xl mb-10 drop-shadow-lg">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 leading-tight">
            Kênh Thông Tin Bất Động Sản & Nhà Đất Uy Tín
          </h1>
          <p className="text-slate-200 text-sm sm:text-lg font-medium drop-shadow-md">
            Tra cứu thông tin bất động sản, dự án căn hộ cao cấp, giá thuê & giá bán chính xác nhất từ chủ đầu tư.
          </p>
        </div>

        {/* Real Estate Search Box (Kính Trong Suốt Nhìn Rõ Video Nền) */}
        <div className="bg-black/15 hover:bg-black/20 backdrop-blur-[2px] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-4 sm:p-6 text-white border border-white/30 transition-all">
          {/* Purpose Tab Bar */}
          <div className="flex items-center gap-1.5 pb-3 mb-4 border-b border-white/15 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'all' 
                  ? 'bg-white/20 text-white shadow-sm border border-white/40' 
                  : 'bg-black/20 text-slate-200 hover:text-white hover:bg-black/40 border border-white/10'
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setActiveTab('sale')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'sale' 
                  ? 'bg-red-600/90 text-white shadow-md shadow-red-600/40 border border-red-400/40' 
                  : 'bg-black/20 text-slate-200 hover:text-red-400 hover:bg-black/40 border border-white/10'
              }`}
            >
              Nhà Đất Bán
            </button>
            <button
              onClick={() => setActiveTab('rent')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'rent' 
                  ? 'bg-red-600/90 text-white shadow-md shadow-red-600/40 border border-red-400/40' 
                  : 'bg-black/20 text-slate-200 hover:text-red-400 hover:bg-black/40 border border-white/10'
              }`}
            >
              Nhà Đất Cho Thuê
            </button>
          </div>

          {/* Search Inputs Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            
            {/* Input Keyword */}
            <div className="lg:col-span-4">
              <label className="block text-[11px] font-bold text-white uppercase mb-1 tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Từ Khóa / Dự Án / Địa Chỉ
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/80" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Nhập tên dự án, đường, mã căn..."
                  className="w-full pl-9 pr-3 py-2.5 bg-black/25 hover:bg-black/35 focus:bg-black/45 text-sm text-white placeholder:text-slate-200/70 border border-white/25 focus:border-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all shadow-inner backdrop-blur-[1px]"
                />
              </div>
            </div>

            {/* Select Project */}
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-white uppercase mb-1 tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Dự Án Trọng Điểm
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none" />
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-black/25 hover:bg-black/35 focus:bg-black/45 text-sm text-white border border-white/25 focus:border-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/40 appearance-none transition-all shadow-inner cursor-pointer backdrop-blur-[1px]"
                >
                  <option value="all" className="bg-slate-900 text-white">Tất cả dự án</option>
                  {projectsList.map((p) => (
                    <option key={p} value={p} className="bg-slate-900 text-white">{p}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/80 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Select City / Region */}
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-white uppercase mb-1 tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Khu Vực / Tỉnh Thành
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-black/25 hover:bg-black/35 focus:bg-black/45 text-sm text-white border border-white/25 focus:border-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/40 appearance-none transition-all shadow-inner cursor-pointer backdrop-blur-[1px]"
                >
                  <option value="all" className="bg-slate-900 text-white">Toàn quốc</option>
                  {citiesList.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/80 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Search Submit Action */}
            <div className="lg:col-span-2">
              <button
                onClick={() => {
                  const element = document.getElementById('listing-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/40 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Tìm Kiếm ({totalResults})</span>
              </button>
            </div>

          </div>

          {/* Quick Trending Searches */}
          <div className="mt-3.5 pt-3 border-t border-white/15 flex flex-wrap items-center gap-2 text-xs text-slate-200">
            <span className="font-semibold text-white flex items-center gap-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              <Tag className="w-3.5 h-3.5 text-white/80" /> Tìm kiếm phổ biến:
            </span>
            {trendingTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchKeyword(tag)}
                className="px-2.5 py-1 rounded-md bg-black/25 hover:bg-black/45 text-slate-100 hover:text-white border border-white/20 font-medium transition-all text-[11px]"
              >
                {tag}
              </button>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
