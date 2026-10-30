import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  QrCode,
  ArrowUpRight,
  ExternalLink,
  History,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import depositService from '../../services/depositService';
import paymentApi from '../../services/paymentApi';
import QrPaymentModal from '../QrPaymentModal';
import { formatVndNumber } from './DepositSummaryCards';
import { renderDepositStatusBadge } from './DepositDetailDrawer';

export default function ContractDepositSummaryCard({
  contractId,
  isCustomerView = false,
  onNavigateToDeposits,
}) {
  const [deposit, setDeposit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // QR Modal cho khách hàng đóng cọc
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrCreating, setQrCreating] = useState(false);

  const loadDeposit = useCallback(async () => {
    if (!contractId) return;
    try {
      setLoading(true);
      setError('');
      const res = await depositService.fetchByContract(contractId);
      setDeposit(res.data || null);
    } catch (err) {
      setError(err.response?.data?.message || '');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    loadDeposit();
  }, [loadDeposit]);

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-white border border-slate-200 animate-pulse h-28" />
    );
  }

  if (error || !deposit) {
    return null;
  }

  const remaining = Number(deposit.remaining_to_collect || 0);
  const movements = deposit.movements || [];

  const handleOpenCustomerQr = async () => {
    if (!deposit.invoice_id || remaining <= 0) return;
    try {
      setQrCreating(true);
      const token =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `qr-${Date.now()}`;
      const res = await paymentApi.createQrPayment(deposit.invoice_id, {
        gateway: 'sepay',
        amount: remaining,
        client_token: token,
      });
      setQrData(res.data);
      setQrModalOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể khởi tạo mã QR đóng tiền cọc lúc này.');
    } finally {
      setQrCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">
                Tiền cọc hợp đồng
              </h4>
              {renderDepositStatusBadge(deposit.display_status, deposit.display_status_label)}
            </div>
            <p className="text-xs text-slate-500">
              Hóa đơn cọc: <strong>{deposit.invoice?.invoice_no || '---'}</strong> • Hạn hoàn trả dự
              kiến:{' '}
              <strong>
                {deposit.refund_due_date
                  ? new Date(deposit.refund_due_date).toLocaleDateString('vi-VN')
                  : 'Khi kết thúc HĐ'}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {remaining > 0 && Number(deposit.contract?.status) !== 3 && (
            <button
              type="button"
              disabled={qrCreating}
              onClick={handleOpenCustomerQr}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>
                {qrCreating
                  ? 'Đang tạo mã QR...'
                  : `Đóng tiền cọc QR (${formatVndNumber(remaining)} đ)`}
              </span>
            </button>
          )}

          {!isCustomerView && (
            <button
              type="button"
              onClick={() => {
                if (onNavigateToDeposits) {
                  onNavigateToDeposits(deposit);
                } else {
                  window.location.hash = `#admin/deposits?search=${encodeURIComponent(
                    deposit.contract?.contract_code || ''
                  )}`;
                }
              }}
              className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Mở Quản lý tiền cọc</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 5 chỉ số tiền cọc */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 block text-[11px]">Tiền cọc cam kết</span>
          <span className="font-black text-slate-900 text-sm">
            {formatVndNumber(deposit.required_amount)} VNĐ
          </span>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <span className="text-emerald-700 block text-[11px]">Đã đóng</span>
          <span className="font-black text-emerald-800 text-sm">
            {formatVndNumber(deposit.collected_amount)} VNĐ
          </span>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
          <span className="text-blue-700 block text-[11px]">Đã hoàn trả</span>
          <span className="font-black text-blue-800 text-sm">
            {formatVndNumber(deposit.refunded_amount)} VNĐ
          </span>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
          <span className="text-amber-700 block text-[11px]">Đã khấu trừ</span>
          <span className="font-black text-amber-800 text-sm">
            {formatVndNumber(deposit.deducted_amount)} VNĐ
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 text-white col-span-2 sm:col-span-1">
          <span className="text-slate-300 block text-[11px]">Đang giữ (HELD)</span>
          <span className="font-black text-sky-400 text-sm">
            {formatVndNumber(deposit.held_amount)} VNĐ
          </span>
        </div>
      </div>

      {/* Lịch sử biến động tiền cọc rút gọn */}
      {movements.length > 0 && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            <span>Biến động tiền cọc ({movements.length})</span>
          </p>
          <div className="space-y-1.5">
            {movements.slice(0, 5).map((mv) => {
              const isOut = mv.direction === 'out';
              return (
                <div
                  key={mv.id}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">
                      {mv.transaction_code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isOut ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {mv.type_label}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {mv.paid_at ? new Date(mv.paid_at).toLocaleDateString('vi-VN') : ''}
                    </span>
                    {mv.reason && (
                      <span className="text-[11px] text-amber-800 italic">({mv.reason})</span>
                    )}
                  </div>
                  <span
                    className={`font-bold ${
                      Number(mv.status) === 5
                        ? 'text-slate-400 line-through'
                        : isOut
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {isOut ? '-' : '+'}
                    {formatVndNumber(mv.amount)} VNĐ
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <QrPaymentModal
        isOpen={qrModalOpen}
        onClose={(isSuccess) => {
          setQrModalOpen(false);
          if (isSuccess) loadDeposit();
        }}
        qrData={qrData}
        invoice={deposit.invoice}
      />
    </div>
  );
}

