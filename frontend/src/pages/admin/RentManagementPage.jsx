import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Building2,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  fetchRentPaymentsThunk,
  fetchRentSummaryThunk,
  fetchFieldLimitsThunk,
  setFilters,
  resetFilters,
} from '../../store/slices/rentPaymentsSlice';
import RentSummaryCards from './components/RentSummaryCards';
import RentPaymentsTable from './components/RentPaymentsTable';
import RecordPaymentModal from './components/RecordPaymentModal';
import RentDetailDrawer from './components/RentDetailDrawer';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Lấy danh sách 12 tháng gần nhất cho month picker
const getRecentMonths = () => {
  const months = [];
  const now = new Date();
  for (let i = -6; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    months.push({
      value: `${y}-${m}`,
      label: `Tháng ${m}/${y}`,
    });
  }
  return months;
};

export default function RentManagementPage({ currentUser, onNavigateToInvoice }) {
  const dispatch = useDispatch();
  const {
    items,
    meta,
    loading,
    error,
    summary,
    summaryLoading,
    filters,
  } = useSelector((state) => state.rentPayments);

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 400);

  const [selectedRecordInvoice, setSelectedRecordInvoice] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);

  const monthsList = getRecentMonths();

  // 1. Tải field limits một lần khi vào trang
  useEffect(() => {
    dispatch(fetchFieldLimitsThunk());
  }, [dispatch]);

  // 2. Đồng bộ debounced search vào filters
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      dispatch(setFilters({ search: debouncedSearch, page: 1 }));
    }
  }, [debouncedSearch, dispatch, filters.search]);

  // 3. Tải danh sách và thẻ thống kê khi filters thay đổi
  const loadData = useCallback(() => {
    const queryParams = {
      month: filters.month,
      status: filters.status || undefined,
      search: filters.search || undefined,
      sort: filters.sort || 'overdue_first',
      per_page: filters.per_page,
      page: filters.page,
    };

    dispatch(fetchRentPaymentsThunk(queryParams));
    dispatch(fetchRentSummaryThunk(filters.month));
  }, [dispatch, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Xử lý thay đổi tháng
  const handleChangeMonth = (e) => {
    dispatch(setFilters({ month: e.target.value, page: 1 }));
  };

  // Xử lý thay đổi trạng thái
  const handleChangeStatus = (statusValue) => {
    dispatch(setFilters({ status: statusValue, page: 1 }));
  };

  // Mở modal ghi nhận thanh toán mới
  const handleOpenRecordNew = () => {
    setSelectedRecordInvoice(null);
    setIsRecordModalOpen(true);
  };

  // Mở modal ghi nhận từ một dòng trong bảng
  const handleRecordFromRow = (invoice) => {
    setSelectedRecordInvoice(invoice);
    setIsRecordModalOpen(true);
  };

  // Xem chi tiết
  const handleViewDetail = (invoice) => {
    setSelectedDetail(invoice);
    setIsDetailDrawerOpen(true);
  };

  // Chuyển hướng sang xem/sửa hóa đơn
  const handleNavigateInvoice = (invoiceId) => {
    if (onNavigateToInvoice) {
      onNavigateToInvoice(invoiceId);
    } else {
      window.location.hash = `#admin/invoices/${invoiceId}`;
    }
  };

  // Hiển thị toast thông báo
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slideDown">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header trang (Hình 43) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4" />
            Tài chính & Thu tiền
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản lý tiền thuê
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi thu tiền thuê nhà hàng tháng, hóa đơn đến hạn và ghi nhận thanh toán
          </p>
        </div>

        {/* Nút Ghi nhận thanh toán mới (Hình 43) */}
        <button
          onClick={handleOpenRecordNew}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Ghi nhận thanh toán mới</span>
        </button>
      </div>

      {/* 4 Thẻ Thống Kê (Hình 43) */}
      <RentSummaryCards
        summary={summary}
        loading={summaryLoading}
        activeStatus={filters.status}
        onSelectStatus={handleChangeStatus}
      />

      {/* Thanh Tìm kiếm & Bộ Lọc */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Ô Tìm kiếm Debounce */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo căn hộ, người thuê, HĐ..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Month Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filters.month}
              onChange={handleChangeMonth}
              className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer"
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
              <option value="all">Tất cả các tháng</option>
            </select>
          </div>

          {/* Lọc Trạng Thái */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filters.status}
              onChange={(e) => handleChangeStatus(e.target.value)}
              className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="paid">Đã thanh toán</option>
              <option value="overdue">Quá hạn</option>
              <option value="upcoming">Chưa đến hạn (tất cả)</option>
              <option value="partial">Trả một phần</option>
              <option value="unpaid">Chưa thanh toán</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Sắp xếp */}
          <select
            value={filters.sort}
            onChange={(e) => dispatch(setFilters({ sort: e.target.value, page: 1 }))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="overdue_first">Ưu tiên Quá hạn</option>
            <option value="due_date_asc">Hạn tăng dần</option>
            <option value="due_date_desc">Hạn giảm dần</option>
            <option value="amount_desc">Số tiền giảm dần</option>
            <option value="amount_asc">Số tiền tăng dần</option>
          </select>

          {/* Nút Làm Mới */}
          <button
            onClick={loadData}
            title="Tải lại danh sách"
            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Bảng Dữ Liệu Tiền Thuê */}
      <RentPaymentsTable
        items={items}
        meta={meta}
        loading={loading}
        filters={filters}
        onChangePage={(p) => dispatch(setFilters({ page: p }))}
        onChangePerPage={(pp) => dispatch(setFilters({ per_page: pp, page: 1 }))}
        onViewDetail={handleViewDetail}
        onEditInvoice={(inv) => handleNavigateInvoice(inv.id)}
        onRecordPayment={handleRecordFromRow}
        onViewInvoice={handleNavigateInvoice}
      />

      {/* Modal Ghi nhận thanh toán mới */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        initialInvoice={selectedRecordInvoice}
        onSuccess={(result) => {
          showToast('Ghi nhận thanh toán thành công!');
          loadData();
        }}
      />

      {/* Drawer Chi tiết tiền thuê & lịch sử giao dịch */}
      <RentDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        detail={selectedDetail}
        loading={false}
        onRecordPayment={(inv) => {
          setIsDetailDrawerOpen(false);
          handleRecordFromRow(inv);
        }}
        onViewInvoice={handleNavigateInvoice}
      />
    </div>
  );
}
