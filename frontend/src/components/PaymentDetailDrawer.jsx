import React from 'react';
import {
  X, FileText, Home, User, Calendar, CreditCard, DollarSign,
  AlertTriangle, CheckCircle2, Clock, Phone, Mail, MapPin, Building2
} from 'lucide-react';

export default function PaymentDetailDrawer({
  isOpen,
  onClose,
  debt, // Debt object from DebtResource
  onOpenQr,
  onOpenManual,
}) {
  if (!isOpen || !debt) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const amount = (float) => parseFloat(float || 0);
  const totalAmount = amount(debt.amount);
  const paidAmount = amount(debt.paid_amount);
  const remainingAmount = amount(debt.remaining_amount);
  const percentPaid = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;

  const isPaid = debt.display_status === 'paid';
  const isCancelled = debt.display_status === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Chi tiết công nợ</h3>
              <p className="text-xs text-slate-500">
                Hóa đơn <span className="font-semibold text-slate-800">{debt.invoice_no}</span>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Khối tiến độ thanh toán */}
          <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Tiến độ thanh toán:</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300">
                {percentPaid}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${percentPaid}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-center">
              <div>
                <p className="text-[11px] text-slate-400">Phải thu</p>
                <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(totalAmount)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Đã thu</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">{formatCurrency(paidAmount)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Còn nợ</p>
                <p className="text-sm font-bold text-amber-400 mt-0.5">{formatCurrency(remainingAmount)}</p>
              </div>
            </div>
          </div>

          {/* Thông tin hóa đơn */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin khoản thu</h4>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Tiêu đề:</span>
                <span className="font-semibold text-slate-900">{debt.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Loại khoản thu:</span>
                <span className="font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800">
                  {debt.type_label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hạn thanh toán:</span>
                <span className="font-semibold text-slate-900">{debt.due_date || 'Không có'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kỳ thanh toán:</span>
                <span className="text-slate-800">
                  {debt.billing_period_start ? `${debt.billing_period_start} đến ${debt.billing_period_end}` : 'Theo hóa đơn'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-semibold text-slate-900">{debt.display_status_label}</span>
              </div>
            </div>
          </div>

          {/* Thông tin Hợp đồng & Bất động sản */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bất động sản & Hợp đồng</h4>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <Home className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 text-sm">{debt.property?.title || 'Chưa cập nhật'}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">{debt.property?.address}</p>
                  <p className="font-mono text-emerald-700 text-[11px] font-semibold mt-0.5">
                    Mã BĐS: {debt.property?.code}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex justify-between">
                <span className="text-slate-500">Hợp đồng:</span>
                <span className="font-medium text-slate-900">
                  {debt.contract?.contract_code} ({debt.contract?.contract_name})
                </span>
              </div>
            </div>
          </div>

          {/* Thông tin Người thuê / Khách hàng */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Người thuê / Khách hàng</h4>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Họ và tên:</span>
                <span className="font-bold text-slate-900">{debt.customer?.name || 'Khách vãng lai'}</span>
              </div>
              {debt.customer?.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Số điện thoại:</span>
                  <span className="font-mono font-medium text-slate-800">{debt.customer.phone}</span>
                </div>
              )}
              {debt.customer?.email && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-800">{debt.customer.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-medium transition-colors"
          >
            Đóng
          </button>
          {!isPaid && !isCancelled && (
            <div className="flex gap-2">
              {onOpenQr && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQr(debt);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
                >
                  Thanh toán QR
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
