import React, { useState, useEffect } from 'react';
import { X, Edit3, Loader2, Save, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateDocMetadataThunk } from '../store/slices/contractDocumentSlice';
import { DOCUMENT_TYPES } from './UploadContractDocumentModal';

export default function EditContractDocumentModal({
  isOpen,
  onClose,
  document,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((state) => state.contractDocument);

  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState(0);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && document) {
      setTitle(document.title || document.original_name || '');
      setDocumentType(Number(document.document_type) || 0);
      setDescription(document.description || '');
      setError('');
    }
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const isSaving = actionLoading === document.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Tiêu đề tài liệu không được để trống.');
      return;
    }

    setError('');
    const result = await dispatch(updateDocMetadataThunk({
      documentId: document.id,
      payload: {
        title: title.trim(),
        document_type: Number(documentType),
        description: description.trim() || null,
      },
    }));

    if (updateDocMetadataThunk.fulfilled.match(result)) {
      if (onSuccess) onSuccess(result.payload);
      onClose();
    } else {
      setError(result.payload || 'Không thể cập nhật tài liệu.');
    }
  };

  return (
    <div className="app-dialog-layer fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="form-surface bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Chỉnh Sửa Thông Tin Tài Liệu</h3>
              <p className="text-[11px] text-slate-300">Tệp: {document.original_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề hiển thị <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phân loại tài liệu <span className="text-red-500">*</span>
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi chú mô tả
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú chi tiết về tài liệu..."
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
