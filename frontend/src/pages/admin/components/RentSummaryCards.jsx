import React from 'react';
import { Wallet, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function RentSummaryCards({ summary, loading, activeStatus, onSelectStatus }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-100 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: 'total',
      title: 'Tổng thu tháng này',
      mainValue: summary?.total_collected_formatted || '0 VNĐ',
      subValue: `Còn phải thu: ${summary?.total_outstanding_formatted || '0 VNĐ'}`,
      icon: Wallet,
      colorClass: 'text-blue-600 bg-blue-50 border-blue-200',
      activeClass: '',
      isStatusFilter: false,
    },
    {
      id: 'paid',
      title: 'Đã thanh toán',
      mainValue: `${summary?.paid_units ?? 0} căn`,
      subValue: 'Nhấn để lọc các căn đã thanh toán',
      icon: CheckCircle2,
      colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      activeRing: 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/30',
      isStatusFilter: true,
      statusValue: 'paid',
    },
    {
      id: 'overdue',
      title: 'Quá hạn',
      mainValue: `${summary?.overdue_units ?? 0} căn`,
      subValue: 'Cần gửi nhắc nhở thu tiền ngay',
      icon: AlertCircle,
      colorClass: 'text-rose-600 bg-rose-50 border-rose-200',
      activeRing: 'ring-2 ring-rose-500 border-rose-400 bg-rose-50/30',
      isStatusFilter: true,
      statusValue: 'overdue',
    },
    {
      id: 'unpaid',
      title: 'Chưa đến hạn',
      mainValue: `${summary?.upcoming_units ?? 0} căn`,
      subValue: summary?.partial_units > 0 ? `(Gồm ${summary.partial_units} căn trả một phần)` : 'Chưa đến hạn thanh toán',
      icon: Clock,
      colorClass: 'text-amber-600 bg-amber-50 border-amber-200',
      activeRing: 'ring-2 ring-amber-500 border-amber-400 bg-amber-50/30',
      isStatusFilter: true,
      statusValue: 'upcoming',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = card.isStatusFilter && (
          activeStatus === card.statusValue || 
          (card.statusValue === 'upcoming' && ['upcoming', 'unpaid', 'partial'].includes(activeStatus))
        );

        return (
          <div
            key={card.id}
            onClick={() => {
              if (card.isStatusFilter) {
                // Nhấn vào thẻ trạng thái đang chọn thì hủy lọc, ngược lại thì lọc trạng thái đó
                onSelectStatus(isActive ? '' : card.statusValue);
              }
            }}
            className={`
              relative bg-white rounded-2xl border p-5 transition-all duration-200 shadow-sm
              ${card.isStatusFilter ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}
              ${isActive ? card.activeRing : 'border-slate-200 hover:border-slate-300'}
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${card.colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="text-2xl font-black text-slate-900 tracking-tight mb-1">
              {card.mainValue}
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-between gap-1">
              <span className="truncate">{card.subValue}</span>
              {isActive && (
                <span className="shrink-0 px-1.5 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-md">
                  Đang lọc
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
