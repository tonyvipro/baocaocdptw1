import React from 'react';
import { Wallet, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

export const formatVndNumber = (val) => {
  const num = Number(val || 0);
  return new Intl.NumberFormat('vi-VN').format(Math.round(num));
};

export default function DepositSummaryCards({
  summary = {},
  loading = false,
  activeStatus = 'all',
  onSelectStatus,
}) {
  const cards = [
    {
      id: 'all',
      title: 'Tổng tiền cọc hiện có',
      value: `${formatVndNumber(summary.total_held_amount)} VNĐ`,
      subtitle: 'Tổng số tiền cọc đang giữ (HELD)',
      icon: Wallet,
      iconBg: 'bg-blue-100 text-blue-600',
      activeRing: 'ring-2 ring-blue-600 border-blue-500 bg-blue-50/40',
      valueColor: 'text-slate-900',
    },
    {
      id: 'collected_any',
      title: 'Đã thu',
      value: `${summary.collected_count ?? 0} cọc`,
      subtitle: 'Khoản cọc đã phát sinh thu (> 0đ)',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100 text-emerald-600',
      activeRing: 'ring-2 ring-emerald-600 border-emerald-500 bg-emerald-50/40',
      valueColor: 'text-emerald-700',
    },
    {
      id: 'held_any',
      title: 'Đang giữ',
      value: `${summary.holding_count ?? 0} cọc`,
      subtitle: 'Khoản cọc có số dư đang giữ (> 0đ)',
      icon: ShieldCheck,
      iconBg: 'bg-indigo-100 text-indigo-600',
      activeRing: 'ring-2 ring-indigo-600 border-indigo-500 bg-indigo-50/40',
      valueColor: 'text-indigo-700',
    },
    {
      id: 'refund_due',
      title: 'Cần hoàn trả',
      value: `${summary.refund_due_count ?? 0} cọc đến hạn`,
      subtitle:
        summary.refund_due_amount > 0
          ? `Tổng đến hạn: ${formatVndNumber(summary.refund_due_amount)} VNĐ`
          : 'Hợp đồng hết hạn / thanh lý cần hoàn cọc',
      icon: AlertTriangle,
      iconBg: 'bg-rose-100 text-rose-600',
      activeRing: 'ring-2 ring-rose-600 border-rose-500 bg-rose-50/40',
      valueColor: 'text-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeStatus === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectStatus && onSelectStatus(isActive && card.id !== 'all' ? 'all' : card.id)}
            className={`text-left p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-start justify-between gap-3 ${
              isActive ? card.activeRing : 'hover:border-slate-300'
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {card.title}
              </p>
              {loading ? (
                <div className="h-7 w-36 bg-slate-200 rounded-lg animate-pulse mt-2" />
              ) : (
                <p className={`text-xl font-black mt-1.5 truncate ${card.valueColor}`}>
                  {card.value}
                </p>
              )}
              <p className="text-[11px] text-slate-500 mt-1 truncate">{card.subtitle}</p>
            </div>
            <div className={`p-3 rounded-xl shrink-0 ${card.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

