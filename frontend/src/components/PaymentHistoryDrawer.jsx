import React, { useState } from 'react';
import {
  X, History, CreditCard, Clock, CheckCircle2, AlertCircle,
  RotateCcw, ShieldAlert, ArrowDownLeft, User, Calendar
} from 'lucide-react';
import paymentApi from '../services/paymentApi';

export default function PaymentHistoryDrawer({
  isOpen,
  onClose,
  invoice,
  transactions = [],
  currentUser,
  onRefresh,
}) {
  const [cancellingTxId, setCancellingTxId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState(null);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  if (!isOpen || !invoice) return null;

  const isAdmin = currentUser?.role_id === 1;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Thành công
          </span>
        );
      case 0:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 animate-spin" /> Chờ xử lý
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
            <AlertCircle className="w-3 h-3" /> Thất bại
          </span>
        );
      case 4:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            Hết hạn
          </span>
        );
      case 5:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 line-through">
            Đã hủy
          </span>
        );
      case 6:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <ShieldAlert className="w-3 h-3" /> Cần đối soát
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            Không xác định
          </span>
        );
    }
  };

  const handleCancelManual = async (txId) => {
    if (!cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do hủy giao dịch.');
      return;
    }

    try {
      setIsSubmittingCancel(true);
      setCancelError(null);
      await paymentApi.cancelManualPayment(txId, cancelReason.trim());
      setCancellingTxId(null);
      setCancelReason('');
      if (onRefresh) onRefresh();
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Không thể hủy giao dịch lúc này.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Lịch sử thanh toán</h3>
              <p className="text-xs text-slate-500">
                Hóa đơn: <span className="font-semibold text-slate-800">{invoice.invoice_no}</span> ({invoice.title})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body: Danh sách giao dịch */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-12 h-12 mx-auto stroke-[1.5] mb-2 opacity-50" />
              <p className="text-sm">Chưa có giao dịch thanh toán nào cho hóa đơn này.</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {tx.transaction_code}
                      </span>
                      {getStatusBadge(tx.status)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{tx.paid_at_formatted || tx.created_at}</span>
                      <span>•</span>
                      <span className="capitalize">{tx.source_label}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-base text-emerald-700">
                      {formatCurrency(tx.amount)}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">{tx.payment_method_label}</p>
                  </div>
                </div>

                {/* Chi tiết phụ */}
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1 bg-slate-50/50 p-2.5 rounded-lg">
                  {tx.reference_code && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mã tham chiếu:</span>
                      <span className="font-mono font-medium">{tx.reference_code}</span>
                    </div>
                  )}
                  {tx.gateway_txn_id && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mã cổng/ngân hàng:</span>
                      <span className="font-mono font-medium">{tx.gateway_txn_id}</span>
                    </div>
                  )}
                  {tx.note && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 shrink-0">Ghi chú:</span>
                      <span className="text-slate-800 text-right">{tx.note}</span>
                    </div>
                  )}
                  {tx.failure_reason && (
                    <div className="text-rose-600 text-[11px] font-medium pt-1">
                      Lý do: {tx.failure_reason}
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                    <span>Người ghi nhận:</span>
                    <span>{tx.recorder_name}</span>
                  </div>
                </div>

                {/* Nút hủy giao dịch nhập tay (Chỉ Admin) */}
                {isAdmin && tx.source === 'manual' && tx.status === 1 && (
                  <div className="pt-1 flex justify-end">
                    {cancellingTxId === tx.id ? (
                      <div className="w-full space-y-2 p-3 bg-rose-50 border border-rose-200 rounded-lg animate-in fade-in">
                        <p className="text-xs font-semibold text-rose-800">
                          Xác nhận hủy giao dịch nhập tay:
                        </p>
                        {cancelError && (
                          <p className="text-xs text-rose-600 font-medium">{cancelError}</p>
                        )}
                        <textarea
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Nhập lý do hủy (bắt buộc, tối đa 500 ký tự)..."
                          maxLength={500}
                          className="w-full p-2 border border-rose-300 rounded text-xs bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                          rows={2}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCancellingTxId(null);
                              setCancelReason('');
                              setCancelError(null);
                            }}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
                          >
                            Đóng
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelManual(tx.id)}
                            disabled={isSubmittingCancel}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {isSubmittingCancel ? 'Đang hủy...' : 'Xác nhận hủy'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCancellingTxId(tx.id);
                          setCancelReason('');
                          setCancelError(null);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Hủy giao dịch này
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Tổng cộng: <span className="font-bold text-slate-800">{transactions.length}</span> giao dịch
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
