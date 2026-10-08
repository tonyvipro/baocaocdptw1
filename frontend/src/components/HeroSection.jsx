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

        {/* Real Estate Search Box (Glassmorphism Effect) */}
        <div className="bg-white/85 backdrop-blur-2xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-4 sm:p-6 text-slate-800 border border-white">
          {/* Purpose Tab Bar */}
          <div className="flex items-center gap-1 pb-3 mb-3 border-b border-slate-100 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'all' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setActiveTab('sale')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'sale' 
                  ? 'bg-red-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-red-600 hover:bg-slate-100'
              }`}
            >
              Nhà Đất Bán
            </button>
            <button
              onClick={() => setActiveTab('rent')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'rent' 
                  ? 'bg-red-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-red-600 hover:bg-slate-100'
              }`}
            >
              Nhà Đất Cho Thuê
            </button>
          </div>

          {/* Search Inputs Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            
            {/* Input Keyword */}
            <div className="lg:col-span-4">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Từ Khóa / Dự Án / Địa Chỉ
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Nhập tên dự án, đường, mã căn..."
                  className="w-full pl-9 pr-3 py-2.5 bg-white text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
                />
              </div>
            </div>

            {/* Select Project */}
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Dự Án Trọng Điểm
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full pl-9 pr-7 py-2.5 bg-white text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all text-slate-800 shadow-sm"
                >
                  <option value="all">Tất cả dự án</option>
                  {projectsList.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Select City / Region */}
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Khu Vực / Tỉnh Thành
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-9 pr-7 py-2.5 bg-white text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all text-slate-800 shadow-sm"
                >
                  <option value="all">Toàn quốc</option>
                  {citiesList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Submit Action */}
            <div className="lg:col-span-2">
              <button
                onClick={() => {
                  const element = document.getElementById('listing-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Tìm Kiếm ({totalResults})</span>
              </button>
            </div>

          </div>

          {/* Quick Trending Searches */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" /> Tìm kiếm phổ biến:
            </span>
            {trendingTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchKeyword(tag)}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors text-[11px]"
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
