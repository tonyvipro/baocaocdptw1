import React, { useState, useEffect } from 'react';
import {
  X, FileText, Download, Eye, Edit3, Trash2, Plus,
  Loader2, ShieldCheck, AlertCircle, FileCheck, Calendar,
  Building, User, FolderOpen
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchContractDocsThunk,
  deleteContractDocThunk,
} from '../store/slices/contractDocumentSlice';
import DocumentPreviewModal from './DocumentPreviewModal';
import EditContractDocumentModal from './EditContractDocumentModal';
import UploadContractDocumentModal from './UploadContractDocumentModal';
import { contractDocumentApi } from '../services/contractDocumentApi';

export default function ContractDocumentListModal({
  isOpen,
  onClose,
  contract,
  currentUser,
}) {
  const dispatch = useDispatch();
  const { activeContractDocs, docsLoading, docsError, actionLoading } = useSelector(
    (state) => state.contractDocument
  );

  const [previewDoc, setPreviewDoc] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (isOpen && contract) {
      dispatch(fetchContractDocsThunk({ contractId: contract.id }));
      setDeleteError('');
    }
  }, [isOpen, contract?.id]);

  if (!isOpen || !contract) return null;

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

  const handleConfirmDelete = async () => {
    if (!deleteConfirmDoc) return;
    setDeleteError('');
    const result = await dispatch(deleteContractDocThunk({
      documentId: deleteConfirmDoc.id,
      contractId: contract.id,
    }));

    if (deleteContractDocThunk.fulfilled.match(result)) {
      setDeleteConfirmDoc(null);
    } else {
      setDeleteError(result.payload?.message || 'Không thể xóa tài liệu này.');
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 0: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 1: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 2: return 'bg-purple-100 text-purple-800 border-purple-200';
      case 3: return 'bg-amber-100 text-amber-800 border-amber-200';
      case 4: return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/20">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Hồ Sơ Tài Liệu Hợp Đồng</h3>
                <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded text-blue-300 font-semibold">
                  {contract.contract_code}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {contract.contract_name || 'Hợp đồng thuê'} • Khách hàng: {contract.customer?.name || 'Chưa rõ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm tài liệu</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contract Quick Meta Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 text-slate-600">
            <span>BĐS: <strong className="text-slate-800">{contract.property?.title || contract.property_title || 'N/A'}</strong></span>
            <span>Hiệu lực: <strong className="text-slate-800">{contract.start_date} → {contract.end_date}</strong></span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 mr-2">Tổng số tài liệu:</span>
            <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-bold rounded-full text-xs">
              {activeContractDocs.length} tệp
            </span>
          </div>
        </div>

        {/* Body / Documents List */}
        <div className="flex-1 overflow-y-auto p-6">
          {docsLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-medium">Đang tải danh sách tài liệu...</p>
            </div>
          ) : docsError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center text-xs text-red-600">
              <AlertCircle className="w-6 h-6 mx-auto mb-1 text-red-500" />
              <span>{docsError}</span>
            </div>
          ) : activeContractDocs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-700 text-sm mb-1">Chưa có tài liệu nào</h4>
              <p className="text-xs text-slate-400 mb-4 max-w-sm">
                Hợp đồng này chưa có tệp đính kèm nào được lưu trữ. Hãy nhấn "Thêm tài liệu" để bắt đầu tải lên.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tải lên tài liệu ngay</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeContractDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 flex items-center justify-center shrink-0 border border-slate-200 transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={doc.title}>
                          {doc.title}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getTypeBadgeClass(doc.document_type)}`}>
                          {doc.document_type_label}
                        </span>
                        {doc.extension_id && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            Phụ lục #{doc.extension_id}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5" title={doc.original_name}>
                        Tên gốc: {doc.original_name}
                      </p>

                      {doc.description && (
                        <p className="text-[11px] text-slate-600 italic mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                          {doc.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                        <span>Dung lượng: <strong className="text-slate-600">{doc.file_size_formatted}</strong></span>
                        <span>•</span>
                        <span>Người tải: <strong className="text-slate-600">{doc.uploaded_by?.name || 'Hệ thống'}</strong></span>
                        <span>•</span>
                        <span>Ngày: {doc.created_at_formatted}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                      title="Xem trước tài liệu"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                      title="Tải về máy"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingDoc(doc)}
                      className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                      title="Sửa thông tin"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteError('');
                        setDeleteConfirmDoc(doc);
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Hệ thống phân quyền: Chỉ nhân viên phụ trách hoặc Admin có quyền thao tác</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
          isCustomer={false}
        />
      )}

      {/* Edit Metadata Modal */}
      {editingDoc && (
        <EditContractDocumentModal
          isOpen={!!editingDoc}
          onClose={() => setEditingDoc(null)}
          document={editingDoc}
        />
      )}

      {/* Upload Modal (Preselected this contract) */}
      {showUploadModal && (
        <UploadContractDocumentModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          preselectedContract={contract}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-center text-slate-900 mb-1">
              Xác Nhận Xóa Tài Liệu?
            </h4>
            <p className="text-xs text-center text-slate-500 mb-4">
              Bạn có chắc chắn muốn xóa tệp: <strong className="text-slate-800">{deleteConfirmDoc.title}</strong>? Tài liệu sẽ được chuyển vào thùng rác mềm.
            </p>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmDoc(null)}
                disabled={actionLoading === deleteConfirmDoc.id}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading === deleteConfirmDoc.id}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading === deleteConfirmDoc.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác nhận xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
