import React, { useState, useEffect } from 'react';
import {
  FileText, ArrowLeft, Printer, Download, Eye, Calendar,
  Building2, User, Phone, ShieldCheck, Clock, CheckCircle2,
  AlertCircle, FileCheck, History, DollarSign, MapPin, Loader2,
  Receipt, Stamp, ExternalLink, ChevronRight, Plus, Trash2,
  Edit3, X, XCircle, AlertTriangle, RefreshCw
} from 'lucide-react';
import { contractDocumentApi } from '../../services/contractDocumentApi';
import { contractExtensionApi } from '../../services/contractExtensionApi';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';
import UploadContractDocumentModal, { DOCUMENT_TYPES } from '../../components/UploadContractDocumentModal';
import EditContractDocumentModal from '../../components/EditContractDocumentModal';
import ContractA4Document, {
  convertNumberToVietnameseWords,
  formatContractDate,
  formatCurrency,
} from '../../components/ContractA4Document';

export default function AdminContractDetailPage({
  contract,
  currentUser,
  onBack,
  onRefreshList,
}) {
  const [activeViewMode, setActiveViewMode] = useState('a4'); // 'a4' | 'docs' | 'extensions'
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');

  const [extensions, setExtensions] = useState([]);
  const [extLoading, setExtLoading] = useState(false);
  const [extActionLoading, setExtActionLoading] = useState(null);

  // Modals
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [deleteDocTarget, setDeleteDocTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Reject Extension Modal
  const [rejectModalExt, setRejectModalExt] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const isAdmin = currentUser && Number(currentUser.role_id) === 1;

  useEffect(() => {
    if (contract?.id) {
      loadDocuments();
      loadExtensions();
    }
  }, [contract?.id]);

  const loadDocuments = async () => {
    setDocsLoading(true);
    setDocsError('');
    try {
      const res = await contractDocumentApi.fetchContractDocs(contract.id);
      setDocuments(res.data || []);
    } catch (err) {
      setDocsError(err.response?.data?.message || err.message || 'Lỗi khi tải tài liệu');
    } finally {
      setDocsLoading(false);
    }
  };

  const loadExtensions = async () => {
    setExtLoading(true);
    try {
      const res = await contractExtensionApi.getHistoryByContract(contract.id);
      setExtensions(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử gia hạn:', err);
    } finally {
      setExtLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async (doc) => {
    try {
      const blob = await contractDocumentApi.downloadDoc(doc.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.original_name || doc.title || 'tai-lieu';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      alert('Tải xuống thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteDoc = async () => {
    if (!deleteDocTarget) return;
    setDeleteLoading(true);
    try {
      await contractDocumentApi.deleteDoc(deleteDocTarget.id);
      setDeleteDocTarget(null);
      loadDocuments();
      if (onRefreshList) onRefreshList();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Xóa tài liệu thất bại');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApproveExtension = async (extId) => {
    if (!window.confirm('Xác nhận PHÊ DUYỆT yêu cầu gia hạn này? Thời hạn hợp đồng và giá thuê mới sẽ được áp dụng ngay lập tức.')) {
      return;
    }
    setExtActionLoading(extId);
    try {
      await contractExtensionApi.approveExtension(extId);
      alert('Phê duyệt yêu cầu gia hạn thành công!');
      loadExtensions();
      if (onRefreshList) onRefreshList();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Không thể phê duyệt yêu cầu.');
    } finally {
      setExtActionLoading(null);
    }
  };

  const handleRejectExtension = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối để thông báo cho nhân viên.');
      return;
    }
    setExtActionLoading(rejectModalExt.id);
    try {
      await contractExtensionApi.rejectExtension(rejectModalExt.id, { reason: rejectReason.trim() });
      setRejectModalExt(null);
      setRejectReason('');
      setRejectError('');
      alert('Đã từ chối yêu cầu gia hạn.');
      loadExtensions();
      if (onRefreshList) onRefreshList();
    } catch (err) {
      setRejectError(err.response?.data?.message || err.message || 'Từ chối thất bại');
    } finally {
      setExtActionLoading(null);
    }
  };

  const getTypeBadgeClass = (type) => {
    const found = DOCUMENT_TYPES.find(d => d.value === Number(type));
    return found ? found.color : 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 0:
        return { label: 'Nháp / Chờ ký', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 1:
        return { label: 'Đang hiệu lực', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 2:
        return { label: 'Đã thanh lý / Hết hạn', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 3:
        return { label: 'Đã hủy', cls: 'bg-red-100 text-red-800 border-red-200' };
      default:
        return { label: 'Đang hiệu lực', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  };

  const statusBadge = getStatusBadge(contract.status);

  return (
    <div className="min-h-full bg-slate-100/90 py-6 px-3 sm:px-6 lg:px-8">
      {/* 1. THANH ĐIỀU KHIỂN & CÔNG CỤ (Ẩn khi in ấn) */}
      <div className="max-w-5xl mx-auto mb-6 no-print space-y-4">
        {/* Breadcrumb & Navigation Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {contract.contract_code}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
              {contract.contract_name || 'Hợp đồng thuê'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                window.location.hash = '#admin/invoices';
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer"
              title="Xem các hóa đơn thanh toán của hợp đồng này"
            >
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Hóa đơn liên quan</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 transition-colors cursor-pointer"
              title="Tải lên tài liệu mới cho hợp đồng"
            >
              <Plus className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">Tải lên tài liệu</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              title="In văn bản hợp đồng khổ A4"
            >
              <Printer className="w-4 h-4" />
              <span>In Hợp Đồng (A4)</span>
            </button>
          </div>
        </div>

        {/* Tab chuyển đổi chế độ xem */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveViewMode('a4')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeViewMode === 'a4'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Văn Bản Hợp Đồng (Khổ A4)</span>
            </button>

            <button
              onClick={() => setActiveViewMode('docs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeViewMode === 'docs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Hồ Sơ Đính Kèm ({documents.length})</span>
            </button>

            <button
              onClick={() => setActiveViewMode('extensions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeViewMode === 'extensions'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-purple-600" />
              <span>Lịch Sử Gia Hạn ({extensions.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>

            {contract.is_high_value && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>HĐ Giá Trị Lớn</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. KHUNG HIỂN THỊ KHỔ GIẤY A4 CHÍNH XÁC TỪ TRÊN XUỐNG */}
      {activeViewMode === 'a4' && (
        <ContractA4Document
          contract={contract}
          currentUser={currentUser}
          showWatermark={true}
        />
      )}

      {/* 3. CHẾ ĐỘ XEM HỒ SƠ TÀI LIỆU ĐÍNH KÈM */}
      {activeViewMode === 'docs' && (
        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Hồ Sơ Tài Liệu Số Hóa Của Hợp Đồng</h3>
                <p className="text-[11px] text-slate-300">
                  Bản quét hợp đồng gốc, phụ lục gia hạn và biên bản bàn giao
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 bg-white/10 rounded-full text-blue-300">
                {documents.length} tệp tài liệu
              </span>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm tài liệu</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {docsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
                <p className="text-xs font-medium">Đang tải danh sách tài liệu...</p>
              </div>
            ) : docsError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center text-xs text-red-600">
                {docsError}
              </div>
            ) : documents.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-700">Chưa có tài liệu đính kèm số hóa nào</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Bạn có thể nhấn nút "Thêm tài liệu" ở trên để tải lên bản quét hợp đồng, phụ lục hoặc biên bản bàn giao.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={doc.title}>
                            {doc.title || doc.original_name}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getTypeBadgeClass(doc.document_type)}`}>
                            {doc.document_type_label || 'Tài liệu'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tệp: {doc.original_name} • {doc.file_size_formatted || `${Math.round((doc.file_size || 0) / 1024)} KB`} • Ngày tải: {doc.created_at_formatted || doc.created_at?.slice(0, 10)}
                          {doc.uploader && ` • Bởi: ${doc.uploader.name}`}
                        </p>
                        {doc.description && (
                          <p className="text-[11px] text-slate-500 italic mt-0.5">{doc.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Xem tài liệu"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem</span>
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Tải về máy"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải</span>
                      </button>
                      <button
                        onClick={() => setEditingDoc(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Sửa thông tin"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteDocTarget(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Xóa tài liệu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. CHẾ ĐỘ XEM LỊCH SỬ GIA HẠN */}
      {activeViewMode === 'extensions' && (
        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
          <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-purple-300" />
              <div>
                <h3 className="text-sm font-bold text-white">Lịch Sử Phụ Lục Gia Hạn Hợp Đồng</h3>
                <p className="text-[11px] text-purple-200">Các yêu cầu gia hạn và điều chỉnh thời hạn thuê</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-white/10 rounded-full text-purple-200">
              {extensions.length} lần gia hạn
            </span>
          </div>

          <div className="p-6">
            {extLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-purple-600 mb-2" />
                <p className="text-xs font-medium">Đang tải lịch sử gia hạn...</p>
              </div>
            ) : extensions.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <History className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-700">Chưa có yêu cầu gia hạn nào</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hợp đồng này chưa có phụ lục gia hạn nào được tạo.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {extensions.map((ext, idx) => {
                  const isApproved = ext.status === 1 || ext.status === 'APPROVED';
                  const isPending = ext.status === 0 || ext.status === 'PENDING' || ext.status === 'SUBMITTED';
                  const isRejected = ext.status === 2 || ext.status === 'REJECTED';

                  return (
                    <div key={ext.id || idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          {isApproved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : isRejected ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-500" />
                          )}
                          <span>Phụ lục #{ext.extension_code || `Đợt ${idx + 1}`} ({ext.created_at?.slice(0, 10) || '—'})</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isRejected
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isApproved ? 'Đã duyệt' : isRejected ? 'Từ chối' : 'Chờ duyệt'}
                          </span>
                        </div>
                        <div className="text-slate-600 mt-1 pl-6 space-y-0.5">
                          {ext.new_end_date && (
                            <p>Thời hạn mới kéo dài đến: <strong className="text-blue-600 font-bold">{ext.new_end_date}</strong></p>
                          )}
                          {ext.new_rental_price && (
                            <p>Giá thuê mới: <strong className="text-red-600 font-bold">{formatCurrency(ext.new_rental_price)} / tháng</strong></p>
                          )}
                          {ext.reason && (
                            <p className="text-slate-500 italic">Lý do: {ext.reason}</p>
                          )}
                          {ext.rejection_reason && (
                            <p className="text-red-600 italic">Lý do từ chối: {ext.rejection_reason}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {isPending && isAdmin && (
                          <>
                            <button
                              onClick={() => handleApproveExtension(ext.id)}
                              disabled={extActionLoading === ext.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              {extActionLoading === ext.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              <span>Duyệt</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalExt(ext);
                                setRejectReason('');
                                setRejectError('');
                              }}
                              disabled={extActionLoading === ext.id}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              <span>Từ chối</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
          isCustomer={false}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadContractDocumentModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          preselectedContract={contract}
          onSuccess={() => {
            setShowUploadModal(false);
            loadDocuments();
            if (onRefreshList) onRefreshList();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingDoc && (
        <EditContractDocumentModal
          isOpen={!!editingDoc}
          onClose={() => setEditingDoc(null)}
          document={editingDoc}
          onSuccess={() => {
            setEditingDoc(null);
            loadDocuments();
            if (onRefreshList) onRefreshList();
          }}
        />
      )}

      {/* Confirm Delete Doc Modal */}
      {deleteDocTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-900">Xác nhận xóa tài liệu</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa tài liệu <strong>"{deleteDocTarget.title || deleteDocTarget.original_name}"</strong> khỏi hợp đồng này không? Thao tác này không thể hoàn tác.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteDocTarget(null)}
                disabled={deleteLoading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteDoc}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Extension Modal */}
      {rejectModalExt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-sm text-slate-900">Từ chối yêu cầu gia hạn</h3>
              </div>
              <button
                onClick={() => setRejectModalExt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {rejectError && (
              <div className="p-2.5 mb-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rejectError}</span>
              </div>
            )}

            <form onSubmit={handleRejectExtension}>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối để nhân viên phụ trách nắm thông tin..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none min-h-[90px]"
                required
              />
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalExt(null)}
                  disabled={extActionLoading}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={extActionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  {extActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xác nhận từ chối</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
