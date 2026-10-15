import React, { useState } from 'react';
import {
  DollarSign, Maximize2, Building2, ChevronDown, RotateCcw,
  Search, ArrowUpDown, LayoutGrid, List, Map, Sparkles, X,
  SlidersHorizontal, Check, Info, Layers
} from 'lucide-react';

export default function PropertyFilter({
  selectedType = 'all',
  setSelectedType = () => { },
  typesList = [],
  selectedPriceRange = 'all',
  setSelectedPriceRange = () => { },
  selectedAreaRange = 'all',
  setSelectedAreaRange = () => { },
  selectedDeveloper = 'all',
  setSelectedDeveloper = () => { },
  developersList = [],
  selectedBedrooms = 'all',
  setSelectedBedrooms = () => { },
  sortBy = 'default',
  setSortBy = () => { },
  viewMode = 'grid',
  setViewMode = () => { },
  resetFilters = () => { },
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

  // 3. Tab chuyển đổi dải nút bấm nhanh giữa Loại BĐS, Diện Tích và Mức Giá
  const [quickChipMode, setQuickChipMode] = useState('type'); // 'type' | 'area' | 'price'

  // Danh mục các loại BĐS chuẩn (Đặc tả Hình 20 trong báo cáo: Tất cả, Căn hộ, Nhà phố, Đất nền, Biệt thự)
  const propertyTypeOptions = [
    { value: 'all', label: 'Tất cả loại hình BĐS' },
    { value: 'Căn hộ', label: 'Căn hộ (Chung cư, Căn hộ cao cấp)' },
    { value: 'Nhà phố', label: 'Nhà phố (Liền kề, Nhà riêng)' },
    { value: 'Biệt thự', label: 'Biệt thự (Villa nghỉ dưỡng)' },
    { value: 'Đất nền', label: 'Đất nền (Đất dự án, Thổ cư)' },
    { value: 'Mặt bằng', label: 'Mặt bằng kinh doanh / Shophouse' },
  ];

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

  // Quick Chips chọn nhanh Loại BĐS (Hình 20)
  const quickTypeChips = [
    { label: 'Tất cả loại', value: 'all' },
    { label: '🏢 Căn hộ', value: 'Căn hộ' },
    { label: '🏡 Nhà phố', value: 'Nhà phố' },
    { label: '🏰 Biệt thự', value: 'Biệt thự' },
    { label: '🏞️ Đất nền', value: 'Đất nền' },
    { label: '🏪 Mặt bằng', value: 'Mặt bằng' },
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

  // Quick Chips chọn nhanh mức giá (Hình 18)
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

  // Helper hiển thị tên nhãn loại BĐS đang chọn
  const getActiveTypeLabel = () => {
    if (!selectedType || selectedType === 'all') return null;
    const found = propertyTypeOptions.find(o => o.value === selectedType);
    return found ? found.label : selectedType;
  };

  return (
    <div className="bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-md mb-8 transition-all font-sans relative">

      {/* Header thanh bộ lọc */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
              BỘ LỌC TÌM KIẾM BẤT ĐỘNG SẢN
            </h3>
          </div>
        </div>

        {/* Nút đặt lại lọc loại BĐS, diện tích, giá & toàn bộ bộ lọc */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {selectedType !== 'all' && (
            <button
              onClick={() => setSelectedType('all')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold transition-colors border border-purple-200 shadow-2xs"
            >
              <RotateCcw className="w-3 h-3" />
              Bỏ lọc loại
            </button>
          )}
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
      {/* 3 BỘ LỌC CHÍNH THEO ĐẶC TẢ: LỌC LOẠI BĐS, LỌC DIỆN TÍCH, LỌC GIÁ         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 mb-4">

        {/* 1. BỘ LỌC THEO LOẠI BĐS */}
        <div className="md:col-span-4 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5 h-6">
              <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-purple-600 truncate">
                <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>1. Loại Bất Động Sản</span>
              </span>
            </div>
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full h-11 pl-9 pr-9 py-2 bg-white border border-purple-300 hover:border-purple-400 focus:border-purple-500 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none cursor-pointer transition-all shadow-2xs"
              >
                {propertyTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Building2 className="w-4 h-4 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-purple-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-1.5 h-5 text-[10px]">
            <button
              type="button"
              onClick={() => setQuickChipMode('type')}
              className="text-purple-600 hover:text-purple-700 font-bold hover:underline flex items-center gap-1 shrink-0"
            >
              <span>+ Chọn nhanh loại</span>
            </button>
            {selectedType !== 'all' ? (
              <span className="text-slate-500 font-medium truncate max-w-[130px]" title={getActiveTypeLabel()}>
                Loại: <strong className="text-purple-600">{getActiveTypeLabel()}</strong>
              </span>
            ) : (
              <span className="text-slate-400 truncate">Tất cả loại BĐS</span>
            )}
          </div>
        </div>

        {/* 2. BỘ LỌC THEO DIỆN TÍCH */}
        <div className="md:col-span-4 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5 h-6">
              <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-blue-600 truncate">
                <Maximize2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>2. Diện Tích</span>
              </span>
            </div>
            <div className="relative">
              <select
                value={selectedAreaRange}
                onChange={(e) => setSelectedAreaRange(e.target.value)}
                className="w-full h-11 pl-9 pr-9 py-2 bg-white border border-blue-300 hover:border-blue-400 focus:border-blue-500 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer transition-all shadow-2xs"
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
          </div>

          <div className="flex items-center justify-between mt-1.5 h-5 text-[10px]">
            <button
              type="button"
              onClick={() => setShowCustomAreaModal(true)}
              className="text-blue-600 hover:text-blue-700 font-bold hover:underline flex items-center gap-1 shrink-0"
            >
              <span>+ Tự nhập DT</span>
            </button>
            {selectedAreaRange !== 'all' ? (
              <span className="text-slate-500 font-medium truncate max-w-[130px]" title={getActiveAreaLabel()}>
                DT: <strong className="text-blue-600">{getActiveAreaLabel()}</strong>
              </span>
            ) : (
              <span className="text-slate-400 truncate">Tất cả diện tích</span>
            )}
          </div>
        </div>

        {/* 3. BỘ LỌC THEO MỨC GIÁ */}
        <div className="md:col-span-4 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5 h-6">
              <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-red-600 truncate">
                <DollarSign className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>3. Mức Giá</span>
              </span>
            </div>
            <div className="relative">
              <select
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className="w-full h-11 pl-9 pr-9 py-2 bg-white border border-red-300 hover:border-red-400 focus:border-red-500 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 appearance-none cursor-pointer transition-all shadow-2xs"
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
          </div>

          <div className="flex items-center justify-between mt-1.5 h-5 text-[10px]">
            <button
              type="button"
              onClick={() => setShowCustomPriceModal(true)}
              className="text-red-600 hover:text-red-700 font-bold hover:underline flex items-center gap-1 shrink-0"
            >
              <span>+ Tự nhập giá</span>
            </button>
            {selectedPriceRange !== 'all' ? (
              <span className="text-slate-500 font-medium truncate max-w-[130px]" title={getActivePriceLabel()}>
                Giá: <strong className="text-red-600">{getActivePriceLabel()}</strong>
              </span>
            ) : (
              <span className="text-slate-400 truncate">Tất cả mức giá</span>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* QUICK FILTER CHIPS (DẢI CHỌN NHANH LOẠI BĐS, DIỆN TÍCH & MỨC GIÁ)         */}
      {/* ========================================================================= */}
      <div className="pt-2 pb-3 flex flex-wrap items-center gap-2 border-t border-slate-100">
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setQuickChipMode('type')}
            className={`px-2 py-1 rounded-md transition-all ${quickChipMode === 'type' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            🏢 Chọn nhanh Loại BĐS
          </button>
          <button
            type="button"
            onClick={() => setQuickChipMode('area')}
            className={`px-2 py-1 rounded-md transition-all ${quickChipMode === 'area' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            📐 Chọn nhanh Diện Tích
          </button>
          <button
            type="button"
            onClick={() => setQuickChipMode('price')}
            className={`px-2 py-1 rounded-md transition-all ${quickChipMode === 'price' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            💰 Chọn nhanh Giá
          </button>
        </div>

        {/* Chips Loại BĐS (Hình 20) */}
        {quickChipMode === 'type' && (
          <div className="flex flex-wrap items-center gap-1.5 animate-fadeIn">
            {quickTypeChips.map((chip) => {
              const isSelected = selectedType === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setSelectedType(chip.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${isSelected
                    ? 'bg-purple-600 text-white shadow-xs scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80'
                    }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Chips Diện Tích (Hình 19) */}
        {quickChipMode === 'area' && (
          <div className="flex flex-wrap items-center gap-1.5 animate-fadeIn">
            {quickAreaChips.map((chip) => {
              const isSelected = selectedAreaRange === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setSelectedAreaRange(chip.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${isSelected
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

        {/* Chips Giá (Hình 18) */}
        {quickChipMode === 'price' && (
          <div className="flex flex-wrap items-center gap-1.5 animate-fadeIn">
            {quickPriceChips.map((chip) => {
              const isSelected = selectedPriceRange === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setSelectedPriceRange(chip.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${isSelected
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
          {/* Nút Tìm Kiếm Theo Loại BĐS (Theo Hình 20 trong báo cáo) */}
          <button
            type="button"
            className="h-9 flex items-center gap-1.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Áp dụng tìm kiếm theo loại BĐS đã chọn (Hình 20)"
          >
            <Search className="w-3.5 h-3.5" />
            <span>TÌM KIẾM THEO LOẠI BĐS</span>
          </button>

          {/* Active Type Badge */}
          {selectedType !== 'all' && (
            <div className="h-9 inline-flex items-center gap-1.5 px-3 bg-purple-50 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 animate-fadeIn">
              <span>Đang lọc Loại: {getActiveTypeLabel()}</span>
              <button
                type="button"
                onClick={() => setSelectedType('all')}
                className="hover:text-purple-900 ml-1 p-0.5 rounded-full hover:bg-purple-100"
                title="Bỏ lọc loại BĐS này"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Active Area Badge */}
          {selectedAreaRange !== 'all' && (
            <div className="h-9 inline-flex items-center gap-1.5 px-3 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 animate-fadeIn">
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
            <div className="h-9 inline-flex items-center gap-1.5 px-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 animate-fadeIn">
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

          <div className="h-9 flex items-center text-xs text-slate-600 font-semibold bg-slate-50 px-3 rounded-xl border border-slate-200">
            <span>Tìm thấy: <strong className="text-purple-600 font-bold">{totalResults}</strong> bất động sản</span>
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
              className="py-1.5 pl-3 pr-7 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer shadow-xs"
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
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              title="Xem dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              title="Xem dạng danh sách"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'map' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
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
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${customPriceUnit === 'billion'
                      ? 'bg-red-50 text-red-700 border-red-400 ring-2 ring-red-400/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                  >
                    Tỷ VNĐ (Dành cho mua bán)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomPriceUnit('million')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${customPriceUnit === 'million'
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
