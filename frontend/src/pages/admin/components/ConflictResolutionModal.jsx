import React from 'react';
import { AlertTriangle, RefreshCw, X, ShieldAlert } from 'lucide-react';

export default function ConflictResolutionModal({
  conflictData,
  onClose,
  onReloadLatest,
  onConfirmDuplicate,
  loading,
}) {
  if (!conflictData) return null;

  const isDuplicateSuspected = conflictData.code === 'DUPLICATE_SUSPECTED';
  const isStaleVersion = conflictData.code === 'STALE_VERSION';

  return (
    <div className="app-dialog-layer fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="form-surface bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleUp">
        {/* Header */}
        <div
          className={`p-5 flex items-center gap-3 border-b ${
            isDuplicateSuspected ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDuplicateSuspected
                ? 'bg-amber-100 text-amber-700 border-amber-300'
                : 'bg-rose-100 text-rose-700 border-rose-300'
            }`}
          >
            {isDuplicateSuspected ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isDuplicateSuspected ? 'Cảnh báo nghi trùng thanh toán' : 'Xung đột phiên bản dữ liệu'}
            </h3>
            <p className="text-xs text-slate-500 font-mono">Mã lỗi: {conflictData.code || '409_CONFLICT'}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {conflictData.message}
          </p>

          {isStaleVersion && conflictData.current && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span>Người sửa lần cuối:</span>
                <span className="font-bold text-slate-800">
                  {conflictData.current.updater_name || 'Quản trị viên'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian cập nhật:</span>
                <span className="font-mono text-slate-700">
                  {conflictData.current.updated_at_formatted || conflictData.current.updated_at || 'Vừa xong'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Số tiền còn nợ hiện tại:</span>
                <span className="font-bold text-blue-600">
                  {new Intl.NumberFormat('vi-VN').format(conflictData.current.remaining || 0)} VNĐ
                </span>
              </div>
            </div>
          )}

          {isDuplicateSuspected && (
            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-800">
              Hệ thống phát hiện một giao dịch có cùng số tiền và phương thức vừa được thực hiện trong 5 phút qua.
              Nếu đây là một khoản thu riêng biệt, bạn có thể chọn <strong>Vẫn ghi nhận</strong>.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Đóng
          </button>

          {isStaleVersion && (
            <button
              type="button"
              onClick={() => onReloadLatest(conflictData.current)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Tải lại dữ liệu mới</span>
            </button>
          )}

          {isDuplicateSuspected && (
            <button
              type="button"
              onClick={onConfirmDuplicate}
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Vẫn ghi nhận khoản này</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
