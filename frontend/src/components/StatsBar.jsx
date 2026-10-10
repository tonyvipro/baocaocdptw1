import React from 'react';
import { Building2, Key, Tag, ShieldCheck } from 'lucide-react';

export default function StatsBar({ totalCount, rentCount, saleCount }) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-600 font-medium">Hệ thống đang niêm yết:</span>
              <strong className="text-slate-900 font-bold">{totalCount} bất động sản</strong>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-slate-500">
              <span>•</span>
              <span>Bán & chuyển nhượng: <strong className="text-red-600">{saleCount}</strong></span>
              <span>•</span>
              <span>Căn hộ cho thuê: <strong className="text-blue-600">{rentCount}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pháp lý minh bạch</span>
            </span>
            <span className="hidden md:flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>Giá niêm yết chính chủ</span>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
