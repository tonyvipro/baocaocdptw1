import React from 'react';
import { X, Bed, Bath, Maximize2, Trash2, ArrowRight } from 'lucide-react';

export default function CompareDrawer({ comparedList, onRemove, onClear, onClose, onSelectProperty }) {
  if (comparedList.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t-2 border-emerald-500 shadow-2xl p-4 transition-transform">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">So Sánh Bất Động Sản ({comparedList.length}/4)</span>
            <span className="text-xs text-slate-400">Chọn tối đa 4 căn để đối chiếu chi tiết</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClear}
              className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa tất cả</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {comparedList.map((p) => {
            const isRent = p.purpose === 'rent';
            return (
              <div key={p.code} className="relative bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <button
                  onClick={() => onRemove(p)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="flex gap-2.5">
                  <img src={p.image} alt={p.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-emerald-700 truncate">{p.project}</p>
                    <p className="font-extrabold text-slate-900 truncate">{isRent ? p.price_rent_text : p.price_sale_text}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{p.area}m² • {p.bedrooms}PN • {p.bathrooms}WC</p>
                  </div>
                </div>

                <button
                  onClick={() => onSelectProperty(p)}
                  className="w-full mt-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                >
                  <span>Chi tiết</span>
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
