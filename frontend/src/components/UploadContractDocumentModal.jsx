import React, { useState, useRef, useEffect } from 'react';
import {
  X, UploadCloud, FileText, CheckCircle2, AlertTriangle, Trash2,
  Loader2, Info, Building2, User, FileCheck, ShieldAlert
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  uploadContractDocsThunk,
  setUploadProgress,
  fetchContractsWithDocsThunk,
} from '../store/slices/contractDocumentSlice';

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_UPLOAD = 20;

export const DOCUMENT_TYPES = [
  { value: 0, label: 'Hợp đồng chính', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 1, label: 'Phụ lục gia hạn / sửa đổi', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 2, label: 'Giấy tờ tùy thân (CCCD / Passport)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 3, label: 'Giấy tờ bất động sản (Sổ đỏ / Sổ hồng)', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 4, label: 'Biên bản bàn giao / Thanh lý', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { value: 5, label: 'Khác (Hóa đơn, Chứng từ...)', color: 'bg-slate-100 text-slate-800 border-slate-200' },
];

export default function UploadContractDocumentModal({
  isOpen,
  onClose,
  preselectedContract = null,
  allContracts = [],
  onSuccess,
}) {
  const dispatch = useDispatch();
  const { uploading, uploadProgress } = useSelector((state) => state.contractDocument);

  const [selectedContractId, setSelectedContractId] = useState('');
  const [contractSearch, setContractSearch] = useState('');
  const [documentType, setDocumentType] = useState(0);
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (preselectedContract) {
        setSelectedContractId(String(preselectedContract.id));
      } else if (allContracts.length > 0 && !selectedContractId) {
        setSelectedContractId(String(allContracts[0].id));
      }
      setSelectedFiles([]);
      setValidationError('');
      setWarnings([]);
      setDescription('');
      setDocumentType(0);
      setContractSearch('');
    }
  }, [isOpen, preselectedContract]);

  if (!isOpen) return null;

  const currentContract = preselectedContract || allContracts.find(c => String(c.id) === String(selectedContractId));

  // Lọc danh sách hợp đồng cho dropdown tìm kiếm
  const filteredContracts = allContracts.filter(c => {
    if (!contractSearch) return true;
    const q = contractSearch.toLowerCase();
    return (
      (c.contract_code || '').toLowerCase().includes(q) ||
      (c.contract_name || '').toLowerCase().includes(q) ||
      (c.customer?.name || '').toLowerCase().includes(q)
    );
  });

  // Xử lý thêm tệp từ input hoặc drop
  const handleAddFiles = (fileList) => {
    setValidationError('');
    const newFiles = Array.from(fileList);
    const validFiles = [];
    const newWarnings = [...warnings];

    if (selectedFiles.length + newFiles.length > MAX_FILES_PER_UPLOAD) {
      setValidationError(`Bạn chỉ được chọn tối đa ${MAX_FILES_PER_UPLOAD} tệp trong một lần tải lên.`);
      return;
    }

    for (const file of newFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setValidationError(`Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận các định dạng: PDF, DOC, DOCX, JPG, JPEG, PNG.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setValidationError(`Tệp "${file.name}" vượt quá dung lượng tối đa 10MB (${(file.size / (1024 * 1024)).toFixed(2)}MB).`);
        return;
      }

      // Cảnh báo trùng lặp trong đợt chọn này
      const isDuplicate = selectedFiles.some(f => f.name === file.name && f.size === file.size);
      if (isDuplicate) {
        newWarnings.push(`Tệp trùng lặp: ${file.name}`);
      } else {
        validFiles.push(file);
      }
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setWarnings(newWarnings);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const targetContractId = preselectedContract?.id || selectedContractId;
    if (!targetContractId) {
      setValidationError('Vui lòng chọn hợp đồng cần bổ sung tài liệu.');
      return;
    }

    if (selectedFiles.length === 0) {
      setValidationError('Vui lòng chọn ít nhất 1 tệp tài liệu để tải lên.');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files[]', file);
    });
    formData.append('document_type', documentType);
    if (description.trim()) {
      formData.append('description', description.trim());
    }

    const result = await dispatch(uploadContractDocsThunk({
      contractId: targetContractId,
      formData,
      onProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          dispatch(setUploadProgress(percent));
        }
      },
    }));

    if (uploadContractDocsThunk.fulfilled.match(result)) {
      if (onSuccess) onSuccess(result.payload);
      onClose();
    } else {
      setValidationError(result.payload || 'Tải lên tài liệu thất bại.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="app-dialog-layer fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="form-surface bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-slate-200 my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 flex items-center justify-center text-blue-400 border border-blue-500/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tải Lên Tài Liệu Hợp Đồng Mới</h3>
              <p className="text-xs text-slate-300">Lưu trữ an toàn, hỗ trợ tối đa 20 file và 10MB/file</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          
          {/* Validation & Warning Alerts */}
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-800 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Cảnh báo trùng lặp tệp:</span>
              </div>
              {warnings.map((w, idx) => (
                <p key={idx} className="pl-6 text-[11px]">{w}</p>
              ))}
            </div>
          )}

          {/* Chọn Hợp đồng (nếu chưa preselected) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Hợp đồng mục tiêu <span className="text-red-500">*</span>
            </label>
            {preselectedContract ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{preselectedContract.contract_name || preselectedContract.contract_code}</p>
                  <p className="text-[11px] text-slate-500">Mã: {preselectedContract.contract_code} • Khách hàng: {preselectedContract.customer?.name || '—'}</p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                  Đã chọn
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Tìm theo mã HĐ, tên HĐ hoặc tên khách hàng..."
                  value={contractSearch}
                  onChange={(e) => setContractSearch(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Chọn hợp đồng cần lưu tài liệu --</option>
                  {filteredContracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.contract_code}] {c.contract_name || 'Hợp đồng'} - KH: {c.customer?.name || 'Chưa rõ'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Loại tài liệu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Phân loại tài liệu <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DOCUMENT_TYPES.map((dt) => (
                <label
                  key={dt.value}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    documentType === dt.value
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="documentType"
                    value={dt.value}
                    checked={documentType === dt.value}
                    onChange={() => setDocumentType(dt.value)}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{dt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ghi chú mô tả */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ghi chú / Mô tả chi tiết (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Bản scan có đầy đủ chữ ký 2 bên và dấu đỏ công chứng ngày 01/11..."
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Drag & Drop Upload Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tệp tài liệu đính kèm <span className="text-red-500">*</span>
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files) handleAddFiles(e.target.files);
                }}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Kéo thả nhiều tệp vào đây hoặc <span className="text-blue-600 underline">bấm để duyệt</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Hỗ trợ PDF, DOC, DOCX, JPG, PNG • Tối đa 10MB/tệp • Tối đa 20 tệp
              </p>
            </div>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                <span>Tệp đã chọn ({selectedFiles.length}):</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-red-600 hover:underline text-[11px] font-semibold"
                >
                  Xóa tất cả
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      disabled={uploading}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex justify-between text-xs font-bold text-blue-800">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang tải lên máy chủ bảo mật...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-blue-600">
                Giao dịch All-or-Nothing: Đảm bảo toàn bộ tệp được xác thực an toàn trước khi lưu.
              </p>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={uploading || selectedFiles.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải lên...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Bắt đầu tải lên ({selectedFiles.length})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
