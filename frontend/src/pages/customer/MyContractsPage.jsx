import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Search, RefreshCw, Eye, Download, Calendar,
  Building2, ArrowRight, ShieldCheck, AlertTriangle, Clock,
  Filter, X, ChevronLeft, ChevronRight, CheckCircle2, User, Phone,
  FileCheck, ShieldAlert
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMyContractsThunk,
  setCustomerFilters,
  resetCustomerFilters,
} from '../../store/slices/customerContractSlice';

export default function MyContractsPage({ currentUser, onSelectContract, onGoHome }) {
  const dispatch = useDispatch();
  const {
    myContracts,
    pagination,
    filters,
    loading,
    error,
  } = useSelector((state) => state.customerContract);

  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        dispatch(setCustomerFilters({ search: searchTerm, page: 1 }));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, dispatch]);

  const loadData = useCallback(() => {
    dispatch(fetchMyContractsThunk(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key, value) => {
    dispatch(setCustomerFilters({ [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    dispatch(resetCustomerFilters());
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      dispatch(setCustomerFilters({ page: newPage }));
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '0 ₫';
    return Number(val).toLocaleString('vi-VN') + ' ₫';
  };

  const renderStatusBadge = (contract) => {
    switch (Number(contract.status)) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {contract.status_label || 'Đang có hiệu lực'}
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            {contract.status_label || 'Đã thanh lý'}
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {contract.status_label || 'Đã hủy'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {contract.status_label || 'N/A'}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <button onClick={onGoHome} className="hover:text-blue-600 transition-colors">Trang chủ</button>
            <span>/</span>
            <span className="text-slate-800 font-bold">Hợp đồng của tôi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-blue-600" />
            <span>Hợp Đồng Của Tôi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi danh sách các hợp đồng thuê & giao dịch của quý khách tại 3TV Land
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã hợp đồng hoặc tên hợp đồng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Status */}
        <div className="w-full md:w-56">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="1">Đang có hiệu lực</option>
            <option value="2">Đã thanh lý / Hết hạn</option>
            <option value="3">Đã hủy</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {(filters.search || filters.status) && (
          <button
            onClick={handleClearFilters}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shrink-0"
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Contracts List / Cards */}
      {loading && myContracts.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-xs font-semibold">Đang tải danh sách hợp đồng của bạn...</p>
        </div>
      ) : myContracts.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200 p-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Bạn chưa có hợp đồng nào</h3>
          <p className="text-xs text-slate-500 max-w-md mb-6">
            Khi bạn ký kết hợp đồng thuê hoặc mua bán bất động sản với 3TV Land, thông tin và tài liệu hồ sơ sẽ hiển thị tại đây.
          </p>
          <button
            onClick={onGoHome}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Khám phá bất động sản nổi bật
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {myContracts.map((contract) => (
            <div
              key={contract.id}
              onClick={() => onSelectContract(contract.id)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all p-5 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            >
              {/* Expiring soon warning strip */}
              {contract.is_expiring_soon && (
                <div className="bg-amber-500 text-white px-3 py-1 text-[11px] font-extrabold flex items-center justify-between -mx-5 -mt-5 mb-4 shadow-xs">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    SẮP HẾT HẠN (Còn {contract.days_until_expiration} ngày)
                  </span>
                  <span className="underline text-[10px]">Gia hạn sớm</span>
                </div>
              )}

              {/* Card Header: Code & Status */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {contract.contract_code}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm mt-1.5 group-hover:text-blue-600 transition-colors line-clamp-1" title={contract.contract_name}>
                      {contract.contract_name}
                    </h3>
                  </div>
                  <div>
                    {renderStatusBadge(contract)}
                  </div>
                </div>

                {/* Property Info */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 mb-4">
                  <div className="text-xs font-bold text-slate-800 line-clamp-1">
                    {contract.property_title || 'Bất động sản'}
                  </div>
                  {contract.property_address && (
                    <div className="text-[11px] text-slate-500 flex items-start gap-1 line-clamp-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{contract.property_address}</span>
                    </div>
                  )}
                </div>

                {/* Dates & Price Info */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Thời hạn</span>
                    <span className="font-bold text-slate-800 text-[11px] block mt-0.5">
                      {contract.start_date} → {contract.end_date}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Giá thuê</span>
                    <span className="font-black text-red-600 text-[11px] block mt-0.5">
                      {formatCurrency(contract.rental_price)}/tháng
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Docs Count & View Detail Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  <span><strong className="text-slate-800">{contract.documents_count || 0}</strong> tài liệu</span>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Xem chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {pagination.total > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hiển thị <strong className="text-slate-800">{myContracts.length}</strong> trên tổng số <strong className="text-slate-800">{pagination.total}</strong> hợp đồng
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-bold text-slate-700">
              Trang {pagination.current_page} / {pagination.last_page || 1}
            </span>

            <button
              onClick={() => handlePageChange(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.last_page}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
