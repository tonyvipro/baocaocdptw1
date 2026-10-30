import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  Building2,
  User,
  FileText,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  FolderOpen,
  Download,
  Eye,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Receipt,
  Edit3,
} from 'lucide-react';
import { voidDepositMovementThunk } from '../../store/slices/depositsSlice';
import { formatVndNumber } from './DepositSummaryCards';

export const renderDepositStatusBadge = (status, label) => {
  const badgeMap = {
    refunded: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    holding: 'bg-blue-100 text-blue-800 border-blue-200',
    refund_due: 'bg-rose-100 text-rose-800 border-rose-200',
    partial_collected: 'bg-amber-100 text-amber-800 border-amber-200',
    partial_refunded: 'bg-amber-100 text-amber-800 border-amber-200',
    deducted: 'bg-orange-100 text-orange-800 border-orange-200',
    unpaid: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
        badgeMap[status] || badgeMap.unpaid
      }`}
    >
      {label || status}
    </span>
  );
};

export default function DepositDetailDrawer({
  isOpen,
  onClose,
  deposit,
  loading = false,
  currentUser = null,
  onOpenCollect,
  onOpenRefund,
  onOpenEdit,
  onOpenDocuments,
  onViewInvoice,
  onRefresh,
}) {
  const dispatch = useDispatch();
  const { submitting } = useSelector((state) => state.deposits);

  const [voidingTxId, setVoidingTxId] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');

  if (!isOpen) return null;

  const isAdmin = Number(currentUser?.role_id) === 1;
  const movements = deposit?.movements || [];
  const documents = (deposit?.documents || []).filter((d) =>
    [4, 6].includes(Number(d.document_type))
  );

  const handleVoidMovement = async (txId) => {
    setVoidError('');
    if (voidReason.trim().length < 3) {
      setVoidError('Vui lòng nhập lý do hủy giao dịch (ít nhất 3 ký tự).');
      return;
    }

    const res = await dispatch(
      voidDepositMovementThunk({
        transactionId: txId,
        reason: voidReason.trim(),
      })
    );

    if (voidDepositMovementThunk.fulfilled.match(res)) {
      setVoidingTxId(null);
      setVoidReason('');
      if (onRefresh) onRefresh();
    } else {
      setVoidError(res.payload?.message || 'Không thể hủy giao dịch tiền cọc.');
    }
  };

  const handlePreviewOrDownloadDoc = (docId, action = 'preview') => {
    const token = localStorage.getItem('3tv_token') || '';
    const url = `/api/contract-documents/${docId}/${action}`;
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('Không thể tải tệp chứng từ.');
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        if (action === 'preview') {
          window.open(blobUrl, '_blank');
        } else {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `chung-tu-coc-${docId}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-base uppercase tracking-tight">
                Chi tiết Khoản Tiền Cọc
              </h3>
              {deposit &&
                renderDepositStatusBadge(
                  deposit.display_status,
                  deposit.display_status_label
                )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hợp đồng:{' '}
              <strong className="text-slate-800">
                {deposit?.contract?.contract_code || '---'}
              </strong>{' '}
              | Hóa đơn cọc:{' '}
              <strong className="text-slate-800">
                {deposit?.invoice?.invoice_no || '---'}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading || !deposit ? (
            <div className="py-16 text-center text-slate-400 text-xs font-semibold">
              Đang tải thông tin chi tiết khoản tiền cọc...
            </div>
          ) : (
            <>
              {/* 1. Thông tin Hợp đồng, Căn hộ & Người thuê */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                      <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        {deposit.property?.code} - {deposit.property?.title}
                      </span>
                    </div>
                    <p className="text-slate-500 pl-6">{deposit.property?.address}</p>
                  </div>
                  {deposit.invoice_id && onViewInvoice && (
                    <button
                      type="button"
                      onClick={() => onViewInvoice(deposit.invoice_id)}
                      className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Xem hóa đơn cọc
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[11px]">Người thuê</span>
                      <span className="font-bold text-slate-800">
                        {deposit.customer?.name} ({deposit.customer?.phone || '---'})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[11px]">Thời hạn hợp đồng</span>
                      <span className="font-bold text-slate-800">
                        {deposit.contract?.start_date
                          ? new Date(deposit.contract.start_date).toLocaleDateString('vi-VN')
                          : '---'}{' '}
                        →{' '}
                        {deposit.contract?.end_date
                          ? new Date(deposit.contract.end_date).toLocaleDateString('vi-VN')
                          : '---'}
                      </span>
                    </div>
                  </div>
                </div>

                {deposit.notes && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-900 text-xs">
                    <strong>Ghi chú khoản cọc:</strong> {deposit.notes}
                  </div>
                )}
              </div>

              {/* 2. 5 Con số tài chính của khoản cọc */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">1. Cam kết</span>
                  <span className="font-black text-slate-900 text-sm mt-0.5 block">
                    {formatVndNumber(deposit.required_amount)} đ
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-emerald-700 block text-[11px]">2. Đã thu</span>
                  <span className="font-black text-emerald-800 text-sm mt-0.5 block">
                    {formatVndNumber(deposit.collected_amount)} đ
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-blue-700 block text-[11px]">3. Đã hoàn trả</span>
                  <span className="font-black text-blue-800 text-sm mt-0.5 block">
                    {formatVndNumber(deposit.refunded_amount)} đ
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-amber-700 block text-[11px]">4. Đã khấu trừ</span>
                  <span className="font-black text-amber-800 text-sm mt-0.5 block">
                    {formatVndNumber(deposit.deducted_amount)} đ
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 text-white col-span-2 sm:col-span-1">
                  <span className="text-slate-300 block text-[11px]">5. ĐANG GIỮ</span>
                  <span className="font-black text-sky-400 text-sm mt-0.5 block">
                    {formatVndNumber(deposit.held_amount)} đ
                  </span>
                </div>
              </div>

              {/* 3. Các nút hành động nhanh */}
              <div className="flex flex-wrap items-center gap-2">
                {Number(deposit.remaining_to_collect) > 0 &&
                  Number(deposit.contract?.status) !== 3 && (
                    <button
                      type="button"
                      onClick={() => onOpenCollect && onOpenCollect(deposit)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      Ghi nhận thu cọc
                    </button>
                  )}

                {isAdmin && Number(deposit.held_amount) > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenRefund && onOpenRefund(deposit)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Ghi nhận hoàn trả / khấu trừ
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onOpenEdit && onOpenEdit(deposit)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </button>

                <button
                  type="button"
                  onClick={() => onOpenDocuments && onOpenDocuments(deposit)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                  Quản lý chứng từ cọc ({documents.length})
                </button>
              </div>

              {/* 4. Sổ giao dịch tiền cọc (Thu / Hoàn trả / Khấu trừ) */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Sổ giao dịch tiền cọc ({movements.length})</span>
                </h4>

                {movements.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Chưa phát sinh giao dịch thu hay hoàn trả tiền cọc nào.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {movements.map((mv) => {
                      const isOut = mv.direction === 'out';
                      const isCancelled = Number(mv.status) === 5;
                      const canVoid =
                        isAdmin &&
                        Number(mv.status) === 1 &&
                        ['deposit_refund', 'deposit_deduction'].includes(mv.type);

                      return (
                        <div
                          key={mv.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                            isCancelled
                              ? 'bg-slate-50 border-slate-200 opacity-65'
                              : 'bg-white border-slate-200 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono font-bold text-slate-900">
                                  {mv.transaction_code}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    mv.type === 'deposit_refund'
                                      ? 'bg-blue-100 text-blue-800'
                                      : mv.type === 'deposit_deduction'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {mv.type_label}
                                </span>
                                {Number(mv.status) === 1 ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                    <CheckCircle2 className="w-3 h-3" /> Thành công
                                  </span>
                                ) : Number(mv.status) === 0 ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
                                    <Clock className="w-3 h-3" /> Chờ xử lý
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 line-through">
                                    {mv.status_label}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">
                                {mv.paid_at
                                  ? new Date(mv.paid_at).toLocaleString('vi-VN')
                                  : '---'}{' '}
                                • {mv.payment_method_label}
                                {mv.reference_code ? ` • Ref: ${mv.reference_code}` : ''}
                              </p>
                            </div>

                            <div className="text-right">
                              <span
                                className={`font-black text-sm ${
                                  isCancelled
                                    ? 'text-slate-400 line-through'
                                    : isOut
                                    ? 'text-rose-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {isOut ? '-' : '+'}
                                {formatVndNumber(mv.amount)} VNĐ
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Ghi nhận: {mv.recorder?.name || 'Hệ thống'}
                              </p>
                            </div>
                          </div>

                          {(mv.reason || mv.note || mv.failure_reason) && (
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-700 space-y-1">
                              {mv.reason && (
                                <div>
                                  <strong>Lý do:</strong> {mv.reason}
                                </div>
                              )}
                              {mv.note && (
                                <div>
                                  <strong>Ghi chú:</strong> {mv.note}
                                </div>
                              )}
                              {mv.failure_reason && (
                                <div className="text-rose-600">
                                  <strong>Lý do hủy:</strong> {mv.failure_reason}
                                </div>
                              )}
                            </div>
                          )}

                          {canVoid && (
                            <div className="pt-1 flex justify-end">
                              {voidingTxId === mv.id ? (
                                <div className="w-full p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                                  <p className="font-bold text-rose-800 text-[11px]">
                                    Nhập lý do hủy giao dịch hoàn trả/khấu trừ này:
                                  </p>
                                  {voidError && (
                                    <p className="text-[11px] text-rose-600 font-semibold">
                                      {voidError}
                                    </p>
                                  )}
                                  <input
                                    type="text"
                                    maxLength={500}
                                    value={voidReason}
                                    onChange={(e) => setVoidReason(e.target.value)}
                                    placeholder="Nhập lý do hủy (bắt buộc, tối đa 500 ký tự)..."
                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-lg"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setVoidingTxId(null);
                                        setVoidReason('');
                                        setVoidError('');
                                      }}
                                      className="px-2.5 py-1 text-xs text-slate-600"
                                    >
                                      Đóng
                                    </button>
                                    <button
                                      type="button"
                                      disabled={submitting}
                                      onClick={() => handleVoidMovement(mv.id)}
                                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                                    >
                                      {submitting ? 'Đang hủy...' : 'Xác nhận hủy giao dịch'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVoidingTxId(mv.id);
                                    setVoidReason('');
                                    setVoidError('');
                                  }}
                                  className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" /> Hủy giao dịch này
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. Danh sách chứng từ tiền cọc & biên bản bàn giao */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-600" />
                    <span>Chứng từ cọc & Biên bản bàn giao ({documents.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => onOpenDocuments && onOpenDocuments(deposit)}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    + Tải lên / Quản lý chứng từ
                  </button>
                </div>

                {documents.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Chưa có chứng từ tiền cọc hoặc biên bản bàn giao đính kèm.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate">{doc.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {doc.document_type_label} • {doc.file_size_formatted} •{' '}
                            {doc.created_at
                              ? new Date(doc.created_at).toLocaleDateString('vi-VN')
                              : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePreviewOrDownloadDoc(doc.id, 'preview')}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Xem trước"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePreviewOrDownloadDoc(doc.id, 'download')}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-blue-600 cursor-pointer"
                            title="Tải xuống"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

