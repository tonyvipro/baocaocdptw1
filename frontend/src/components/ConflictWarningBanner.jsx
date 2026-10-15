import React from 'react';
import { AlertTriangle, RefreshCw, Lock, X } from 'lucide-react';

export default function ConflictWarningBanner({
  conflictEvent,
  onReload,
  onDismiss,
  entityName = 'Dữ liệu'
}) {
  if (!conflictEvent) return null;

  const actionText = conflictEvent.action === 'create' 
    ? 'được thêm mới' 
    : conflictEvent.action === 'delete' 
      ? 'bị xóa' 
      : 'được cập nhật';

  return (
    <div className="relative mb-5 p-4 rounded-2xl bg-amber-950/90 border-2 border-amber-500/70 shadow-2xl backdrop-blur-xl animate-fade-in text-amber-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Lock className="w-3 h-3" /> Chống xung đột dữ liệu đa tab
              </span>
              <span className="text-xs text-amber-400 font-mono">
                {conflictEvent.timestamp ? new Date(conflictEvent.timestamp).toLocaleTimeString('vi-VN') : ''}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-1">
              {entityName} vừa {actionText} ở một phiên làm việc khác!
            </h4>
            <p className="text-xs text-amber-200/90 mt-0.5">
              Để tránh xung đột dữ liệu (race conditions) hoặc ghi đè thông tin cũ, các nút chức năng <strong className="text-white">Thêm / Sửa / Xóa đã được tạm khóa</strong>. Vui lòng tải lại dữ liệu để đồng bộ phiên bản mới nhất.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
          <button
            onClick={onReload}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/50 border border-amber-400/50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>TẢI LẠI DỮ LIỆU NGAY</span>
          </button>
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              title="Đóng thông báo"
              className="p-2 rounded-xl bg-amber-900/50 hover:bg-amber-900 text-amber-300 border border-amber-700/50 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
