import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  fetchPayableInvoicesThunk,
  recordPaymentThunk,
  clearConflictData,
  clearRecordError,
} from '../../../store/slices/rentPaymentsSlice';
import ConflictResolutionModal from './ConflictResolutionModal';

// Tiện ích sinh client_token UUID v4
const generateUuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Lấy thời gian hiện tại định dạng YYYY-MM-DDTHH:mm
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

export default function RecordPaymentModal({
  isOpen,
  onClose,
  initialInvoice = null,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const {
    payable,
    payableLoading,
    recordLoading,
    recordError,
    recordFieldErrors,
    conflictData,
    fieldLimits,
  } = useSelector((state) => state.rentPayments);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paidAt, setPaidAt] = useState(getCurrentDateTimeLocal());
  const [referenceCode, setReferenceCode] = useState('');
  const [note, setNote] = useState('');
  const [clientToken, setClientToken] = useState('');
  const [clientErrors, setClientErrors] = useState({});
  const [showConfirmSummary, setShowConfirmSummary] = useState(false);

  const amountInputRef = useRef(null);

  // Khi modal mở, khởi tạo client_token và chọn invoice
  useEffect(() => {
    if (isOpen) {
      setClientToken(generateUuid());
      dispatch(clearConflictData());
      dispatch(clearRecordError());
      setClientErrors({});
      setShowConfirmSummary(false);
      setPaidAt(getCurrentDateTimeLocal());

      if (initialInvoice) {
        setSelectedInvoice(initialInvoice);
        setAmountRaw(String(initialInvoice.remaining || 0));
      } else {
        setSelectedInvoice(null);
        setAmountRaw('');
        dispatch(fetchPayableInvoicesThunk(''));
      }
    }
  }, [isOpen, initialInvoice, dispatch]);

  // Cập nhật số tiền khi đổi lựa chọn hóa đơn
  const handleSelectInvoice = (inv) => {
    setSelectedInvoice(inv);
    const rem = inv.remaining || 0;
    setAmountRaw(String(rem));
    setClientErrors((prev) => ({ ...prev, invoice_id: null, amount: null }));
  };

  // Nút "Thu đủ"
  const handleFillFullAmount = () => {
    if (selectedInvoice) {
      setAmountRaw(String(selectedInvoice.remaining || 0));
      setClientErrors((prev) => ({ ...prev, amount: null }));
    }
  };

  // Format số tiền hiển thị có dấu chấm phân cách hàng nghìn
  const formatAmountInput = (val) => {
    if (!val) return '';
    const clean = val.replace(/\D/g, '');
    return clean ? new Intl.NumberFormat('vi-VN').format(clean) : '';
  };

  const handleAmountChange = (e) => {
    // Chỉ nhận chữ số
    const cleanDigits = e.target.value.replace(/\D/g, '');
    setAmountRaw(cleanDigits);

    // Kiểm tra không vượt số còn nợ
    if (selectedInvoice && cleanDigits) {
      const num = Number(cleanDigits);
      const rem = selectedInvoice.remaining || 0;
      if (num > rem) {
        setClientErrors((prev) => ({
          ...prev,
          amount: `Số tiền thanh toán vượt quá số tiền còn nợ (${new Intl.NumberFormat('vi-VN').format(rem)} VNĐ).`,
        }));
      } else if (num <= 0) {
        setClientErrors((prev) => ({
          ...prev,
          amount: 'Số tiền thanh toán phải lớn hơn 0.',
        }));
      } else {
        setClientErrors((prev) => ({ ...prev, amount: null }));
      }
    }
  };

  // Tìm kiếm danh sách hóa đơn còn nợ
  const handleSearchPayable = (e) => {
    const val = e.target.value;
    setInvoiceSearch(val);
    dispatch(fetchPayableInvoicesThunk(val));
  };

  // Kiểm tra tính hợp lệ trước khi submit
  const validateForm = () => {
    const errors = {};

    if (!selectedInvoice) {
      errors.invoice_id = 'Vui lòng chọn hóa đơn tiền thuê cần ghi nhận.';
    }

    const numAmount = Number(amountRaw);
    if (!amountRaw || numAmount <= 0) {
      errors.amount = 'Vui lòng nhập số tiền thanh toán lớn hơn 0.';
    } else if (selectedInvoice && numAmount > (selectedInvoice.remaining || 0)) {
      errors.amount = `Số tiền thanh toán vượt quá số tiền còn nợ (${new Intl.NumberFormat('vi-VN').format(selectedInvoice.remaining)} VNĐ).`;
    }

    if (!paymentMethod) {
      errors.payment_method = 'Vui lòng chọn phương thức thanh toán.';
    }

    if (!paidAt) {
      errors.paid_at = 'Vui lòng chọn ngày giờ thanh toán.';
    } else {
      const paidDate = new Date(paidAt);
      const now = new Date();
      if (paidDate > now) {
        errors.paid_at = 'Ngày giờ thanh toán không được ở tương lai.';
      }
    }

    if (referenceCode && referenceCode.length > (fieldLimits?.payment?.reference_code?.max || 100)) {
      errors.reference_code = `Mã tham chiếu không được vượt quá ${fieldLimits?.payment?.reference_code?.max || 100} ký tự.`;
    }

    if (note && note.length > (fieldLimits?.payment?.note?.max || 500)) {
      errors.note = `Ghi chú không được vượt quá ${fieldLimits?.payment?.note?.max || 500} ký tự.`;
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Xử lý gửi biểu mẫu
  const handleSubmit = async (confirmDuplicate = false) => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      version: selectedInvoice.version || 1,
      amount: Number(amountRaw),
      payment_method: paymentMethod,
      paid_at: paidAt,
      reference_code: referenceCode ? referenceCode.trim() : null,
      note: note ? note.trim() : null,
      client_token: clientToken,
      ...(confirmDuplicate ? { confirm_duplicate: true } : {}),
    };

    const resultAction = await dispatch(
      recordPaymentThunk({
        invoiceId: selectedInvoice.id,
        payload,
      })
    );

    if (recordPaymentThunk.fulfilled.match(resultAction)) {
      onSuccess?.(resultAction.payload);
      onClose();
    }
  };

  // Tải lại dữ liệu khi gặp xung đột 409 STALE_VERSION
  const handleReloadLatest = (currentInvoice) => {
    if (currentInvoice) {
      setSelectedInvoice(currentInvoice);
      // Giữ lại số tiền nếu <= số còn nợ mới
      const newRem = currentInvoice.remaining || 0;
      if (Number(amountRaw) > newRem) {
        setAmountRaw(String(newRem));
      }
    }
    dispatch(clearConflictData());
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ghi nhận thanh toán tiền thuê
                </h3>
                <p className="text-xs text-slate-500">
                  Nhập khoản tiền thuê nhà thu trực tiếp hoặc qua chuyển khoản
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4 text-sm">
            {/* Lỗi tổng quát từ server nếu có */}
            {recordError && !conflictData && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{recordError}</span>
              </div>
            )}

            {/* 1. Chọn hóa đơn tiền thuê */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hóa đơn tiền thuê <span className="text-rose-500">*</span>
              </label>

              {initialInvoice ? (
                // Nếu mở từ một dòng thì hiển thị cố định hóa đơn đó
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">
                      {selectedInvoice?.property?.code} - {selectedInvoice?.property?.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      {selectedInvoice?.customer?.name} ({selectedInvoice?.customer?.phone || 'Chưa có SĐT'}) • {selectedInvoice?.period_display}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      Số HĐ: {selectedInvoice?.invoice_no} • Version: {selectedInvoice?.version}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-medium">Còn nợ:</div>
                    <div className="text-sm font-black text-amber-600">
                      {new Intl.NumberFormat('vi-VN').format(selectedInvoice?.remaining || 0)} VNĐ
                    </div>
                  </div>
                </div>
              ) : (
                // Chọn từ danh sách hóa đơn còn nợ
                <div>
                  <div className="relative mb-2">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo căn hộ, người thuê, số hóa đơn..."
                      value={invoiceSearch}
                      onChange={handleSearchPayable}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <select
                    value={selectedInvoice?.id || ''}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const inv = payable.find((p) => p.id === id);
                      if (inv) handleSelectInvoice(inv);
                    }}
                    className={`w-full px-3 py-2 text-xs border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      clientErrors.invoice_id || recordFieldErrors.invoice_id
                        ? 'border-rose-500'
                        : 'border-slate-200'
                    }`}
                  >
                    <option value="">-- Chọn hóa đơn tiền thuê còn nợ --</option>
                    {payable.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.property?.code} - {inv.customer?.name} ({inv.period_display}) • Còn nợ: {new Intl.NumberFormat('vi-VN').format(inv.remaining)} VNĐ
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(clientErrors.invoice_id || recordFieldErrors.invoice_id) && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {clientErrors.invoice_id || recordFieldErrors.invoice_id?.[0]}
                </p>
              )}
            </div>

            {/* 2. Số tiền thanh toán */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Số tiền thanh toán (VNĐ) <span className="text-rose-500">*</span>
                </label>
                {selectedInvoice && (
                  <button
                    type="button"
                    onClick={handleFillFullAmount}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Thu đủ ({new Intl.NumberFormat('vi-VN').format(selectedInvoice.remaining || 0)} VNĐ)
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  ref={amountInputRef}
                  type="text"
                  placeholder="Nhập số tiền..."
                  value={formatAmountInput(amountRaw)}
                  onChange={handleAmountChange}
                  className={`w-full px-3 py-2.5 text-base font-black text-slate-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    clientErrors.amount || recordFieldErrors.amount
                      ? 'border-rose-500'
                      : 'border-slate-300'
                  }`}
                />
                <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">
                  VNĐ
                </span>
              </div>

              {selectedInvoice && (
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>
                    Tổng tiền: {new Intl.NumberFormat('vi-VN').format(selectedInvoice.amount || 0)} VNĐ
                  </span>
                  <span className="font-semibold text-amber-600">
                    Còn nợ: {new Intl.NumberFormat('vi-VN').format(selectedInvoice.remaining || 0)} VNĐ
                  </span>
                </div>
              )}

              {(clientErrors.amount || recordFieldErrors.amount) && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {clientErrors.amount || recordFieldErrors.amount?.[0]}
                </p>
              )}
            </div>

            {/* 3. Phương thức & Ngày giờ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phương thức <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="momo">Ví MoMo</option>
                  <option value="zalopay">Ví ZaloPay</option>
                  <option value="vnpay">Cổng VNPAY</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ngày giờ thanh toán <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  max={getCurrentDateTimeLocal()}
                  className={`w-full px-3 py-2 text-xs border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    clientErrors.paid_at || recordFieldErrors.paid_at
                      ? 'border-rose-500'
                      : 'border-slate-300'
                  }`}
                />
                {(clientErrors.paid_at || recordFieldErrors.paid_at) && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">
                    {clientErrors.paid_at || recordFieldErrors.paid_at?.[0]}
                  </p>
                )}
              </div>
            </div>

            {/* 4. Mã tham chiếu ngân hàng */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã tham chiếu ngân hàng / Bill (tùy chọn)
              </label>
              <input
                type="text"
                maxLength={fieldLimits?.payment?.reference_code?.max || 100}
                placeholder="Ví dụ: FT26298123456"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  clientErrors.reference_code || recordFieldErrors.reference_code
                    ? 'border-rose-500'
                    : 'border-slate-300'
                }`}
              />
              {(clientErrors.reference_code || recordFieldErrors.reference_code) && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {clientErrors.reference_code || recordFieldErrors.reference_code?.[0]}
                </p>
              )}
            </div>

            {/* 5. Ghi chú */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ghi chú (tùy chọn)
                </label>
                {note.length >= (fieldLimits?.payment?.note?.max || 500) * 0.8 && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {note.length}/{fieldLimits?.payment?.note?.max || 500}
                  </span>
                )}
              </div>
              <textarea
                rows={2}
                maxLength={fieldLimits?.payment?.note?.max || 500}
                placeholder="Ghi chú về khoản thanh toán này..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 font-mono truncate">
              ID: {clientToken.slice(0, 8)}...
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={recordLoading || !selectedInvoice || !amountRaw || Number(amountRaw) <= 0}
                onClick={() => handleSubmit(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recordLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận thu tiền</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal giải quyết xung đột 409 (STALE_VERSION hoặc DUPLICATE_SUSPECTED) */}
      <ConflictResolutionModal
        conflictData={conflictData}
        loading={recordLoading}
        onClose={() => dispatch(clearConflictData())}
        onReloadLatest={handleReloadLatest}
        onConfirmDuplicate={() => handleSubmit(true)}
      />
    </>
  );
}
