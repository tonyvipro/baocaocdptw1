import React from 'react';
import { X, ArrowRight, Trash2, SlidersHorizontal } from 'lucide-react';

export default function CompareDrawer({ comparedList, onRemove, onClear, onClose, onSelectProperty }) {
  if (comparedList.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-red-600 shadow-2xl p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-red-600" />
            <span className="font-bold text-slate-900 text-sm">Bảng So Sánh Bất Động Sản ({comparedList.length}/4)</span>
            <span className="text-xs text-slate-500 hidden sm:inline">- Chọn tối đa 4 căn để đối chiếu thông số</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClear}
              className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa tất cả</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {comparedList.map((p) => {
            const isRent = p.purpose === 'rent';
            return (
              <div key={p.code} className="relative bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => onRemove(p)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-600 cursor-pointer"
                  title="Xóa khỏi so sánh"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="flex gap-2.5">
                  <img src={p.image} alt={p.title} className="w-16 h-16 rounded-md object-cover shrink-0" />
                  <div className="flex-1 overflow-hidden pr-4">
                    <p className="font-bold text-slate-900 truncate">{p.project}</p>
                    <p className="font-extrabold text-red-600 truncate mt-0.5">{isRent ? p.price_rent_text : p.price_sale_text}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{p.area}m² • {p.bedrooms}PN • {p.bathrooms}WC</p>
                  </div>
                </div>

                <button
                  onClick={() => onSelectProperty(p)}
                  className="w-full mt-2 py-1.5 bg-slate-900 hover:bg-red-600 text-white rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
