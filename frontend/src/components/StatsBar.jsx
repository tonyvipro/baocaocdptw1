import React from 'react';
import { Building2, KeyRound, Users, ShieldCheck } from 'lucide-react';

export default function StatsBar({ totalCount, rentCount, saleCount }) {
  const stats = [
    { label: 'Tổng Bất Động Sản', value: totalCount, icon: Building2, desc: 'Được kiểm duyệt pháp lý' },
    { label: 'Căn Hộ Cho Thuê', value: rentCount, icon: KeyRound, desc: 'Dọn vào ở ngay' },
    { label: 'BĐS Chuyển Nhượng / Bán', value: saleCount, icon: ShieldCheck, desc: 'Sổ hồng trao tay' },
    { label: 'Khách Hàng Hài Lòng', value: '99.8%', icon: Users, desc: 'Dịch vụ hỗ trợ 24/7' },
  ];

  return (
    <div className="relative -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-3.5 p-2 sm:p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{item.value}</p>
                <p className="text-xs font-semibold text-slate-700">{item.label}</p>
                <p className="text-[11px] text-slate-400 hidden sm:block">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
