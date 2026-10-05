import React from 'react';
import { SlidersHorizontal, ArrowUpDown, LayoutGrid, List, Map, RotateCcw, DollarSign, Maximize, Home } from 'lucide-react';

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
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm mb-8 space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        
        {/* Main Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Loại BĐS Filter (Spec Hình 22) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-emerald-600" />
              Loại BĐS:
            </span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả loại hình</option>
              {typesList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Lọc Theo Giá (Spec Hình 20) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Khoảng Giá:
            </span>
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả mức giá</option>
              <option value="under-3b">Dưới 3 Tỷ</option>
              <option value="3b-6b">3 - 6 Tỷ</option>
              <option value="6b-15b">6 - 15 Tỷ</option>
              <option value="15b-30b">15 - 30 Tỷ</option>
              <option value="above-30b">Trên 30 Tỷ</option>
              <option value="rent-under-15m">Thuê: Dưới 15 Triệu</option>
              <option value="rent-15m-30m">Thuê: 15 - 30 Triệu</option>
              <option value="rent-above-30m">Thuê: Trên 30 Triệu</option>
            </select>
          </div>

          {/* Lọc Theo Diện Tích (Spec Hình 21) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5 text-emerald-600" />
              Diện Tích:
            </span>
            <select
              value={selectedAreaRange}
              onChange={(e) => setSelectedAreaRange(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả diện tích</option>
              <option value="under-50">Dưới 50 m²</option>
              <option value="50-80">50 - 80 m²</option>
              <option value="80-120">80 - 120 m²</option>
              <option value="120-200">120 - 200 m²</option>
              <option value="above-200">Trên 200 m²</option>
            </select>
          </div>

          {/* Developer Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Chủ Đầu Tư:</span>
            <select
              value={selectedDeveloper}
              onChange={(e) => setSelectedDeveloper(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả CĐT</option>
              {developersList.map((dev) => (
                <option key={dev} value={dev}>{dev}</option>
              ))}
            </select>
          </div>

        </div>

        {/* View Mode Toggle (Grid / List / Map) */}
        <div className="flex items-center gap-1 self-end lg:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Lưới</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Danh sách</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'map' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Bản đồ</span>
          </button>
        </div>

      </div>

      {/* Secondary Bar: Bedrooms, Sắp xếp (Hình 56) & Đặt lại */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Bedrooms Quick Select */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 uppercase">Số phòng ngủ:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['all', '1', '2', '3', '4'].map((bed) => (
              <button
                key={bed}
                onClick={() => setSelectedBedrooms(bed)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedBedrooms === bed
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {bed === 'all' ? 'Tất cả' : `${bed} PN`}
              </button>
            ))}
          </div>
        </div>

        {/* Sắp Xếp Theo Lựa Chọn (Spec Hình 56) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 uppercase flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
              Sắp xếp theo:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="default">Mặc định tiêu chuẩn</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
              <option value="area-asc">Diện tích: Nhỏ đến Lớn</option>
              <option value="area-desc">Diện tích: Lớn đến Nhỏ</option>
              <option value="newest">Ngày đăng: Mới nhất</option>
              <option value="oldest">Ngày đăng: Cũ nhất</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1.5 font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            title="Xóa tất cả bộ lọc"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>

      </div>
    </div>
  );
}
