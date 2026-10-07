import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Trash2, 
  X, 
  ExternalLink, 
  MapPin, 
  Maximize2, 
  SlidersHorizontal,
  Search,
  Calendar,
  AlertCircle,
  EyeOff
} from 'lucide-react';

/**
 * Format relative time in Vietnamese
 */
const formatTimeAgo = (dateInput) => {
  if (!dateInput) return 'Gần đây';
  const now = new Date();
  const date = new Date(dateInput);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 0) return 'Vừa xong';
  if (diffInSeconds < 60) return 'Vừa xong';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Hôm qua';
  if (diffInDays < 7) return `${diffInDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function RecentViewsModal({
  isOpen,
  onClose,
  recentViews = [],
  onSelectProperty,
  onRemoveItem,
  onClearAll,
  onToggleCompare,
  comparedList = []
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'sale' | 'rent'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  // Filtered list
  const filteredList = useMemo(() => {
    return recentViews.filter((item) => {
      // Tab filter
      if (activeTab === 'sale' && item.purpose !== 'sale') return false;
      if (activeTab === 'rent' && item.purpose !== 'rent') return false;

      // Search keyword filter
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchProject = item.project?.toLowerCase().includes(q);
        const matchDistrict = item.district?.toLowerCase().includes(q);
        const matchCode = item.code?.toLowerCase().includes(q);
        return matchTitle || matchProject || matchDistrict || matchCode;
      }
      return true;
    });
  }, [recentViews, activeTab, searchKeyword]);

  const saleCount = useMemo(() => recentViews.filter(p => p.purpose === 'sale').length, [recentViews]);
  const rentCount = useMemo(() => recentViews.filter(p => p.purpose === 'rent').length, [recentViews]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Lịch Sử Xem Tin</h3>
                <span className="bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded-full font-bold">
                  {recentViews.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Các bất động sản bạn đã xem chi tiết gần đây trên hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {recentViews.length > 0 && !confirmClear && (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-xs text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-slate-200 hover:border-red-200 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                title="Xóa tất cả lịch sử xem"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xóa tất cả</span>
              </button>
            )}

            {confirmClear && (
              <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-lg border border-red-200 animate-in fade-in">
                <span className="text-[11px] font-medium text-red-700 px-1.5">Xóa hết?</span>
                <button
                  onClick={() => {
                    onClearAll();
                    setConfirmClear(false);
                  }}
                  className="text-xs px-2 py-0.5 bg-red-600 text-white rounded font-bold hover:bg-red-700 cursor-pointer"
                >
                  Có
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-bold hover:bg-slate-300 cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Tabs & Search */}
        {recentViews.length > 0 && (
          <div className="px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({recentViews.length})
              </button>
              <button
                onClick={() => setActiveTab('sale')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'sale'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mua bán ({saleCount})
              </button>
              <button
                onClick={() => setActiveTab('rent')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'rent'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cho thuê ({rentCount})
              </button>
            </div>

            {/* Keyword Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm trong lịch sử xem..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-slate-50/50"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content List */}
        <div className="overflow-y-auto flex-1 p-5 space-y-3 bg-slate-50/40">
          {recentViews.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <Clock className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">Chưa có lịch sử xem tin</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
                Khi bạn mở xem chi tiết bất kỳ tin đăng bất động sản nào, hệ thống sẽ tự động lưu lại tại đây để bạn có thể xem lại bất kỳ lúc nào.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Khám phá bất động sản ngay
              </button>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <EyeOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Không tìm thấy tin đăng nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredList.map((item) => {
              const isComparing = comparedList.some(p => p.code === item.code);
              const priceText = item.purpose === 'rent' ? item.price_rent_text : item.price_sale_text;

              return (
                <div
                  key={item.code}
                  className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-3.5 flex flex-col sm:flex-row gap-3.5 items-start sm:items-center justify-between transition-all hover:shadow-xs group"
                >
                  {/* Thumbnail & Basic Info */}
                  <div 
                    className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      onClose();
                      onSelectProperty(item);
                    }}
                  >
                    <div className="relative w-24 h-20 sm:w-28 sm:h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider text-white ${
                        item.purpose === 'rent' ? 'bg-blue-600' : 'bg-red-600'
                      }`}>
                        {item.purpose === 'rent' ? 'Cho thuê' : 'Bán'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-bold text-slate-800 truncate">
                          {item.project || 'Bất động sản'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          #{item.code}
                        </span>
                      </div>

                      <h4 className="text-xs font-medium text-slate-700 truncate group-hover:text-red-600 transition-colors mb-1">
                        {item.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mb-1">
                        <span className="font-black text-red-600 text-xs">
                          {priceText}
                        </span>
                        <span>•</span>
                        <span>{item.area} m²</span>
                        {item.bedrooms > 0 && (
                          <>
                            <span>•</span>
                            <span>{item.bedrooms} PN</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {item.district}
                        </span>
                      </div>

                      {/* Time viewed */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Đã xem: {formatTimeAgo(item.viewed_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1.5">
                      {/* Compare toggle */}
                      {onToggleCompare && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleCompare(item);
                          }}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                            isComparing
                              ? 'bg-blue-50 text-blue-600 border-blue-200 font-semibold'
                              : 'text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="So sánh bất động sản"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span className="text-[11px]">{isComparing ? 'Đã thêm' : 'So sánh'}</span>
                        </button>
                      )}

                      {/* View Details */}
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectProperty(item);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <span>Xem lại</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.code);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa tin này khỏi lịch sử"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {recentViews.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Lịch sử được lưu tự động trên thiết bị và đồng bộ tài khoản
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
