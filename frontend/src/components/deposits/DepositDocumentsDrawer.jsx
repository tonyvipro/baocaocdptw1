import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  FolderOpen,
  Upload,
  Eye,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import contractDocumentApi from '../../services/contractDocumentApi';

export default function DepositDocumentsDrawer({
  isOpen,
  onClose,
  deposit,
  currentUser = null,
  onChanged,
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Upload form
  const [files, setFiles] = useState([]);
  const [docType, setDocType] = useState('6'); // 6: Chứng từ tiền cọc, 4: Biên bản bàn giao/thanh lý
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [filterMode, setFilterMode] = useState('deposit_only'); // 'deposit_only' | 'all'

  const contractId = deposit?.contract_id || deposit?.contract?.id;

  const loadDocuments = useCallback(async () => {
    if (!contractId) return;
    try {
      setLoading(true);
      setError('');
      const res = await contractDocumentApi.fetchContractDocs(contractId);
      setDocuments(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách chứng từ.');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    if (isOpen && contractId) {
      loadDocuments();
      setFiles([]);
      setTitle('');
      setDescription('');
      setUploadSuccess('');
      setError('');
    }
  }, [isOpen, contractId, loadDocuments]);

  if (!isOpen || !deposit) return null;

  const displayedDocs =
    filterMode === 'deposit_only'
      ? documents.filter((d) => [4, 6].includes(Number(d.document_type)))
      : documents;

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setUploadSuccess('');

    if (!files || files.length === 0) {
      setError('Vui lòng chọn ít nhất 1 tệp chứng từ (PDF, JPG, PNG, DOC, DOCX <= 10MB).');
      return;
    }

    const formData = new FormData();
    files.forEach((f) => formData.append('files[]', f));
    formData.append('document_type', docType);
    if (title.trim()) formData.append('title', title.trim());
    if (description.trim()) formData.append('description', description.trim());

    try {
      setUploading(true);
      const res = await contractDocumentApi.uploadDocs(contractId, formData);
      setUploadSuccess(res.message || 'Tải lên chứng từ tiền cọc thành công!');
      setFiles([]);
      setTitle('');
      setDescription('');
      await loadDocuments();
      if (onChanged) onChanged();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Không thể tải lên chứng từ. Vui lòng kiểm tra định dạng tệp.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (doc) => {
    try {
      const blob = await contractDocumentApi.previewDoc(doc.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      alert('Không thể xem trước tệp này.');
    }
  };

  const handleDownload = async (doc) => {
    try {
      const blob = await contractDocumentApi.downloadDoc(doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.original_name || `chung-tu-${doc.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert('Không thể tải xuống tệp này.');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Xác nhận xóa chứng từ "${doc.title}"?`)) return;
    try {
      await contractDocumentApi.deleteDoc(doc.id);
      await loadDocuments();
      if (onChanged) onChanged();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa chứng từ này.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base uppercase tracking-tight">
                Quản lý Chứng từ Tiền Cọc
              </h3>
              <p className="text-xs text-slate-500">
                Hợp đồng: <strong>{deposit.contract?.contract_code}</strong> •{' '}
                {deposit.property?.code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Form tải lên chứng từ cọc mới */}
          <form
            onSubmit={handleUpload}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs"
          >
            <h4 className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Tải lên biên lai thu/hoàn cọc hoặc biên bản bàn giao</span>
            </h4>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Loại chứng từ</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                >
                  <option value="6">Chứng từ tiền cọc (Biên lai thu/hoàn/UNC)</option>
                  <option value="4">Biên bản bàn giao / thanh lý</option>
                  <option value="1">Phụ lục hợp đồng</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiêu đề hiển thị (tùy chọn)
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: UNC hoàn trả tiền cọc..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Chọn tệp đính kèm (PDF, JPG, PNG, DOC, DOCX - tối đa 10MB)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {uploading ? 'Đang tải lên...' : 'Tải lên chứng từ'}
              </button>
            </div>
          </form>

          {/* Danh sách chứng từ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Danh sách tài liệu ({displayedDocs.length})
              </h4>
              <div className="flex gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilterMode('deposit_only')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                    filterMode === 'deposit_only'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Chứng từ cọc & Bàn giao
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Tất cả tài liệu HĐ ({documents.length})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Đang tải danh sách chứng từ...
              </div>
            ) : displayedDocs.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Chưa có chứng từ tiền cọc nào trong hợp đồng này.
              </div>
            ) : (
              <div className="space-y-2">
                {displayedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs hover:border-slate-300"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 truncate">{doc.title}</p>
                        <p className="text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">
                            {doc.document_type_label}
                          </span>{' '}
                          • {doc.file_size_formatted} •{' '}
                          {doc.created_at
                            ? new Date(doc.created_at).toLocaleDateString('vi-VN')
                            : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePreview(doc)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                        title="Xem trước"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-blue-600 cursor-pointer"
                        title="Tải xuống"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {(Number(currentUser?.role_id) === 1 ||
                        Number(currentUser?.role_id) === 2) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(doc)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                          title="Xóa chứng từ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
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

