import React from 'react';
import { SlidersHorizontal, ArrowUpDown, LayoutGrid, List, Map, RotateCcw } from 'lucide-react';

export default function PropertyFilter({
  selectedDeveloper,
  setSelectedDeveloper,
  developersList,
  selectedBedrooms,
  setSelectedBedrooms,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  resetFilters,
  priceRange,
  setPriceRange
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Developer Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Chủ đầu tư:</span>
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

          {/* Bedrooms Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Phòng ngủ:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {['all', '1', '2', '3', '4'].map((bed) => (
                <button
                  key={bed}
                  onClick={() => setSelectedBedrooms(bed)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedBedrooms === bed
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {bed === 'all' ? 'Tất cả' : `${bed} PN`}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="area-desc">Diện tích lớn nhất</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            title="Xóa tất cả bộ lọc"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>

        </div>

        {/* View Mode Toggle (Grid / List / Map) */}
        <div className="flex items-center gap-1 self-end lg:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Lưới</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
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
    </div>
  );
}
