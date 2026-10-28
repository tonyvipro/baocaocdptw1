import React, { useState, useEffect } from 'react';
import {
  X, Clock, CheckCircle2, XCircle, AlertCircle, Calendar, DollarSign,
  User, FileText, ArrowRight, ExternalLink, ShieldCheck, RefreshCw, AlertTriangle
} from 'lucide-react';
import { contractExtensionApi } from '../services/contractExtensionApi';

export default function ContractExtensionHistoryModal({ contract, onClose, currentUser, onRefreshList }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModalExt, setRejectModalExt] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const isAdmin = currentUser && Number(currentUser.role_id) === 1;

  useEffect(() => {
    if (contract?.id) {
      loadHistory();
    }
  }, [contract]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await contractExtensionApi.getHistoryByContract(contract.id);
      setHistory(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử gia hạn:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (extId) => {
    if (!window.confirm('Xác nhận PHÊ DUYỆT yêu cầu gia hạn này? Thời hạn hợp đồng và giá thuê mới sẽ được áp dụng ngay lập tức.')) {
      return;
    }

    setActionLoading(extId);
    try {
      await contractExtensionApi.approveExtension(extId);
      alert('Phê duyệt yêu cầu gia hạn thành công!');
      loadHistory();
      if (onRefreshList) onRefreshList();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Không thể phê duyệt yêu cầu.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRejectModal = (ext) => {
    setRejectModalExt(ext);
    setRejectReason('');
    setRejectError('');
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối yêu cầu gia hạn.');
      return;
    }

    setActionLoading(rejectModalExt.id);
    try {
      await contractExtensionApi.rejectExtension(rejectModalExt.id, {
        reject_reason: rejectReason.trim()
      });
      alert('Đã từ chối yêu cầu gia hạn.');
      setRejectModalExt(null);
      loadHistory();
      if (onRefreshList) onRefreshList();
    } catch (err) {
      setRejectError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelExtension = async (extId) => {
    if (!window.confirm('Bạn có chắc chắn muốn rút / hủy yêu cầu gia hạn này?')) {
      return;
    }

    setActionLoading(extId);
    try {
      await contractExtensionApi.cancelExtension(extId, {
        reason: 'Người tạo chủ động rút yêu cầu'
      });
      alert('Đã hủy yêu cầu gia hạn thành công.');
      loadHistory();
      if (onRefreshList) onRefreshList();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatVnd = (amount) => {
    if (!amount && amount !== 0) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 0:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" /> Bản nháp
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> Chờ duyệt
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã duyệt
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Bị từ chối
          </span>
        );
      case 4:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-dialog-layer fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="form-surface bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Lịch Sử Gia Hạn Hợp Đồng
                </span>
                <span className="text-xs font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {contract?.contract_code}
                </span>
              </div>
              <h2 className="text-base font-black text-white mt-0.5 line-clamp-1">
                {contract?.contract_name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-semibold">Đang tải lịch sử gia hạn...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Chưa có lịch sử gia hạn</h3>
              <p className="text-xs text-slate-400 mt-1">
                Hợp đồng này chưa có bản ghi hoặc phụ lục gia hạn nào được ghi nhận.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((ext, idx) => (
                <div
                  key={ext.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4 relative overflow-hidden"
                >
                  {/* Status & ID Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Lần #{history.length - idx} (ID: {ext.id})
                      </span>
                      {getStatusBadge(ext.status)}
                      <span className="text-xs font-bold text-slate-700">
                        {ext.extension_type_label || 'Gia hạn hợp đồng'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Tạo: {formatDate(ext.created_at)}</span>
                      {ext.creator && (
                        <span>• Bởi {ext.creator.name}</span>
                      )}
                    </div>
                  </div>

                  {/* Changes Overview Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Thời Gian Gia Hạn
                      </span>
                      <span className="text-xs font-extrabold text-blue-700">
                        {ext.duration_months ? `${ext.duration_months} Tháng (${ext.duration_months / 12 >= 1 ? `${ext.duration_months / 12} năm` : ''})` : '—'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Thời Hạn Hiệu Lực Mới
                      </span>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1 truncate">
                        <span>{formatDate(ext.new_start_date)}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-emerald-700">{formatDate(ext.new_end_date)}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Giá Thuê Mới
                      </span>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1 truncate">
                        <span className="line-through text-slate-400 text-[11px]">
                          {formatVnd(ext.old_rental_price)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-emerald-700 font-black">
                          {formatVnd(ext.new_rental_price || ext.old_rental_price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reason & Notes */}
                  {ext.reason && (
                    <div className="text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <strong className="text-slate-800 block mb-0.5 font-bold">Lý do gia hạn:</strong>
                      <p className="whitespace-pre-line leading-relaxed">{ext.reason}</p>
                    </div>
                  )}

                  {/* Approval / Rejection Info */}
                  {ext.status === 2 && ext.approver && (
                    <div className="text-xs text-emerald-800 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200/60 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Đã được phê duyệt bởi <strong>{ext.approver.name}</strong> vào ngày {formatDate(ext.approved_at)}.
                      </span>
                    </div>
                  )}

                  {ext.status === 3 && (
                    <div className="text-xs text-rose-800 bg-rose-50/80 p-3 rounded-xl border border-rose-200/60 flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Yêu cầu bị từ chối</strong>
                        {ext.reject_reason && (
                          <p className="mt-0.5 text-rose-700">Lý do: {ext.reject_reason}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Documents List */}
                  {ext.documents && ext.documents.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Tài liệu phụ lục đính kèm ({ext.documents.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {ext.documents.map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.file_url || `/storage/${doc.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors border border-slate-200/80"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span className="truncate max-w-[200px]">
                              {doc.original_name || doc.file_name}
                            </span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar for Pending Requests */}
                  {ext.status === 1 && (
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenRejectModal(ext)}
                            disabled={actionLoading === ext.id}
                            className="px-3.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors disabled:opacity-50"
                          >
                            Từ Chối Yêu Cầu
                          </button>
                          <button
                            onClick={() => handleApprove(ext.id)}
                            disabled={actionLoading === ext.id}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {actionLoading === ext.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                            <span>Phê Duyệt Gia Hạn</span>
                          </button>
                        </>
                      )}

                      {(isAdmin || (currentUser && Number(ext.created_by) === Number(currentUser.id))) && (
                        <button
                          onClick={() => handleCancelExtension(ext.id)}
                          disabled={actionLoading === ext.id}
                          className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          Rút Yêu Cầu
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Reject Reason Sub-modal */}
      {rejectModalExt && (
        <div className="app-dialog-layer fixed inset-0 z-[70] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="form-surface bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Từ Chối Yêu Cầu Gia Hạn #{rejectModalExt.id}
              </h3>
              <button
                onClick={() => setRejectModalExt(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Vui lòng nêu rõ lý do từ chối để nhân viên / môi giới phụ trách nắm được thông tin và trao đổi lại với khách hàng.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Lý Do Từ Chối <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối (ví dụ: Chủ nhà không đồng ý mức giá mới, thời gian gia hạn không phù hợp...)"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              {rejectError && (
                <span className="text-[11px] font-semibold text-rose-500 mt-1 block">
                  {rejectError}
                </span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalExt(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading === rejectModalExt.id}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading === rejectModalExt.id && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận từ chối</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
