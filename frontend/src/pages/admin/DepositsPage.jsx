import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Eye,
  Edit3,
  FolderOpen,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Building2,
  User,
  Phone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  fetchDepositsThunk,
  fetchDepositSummaryThunk,
  fetchDepositDetailThunk,
  setDepositFilters,
  resetDepositFilters,
} from '../../store/slices/depositsSlice';
import DepositSummaryCards, { formatVndNumber } from '../../components/deposits/DepositSummaryCards';
import DepositMovementModal from '../../components/deposits/DepositMovementModal';
import DepositDetailDrawer, {
  renderDepositStatusBadge,
} from '../../components/deposits/DepositDetailDrawer';
import DepositEditModal from '../../components/deposits/DepositEditModal';
import DepositDocumentsDrawer from '../../components/deposits/DepositDocumentsDrawer';

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function DepositsPage({ currentUser, onNavigateToInvoice }) {
  const dispatch = useDispatch();
  const {
    items,
    meta,
    loading,
    error,
    summary,
    summaryLoading,
    detail,
    detailLoading,
    filters,
  } = useSelector((state) => state.deposits);

  const isAdmin = Number(currentUser?.role_id) === 1;

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 350);

  // Modals & Drawers state
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementTarget, setMovementTarget] = useState(null);
  const [movementInitialTab, setMovementInitialTab] = useState('collect');

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const [docsDrawerOpen, setDocsDrawerOpen] = useState(false);
  const [docsTarget, setDocsTarget] = useState(null);

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Đọc query từ URL hash nếu có (ví dụ #admin/deposits?search=HD-001&status=refund_due)
  useEffect(() => {
    try {
      const hash = window.location.hash || '';
      const qIndex = hash.indexOf('?');
      if (qIndex !== -1) {
        const params = new URLSearchParams(hash.slice(qIndex + 1));
        const initPatch = {};
        if (params.get('search')) {
          initPatch.search = params.get('search').slice(0, 100);
          setSearchInput(initPatch.search);
        }
        if (params.get('status')) {
          initPatch.status = params.get('status');
        }
        if (Object.keys(initPatch).length > 0) {
          dispatch(setDepositFilters(initPatch));
        }
      }
    } catch {
      // ignore
    }
  }, [dispatch]);

  // Đồng bộ debounced search vào Redux filters
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      dispatch(setDepositFilters({ search: debouncedSearch, page: 1 }));
    }
  }, [debouncedSearch, filters.search, dispatch]);

  // Tải danh sách và 4 thẻ thống kê
  const loadData = useCallback(() => {
    const queryParams = {
      search: filters.search || undefined,
      status: filters.status && filters.status !== 'all' ? filters.status : undefined,
      from_date: filters.from_date || undefined,
      to_date: filters.to_date || undefined,
      end_from: filters.end_from || undefined,
      end_to: filters.end_to || undefined,
      sort: filters.sort || 'refund_due_first',
      per_page: filters.per_page || 10,
      page: filters.page || 1,
    };

    dispatch(fetchDepositsThunk(queryParams));
    dispatch(fetchDepositSummaryThunk());
  }, [dispatch, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mở modal [GHI NHẬN THANH TOÁN MỚI]
  const handleOpenNewMovement = (depositItem = null, tab = 'collect') => {
    setMovementTarget(depositItem);
    setMovementInitialTab(tab);
    setMovementModalOpen(true);
  };

  // Mở Drawer xem chi tiết
  const handleOpenDetail = (depositItem) => {
    setDetailDrawerOpen(true);
    dispatch(fetchDepositDetailThunk(depositItem.id));
  };

  // Mở Modal chỉnh sửa
  const handleOpenEdit = (depositItem) => {
    setEditTarget(depositItem);
    setEditModalOpen(true);
  };

  // Mở Drawer quản lý chứng từ cọc
  const handleOpenDocuments = (depositItem) => {
    setDocsTarget(depositItem);
    setDocsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Toast thông báo thành công */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slideDown">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header trang */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Nhóm 9 • Quản lý Tài chính</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản lý tiền cọc
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi khoản tiền đặt cọc của các hợp đồng, ghi nhận thu cọc, hoàn trả / khấu trừ và
            quản lý chứng từ cọc
          </p>
        </div>
      </div>

      {/* 4 Thẻ thống kê (Hình 44 - bấm thẻ để lọc bảng) */}
      <DepositSummaryCards
        summary={summary}
        loading={summaryLoading}
        activeStatus={filters.status || 'all'}
        onSelectStatus={(st) => dispatch(setDepositFilters({ status: st, page: 1 }))}
      />

      {/* Thanh công cụ trên bảng: Ô tìm kiếm + Nút [GHI NHẬN THANH TOÁN MỚI] căn phải cùng hàng (Mục 3.6) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Thanh tìm kiếm */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              maxLength={100}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.slice(0, 100))}
              placeholder="Tra cứu theo mã/tên hợp đồng, tên/SĐT người thuê, mã/tên căn hộ..."
              className="w-full pl-10 pr-8 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/60 font-medium"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Nút [GHI NHẬN THANH TOÁN MỚI] căn phải cùng hàng với ô tìm kiếm */}
          <button
            type="button"
            onClick={() => handleOpenNewMovement(null, 'collect')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>GHI NHẬN THANH TOÁN MỚI</span>
          </button>
        </div>

        {/* Hàng bộ lọc phụ: Trạng thái, Khoảng ngày thu, Khoảng ngày hết hạn HĐ, Sắp xếp */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Lọc trạng thái */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filters.status || 'all'}
                onChange={(e) =>
                  dispatch(setDepositFilters({ status: e.target.value, page: 1 }))
                }
                className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="holding">Đang giữ</option>
                <option value="refund_due">Cần hoàn trả (Đến hạn)</option>
                <option value="unpaid">Chưa thu</option>
                <option value="partial_collected">Thu một phần</option>
                <option value="partial_refunded">Hoàn một phần</option>
                <option value="refunded">Đã hoàn trả</option>
                <option value="deducted">Đã khấu trừ</option>
                <option value="collected_any">Tất cả đã thu (&gt; 0đ)</option>
                <option value="held_any">Tất cả đang giữ (&gt; 0đ)</option>
              </select>
            </div>

            {/* Khoảng ngày hết hạn HĐ */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-semibold">Hết hạn HĐ:</span>
              <input
                type="date"
                value={filters.end_from || ''}
                onChange={(e) =>
                  dispatch(setDepositFilters({ end_from: e.target.value, page: 1 }))
                }
                className="bg-transparent text-xs font-semibold focus:outline-none"
              />
              <span>→</span>
              <input
                type="date"
                value={filters.end_to || ''}
                onChange={(e) =>
                  dispatch(setDepositFilters({ end_to: e.target.value, page: 1 }))
                }
                className="bg-transparent text-xs font-semibold focus:outline-none"
              />
            </div>

            {/* Sắp xếp */}
            <select
              value={filters.sort || 'refund_due_first'}
              onChange={(e) =>
                dispatch(setDepositFilters({ sort: e.target.value, page: 1 }))
              }
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="refund_due_first">Ưu tiên Cần hoàn trả lên đầu</option>
              <option value="end_date_asc">Ngày hết hạn HĐ tăng dần</option>
              <option value="end_date_desc">Ngày hết hạn HĐ giảm dần</option>
              <option value="amount_desc">Tiền cọc giảm dần</option>
              <option value="amount_asc">Tiền cọc tăng dần</option>
              <option value="collection_date_desc">Ngày thu mới nhất</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {(filters.search ||
              (filters.status && filters.status !== 'all') ||
              filters.end_from ||
              filters.end_to) && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  dispatch(resetDepositFilters());
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
            <button
              type="button"
              onClick={loadData}
              title="Làm mới dữ liệu"
              className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Khối ErrorState có nút Thử lại nếu tải danh sách lỗi */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Bảng dữ liệu Quản lý tiền cọc (Hình 44) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Căn hộ</th>
                <th className="py-3.5 px-4">Người thuê</th>
                <th className="py-3.5 px-4 text-right">Tiền cọc</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4">Ngày thu</th>
                <th className="py-3.5 px-4">Ngày hết hạn HĐ</th>
                <th className="py-3.5 px-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && items.length === 0 ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-4 w-40 bg-slate-200 rounded mb-1.5" />
                      <div className="h-3 w-24 bg-slate-100 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-32 bg-slate-200 rounded mb-1.5" />
                      <div className="h-3 w-20 bg-slate-100 rounded" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-4 w-28 bg-slate-200 rounded ml-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-6 w-24 bg-slate-200 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-7 w-28 bg-slate-200 rounded mx-auto" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-bold text-slate-600 text-sm">
                      Không tìm thấy khoản tiền cọc nào phù hợp
                    </p>
                    <p className="text-xs mt-1">
                      Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((dep) => {
                  const reqAmt = Number(dep.required_amount || 0);
                  const heldAmt = Number(dep.held_amount || 0);
                  const remCollect = Number(dep.remaining_to_collect || 0);
                  const showHeldSubtitle = heldAmt !== reqAmt;

                  return (
                    <tr
                      key={dep.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. Căn hộ */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-xs">
                              {dep.property?.code ? `${dep.property.code} - ` : ''}
                              {dep.property?.title || 'Bất động sản'}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              HĐ:{' '}
                              <span className="font-mono font-semibold text-slate-700">
                                {dep.contract?.contract_code}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Người thuê (kèm SĐT nhỏ) */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{dep.customer?.name || '---'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 pl-5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{dep.customer?.phone || '---'}</span>
                        </div>
                      </td>

                      {/* 3. Tiền cọc (số tiền cam kết, dòng phụ nhỏ "Đang giữ: ..." khi khác) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-slate-900 text-sm">
                          {formatVndNumber(reqAmt)} VNĐ
                        </div>
                        {showHeldSubtitle && (
                          <div className="text-[11px] font-semibold text-blue-700 mt-0.5">
                            Đang giữ: {formatVndNumber(heldAmt)} VNĐ
                          </div>
                        )}
                      </td>

                      {/* 4. Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        {renderDepositStatusBadge(dep.display_status, dep.display_status_label)}
                      </td>

                      {/* 5. Ngày thu */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {dep.collection_date
                          ? new Date(dep.collection_date).toLocaleDateString('vi-VN')
                          : '---'}
                      </td>

                      {/* 6. Ngày hết hạn HĐ */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            dep.display_status === 'refund_due'
                              ? 'text-rose-600 font-bold'
                              : 'text-slate-700'
                          }`}
                        >
                          {dep.contract_end_date
                            ? new Date(dep.contract_end_date).toLocaleDateString('vi-VN')
                            : '---'}
                        </span>
                      </td>

                      {/* 7. Cột HÀNH ĐỘNG: xem chi tiết, chỉnh sửa, quản lý chứng từ cọc + thu/hoàn nhanh */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Nút Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(dep)}
                            title="Xem chi tiết khoản cọc & sổ giao dịch"
                            className="p-2 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Nút Chỉnh sửa */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(dep)}
                            title="Chỉnh sửa thông tin tiền cọc"
                            className="p-2 rounded-xl border border-slate-200 hover:bg-amber-50 hover:border-amber-200 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Nút Quản lý chứng từ cọc */}
                          <button
                            type="button"
                            onClick={() => handleOpenDocuments(dep)}
                            title="Quản lý chứng từ tiền cọc"
                            className="p-2 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-indigo-700 transition-colors relative cursor-pointer"
                          >
                            <FolderOpen className="w-4 h-4" />
                            {Number(dep.documents_count) > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                                {dep.documents_count}
                              </span>
                            )}
                          </button>

                          {/* Nút ngữ cảnh Thu cọc nếu còn thiếu */}
                          {remCollect > 0 && Number(dep.contract?.status) !== 3 && (
                            <button
                              type="button"
                              onClick={() => handleOpenNewMovement(dep, 'collect')}
                              title="Ghi nhận thu tiền cọc"
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              <span>Thu</span>
                            </button>
                          )}

                          {/* Nút ngữ cảnh Hoàn trả nếu đang giữ và là Admin */}
                          {isAdmin && heldAmt > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenNewMovement(dep, 'refund')}
                              title="Hoàn trả / khấu trừ tiền cọc"
                              className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Hoàn</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh phân trang */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-600">
            <span>
              Hiển thị <strong>{meta.from || 0}</strong> - <strong>{meta.to || 0}</strong> trên tổng
              số <strong>{meta.total || 0}</strong> khoản cọc
            </span>
            <select
              value={filters.per_page || 10}
              onChange={(e) =>
                dispatch(
                  setDepositFilters({ per_page: Number(e.target.value), page: 1 })
                )
              }
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={10}>10 dòng / trang</option>
              <option value={20}>20 dòng / trang</option>
              <option value={50}>50 dòng / trang</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() =>
                dispatch(setDepositFilters({ page: Math.max(1, meta.current_page - 1) }))
              }
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-slate-700">
              Trang {meta.current_page || 1} / {meta.last_page || 1}
            </span>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() =>
                dispatch(
                  setDepositFilters({
                    page: Math.min(meta.last_page, meta.current_page + 1),
                  })
                )
              }
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal [GHI NHẬN THANH TOÁN MỚI] (2 tab Thu cọc / Hoàn trả cọc) */}
      <DepositMovementModal
        isOpen={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        initialDeposit={movementTarget}
        initialTab={movementInitialTab}
        currentUser={currentUser}
        onSuccess={(msg) => {
          showToast(msg || 'Ghi nhận thu/hoàn tiền cọc thành công!');
          loadData();
          if (detailDrawerOpen && detail?.id) {
            dispatch(fetchDepositDetailThunk(detail.id));
          }
        }}
      />

      {/* Drawer Xem chi tiết khoản cọc */}
      <DepositDetailDrawer
        isOpen={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        deposit={detail}
        loading={detailLoading}
        currentUser={currentUser}
        onOpenCollect={(dep) => {
          setDetailDrawerOpen(false);
          handleOpenNewMovement(dep, 'collect');
        }}
        onOpenRefund={(dep) => {
          setDetailDrawerOpen(false);
          handleOpenNewMovement(dep, 'refund');
        }}
        onOpenEdit={(dep) => {
          handleOpenEdit(dep);
        }}
        onOpenDocuments={(dep) => {
          handleOpenDocuments(dep);
        }}
        onViewInvoice={(invId) => {
          setDetailDrawerOpen(false);
          if (onNavigateToInvoice) {
            onNavigateToInvoice(invId);
          } else {
            window.location.hash = `#admin/invoices/${invId}`;
          }
        }}
        onRefresh={() => {
          loadData();
          if (detail?.id) dispatch(fetchDepositDetailThunk(detail.id));
        }}
      />

      {/* Modal Chỉnh sửa tiền cọc */}
      <DepositEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        deposit={editTarget}
        onSuccess={(msg) => {
          showToast(msg || 'Cập nhật thông tin tiền cọc thành công!');
          loadData();
          if (detailDrawerOpen && detail?.id) {
            dispatch(fetchDepositDetailThunk(detail.id));
          }
        }}
      />

      {/* Drawer Quản lý chứng từ tiền cọc */}
      <DepositDocumentsDrawer
        isOpen={docsDrawerOpen}
        onClose={() => setDocsDrawerOpen(false)}
        deposit={docsTarget}
        currentUser={currentUser}
        onChanged={() => {
          loadData();
          if (detailDrawerOpen && detail?.id) {
            dispatch(fetchDepositDetailThunk(detail.id));
          }
        }}
      />
    </div>
  );
}

