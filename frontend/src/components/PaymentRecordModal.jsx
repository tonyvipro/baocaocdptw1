import React, { useState, useEffect } from 'react';
import {
  X, CreditCard, QrCode, FileText, CheckCircle2, AlertCircle,
  Building, User, Calendar, DollarSign, RefreshCw, Search, ShieldCheck
} from 'lucide-react';
import paymentApi from '../services/paymentApi';

// Tiện ích sinh client_token UUID v4
const generateUuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getCurrentDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

export default function PaymentRecordModal({
  isOpen,
  onClose,
  initialInvoice = null,
  onSuccessRecord,
  onOpenQrGenerated, // callback khi tạo xong QR -> mở QrPaymentModal
  allowManual = true,
}) {
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'manual'
  const [invoice, setInvoice] = useState(initialInvoice);

  // Form State - Nhập tay
  const [manualAmount, setManualAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paidAt, setPaidAt] = useState(getCurrentDateTimeLocal());
  const [referenceCode, setReferenceCode] = useState('');
  const [note, setNote] = useState('');

  // Form State - Cổng QR
  const [qrGateway, setQrGateway] = useState('sepay'); // 'sepay' | 'mock' | 'momo'
  const [qrAmount, setQrAmount] = useState('');

  // State trạng thái
  const [clientToken, setClientToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setClientToken(generateUuid());
      setErrorMsg(null);
      setFieldErrors({});
      setInvoice(initialInvoice);

      const rem = initialInvoice?.remaining_amount || initialInvoice?.remaining || 0;
      setManualAmount(rem > 0 ? String(rem) : '');
      setQrAmount(rem > 0 ? String(rem) : '');
      setPaidAt(getCurrentDateTimeLocal());
    }
  }, [isOpen, initialInvoice]);

  if (!isOpen) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const remaining = invoice?.remaining_amount ?? invoice?.remaining ?? 0;

  // Xử lý gửi ghi nhận thủ công (Nhập tay)
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!invoice) {
      setErrorMsg('Vui lòng chọn hóa đơn cần ghi nhận thanh toán.');
      return;
    }

    const amt = parseFloat(manualAmount);
    if (!amt || amt <= 0) {
      setFieldErrors({ amount: 'Số tiền thanh toán phải lớn hơn 0.' });
      return;
    }
    if (amt > remaining) {
      setFieldErrors({ amount: `Số tiền thanh toán vượt quá số còn nợ (${formatCurrency(remaining)}).` });
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setFieldErrors({});

      const payload = {
        amount: amt,
        payment_method: paymentMethod,
        paid_at: paidAt,
        reference_code: referenceCode.trim() || null,
        note: note.trim() || null,
        version: invoice.version || 1,
        client_token: clientToken,
      };

      const res = await paymentApi.recordPayment(invoice.id, payload);
      if (onSuccessRecord) onSuccessRecord(res.data);
      onClose();
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.errors) {
        setFieldErrors(resp.errors);
      }
      setErrorMsg(resp?.message || 'Không thể ghi nhận thanh toán lúc này. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý tạo mã QR qua cổng
  const handleQrSubmit = async (e) => {
    e.preventDefault();
    if (!invoice) {
      setErrorMsg('Vui lòng chọn hóa đơn cần tạo mã QR thanh toán.');
      return;
    }

    const amt = parseFloat(qrAmount);
    if (!amt || amt <= 0) {
      setFieldErrors({ qrAmount: 'Số tiền thanh toán phải lớn hơn 0.' });
      return;
    }
    if (amt > remaining) {
      setFieldErrors({ qrAmount: `Số tiền thanh toán vượt quá số còn nợ (${formatCurrency(remaining)}).` });
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setFieldErrors({});

      const payload = {
        gateway: qrGateway,
        amount: amt,
        client_token: clientToken,
        version: invoice.version || 1,
      };

      const res = await paymentApi.createQrPayment(invoice.id, payload);
      onClose();
      if (onOpenQrGenerated) {
        onOpenQrGenerated(res.data, invoice);
      }
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.errors) {
        setFieldErrors(resp.errors);
      }
      setErrorMsg(resp?.message || 'Không thể tạo mã QR thanh toán. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Ghi nhận thanh toán</h3>
              <p className="text-xs text-slate-500">
                Hóa đơn: <span className="font-semibold text-slate-800">{invoice?.invoice_no}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector (Mục 3.1 & 7.2) */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('qr');
              setErrorMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'qr'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Thanh toán QR (Khuyên dùng)</span>
          </button>
          {allowManual && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('manual');
                setErrorMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'manual'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Nhập tay (Nhân viên)</span>
            </button>
          )}
        </div>

        {/* Body Form */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Thông tin hóa đơn tóm tắt */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Khách hàng / Người thuê:</span>
              <span className="font-bold text-slate-900">{invoice?.customer?.name || 'Khách hàng'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bất động sản:</span>
              <span className="font-medium text-slate-800 truncate max-w-[240px]">
                {invoice?.property?.title || 'BĐS liên quan'}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">Số tiền còn nợ:</span>
              <span className="font-bold text-emerald-700 text-sm">
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>

          {/* Hộp báo lỗi nghiệp vụ đỏ trong modal */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-700 font-medium leading-relaxed">
                {errorMsg}
              </div>
            </div>
          )}

          {/* FORM TAB 1: THANH TOÁN QR */}
          {activeTab === 'qr' && (
            <form onSubmit={handleQrSubmit} className="space-y-4">
              {/* Chọn cổng thanh toán */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Chọn cổng thanh toán QR:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQrGateway('sepay')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      qrGateway === 'sepay'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <p className="font-bold text-xs">VietQR (SePay)</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">App mọi ngân hàng</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrGateway('mock')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      qrGateway === 'mock'
                        ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <p className="font-bold text-xs">MockGateway</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Giả lập localhost</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrGateway('momo')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      qrGateway === 'momo'
                        ? 'border-pink-500 bg-pink-50/50 text-pink-900 ring-2 ring-pink-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <p className="font-bold text-xs">Ví MoMo</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Môi trường sandbox</p>
                  </button>
                </div>
              </div>

              {/* Số tiền quét QR */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Số tiền thanh toán (VNĐ) <span className="text-rose-500">*</span>:
                  </label>
                  <button
                    type="button"
                    onClick={() => setQrAmount(String(remaining))}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                  >
                    Thu đủ ({formatCurrency(remaining)})
                  </button>
                </div>
                <input
                  type="number"
                  value={qrAmount}
                  onChange={(e) => setQrAmount(e.target.value)}
                  placeholder="Nhập số tiền..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold bg-white text-slate-900 focus:outline-hidden focus:ring-2 ${
                    fieldErrors.qrAmount ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-emerald-500/20'
                  }`}
                  min="1000"
                  max={remaining}
                  step="1000"
                />
                {fieldErrors.qrAmount && (
                  <p className="text-xs text-rose-600">{fieldErrors.qrAmount}</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
                <p>• Mã QR sẽ có hiệu lực trong 15 phút kể từ khi tạo.</p>
                <p>• Sau khi khách quét mã và chuyển tiền, hệ thống tự động cập nhật hóa đơn ngay lập tức.</p>
              </div>

              {/* Nút hành động */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Đang tạo mã...' : 'Tạo mã thanh toán QR'}</span>
                </button>
              </div>
            </form>
          )}

          {/* FORM TAB 2: NHẬP TAY (NHÂN VIÊN) */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* Số tiền thanh toán */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Số tiền thanh toán (VNĐ) <span className="text-rose-500">*</span>:
                  </label>
                  <button
                    type="button"
                    onClick={() => setManualAmount(String(remaining))}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                  >
                    Thu đủ ({formatCurrency(remaining)})
                  </button>
                </div>
                <input
                  type="number"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="Nhập số tiền..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold bg-white text-slate-900 focus:outline-hidden focus:ring-2 ${
                    fieldErrors.amount ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-emerald-500/20'
                  }`}
                  min="1"
                  max={remaining}
                  step="any"
                />
                {fieldErrors.amount && (
                  <p className="text-xs text-rose-600">{fieldErrors.amount}</p>
                )}
              </div>

              {/* Phương thức thanh toán */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Phương thức thanh toán <span className="text-rose-500">*</span>:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="momo">Ví điện tử MoMo</option>
                  <option value="zalopay">Ví điện tử ZaloPay</option>
                </select>
              </div>

              {/* Ngày thanh toán */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Ngày thanh toán <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="datetime-local"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Mã tham chiếu */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Mã tham chiếu / Số biên nhận ngân hàng:
                </label>
                <input
                  type="text"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder="VD: FT241028123456..."
                  maxLength={100}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Ghi chú */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Ghi chú:</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú thêm về khoản thu này..."
                  maxLength={500}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Nút hành động */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Đang ghi nhận...' : 'Xác nhận ghi nhận'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
