import React, { useState } from 'react';
import {
  Eye,
  Edit2,
  FileText,
  Download,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Building,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

export default function RentPaymentsTable({
  items,
  meta,
  loading,
  filters,
  onChangePage,
  onChangePerPage,
  onViewDetail,
  onEditInvoice,
  onRecordPayment,
  onViewInvoice,
}) {
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  const getStatusBadge = (status, label) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {label || 'Đã thanh toán'}
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            {label || 'Quá hạn'}
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {label || 'Trả một phần'}
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            {label || 'Chưa đến hạn'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 line-through">
            {label || 'Đã hủy'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {label || 'Chưa xác định'}
          </span>
        );
    }
  };

  const formatVnd = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num || 0) + ' VNĐ';
  };

  const handleDownloadPdf = (invoice) => {
    const token = localStorage.getItem('3tv_token') || '';
    const url = `/api/invoices/${invoice.id}/pdf?download=1${token ? `&token=${token}` : ''}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <Building className="w-14 h-14 mx-auto text-slate-300 mb-3" />
        <h4 className="text-base font-bold text-slate-700 mb-1">
          Không có khoản thu nào trong kỳ này
        </h4>
        <p className="text-sm text-slate-400">
          Hãy chọn tháng khác hoặc thay đổi bộ lọc tìm kiếm để xem các khoản tiền thuê.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Bảng dữ liệu chính */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Căn hộ</th>
              <th className="py-3.5 px-4">Người thuê</th>
              <th className="py-3.5 px-4">Kỳ hạn</th>
              <th className="py-3.5 px-4">Số tiền</th>
              <th className="py-3.5 px-4 text-center">Trạng thái</th>
              <th className="py-3.5 px-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {items.map((item) => {
              const isOverdue = item.display_status === 'overdue';
              const isMenuOpen = openActionMenuId === item.id;

              return (
                <tr
                  key={item.id}
                  className={`
                    transition-colors hover:bg-slate-50/80
                    ${isOverdue ? 'bg-rose-50/20' : ''}
                  `}
                >
                  {/* Căn hộ */}
                  <td className="py-4 px-4 align-top">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                        {item.property?.code || 'P'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 line-clamp-1">
                          {item.property?.title || 'Căn hộ chưa đặt tên'}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1">
                          {item.property?.address || item.contract?.contract_code}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          Số HĐ: {item.invoice_no}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Người thuê */}
                  <td className="py-4 px-4 align-top">
                    <div className="font-semibold text-slate-900">
                      {item.customer?.name || 'Khách vãng lai'}
                    </div>
                    {item.customer?.phone && (
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {item.customer.phone}
                      </div>
                    )}
                  </td>

                  {/* Kỳ hạn */}
                  <td className="py-4 px-4 align-top">
                    <div className="font-bold text-slate-800">
                      {item.period_display || 'Tháng này'}
                    </div>
                    <div className={`text-xs mt-0.5 ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                      Hạn: {item.due_date_formatted || item.due_date}
                    </div>
                  </td>

                  {/* Số tiền */}
                  <td className="py-4 px-4 align-top">
                    <div className="font-black text-slate-900">
                      {formatVnd(item.amount)}
                    </div>
                    {item.remaining > 0 ? (
                      <div className="text-xs font-semibold text-amber-600 mt-0.5">
                        Còn nợ: {formatVnd(item.remaining)}
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-600 font-medium mt-0.5">
                        Đã thanh toán đủ
                      </div>
                    )}
                  </td>

                  {/* Trạng thái */}
                  <td className="py-4 px-4 align-top text-center">
                    {getStatusBadge(item.display_status, item.display_status_label)}
                  </td>

                  {/* Cột Hành động */}
                  <td className="py-4 px-4 align-top text-right">
                    <div className="flex items-center justify-end gap-1.5 relative">
                      {/* Nút Ghi nhận nhanh nếu còn nợ */}
                      {item.remaining > 0 && item.raw_status !== 3 && (
                        <button
                          onClick={() => onRecordPayment(item)}
                          title="Ghi nhận thanh toán"
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Thu tiền</span>
                        </button>
                      )}

                      {/* Nút Xem chi tiết (Eye) */}
                      <button
                        onClick={() => onViewDetail(item)}
                        title="Xem chi tiết tiền thuê"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Nút Sửa hóa đơn (Pencil) */}
                      <button
                        onClick={() => {
                          if (item.can_edit) {
                            onEditInvoice(item);
                          }
                        }}
                        disabled={!item.can_edit}
                        title={
                          item.can_edit
                            ? 'Chỉnh sửa hóa đơn'
                            : item.edit_disabled_tooltip || 'Hóa đơn đã có thanh toán'
                        }
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.can_edit
                            ? 'text-slate-500 hover:text-amber-600 hover:bg-slate-100 cursor-pointer'
                            : 'text-slate-300 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Menu Xem / Xuất Hóa đơn */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenActionMenuId(isMenuOpen ? null : item.id)}
                          title="Tùy chọn hóa đơn"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div
                            className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20 text-left text-xs font-semibold"
                            onMouseLeave={() => setOpenActionMenuId(null)}
                          >
                            <button
                              onClick={() => {
                                setOpenActionMenuId(null);
                                onViewInvoice(item.id);
                              }}
                              className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4 text-blue-500" />
                              <span>Xem hóa đơn</span>
                            </button>
                            <button
                              onClick={() => {
                                setOpenActionMenuId(null);
                                handleDownloadPdf(item);
                              }}
                              className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                            >
                              <Download className="w-4 h-4 text-emerald-500" />
                              <span>Tải PDF hóa đơn</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Thanh phân trang ở góc dưới bên phải (Mục 0 & 3.5) */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 font-medium">
          Hiển thị{' '}
          <span className="font-bold text-slate-800">
            {meta?.total > 0 ? (meta.current_page - 1) * meta.per_page + 1 : 0}
          </span>{' '}
          đến{' '}
          <span className="font-bold text-slate-800">
            {Math.min(meta?.current_page * meta?.per_page, meta?.total || 0)}
          </span>{' '}
          trong tổng số{' '}
          <span className="font-bold text-slate-800">{meta?.total || 0}</span> khoản thu
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Chọn số dòng */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Dòng:</span>
            <select
              value={filters.per_page}
              onChange={(e) => onChangePerPage(Number(e.target.value))}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Nút Trước / Sau */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChangePage(meta.current_page - 1)}
              disabled={meta?.current_page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">
              {meta?.current_page || 1} / {meta?.last_page || 1}
            </span>
            <button
              onClick={() => onChangePage(meta.current_page + 1)}
              disabled={meta?.current_page >= meta?.last_page}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
