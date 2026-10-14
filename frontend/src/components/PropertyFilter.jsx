import React, { useState } from 'react';
import { 
  DollarSign, Maximize2, Building2, ChevronDown, RotateCcw, 
  Search, ArrowUpDown, LayoutGrid, List, Map, Sparkles, X, 
  SlidersHorizontal, Check, Info
} from 'lucide-react';

export default function PropertyFilter({
  selectedType = 'all',
  setSelectedType = () => {},
  typesList = [],
  selectedPriceRange = 'all',
  setSelectedPriceRange = () => {},
  selectedAreaRange = 'all',
  setSelectedAreaRange = () => {},
  selectedDeveloper = 'all',
  setSelectedDeveloper = () => {},
  developersList = [],
  selectedBedrooms = 'all',
  setSelectedBedrooms = () => {},
  sortBy = 'default',
  setSortBy = () => {},
  viewMode = 'grid',
  setViewMode = () => {},
  resetFilters = () => {},
  totalResults = 0,
  activeTab = 'all', // 'all' | 'sale' | 'rent'
}) {
  // 1. State modal tự nhập khoảng giá tùy chỉnh (Custom Min - Max Price)
  const [showCustomPriceModal, setShowCustomPriceModal] = useState(false);
  const [customMinPrice, setCustomMinPrice] = useState('');
  const [customMaxPrice, setCustomMaxPrice] = useState('');
  const [customPriceUnit, setCustomPriceUnit] = useState('billion'); // 'billion' (Tỷ) | 'million' (Triệu)
  
  // 2. State modal tự nhập khoảng diện tích tùy chỉnh (Custom Min - Max Area)
  const [showCustomAreaModal, setShowCustomAreaModal] = useState(false);
  const [customMinArea, setCustomMinArea] = useState('');
  const [customMaxArea, setCustomMaxArea] = useState('');

  // 3. Tab chuyển đổi dải nút bấm nhanh giữa Giá và Diện Tích
  const [quickChipMode, setQuickChipMode] = useState('area'); // 'area' | 'price'

  // Thông báo tạm thời cho bộ lọc Loại BĐS chờ branch mới
  const [pendingNotice, setPendingNotice] = useState(null);

  const showNotice = (msg) => {
    setPendingNotice(msg);
    setTimeout(() => setPendingNotice(null), 3500);
  };

  // Danh mục các khoảng giá chuẩn (Hình 18)
  const priceOptions = [
    { value: 'all', label: 'Tất cả mức giá' },
    // Mua bán BĐS (Đơn vị Tỷ)
    { value: 'under-1b', label: 'Dưới 1 Tỷ' },
    { value: '1b-3b', label: '1 - 3 Tỷ' },
    { value: 'under-3b', label: 'Dưới 3 Tỷ' },
    { value: '3b-5b', label: '3 - 5 Tỷ' },
    { value: '3b-6b', label: '3 - 6 Tỷ' },
    { value: '5b-10b', label: '5 - 10 Tỷ' },
    { value: '6b-15b', label: '6 - 15 Tỷ' },
    { value: '10b-20b', label: '10 - 20 Tỷ' },
    { value: '10b-30b', label: '10 - 30 Tỷ (Đặc tả Hình 18)' },
    { value: '20b-30b', label: '20 - 30 Tỷ' },
    { value: 'above-30b', label: 'Trên 30 Tỷ' },
    // Cho thuê BĐS (Đơn vị Triệu/tháng)
    { value: 'rent-under-5m', label: 'Thuê: Dưới 5 Triệu/tháng' },
    { value: 'rent-5m-10m', label: 'Thuê: 5 - 10 Triệu/tháng' },
    { value: 'rent-under-15m', label: 'Thuê: Dưới 15 Triệu/tháng' },
    { value: 'rent-10m-20m', label: 'Thuê: 10 - 20 Triệu/tháng' },
    { value: 'rent-15m-30m', label: 'Thuê: 15 - 30 Triệu/tháng' },
    { value: 'rent-20m-40m', label: 'Thuê: 20 - 40 Triệu/tháng' },
    { value: 'rent-above-30m', label: 'Thuê: Trên 30 Triệu/tháng' },
    { value: 'rent-above-40m', label: 'Thuê: Trên 40 Triệu/tháng' },
  ];

  // Danh mục các khoảng diện tích chuẩn (Hình 19)
  const areaOptions = [
    { value: 'all', label: 'Tất cả diện tích' },
    { value: 'under-30', label: 'Dưới 30 m² (Studio / Mini)' },
    { value: '30-50', label: '30 - 50 m²' },
    { value: 'under-50', label: 'Dưới 50 m²' },
    { value: '50-80', label: '50 - 80 m²' },
    { value: '50-150', label: '50 - 150 m² (Đặc tả Hình 19: 50m2 - 150m2+)' },
    { value: '80-120', label: '80 - 120 m²' },
    { value: '120-200', label: '120 - 200 m²' },
    { value: '200-300', label: '200 - 300 m²' },
    { value: 'above-150', label: 'Trên 150 m²' },
    { value: 'above-200', label: 'Trên 200 m²' },
    { value: 'above-300', label: 'Trên 300 m² (Biệt thự / Đất lớn)' },
  ];

  // Quick Chips chọn nhanh mức giá
  const quickPriceChips = [
    { label: 'Tất cả giá', value: 'all' },
    { label: '< 3 Tỷ', value: 'under-3b' },
    { label: '3 - 6 Tỷ', value: '3b-6b' },
    { label: '6 - 15 Tỷ', value: '6b-15b' },
    { label: '10 - 30 Tỷ (Hình 18)', value: '10b-30b' },
    { label: '> 30 Tỷ', value: 'above-30b' },
    { label: 'Thuê < 15Tr', value: 'rent-under-15m' },
    { label: 'Thuê 15 - 30Tr', value: 'rent-15m-30m' },
  ];

  // Quick Chips chọn nhanh diện tích (Hình 19)
  const quickAreaChips = [
    { label: 'Tất cả DT', value: 'all' },
    { label: '< 50 m²', value: 'under-50' },
    { label: '50 - 80 m²', value: '50-80' },
    { label: '50 - 150 m² (Hình 19)', value: '50-150' },
    { label: '80 - 120 m²', value: '80-120' },
    { label: '120 - 200 m²', value: '120-200' },
    { label: '> 200 m²', value: 'above-200' },
  ];

  // Xử lý áp dụng khoảng giá tùy chỉnh
  const handleApplyCustomPrice = (e) => {
    e.preventDefault();
    const multiplier = customPriceUnit === 'billion' ? 1000000000 : 1000000;
    const minVal = customMinPrice ? parseFloat(customMinPrice) * multiplier : 0;
    const maxVal = customMaxPrice ? parseFloat(customMaxPrice) * multiplier : Infinity;
    
    if (minVal > maxVal && maxVal !== Infinity) {
      alert('Mức giá tối thiểu không thể lớn hơn mức giá tối đa!');
      return;
    }
    
    setSelectedPriceRange(`custom:${minVal}-${maxVal}`);
    setShowCustomPriceModal(false);
  };

  // Xử lý áp dụng khoảng diện tích tùy chỉnh
  const handleApplyCustomArea = (e) => {
    e.preventDefault();
    const minVal = customMinArea ? parseFloat(customMinArea) : 0;
    const maxVal = customMaxArea ? parseFloat(customMaxArea) : Infinity;
    
    if (minVal > maxVal && maxVal !== Infinity) {
      alert('Diện tích tối thiểu không thể lớn hơn diện tích tối đa!');
      return;
    }
    
    setSelectedAreaRange(`custom-area:${minVal}-${maxVal}`);
    setShowCustomAreaModal(false);
  };

  // Helper hiển thị tên nhãn giá đang chọn
  const getActivePriceLabel = () => {
    if (!selectedPriceRange || selectedPriceRange === 'all') return null;
    if (selectedPriceRange.startsWith('custom:')) {
      const parts = selectedPriceRange.replace('custom:', '').split('-');
      const min = parseFloat(parts[0]) || 0;
      const max = parseFloat(parts[1]) || Infinity;
      const minStr = min >= 1000000000 ? `${(min / 1000000000).toFixed(1)} Tỷ` : `${(min / 1000000).toFixed(0)} Tr`;
      const maxStr = max === Infinity ? 'Trở lên' : (max >= 1000000000 ? `${(max / 1000000000).toFixed(1)} Tỷ` : `${(max / 1000000).toFixed(0)} Tr`);
      return `Tùy chỉnh: ${minStr} - ${maxStr}`;
    }
    const found = priceOptions.find(o => o.value === selectedPriceRange);
    return found ? found.label : selectedPriceRange;
  };

  // Helper hiển thị tên nhãn diện tích đang chọn
  const getActiveAreaLabel = () => {
    if (!selectedAreaRange || selectedAreaRange === 'all') return null;
    if (selectedAreaRange.startsWith('custom-area:')) {
      const parts = selectedAreaRange.replace('custom-area:', '').split('-');
      const min = parseFloat(parts[0]) || 0;
      const max = parseFloat(parts[1]) || Infinity;
      const minStr = `${min} m²`;
      const maxStr = max === Infinity ? 'Trở lên' : `${max} m²`;
      return `Tùy chỉnh: ${minStr} - ${maxStr}`;
    }
    const found = areaOptions.find(o => o.value === selectedAreaRange);
    return found ? found.label : selectedAreaRange;
  };

  return (
    <div className="bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-md mb-8 transition-all font-sans relative">
      
      {/* Toast thông báo */}
      {pendingNotice && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full shadow-lg border border-slate-700 animate-fadeIn">
          <Info className="w-4 h-4 text-amber-400" />
          <span>{pendingNotice}</span>
        </div>
      )}

      {/* Header thanh bộ lọc */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight flex items-center flex-wrap gap-2">
              BỘ LỌC TÌM KIẾM BẤT ĐỘNG SẢN
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                <Maximize2 className="w-3 h-3 text-blue-600" />
                Đang kích hoạt: Lọc Theo Diện Tích (Hình 19)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                <DollarSign className="w-3 h-3 text-red-600" />
                Lọc Theo Giá (Hình 18)
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Branch: <code className="text-blue-600 font-mono font-bold">quyen/Filter_by_area</code> — Đã hoàn thiện cả bộ lọc Giá (Hình 18) và bộ lọc Diện Tích (Hình 19).
            </p>
          </div>
        </div>

        {/* Nút đặt lại lọc giá, diện tích & toàn bộ bộ lọc */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {selectedAreaRange !== 'all' && (
            <button
              onClick={() => setSelectedAreaRange('all')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors border border-blue-200 shadow-2xs"
            >
              <RotateCcw className="w-3 h-3" />
              Bỏ lọc diện tích
            </button>
          )}
          {selectedPriceRange !== 'all' && (
            <button
              onClick={() => setSelectedPriceRange('all')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors border border-red-200 shadow-2xs"
            >
              <RotateCcw className="w-3 h-3" />
              Bỏ lọc giá
            </button>
          )}
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
            title="Đặt lại toàn bộ bộ lọc về mặc định"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Đặt lại tất cả</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 BỘ LỌC CHÍNH THEO ĐẶC TẢ: LỌC GIÁ, LỌC DIỆN TÍCH, LỌC LOẠI BĐS         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 mb-4">
        
        {/* 1. BỘ LỌC THEO DIỆN TÍCH (CHỨC NĂNG CHÍNH ĐANG LÀM - ACTIVE ⭐) */}
        <div className="md:col-span-5 relative group">
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
              1. Lọc Theo Diện Tích (Hình 19 - Active ⭐)
            </span>
            <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
              Đang hoạt động ⭐
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedAreaRange}
              onChange={(e) => setSelectedAreaRange(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-white border-2 border-blue-400 hover:border-blue-500 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-3 focus:ring-blue-500/20 appearance-none cursor-pointer transition-all shadow-xs"
            >
              {areaOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Maximize2 className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-blue-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center justify-between mt-1 text-[10px]">
            <button
              type="button"
              onClick={() => setShowCustomAreaModal(true)}
              className="text-blue-600 hover:text-blue-700 font-bold hover:underline flex items-center gap-1 mt-0.5"
            >
              <span>+ Tự nhập khoảng diện tích (Min - Max m²)</span>
            </button>
            {selectedAreaRange !== 'all' && (
              <span className="text-slate-500 font-medium">
                Khoảng: <strong className="text-blue-600">{getActiveAreaLabel()}</strong>
              </span>
            )}
          </div>
        </div>

        {/* 2. BỘ LỌC THEO MỨC GIÁ (Hình 18 - ACTIVE ⭐) */}
        <div className="md:col-span-4 relative group">
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-red-600 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-red-600" />
              2. Lọc Theo Mức Giá (Hình 18)
            </span>
            <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200 font-bold">
              Active ⭐
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-red-300 hover:border-red-400 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 appearance-none cursor-pointer transition-all shadow-xs"
            >
              {priceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <DollarSign className="w-4 h-4 text-red-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-red-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center justify-between mt-1 text-[10px]">
            <button
              type="button"
              onClick={() => setShowCustomPriceModal(true)}
              className="text-red-600 hover:text-red-700 font-bold hover:underline flex items-center gap-1 mt-0.5"
            >
              <span>+ Tự nhập giá</span>
            </button>
            {selectedPriceRange !== 'all' && (
              <span className="text-slate-500 font-medium truncate">
                Giá: <strong className="text-red-600">{getActivePriceLabel()}</strong>
              </span>
            )}
          </div>
        </div>

        {/* 3. BỘ LỌC THEO LOẠI BĐS (Chờ branch quyen/Filter_by_type) */}
        <div className="md:col-span-3 relative opacity-85 hover:opacity-100 transition-opacity">
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              3. Loại BĐS
            </span>
            <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold" title="Chức năng sẽ được hoàn thiện khi tạo branch quyen/Filter_by_type">
              Chờ branch mới ⏳
            </span>
          </label>
          <div className="relative" onClick={() => showNotice('Bộ lọc loại BĐS đã sẵn sàng giao diện và sẽ hoạt động khi tạo branch quyen/Filter_by_type.')}>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                showNotice('Chức năng Lọc theo loại BĐS sẽ được kích hoạt tại branch quyen/Filter_by_type.');
              }}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer transition-colors"
            >
              <option value="all">Loại nhà đất: Tất cả</option>
              {typesList.length > 0 ? (
                typesList.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))
              ) : (
                <>
                  <option value="Căn hộ cao cấp">Căn hộ cao cấp</option>
                  <option value="Nhà phố">Nhà phố / Liền kề</option>
                  <option value="Biệt thự">Biệt thự / Villa</option>
                  <option value="Đất nền">Đất nền dự án</option>
                  <option value="Mặt bằng">Mặt bằng kinh doanh</option>
                </>
              )}
            </select>
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Sẽ kích hoạt ở branch quyen/Filter_by_type</span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* QUICK FILTER CHIPS (DẢI CHỌN NHANH DIỆN TÍCH & MỨC GIÁ)                   */}
      {/* ========================================================================= */}
      <div className="pt-2 pb-3 flex flex-wrap items-center gap-2 border-t border-slate-100">
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setQuickChipMode('area')}
            className={`px-2 py-1 rounded-md transition-all ${
              quickChipMode === 'area' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📐 Chọn nhanh Diện Tích
          </button>
          <button
            type="button"
            onClick={() => setQuickChipMode('price')}
            className={`px-2 py-1 rounded-md transition-all ${
              quickChipMode === 'price' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💰 Chọn nhanh Giá
          </button>
        </div>

        {/* Chips Diện Tích */}
        {quickChipMode === 'area' && (
          <div className="flex flex-wrap items-center gap-1.5 animate-fadeIn">
            {quickAreaChips.map((chip) => {
              const isSelected = selectedAreaRange === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setSelectedAreaRange(chip.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs scale-105'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Chips Giá */}
        {quickChipMode === 'price' && (
          <div className="flex flex-wrap items-center gap-1.5 animate-fadeIn">
            {quickPriceChips.map((chip) => {
              const isSelected = selectedPriceRange === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setSelectedPriceRange(chip.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-xs scale-105'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* THANH THAO TÁC: NÚT TÌM KIẾM, SẮP XẾP, CHẾ ĐỘ XEM & THỐNG KÊ KẾT QUẢ      */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-slate-100">
        
        {/* Kết quả tìm kiếm & Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Tìm Kiếm Theo Diện Tích (Theo Hình 19 trong báo cáo) */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Áp dụng tìm kiếm theo diện tích đã chọn (Hình 19)"
          >
            <Search className="w-3.5 h-3.5" />
            <span>TÌM KIẾM THEO DIỆN TÍCH</span>
          </button>

          {/* Active Area Badge */}
          {selectedAreaRange !== 'all' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 animate-fadeIn">
              <span>Đang lọc DT: {getActiveAreaLabel()}</span>
              <button
                type="button"
                onClick={() => setSelectedAreaRange('all')}
                className="hover:text-blue-900 ml-1 p-0.5 rounded-full hover:bg-blue-100"
                title="Bỏ lọc diện tích này"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Active Price Badge */}
          {selectedPriceRange !== 'all' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200 animate-fadeIn">
              <span>Đang lọc Giá: {getActivePriceLabel()}</span>
              <button
                type="button"
                onClick={() => setSelectedPriceRange('all')}
                className="hover:text-red-900 ml-1 p-0.5 rounded-full hover:bg-red-100"
                title="Bỏ lọc khoảng giá này"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="text-xs text-slate-600 font-semibold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span>Tìm thấy: <strong className="text-blue-600 font-bold">{totalResults}</strong> bất động sản</span>
          </div>
        </div>

        {/* Sort & View Mode Tools */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          {/* Sắp xếp */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold whitespace-nowrap flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sắp xếp:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-1.5 pl-3 pr-7 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs"
            >
              <option value="default">Phổ biến nhất</option>
              <option value="newest">Mới đăng nhất</option>
              <option value="area-asc">Diện tích: Nhỏ đến Lớn</option>
              <option value="area-desc">Diện tích: Lớn đến Nhỏ</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
            </select>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem dạng danh sách"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'map' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem trên bản đồ"
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TỰ NHẬP KHOẢNG DIỆN TÍCH TÙY CHỌN (CUSTOM AREA RANGE)            */}
      {/* ========================================================================= */}
      {showCustomAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-scaleUp">
            <button
              type="button"
              onClick={() => setShowCustomAreaModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Maximize2 className="w-5 h-5" />
              <h4 className="text-base font-extrabold text-slate-900">Tùy Chỉnh Khoảng Diện Tích BĐS</h4>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Nhập khoảng diện tích tối thiểu và tối đa (m²) để hệ thống lọc các bất động sản phù hợp theo nhu cầu của bạn.
            </p>

            <form onSubmit={handleApplyCustomArea} className="space-y-4">
              {/* Ô nhập Min - Max Area */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diện tích tối thiểu (Từ):</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={customMinArea}
                      onChange={(e) => setCustomMinArea(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                      m²
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diện tích tối đa (Đến):</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={customMaxArea}
                      onChange={(e) => setCustomMaxArea(e.target.value)}
                      placeholder="Không giới hạn"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                      m²
                    </span>
                  </div>
                </div>
              </div>

              {/* Gợi ý diện tích nhanh */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Gợi ý khoảng diện tích phổ biến:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Dưới 50 m²', min: 0, max: 50 },
                    { label: '50 - 80 m²', min: 50, max: 80 },
                    { label: '50 - 150 m² (Hình 19)', min: 50, max: 150 },
                    { label: '80 - 120 m²', min: 80, max: 120 },
                    { label: '120 - 200 m²', min: 120, max: 200 },
                    { label: 'Trên 200 m²', min: 200, max: '' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomMinArea(preset.min ? preset.min.toString() : '');
                        setCustomMaxArea(preset.max ? preset.max.toString() : '');
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomAreaModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Áp dụng bộ lọc diện tích
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TỰ NHẬP KHOẢNG GIÁ TÙY CHỌN (CUSTOM PRICE RANGE)                  */}
      {/* ========================================================================= */}
      {showCustomPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-scaleUp">
            <button
              type="button"
              onClick={() => setShowCustomPriceModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-red-600 mb-2">
              <DollarSign className="w-5 h-5" />
              <h4 className="text-base font-extrabold text-slate-900">Tùy Chỉnh Khoảng Giá BĐS</h4>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Nhập giá tối thiểu và tối đa bạn mong muốn để hệ thống lọc chính xác các bất động sản phù hợp.
            </p>

            <form onSubmit={handleApplyCustomPrice} className="space-y-4">
              {/* Đơn vị tiền tệ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Đơn vị tính:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomPriceUnit('billion')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      customPriceUnit === 'billion'
                        ? 'bg-red-50 text-red-700 border-red-400 ring-2 ring-red-400/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tỷ VNĐ (Dành cho mua bán)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomPriceUnit('million')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      customPriceUnit === 'million'
                        ? 'bg-red-50 text-red-700 border-red-400 ring-2 ring-red-400/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Triệu VNĐ (Dành cho thuê)
                  </button>
                </div>
              </div>

              {/* Ô nhập Min - Max */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giá tối thiểu (Từ):</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={customMinPrice}
                      onChange={(e) => setCustomMinPrice(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                      {customPriceUnit === 'billion' ? 'Tỷ' : 'Tr'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giá tối đa (Đến):</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={customMaxPrice}
                      onChange={(e) => setCustomMaxPrice(e.target.value)}
                      placeholder="Không giới hạn"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                      {customPriceUnit === 'billion' ? 'Tỷ' : 'Tr'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomPriceModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Áp dụng bộ lọc giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
