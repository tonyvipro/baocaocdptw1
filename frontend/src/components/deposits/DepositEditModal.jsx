import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, AlertCircle, Lock, RefreshCw, Save } from 'lucide-react';
import {
  updateDepositThunk,
  clearDepositFormState,
} from '../../store/slices/depositsSlice';
import { formatVndNumber } from './DepositSummaryCards';

export default function DepositEditModal({
  isOpen,
  onClose,
  deposit,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const { submitting, submitError, fieldErrors, conflictData } = useSelector(
    (state) => state.deposits
  );

  const [currentDeposit, setCurrentDeposit] = useState(deposit);
  const [requiredAmount, setRequiredAmount] = useState('');
  const [refundDueDate, setRefundDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen || !deposit) return;
    dispatch(clearDepositFormState());
    setCurrentDeposit(deposit);
    setRequiredAmount(String(deposit.required_amount || ''));
    setRefundDueDate(deposit.refund_due_date || deposit.contract_end_date || '');
    setNotes(deposit.notes || '');
  }, [isOpen, deposit, dispatch]);

  if (!isOpen || !currentDeposit) return null;

  const isAmountLocked = Number(currentDeposit.collected_amount || 0) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      version: currentDeposit.version,
      refund_due_date: refundDueDate || null,
      notes: notes.trim() || null,
    };

    if (!isAmountLocked) {
      payload.required_amount = Number(requiredAmount || 0);
    }

    const res = await dispatch(
      updateDepositThunk({
        id: currentDeposit.id,
        payload,
      })
    );

    if (updateDepositThunk.fulfilled.match(res)) {
      if (onSuccess) {
        onSuccess(res.payload?.message || 'Cập nhật thông tin tiền cọc thành công!');
      }
      onClose();
    }
  };

  const handleReloadStale = () => {
    if (conflictData?.current_data) {
      const fresh = conflictData.current_data;
      setCurrentDeposit(fresh);
      setRequiredAmount(String(fresh.required_amount || ''));
      setRefundDueDate(fresh.refund_due_date || fresh.contract_end_date || '');
      setNotes(fresh.notes || '');
    }
    dispatch(clearDepositFormState());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Chỉnh sửa Khoản Tiền Cọc
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hợp đồng: <strong>{currentDeposit.contract?.contract_code}</strong> •{' '}
              {currentDeposit.property?.code}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Hộp đỏ lỗi xung đột / nghiệp vụ */}
          {(submitError || conflictData) && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold">
                  {conflictData?.message || submitError}
                </span>
              </div>
              {conflictData?.code === 'STALE_VERSION' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleReloadStale}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Tải lại phiên bản mới nhất
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Số tiền cọc cam kết */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số tiền cọc cam kết (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              max="999999999999.99"
              disabled={isAmountLocked}
              value={requiredAmount}
              onChange={(e) => setRequiredAmount(e.target.value)}
              className={`w-full px-3.5 py-2 text-sm font-bold border rounded-xl ${
                isAmountLocked
                  ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                  : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            />
            {isAmountLocked && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>
                  Khoản cọc đã phát sinh giao dịch thu (
                  {formatVndNumber(currentDeposit.collected_amount)} VNĐ), không thể sửa số tiền cọc
                  cam kết.
                </span>
              </p>
            )}
            {fieldErrors?.required_amount && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.required_amount[0]}</p>
            )}
          </div>

          {/* Hạn hoàn trả dự kiến */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hạn hoàn trả dự kiến
            </label>
            <input
              type="date"
              value={refundDueDate}
              onChange={(e) => setRefundDueDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldErrors?.refund_due_date && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.refund_due_date[0]}</p>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Ghi chú khoản cọc (tối đa 1000 ký tự)
              </label>
              <span className="text-[11px] text-slate-400">{notes.length}/1000</span>
            </div>
            <textarea
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú theo dõi tiền đặt cọc..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldErrors?.notes && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.notes[0]}</p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

