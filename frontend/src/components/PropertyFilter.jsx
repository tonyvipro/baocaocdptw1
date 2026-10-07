import React from 'react';
import { LayoutGrid, List, Map, RotateCcw, ChevronDown, SlidersHorizontal } from 'lucide-react';

export default function PropertyFilter({
  selectedDeveloper,
  setSelectedDeveloper,
  developersList,
  selectedType,
  setSelectedType,
  typesList,
  selectedBedrooms,
  setSelectedBedrooms,
  selectedPriceRange,
  setSelectedPriceRange,
  selectedAreaRange,
  setSelectedAreaRange,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  resetFilters,
}) {
  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Filter Dropdowns List */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Loại BĐS */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="pl-3 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-600 appearance-none cursor-pointer transition-colors"
            >
              <option value="all">Loại nhà đất: Tất cả</option>
              {typesList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Mức Giá */}
          <div className="relative">
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="pl-3 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-600 appearance-none cursor-pointer transition-colors"
            >
              <option value="all">Mức giá: Tất cả</option>
              <option value="under-3b">Dưới 3 Tỷ</option>
              <option value="3b-6b">3 - 6 Tỷ</option>
              <option value="6b-15b">6 - 15 Tỷ</option>
              <option value="15b-30b">15 - 30 Tỷ</option>
              <option value="above-30b">Trên 30 Tỷ</option>
              <option value="rent-under-15m">Thuê: Dưới 15 Tr</option>
              <option value="rent-15m-30m">Thuê: 15 - 30 Tr</option>
              <option value="rent-above-30m">Thuê: Trên 30 Tr</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Diện Tích */}
          <div className="relative">
            <select
              value={selectedAreaRange}
              onChange={(e) => setSelectedAreaRange(e.target.value)}
              className="pl-3 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-600 appearance-none cursor-pointer transition-colors"
            >
              <option value="all">Diện tích: Tất cả</option>
              <option value="under-50">Dưới 50 m²</option>
              <option value="50-80">50 - 80 m²</option>
              <option value="80-120">80 - 120 m²</option>
              <option value="120-200">120 - 200 m²</option>
              <option value="above-200">Trên 200 m²</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Phòng Ngủ */}
          <div className="relative">
            <select
              value={selectedBedrooms}
              onChange={(e) => setSelectedBedrooms(e.target.value)}
              className="pl-3 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-600 appearance-none cursor-pointer transition-colors"
            >
              <option value="all">Số phòng ngủ: Tất cả</option>
              <option value="1">1 Phòng ngủ</option>
              <option value="2">2 Phòng ngủ</option>
              <option value="3">3 Phòng ngủ</option>
              <option value="4">4+ Phòng ngủ</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Chủ Đầu Tư */}
          <div className="relative">
            <select
              value={selectedDeveloper}
              onChange={(e) => setSelectedDeveloper(e.target.value)}
              className="pl-3 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-600 appearance-none cursor-pointer transition-colors"
            >
              <option value="all">Chủ đầu tư: Tất cả</option>
              {developersList.map((dev) => (
                <option key={dev} value={dev}>{dev}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
            title="Xóa bộ lọc về mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đặt lại</span>
          </button>

        </div>

        {/* Sort & View Mode Tools */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          
          {/* Sắp xếp */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium whitespace-nowrap">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-1.5 pl-2.5 pr-6 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 cursor-pointer"
            >
              <option value="default">Phổ biến nhất</option>
              <option value="newest">Mới đăng nhất</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
              <option value="area-asc">Diện tích: Nhỏ đến Lớn</option>
              <option value="area-desc">Diện tích: Lớn đến Nhỏ</option>
            </select>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-bold transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-bold transition-colors ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem dạng danh sách"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-md text-xs font-bold transition-colors ${
                viewMode === 'map' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem trên bản đồ"
            >
              <Map className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
