import React from 'react';
import {
  X,
  CreditCard,
  Building,
  User,
  Calendar,
  FileText,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function RentDetailDrawer({
  isOpen,
  onClose,
  detail,
  loading,
  onRecordPayment,
  onViewInvoice,
}) {
  if (!isOpen) return null;

  const formatVnd = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num || 0) + ' VNĐ';
  };

  const handleDownloadPdf = () => {
    if (!detail) return;
    const token = localStorage.getItem('3tv_token') || '';
    const url = `/api/invoices/${detail.id}/pdf?download=1${token ? `&token=${token}` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slideLeft">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono text-xs font-bold">
                {detail?.invoice_no || 'Đang tải...'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Version: {detail?.version || 1}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Chi tiết thu tiền thuê nhà
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : detail ? (
            <>
              {/* Thẻ trạng thái & Số tiền nổi bật */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Tổng số tiền thuê</div>
                  <div className="text-2xl font-black text-white tracking-tight mt-0.5">
                    {formatVnd(detail.amount)}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-emerald-400">Đã trả: {formatVnd(detail.paid_amount)}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-amber-400 font-bold">Còn nợ: {formatVnd(detail.remaining)}</span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                    {detail.display_status_label}
                  </span>
                  {detail.updater_name && (
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      Cập nhật bởi: <strong className="text-slate-200">{detail.updater_name}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Thông tin căn hộ & Hợp đồng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-slate-500" />
                    Căn hộ & Hợp đồng
                  </div>
                  <div className="font-bold text-slate-900">
                    {detail.property?.code} - {detail.property?.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {detail.property?.address}
                  </div>
                  <div className="text-xs text-slate-600 font-mono mt-2 pt-2 border-t border-slate-200/60 flex justify-between">
                    <span>Mã HĐ:</span>
                    <strong className="text-slate-800">{detail.contract?.contract_code}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-500" />
                    Người thuê (Khách hàng)
                  </div>
                  <div className="font-bold text-slate-900">
                    {detail.customer?.name || 'Khách vãng lai'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {detail.customer?.phone || 'Chưa cập nhật số điện thoại'}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {detail.customer?.email}
                  </div>
                </div>
              </div>

              {/* Thông tin kỳ hạn & hạn thanh toán */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Kỳ thanh toán</span>
                  <span className="font-bold text-slate-800">{detail.period_display}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Hạn thanh toán</span>
                  <span className="font-bold text-slate-800 font-mono">{detail.due_date_formatted || detail.due_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Ngày lập</span>
                  <span className="font-bold text-slate-800 font-mono">{detail.issue_date || 'Theo hợp đồng'}</span>
                </div>
              </div>

              {/* Danh sách giao dịch thu tiền */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                  <span>Lịch sử các lần thanh toán ({detail.transactions?.length || 0})</span>
                  {detail.remaining > 0 && detail.raw_status !== 3 && (
                    <button
                      onClick={() => onRecordPayment(detail)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Ghi nhận thêm</span>
                    </button>
                  )}
                </h4>

                {detail.transactions && detail.transactions.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {detail.transactions.map((tx) => (
                      <div key={tx.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{tx.transaction_code}</span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium text-[10px]">
                              {tx.payment_method_label}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold text-[10px]">
                              {tx.status_label}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px] mt-1 flex items-center gap-2">
                            <span>{tx.paid_at_formatted || tx.paid_at}</span>
                            <span>•</span>
                            <span>Thu bởi: {tx.recorder_name}</span>
                            {tx.reference_code && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-500">Ref: {tx.reference_code}</span>
                              </>
                            )}
                          </div>
                          {tx.note && <div className="text-slate-500 italic mt-1 bg-amber-50/60 px-2 py-1 rounded border border-amber-100/50">"{tx.note}"</div>}
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <div className="text-sm font-black text-emerald-600">
                            +{formatVnd(tx.amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs">
                    Chưa có giao dịch thu tiền nào cho hóa đơn này.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Tải PDF hóa đơn</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onViewInvoice(detail?.id);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Xem trang hóa đơn</span>
            </button>

            {detail?.remaining > 0 && detail?.raw_status !== 3 && (
              <button
                onClick={() => {
                  onClose();
                  onRecordPayment(detail);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Ghi nhận thanh toán</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
