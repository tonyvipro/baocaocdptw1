import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CreditCard, Search, Calendar, Filter, RefreshCw, QrCode,
  FileText, CheckCircle2, Clock, AlertTriangle, AlertCircle,
  Eye, History, ChevronLeft, ChevronRight, Home, User,
  ArrowUpRight, ArrowDownLeft, ShieldAlert, Sparkles, Download
} from 'lucide-react';
import paymentApi from '../../services/paymentApi';
import QrPaymentModal from '../../components/QrPaymentModal';
import PaymentRecordModal from '../../components/PaymentRecordModal';
import PaymentHistoryDrawer from '../../components/PaymentHistoryDrawer';
import PaymentDetailDrawer from '../../components/PaymentDetailDrawer';

export default function PaymentsPage({ currentUser }) {
  // Lọc & Phân trang
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Dữ liệu
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Drawers
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordModalInvoice, setRecordModalInvoice] = useState(null);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState(null);
  const [qrModalInvoice, setQrModalInvoice] = useState(null);

  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyInvoice, setHistoryInvoice] = useState(null);
  const [historyTransactions, setHistoryTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [detailDebt, setDetailDebt] = useState(null);

  // Debounce tìm kiếm 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Tải 4 thẻ thống kê
  const fetchSummaryData = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const res = await paymentApi.fetchSummary(selectedMonth);
      setSummary(res.data);
    } catch (err) {
      console.warn('Lỗi tải thống kê thanh toán:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedMonth]);

  // Tải danh sách công nợ
  const fetchDebtsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await paymentApi.fetchDebts({
        month: selectedMonth,
        search: debouncedSearch.trim() || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        per_page: perPage,
        page: page,
      });

      setDebts(res.data || []);
      if (res.meta) {
        setPagination(res.meta);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách công nợ.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, debouncedSearch, typeFilter, statusFilter, perPage, page]);

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  useEffect(() => {
    fetchDebtsData();
  }, [fetchDebtsData]);

  const handleRefreshAll = () => {
    fetchSummaryData();
    fetchDebtsData();
  };

  // Mở drawer lịch sử
  const handleOpenHistory = async (debt) => {
    setHistoryInvoice(debt);
    setIsHistoryDrawerOpen(true);
    try {
      setHistoryLoading(true);
      const res = await paymentApi.fetchInvoiceTransactions(debt.id);
      setHistoryTransactions(res.data || []);
    } catch (err) {
      console.warn('Lỗi tải lịch sử giao dịch:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Mở drawer chi tiết
  const handleOpenDetail = (debt) => {
    setDetailDebt(debt);
    setIsDetailDrawerOpen(true);
  };

  // Mở modal ghi nhận cho 1 hóa đơn cụ thể
  const handleOpenRecordForInvoice = (debt) => {
    setRecordModalInvoice(debt);
    setIsRecordModalOpen(true);
  };

  // Khi tạo xong mã QR từ RecordPaymentModal -> mở QrPaymentModal
  const handleQrGenerated = (generatedData, inv) => {
    setQrModalData(generatedData);
    setQrModalInvoice(inv);
    setIsQrModalOpen(true);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  // Badges trạng thái hiển thị
  const renderStatusBadge = (status, hasPendingQr) => {
    let badgeClass = 'bg-slate-100 text-slate-700';
    let icon = null;
    let label = 'Chưa xác định';

    switch (status) {
      case 'paid':
        badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
        label = 'Đã thanh toán';
        break;
      case 'partial':
        badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
        icon = <Clock className="w-3.5 h-3.5 text-amber-600" />;
        label = 'Trả một phần';
        break;
      case 'overdue':
        badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
        icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
        label = 'Quá hạn';
        break;
      case 'unpaid':
      case 'upcoming':
        badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
        icon = <Calendar className="w-3.5 h-3.5 text-blue-500" />;
        label = 'Chưa đến hạn';
        break;
      case 'cancelled':
        badgeClass = 'bg-gray-100 text-gray-600 border-gray-200 line-through';
        label = 'Đã hủy';
        break;
      default:
        break;
    }

    return (
      <div className="flex flex-col gap-1 items-start">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}>
          {icon}
          <span>{label}</span>
        </span>
        {hasPendingQr && status !== 'paid' && status !== 'cancelled' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">
            <QrCode className="w-3 h-3" /> Đang chờ thanh toán
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Trang */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-emerald-600" />
            <span>Quản lý Công nợ & Thanh toán</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi tổng thể các khoản thu, thanh toán qua cổng quét mã QR (VietQR / MoMo) và đối soát công nợ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Chọn tháng */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-hidden"
            />
          </div>

          <button
            onClick={handleRefreshAll}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Nút Tạo Ghi nhận mới */}
          <button
            onClick={() => {
              setRecordModalInvoice(debts[0] || null);
              setIsRecordModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Ghi nhận thanh toán mới</span>
          </button>
        </div>
      </div>

      {/* 2. Bốn thẻ thống kê (Hình 45, Mục 3.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Tổng thu tháng này */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng thu tháng này
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {summaryLoading ? '...' : formatCurrency(summary?.total_collected)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Mọi giao dịch thành công trong tháng</p>
          </div>
        </div>

        {/* Thẻ 2: Đã thanh toán */}
        <div
          onClick={() => {
            setStatusFilter('paid');
            setPage(1);
          }}
          className={`p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all cursor-pointer group ${
            statusFilter === 'paid' ? 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Đã thanh toán
            </span>
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-teal-700 tracking-tight">
              {summaryLoading ? '...' : formatCurrency(summary?.paid_amount)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Số tiền đã thu của các hóa đơn trong tháng</p>
          </div>
        </div>

        {/* Thẻ 3: Còn nợ */}
        <div
          onClick={() => {
            setStatusFilter('partial');
            setPage(1);
          }}
          className={`p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all cursor-pointer group ${
            statusFilter === 'partial' ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-500/20' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Còn nợ
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-amber-700 tracking-tight">
              {summaryLoading ? '...' : formatCurrency(summary?.remaining_amount)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Khoản chưa thanh toán đủ trong tháng</p>
          </div>
        </div>

        {/* Thẻ 4: Quá hạn */}
        <div
          onClick={() => {
            setStatusFilter('overdue');
            setPage(1);
          }}
          className={`p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all cursor-pointer group ${
            statusFilter === 'overdue' ? 'bg-rose-50/50 border-rose-400 ring-2 ring-rose-500/20' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Quá hạn
            </span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-rose-700 tracking-tight">
              {summaryLoading ? '...' : `${summary?.overdue_count || 0} khoản quá hạn`}
            </p>
            <p className="text-[11px] font-semibold text-rose-600 mt-1">
              Tổng tiền: {summaryLoading ? '...' : formatCurrency(summary?.overdue_amount)}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Thanh tìm kiếm và bộ lọc */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo căn hộ, người thuê, số HĐ..."
            maxLength={100}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Lọc loại khoản thu */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Khoản thu:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Tất cả loại</option>
              <option value="rent">Tiền thuê</option>
              <option value="deposit">Tiền cọc</option>
              <option value="service">Phí dịch vụ</option>
              <option value="sale">Mua bán BĐS</option>
              <option value="other">Khoản thu khác</option>
            </select>
          </div>

          {/* Lọc trạng thái */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="paid">Đã thanh toán</option>
              <option value="partial">Trả một phần</option>
              <option value="overdue">Quá hạn</option>
              <option value="unpaid">Chưa đến hạn</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Bảng Công nợ và Thanh toán (Hình 45, Mục 3.1) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs">Đang tải dữ liệu công nợ...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">{error}</p>
            <button
              onClick={fetchDebtsData}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Thử lại
            </button>
          </div>
        ) : debts.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <FileText className="w-12 h-12 mx-auto stroke-[1.5] text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Không có dữ liệu công nợ phù hợp</p>
            <p className="text-xs text-slate-400">Thử thay đổi tháng, từ khóa tìm kiếm hoặc bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Căn hộ / BĐS</th>
                  <th className="px-5 py-3.5">Người thuê / Khách</th>
                  <th className="px-5 py-3.5">Kỳ hạn</th>
                  <th className="px-5 py-3.5 text-right">Phải thu</th>
                  <th className="px-5 py-3.5 text-right">Đã thu</th>
                  <th className="px-5 py-3.5 text-right">Còn nợ</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {debts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Căn hộ / BĐS */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm">{debt.property?.title || 'BĐS chưa cập nhật'}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{debt.property?.address}</div>
                      <span className="font-mono text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                        {debt.property?.code}
                      </span>
                    </td>

                    {/* Người thuê */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{debt.customer?.name || 'Khách hàng'}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{debt.customer?.phone || 'Chưa có SĐT'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        HĐ: {debt.contract?.contract_code}
                      </div>
                    </td>

                    {/* Kỳ hạn */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">
                        {debt.due_date ? `Hạn: ${debt.due_date}` : 'Không có hạn'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Khoản: <span className="font-medium text-slate-700">{debt.type_label}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Số HĐ: {debt.invoice_no}
                      </div>
                    </td>

                    {/* Phải thu */}
                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      {formatCurrency(debt.amount)}
                    </td>

                    {/* Đã thu */}
                    <td className="px-5 py-4 text-right font-semibold text-emerald-700">
                      {formatCurrency(debt.paid_amount)}
                    </td>

                    {/* Còn nợ */}
                    <td className="px-5 py-4 text-right font-bold text-amber-700">
                      {formatCurrency(debt.remaining_amount)}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-5 py-4">
                      {renderStatusBadge(debt.display_status, debt.has_pending_qr)}
                    </td>

                    {/* Cột Hành động (Mục 3.1) */}
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Xem chi tiết */}
                        <button
                          onClick={() => handleOpenDetail(debt)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Xem chi tiết công nợ & tiến độ"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Xem lịch sử thanh toán */}
                        <button
                          onClick={() => handleOpenHistory(debt)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Lịch sử mọi giao dịch"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Nút Thanh toán QR nhanh nếu còn nợ */}
                        {debt.display_status !== 'paid' && debt.display_status !== 'cancelled' && (
                          <button
                            onClick={() => handleOpenRecordForInvoice(debt)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Quét mã QR thanh toán"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span>trên tổng số <strong className="text-slate-800">{pagination.total}</strong> dòng</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">
              Trang {pagination.current_page} / {pagination.last_page || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.last_page))}
              disabled={page >= pagination.last_page}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL GHI NHẬN THANH TOÁN (2 TAB: QR & NHẬP TAY) */}
      <PaymentRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        initialInvoice={recordModalInvoice}
        onSuccessRecord={() => {
          handleRefreshAll();
        }}
        onOpenQrGenerated={handleQrGenerated}
      />

      {/* MODAL MÃ QR THANH TOÁN (SEPAY / MOCK / MOMO) */}
      <QrPaymentModal
        isOpen={isQrModalOpen}
        onClose={(wasSuccess) => {
          setIsQrModalOpen(false);
          if (wasSuccess) {
            handleRefreshAll();
          }
        }}
        qrData={qrModalData}
        invoice={qrModalInvoice}
        onSuccess={() => {
          handleRefreshAll();
        }}
        onSuccessPayment={() => {
          handleRefreshAll();
        }}
      />

      {/* DRAWER LỊCH SỬ GIAO DỊCH */}
      <PaymentHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        invoice={historyInvoice}
        transactions={historyTransactions}
        currentUser={currentUser}
        onRefresh={() => {
          if (historyInvoice) handleOpenHistory(historyInvoice);
          handleRefreshAll();
        }}
      />

      {/* DRAWER CHI TIẾT CÔNG NỢ */}
      <PaymentDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        debt={detailDebt}
        onOpenQr={(d) => handleOpenRecordForInvoice(d)}
      />
    </div>
  );
}
