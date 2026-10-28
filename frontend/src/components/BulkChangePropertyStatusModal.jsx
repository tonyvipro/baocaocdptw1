import React, { useState } from 'react';
import { 
  X, ShieldCheck, CheckCircle2, XCircle, Clock, Tag, 
  AlertTriangle, RefreshCw, Check, ArrowRight
} from 'lucide-react';

export default function BulkChangePropertyStatusModal({ 
  isOpen, 
  onClose, 
  selectedCount, 
  onConfirm 
}) {
  const [targetStatus, setTargetStatus] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const statusOptions = [
    {
      value: 1,
      label: 'Đang hiển thị (Active)',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      activeBorderClass: 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20',
      icon: CheckCircle2,
      desc: 'Công khai tất cả tin đã chọn lên trang chủ & tìm kiếm (tự động gia hạn nếu quá hạn).'
    },
    {
      value: 2,
      label: 'Đã giao dịch (Bán/Thuê)',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-300',
      activeBorderClass: 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20',
      icon: Tag,
      desc: 'Đánh dấu tất cả các BĐS đã chọn đã hoàn tất giao dịch (bán hoặc cho thuê).'
    },
    {
      value: 0,
      label: 'Chờ kiểm duyệt (Pending)',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-300',
      activeBorderClass: 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20',
      icon: Clock,
      desc: 'Đưa các tin đã chọn về danh sách chờ Ban Quản Trị duyệt lại.'
    },
    {
      value: 4,
      label: 'Tạm ẩn / Từ chối (Hidden)',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-300',
      activeBorderClass: 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20',
      icon: XCircle,
      desc: 'Tạm dừng hiển thị các tin đã chọn trên toàn hệ thống kèm lý do.'
    },
  ];

  const quickReasons = [
    'Tạm ngưng giao dịch theo yêu cầu chủ tài sản',
    'Chưa đạt tiêu chuẩn kiểm duyệt nội dung sàn',
    'Cần bổ sung hồ sơ pháp lý và kiểm tra thực tế',
    'Tin đăng trùng lặp hoặc giá không chính xác'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (targetStatus === 4 && !reason.trim()) {
      setError('Vui lòng nhập lý do khi tạm ẩn / từ chối hàng loạt.');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(targetStatus, reason.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi thực hiện thao tác hàng loạt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-dialog-layer fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn font-sans">
      <div 
        className="form-surface relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">ĐỔI TRẠNG THÁI HÀNG LOẠT</h3>
              <p className="text-[11px] text-slate-400">
                Đang áp dụng cho <strong className="text-white font-bold">{selectedCount}</strong> bất động sản đã chọn
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Chọn trạng thái đích áp dụng:
            </label>
            <div className="space-y-2">
              {statusOptions.map((opt) => {
                const isSelected = targetStatus === opt.value;
                const Icon = opt.icon;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setTargetStatus(opt.value)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? opt.activeBorderClass
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-slate-700" />
                        <span className="font-bold text-slate-800">{opt.label}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 pl-6.5">
                      {opt.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {targetStatus === 4 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-700">Lý do tạm ẩn / từ chối (*):</label>
              <div className="flex flex-wrap gap-1">
                {quickReasons.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReason(qr)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      reason === qr 
                        ? 'bg-rose-600 text-white border-rose-600 font-bold' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300'
                    }`}
                  >
                    {qr}
                  </button>
                ))}
              </div>
              <textarea
                rows="2"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do áp dụng cho các tin đã chọn..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-rose-500 font-medium"
              ></textarea>
            </div>
          )}

          {targetStatus !== 4 && (
            <div className="space-y-1 pt-1">
              <label className="font-bold text-slate-700">Ghi chú thao tác (Tùy chọn):</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ghi chú nội bộ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Áp Dụng Cho {selectedCount} BĐS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
