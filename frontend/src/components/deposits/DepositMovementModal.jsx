import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  QrCode,
  RefreshCw,
  ShieldAlert,
  Building2,
  User,
} from 'lucide-react';
import {
  collectDepositThunk,
  refundDepositThunk,
  clearDepositFormState,
} from '../../store/slices/depositsSlice';
import depositService from '../../services/depositService';
import paymentApi from '../../services/paymentApi';
import QrPaymentModal from '../QrPaymentModal';
import { formatVndNumber } from './DepositSummaryCards';

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const nowLocalDatetime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

export default function DepositMovementModal({
  isOpen,
  onClose,
  initialDeposit = null,
  initialTab = 'collect', // 'collect' | 'refund'
  currentUser = null,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const { submitting, submitError, fieldErrors, conflictData } = useSelector(
    (state) => state.deposits
  );

  const isAdmin = Number(currentUser?.role_id) === 1;
  const [activeTab, setActiveTab] = useState(initialTab);

  // Danh sách khoản cọc để chọn nếu mở từ nút [GHI NHẬN THANH TOÁN MỚI] trên thanh công cụ
  const [options, setOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionSearch, setOptionSearch] = useState('');
  const [selectedDeposit, setSelectedDeposit] = useState(initialDeposit);

  // Form state - Tab Thu cọc
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState('bank_transfer');
  const [collectPaidAt, setCollectPaidAt] = useState(nowLocalDatetime());
  const [collectRef, setCollectRef] = useState('');
  const [collectNote, setCollectNote] = useState('');
  const [collectToken, setCollectToken] = useState(generateUuid());

  // Form state - Tab Hoàn trả cọc
  const [refundAmount, setRefundAmount] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('0');
  const [deductionReason, setDeductionReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('bank_transfer');
  const [refundPaidAt, setRefundPaidAt] = useState(nowLocalDatetime());
  const [refundRef, setRefundRef] = useState('');
  const [refundNote, setRefundNote] = useState('');
  const [refundToken, setRefundToken] = useState(generateUuid());
  const [confirmStep, setConfirmStep] = useState(false);
  const [localError, setLocalError] = useState('');

  // QR Modal state cho Tab Thu cọc
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrCreating, setQrCreating] = useState(false);

  const loadOptions = useCallback(
    async (mode, search = '') => {
      try {
        setOptionsLoading(true);
        const res = await depositService.fetchOptions(mode, search);
        setOptions(res.data || []);
      } catch (e) {
        console.warn('Lỗi tải danh sách khoản cọc:', e);
      } finally {
        setOptionsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    dispatch(clearDepositFormState());
    setLocalError('');
    setConfirmStep(false);

    const safeTab = !isAdmin && initialTab === 'refund' ? 'collect' : initialTab;
    setActiveTab(safeTab);
    setSelectedDeposit(initialDeposit || null);
    setCollectToken(generateUuid());
    setRefundToken(generateUuid());
    setCollectPaidAt(nowLocalDatetime());
    setRefundPaidAt(nowLocalDatetime());
    setCollectRef('');
    setCollectNote('');
    setRefundRef('');
    setRefundNote('');
    setDeductionAmount('0');
    setDeductionReason('');

    if (initialDeposit) {
      setCollectAmount(String(initialDeposit.remaining_to_collect || ''));
      setRefundAmount(String(initialDeposit.held_amount || ''));
    } else {
      setCollectAmount('');
      setRefundAmount('');
      loadOptions(safeTab, '');
    }
  }, [isOpen, initialDeposit, initialTab, isAdmin, dispatch, loadOptions]);

  // Khi đổi tab trong modal
  const handleSwitchTab = (tab) => {
    if (tab === 'refund' && !isAdmin) return;
    setActiveTab(tab);
    dispatch(clearDepositFormState());
    setLocalError('');
    setConfirmStep(false);
    if (!initialDeposit) {
      setSelectedDeposit(null);
      loadOptions(tab, optionSearch);
    }
  };

  // Khi chọn 1 khoản cọc từ dropdown
  const handleSelectDepositOption = (depId) => {
    const found = options.find((o) => Number(o.id) === Number(depId)) || null;
    setSelectedDeposit(found);
    setLocalError('');
    setConfirmStep(false);
    if (found) {
      setCollectAmount(String(found.remaining_to_collect || ''));
      setRefundAmount(String(found.held_amount || ''));
      setDeductionAmount('0');
    }
  };

  if (!isOpen) return null;

  const remainingToCollect = Number(selectedDeposit?.remaining_to_collect || 0);
  const heldAmount = Number(selectedDeposit?.held_amount || 0);
  const collectedSoFar = Number(selectedDeposit?.collected_amount || 0);
  const refundedSoFar = Number(selectedDeposit?.refunded_amount || 0);
  const deductedSoFar = Number(selectedDeposit?.deducted_amount || 0);
  const requiredAmount = Number(selectedDeposit?.required_amount || 0);

  // Kiểm tra HĐ còn hiệu lực chưa đến hạn hoàn trả (cần lý do hoàn sớm)
  const isEarlyRefund =
    selectedDeposit &&
    !selectedDeposit.is_refund_due &&
    Number(selectedDeposit.contract?.status ?? 1) === 1;

  const numRefund = Number(refundAmount || 0);
  const numDeduction = Number(deductionAmount || 0);
  const totalRefundPlusDeduction = Math.round((numRefund + numDeduction) * 100) / 100;
  const isExceedHeld = selectedDeposit && totalRefundPlusDeduction > heldAmount;

  // Xử lý GHI NHẬN THU CỌC (nhập tay)
  const handleSubmitCollect = async (e, confirmDuplicate = false) => {
    if (e) e.preventDefault();
    setLocalError('');

    if (!selectedDeposit) {
      setLocalError('Vui lòng chọn hợp đồng / khoản tiền cọc cần thu.');
      return;
    }

    const amt = Number(collectAmount || 0);
    if (amt <= 0) {
      setLocalError('Số tiền phải thu phải lớn hơn 0.');
      return;
    }
    if (amt > remainingToCollect) {
      setLocalError(
        `Số tiền thu cọc vượt quá số tiền cọc còn thiếu (${formatVndNumber(remainingToCollect)} VNĐ).`
      );
      return;
    }

    const res = await dispatch(
      collectDepositThunk({
        id: selectedDeposit.id,
        payload: {
          version: selectedDeposit.version,
          amount: amt,
          payment_method: collectMethod,
          paid_at: collectPaidAt ? new Date(collectPaidAt).toISOString() : undefined,
          reference_code: collectRef.trim() || undefined,
          note: collectNote.trim() || undefined,
          client_token: confirmDuplicate ? generateUuid() : collectToken,
          confirm_duplicate: confirmDuplicate || undefined,
        },
      })
    );

    if (collectDepositThunk.fulfilled.match(res)) {
      if (onSuccess) onSuccess(res.payload?.message || 'Ghi nhận thu/hoàn tiền cọc thành công!');
      onClose();
    }
  };

  // Xử lý tạo mã QR cho khoản thu cọc (Tái sử dụng luồng QR của Hóa đơn cọc)
  const handleOpenQrCollect = async () => {
    setLocalError('');
    if (!selectedDeposit?.invoice_id) {
      setLocalError('Khoản tiền cọc này chưa có hóa đơn liên kết để tạo mã QR.');
      return;
    }
    const amt = Number(collectAmount || remainingToCollect);
    if (amt <= 0 || amt > remainingToCollect) {
      setLocalError('Vui lòng nhập số tiền thu cọc hợp lệ trước khi tạo mã QR.');
      return;
    }

    try {
      setQrCreating(true);
      const res = await paymentApi.createQrPayment(selectedDeposit.invoice_id, {
        gateway: collectMethod === 'momo' ? 'momo' : 'sepay',
        amount: amt,
        client_token: generateUuid(),
      });
      setQrData(res.data);
      setQrModalOpen(true);
    } catch (err) {
      setLocalError(
        err.response?.data?.message || 'Không thể khởi tạo mã QR thanh toán lúc này.'
      );
    } finally {
      setQrCreating(false);
    }
  };

  // Xử lý GHI NHẬN HOÀN TRẢ / KHẤU TRỪ CỌC
  const handleSubmitRefund = async (e, confirmDuplicate = false) => {
    if (e) e.preventDefault();
    setLocalError('');

    if (!selectedDeposit) {
      setLocalError('Vui lòng chọn hợp đồng / khoản tiền cọc cần hoàn trả.');
      return;
    }

    if (totalRefundPlusDeduction <= 0) {
      setLocalError('Số tiền phải thu phải lớn hơn 0.');
      return;
    }

    if (isExceedHeld) {
      setLocalError('Số tiền cọc hoàn trả vượt quá tổng số tiền cọc đang giữ.');
      return;
    }

    if (numDeduction > 0 && !deductionReason.trim()) {
      setLocalError('Vui lòng nhập lý do khấu trừ tiền cọc.');
      return;
    }

    if (isEarlyRefund && !refundNote.trim() && !deductionReason.trim()) {
      setLocalError('Hợp đồng đang còn hiệu lực, vui lòng nhập lý do hoàn trả tiền cọc sớm vào ô Ghi chú.');
      return;
    }

    // Bước xác nhận thứ 2 nếu có hoàn tiền thực (refund_amount > 0)
    if (numRefund > 0 && !confirmStep && !confirmDuplicate) {
      setConfirmStep(true);
      return;
    }

    const res = await dispatch(
      refundDepositThunk({
        id: selectedDeposit.id,
        payload: {
          version: selectedDeposit.version,
          refund_amount: numRefund,
          deduction_amount: numDeduction,
          deduction_reason: deductionReason.trim() || undefined,
          early_refund_reason: isEarlyRefund ? refundNote.trim() : undefined,
          payment_method: refundMethod,
          paid_at: refundPaidAt ? new Date(refundPaidAt).toISOString() : undefined,
          reference_code: refundRef.trim() || undefined,
          note: refundNote.trim() || undefined,
          client_token: confirmDuplicate ? generateUuid() : refundToken,
          confirm_duplicate: confirmDuplicate || undefined,
        },
      })
    );

    if (refundDepositThunk.fulfilled.match(res)) {
      if (onSuccess) onSuccess(res.payload?.message || 'Ghi nhận thu/hoàn tiền cọc thành công!');
      onClose();
    }
  };

  // Tải lại dữ liệu mới nhất khi gặp lỗi xung đột 409 STALE_VERSION
  const handleReloadStale = () => {
    if (conflictData?.current_data) {
      const fresh = conflictData.current_data;
      setSelectedDeposit(fresh);
      setCollectAmount(String(fresh.remaining_to_collect || ''));
      setRefundAmount(String(fresh.held_amount || ''));
    }
    dispatch(clearDepositFormState());
    setConfirmStep(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Ghi nhận Thu / Hoàn trả Tiền Cọc
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mọi giao dịch tiền cọc được đồng bộ tự động với Hóa đơn và Lịch sử giao dịch
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2 Tabs: THU CỌC & HOÀN TRẢ CỌC */}
          <div className="px-6 pt-3 bg-slate-50/60 border-b border-slate-200 flex gap-2">
            <button
              type="button"
              onClick={() => handleSwitchTab('collect')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'collect'
                  ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>1. Thu tiền cọc</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleSwitchTab('refund')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'refund'
                    ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>2. Hoàn trả / Khấu trừ cọc</span>
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* HỘP ĐỎ LỖI NGHIỆP VỤ / XUNG ĐỘT NGAY TRONG MODAL */}
            {(localError || submitError || conflictData) && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-semibold">
                    {localError || conflictData?.message || submitError}
                  </div>
                </div>

                {conflictData?.code === 'STALE_VERSION' && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleReloadStale}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tải lại dữ liệu mới nhất
                    </button>
                  </div>
                )}

                {conflictData?.code === 'DUPLICATE_SUSPECTED' && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={(e) =>
                        activeTab === 'collect'
                          ? handleSubmitCollect(e, true)
                          : handleSubmitRefund(e, true)
                      }
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Tôi xác nhận đây là giao dịch mới, vẫn ghi nhận
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Chọn khoản cọc nếu chưa truyền cố định từ dòng */}
            {!initialDeposit ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Chọn Hợp đồng / Khoản tiền cọc <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={optionSearch}
                    onChange={(e) => {
                      const val = e.target.value.slice(0, 100);
                      setOptionSearch(val);
                      loadOptions(activeTab, val);
                    }}
                    placeholder="Tìm nhanh theo mã HĐ, tên khách, mã căn hộ..."
                    className="w-1/3 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={selectedDeposit?.id || ''}
                    onChange={(e) => handleSelectDepositOption(e.target.value)}
                    disabled={optionsLoading}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                  >
                    <option value="">
                      {optionsLoading
                        ? 'Đang tải danh sách khoản cọc...'
                        : activeTab === 'collect'
                        ? `-- Chọn khoản cọc còn thiếu (${options.length} khoản) --`
                        : `-- Chọn khoản cọc đang giữ (${options.length} khoản) --`}
                    </option>
                    {options.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.contract?.contract_code} | {opt.property?.code || 'BĐS'} -{' '}
                        {opt.customer?.name} |{' '}
                        {activeTab === 'collect'
                          ? `Còn thiếu: ${formatVndNumber(opt.remaining_to_collect)} đ`
                          : `Đang giữ: ${formatVndNumber(opt.held_amount)} đ`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>
                      {selectedDeposit?.property?.code} - {selectedDeposit?.property?.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Người thuê: <strong>{selectedDeposit?.customer?.name}</strong> (
                      {selectedDeposit?.customer?.phone || '---'}) | HĐ:{' '}
                      <strong>{selectedDeposit?.contract?.contract_code}</strong>
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                  {selectedDeposit?.display_status_label}
                </span>
              </div>
            )}

            {/* Khối thông tin số dư khoản cọc đang chọn */}
            {selectedDeposit && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-900 text-white rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Cọc cam kết</span>
                  <span className="font-bold text-sm">{formatVndNumber(requiredAmount)} đ</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Đã thu</span>
                  <span className="font-bold text-sm text-emerald-400">
                    {formatVndNumber(collectedSoFar)} đ
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Đã hoàn / Khấu trừ</span>
                  <span className="font-bold text-sm text-amber-300">
                    {formatVndNumber(refundedSoFar + deductedSoFar)} đ
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    {activeTab === 'collect' ? 'Còn phải thu' : 'ĐANG GIỮ (HELD)'}
                  </span>
                  <span className="font-black text-sm text-sky-400">
                    {formatVndNumber(activeTab === 'collect' ? remainingToCollect : heldAmount)} đ
                  </span>
                </div>
              </div>
            )}

            {/* ================= TAB 1: THU TIỀN CỌC ================= */}
            {activeTab === 'collect' && (
              <form onSubmit={(e) => handleSubmitCollect(e, false)} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Số tiền thu cọc (VNĐ) <span className="text-rose-500">*</span>
                    </label>
                    {selectedDeposit && remainingToCollect > 0 && (
                      <button
                        type="button"
                        onClick={() => setCollectAmount(String(remainingToCollect))}
                        className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        [Thu đủ: {formatVndNumber(remainingToCollect)} VNĐ]
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="999999999999.99"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    placeholder="Nhập số tiền thu cọc..."
                    className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {fieldErrors?.amount && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">
                      {fieldErrors.amount[0]}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phương thức thanh toán <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={collectMethod}
                      onChange={(e) => setCollectMethod(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                      <option value="cash">Tiền mặt</option>
                      <option value="sepay">Quét mã VietQR (SePay)</option>
                      <option value="momo">Ví điện tử MoMo</option>
                      <option value="zalopay">Ví điện tử ZaloPay</option>
                      <option value="vnpay">Cổng VNPAY</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ngày giờ thu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={collectPaidAt}
                      onChange={(e) => setCollectPaidAt(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã tham chiếu ngân hàng / Số biên lai (tối đa 100 ký tự)
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={collectRef}
                    onChange={(e) => setCollectRef(e.target.value)}
                    placeholder="VD: FT26303998877..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {fieldErrors?.reference_code && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.reference_code[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ghi chú (tối đa 500 ký tự)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={collectNote}
                    onChange={(e) => setCollectNote(e.target.value)}
                    placeholder="Ghi chú đợt thu tiền đặt cọc..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={!selectedDeposit || qrCreating || submitting}
                    onClick={handleOpenQrCollect}
                    className="px-4 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{qrCreating ? 'Đang tạo mã QR...' : 'Thanh toán bằng mã QR'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedDeposit || submitting || remainingToCollect <= 0}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? 'Đang ghi nhận...' : 'Ghi nhận thu cọc'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ================= TAB 2: HOÀN TRẢ / KHẤU TRỪ CỌC ================= */}
            {activeTab === 'refund' && isAdmin && (
              <form onSubmit={(e) => handleSubmitRefund(e, false)} className="space-y-4">
                {isEarlyRefund && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Lưu ý hoàn trả sớm:</strong> Hợp đồng này đang trong thời hạn hiệu lực.
                      Quản trị viên bắt buộc nhập rõ lý do hoàn trả sớm vào mục Ghi chú bên dưới.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Số tiền hoàn trả khách (VNĐ) <span className="text-rose-500">*</span>
                      </label>
                      {selectedDeposit && heldAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setRefundAmount(String(heldAmount));
                            setDeductionAmount('0');
                            setConfirmStep(false);
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          [Hoàn toàn bộ: {formatVndNumber(heldAmount)}]
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="999999999999.99"
                      value={refundAmount}
                      onChange={(e) => {
                        setRefundAmount(e.target.value);
                        setConfirmStep(false);
                      }}
                      placeholder="Nhập số tiền trả lại khách..."
                      className={`w-full px-3.5 py-2 text-sm font-bold border rounded-xl focus:outline-none focus:ring-2 ${
                        isExceedHeld
                          ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/30'
                          : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Số tiền khấu trừ giữ lại (VNĐ)
                      </label>
                      {selectedDeposit && heldAmount > 0 && numRefund < heldAmount && (
                        <button
                          type="button"
                          onClick={() => {
                            const rem = Math.max(0, heldAmount - numRefund);
                            setDeductionAmount(String(rem));
                            setConfirmStep(false);
                          }}
                          className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
                        >
                          [Khấu trừ phần còn lại]
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="999999999999.99"
                      value={deductionAmount}
                      onChange={(e) => {
                        setDeductionAmount(e.target.value);
                        setConfirmStep(false);
                      }}
                      placeholder="0"
                      className="w-full px-3.5 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Cảnh báo vượt số tiền đang giữ đúng nguyên văn dòng 19 BẢNG LỖI */}
                {isExceedHeld && (
                  <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Số tiền cọc hoàn trả vượt quá tổng số tiền cọc đang giữ.</span>
                  </p>
                )}
                {fieldErrors?.refund_amount && !isExceedHeld && (
                  <p className="text-xs font-bold text-rose-600">{fieldErrors.refund_amount[0]}</p>
                )}

                {numDeduction > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-amber-800 mb-1">
                      Lý do khấu trừ tiền cọc (bắt buộc, tối đa 500 ký tự){' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={500}
                      value={deductionReason}
                      onChange={(e) => setDeductionReason(e.target.value)}
                      placeholder="VD: Khấu trừ công nợ hóa đơn điện nước kỳ cuối và chi phí sửa chữa..."
                      className="w-full px-3 py-2 text-xs border border-amber-300 bg-amber-50/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {fieldErrors?.deduction_reason && (
                      <p className="text-xs text-rose-600 mt-1">{fieldErrors.deduction_reason[0]}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phương thức hoàn trả <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                      <option value="cash">Tiền mặt</option>
                      <option value="momo">Ví điện tử MoMo</option>
                      <option value="zalopay">Ví điện tử ZaloPay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ngày giờ hoàn trả <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={refundPaidAt}
                      onChange={(e) => setRefundPaidAt(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã tham chiếu chuyển khoản / Số chứng từ (tối đa 100 ký tự)
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={refundRef}
                    onChange={(e) => setRefundRef(e.target.value)}
                    placeholder="VD: UNC-VCB-998877..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ghi chú / Lý do hoàn trả {isEarlyRefund && <span className="text-rose-500">*</span>}
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={refundNote}
                    onChange={(e) => setRefundNote(e.target.value)}
                    placeholder="Nhập ghi chú biên bản bàn giao hoặc lý do hoàn trả..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {fieldErrors?.note && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.note[0]}</p>
                  )}
                </div>

                {/* Bước xác nhận thứ 2 trước khi hoàn tiền thực (Mục 3.6) */}
                {confirmStep && numRefund > 0 && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-300 text-xs text-blue-950 space-y-2 animate-fadeIn">
                    <div className="font-extrabold flex items-center gap-2 text-blue-800">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>XÁC NHẬN CHUYỂN TIỀN HOÀN CỌC</span>
                    </div>
                    <p className="leading-relaxed">
                      Xác nhận hoàn trả{' '}
                      <strong className="text-blue-700">{formatVndNumber(numRefund)} VNĐ</strong>
                      {numDeduction > 0
                        ? ` (và khấu trừ ${formatVndNumber(numDeduction)} VNĐ)`
                        : ''}{' '}
                      cho khách hàng <strong>{selectedDeposit?.customer?.name}</strong> (Hợp đồng{' '}
                      <strong>{selectedDeposit?.contract?.contract_code}</strong>). Bạn đã chuyển tiền
                      cho khách chưa?
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  {confirmStep && (
                    <button
                      type="button"
                      onClick={() => setConfirmStep(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Quay lại sửa
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !selectedDeposit ||
                      submitting ||
                      heldAmount <= 0 ||
                      isExceedHeld ||
                      totalRefundPlusDeduction <= 0
                    }
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold uppercase tracking-wider shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {submitting
                      ? 'Đang xử lý...'
                      : confirmStep
                      ? 'Đã chuyển tiền & Xác nhận hoàn trả'
                      : 'Ghi nhận hoàn trả / khấu trừ'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Modal QR tái sử dụng từ chức năng Thanh toán */}
      <QrPaymentModal
        isOpen={qrModalOpen}
        onClose={(isSuccess) => {
          setQrModalOpen(false);
          if (isSuccess) {
            if (onSuccess) onSuccess('Ghi nhận thu/hoàn tiền cọc thành công!');
            onClose();
          }
        }}
        qrData={qrData}
        invoice={selectedDeposit?.invoice}
      />
    </>
  );
}

