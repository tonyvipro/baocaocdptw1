import React, { useState, useEffect } from 'react';
import {
  X, Download, ZoomIn, ZoomOut, RotateCw, FileText,
  AlertCircle, Loader2, Eye, ShieldCheck, File
} from 'lucide-react';
import { contractDocumentApi } from '../services/contractDocumentApi';

/**
 * Reusable Document Preview Modal
 * Dùng chung cho cả Phần A (Nhân viên) và Phần B (Khách hàng)
 * Hỗ trợ PDF, Ảnh (JPEG, PNG), và thông báo tải về cho DOC/DOCX.
 * Sử dụng Blob URL an toàn và tự động giải phóng bộ nhớ khi đóng.
 */
export default function DocumentPreviewModal({
  isOpen,
  onClose,
  document,
  isCustomer = false,
}) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!isOpen || !document) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setZoom(100);
      setRotation(0);
      setError(null);
      return;
    }

    let active = true;
    const fetchBlob = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchMethod = isCustomer
          ? contractDocumentApi.previewMyDoc
          : contractDocumentApi.previewDoc;

        const blob = await fetchMethod(document.id);
        if (active) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Không thể xem trước tệp tài liệu này.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    // Chỉ fetch preview với PDF và Ảnh
    const ext = (document.file_extension || '').toLowerCase();
    const mime = (document.mime_type || '').toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'image/jpeg', 'image/png'].some(t => ext === t || mime.includes(t));
    const isPdf = ext === 'pdf' || mime.includes('pdf');

    if (isImage || isPdf) {
      fetchBlob();
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, document?.id]);

  if (!isOpen || !document) return null;

  const ext = (document.file_extension || '').toLowerCase();
  const mime = (document.mime_type || '').toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png'].includes(ext) || mime.startsWith('image/');
  const isPdf = ext === 'pdf' || mime.includes('pdf');
  const isWord = ['doc', 'docx'].includes(ext) || mime.includes('word');

  const handleDownload = async () => {
    try {
      const downloadMethod = isCustomer
        ? contractDocumentApi.downloadMyDoc
        : contractDocumentApi.downloadDoc;

      const blob = await downloadMethod(document.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.original_name || document.title || 'tai-lieu';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      alert('Tải xuống thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-blue-400 shrink-0">
              {isPdf ? <FileText className="w-5 h-5 text-red-400" /> : isImage ? <Eye className="w-5 h-5 text-emerald-400" /> : <File className="w-5 h-5 text-blue-400" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate" title={document.title || document.original_name}>
                {document.title || document.original_name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="font-semibold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded text-[11px]">
                  {document.document_type_label || 'Tài liệu'}
                </span>
                <span>•</span>
                <span>{document.file_size_formatted || ''}</span>
                {document.contract_code && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">HĐ: {document.contract_code}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Image zoom & rotate controls */}
            {isImage && blobUrl && (
              <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-lg p-1 mr-2 text-slate-300">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-white/20 rounded hover:text-white transition-colors"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs px-1 font-mono">{zoom}%</span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-white/20 rounded hover:text-white transition-colors"
                  title="Phóng to"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1.5 hover:bg-white/20 rounded hover:text-white transition-colors ml-1"
                  title="Xoay 90 độ"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tải về</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-sm font-semibold">Đang nạp dữ liệu xem trước bảo mật...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-6 text-center max-w-md bg-white rounded-xl shadow-sm border border-red-200">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-base mb-1">Không thể hiển thị tài liệu</h4>
              <p className="text-xs text-slate-600 mb-4">{error}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Tải về để mở trực tiếp
              </button>
            </div>
          )}

          {!loading && !error && isPdf && blobUrl && (
            <iframe
              src={blobUrl}
              title={document.title || 'PDF Preview'}
              className="w-full h-full border-0"
            />
          )}

          {!loading && !error && isImage && blobUrl && (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              <img
                src={blobUrl}
                alt={document.title || 'Preview'}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
                className="rounded shadow-md select-none"
              />
            </div>
          )}

          {!loading && !error && isWord && (
            <div className="p-8 text-center max-w-md bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base mb-1.5">Tệp Microsoft Word ({ext.toUpperCase()})</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-5">
                Định dạng tệp này không hỗ trợ hiển thị trực tiếp trong trình duyệt web để đảm bảo độ chính xác của bảng biểu và font chữ. Quý khách vui lòng tải về để xem bằng Microsoft Word hoặc ứng dụng tương đương.
              </p>
              <button
                onClick={handleDownload}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Tải tệp Word về máy ({document.file_size_formatted})
              </button>
            </div>
          )}

          {!loading && !error && !isPdf && !isImage && !isWord && (
            <div className="p-8 text-center max-w-md bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
                <File className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base mb-1.5">Tệp tài liệu ({ext.toUpperCase()})</h4>
              <p className="text-xs text-slate-500 mb-5">
                Vui lòng tải tệp về máy tính hoặc điện thoại để mở bằng ứng dụng tương thích.
              </p>
              <button
                onClick={handleDownload}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Tải tài liệu về máy ({document.file_size_formatted})
              </button>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Tài liệu được bảo vệ và mã hóa truyền phát qua giao thức Sanctum an toàn</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Ngày tải: {document.created_at_formatted || '—'}</span>
            {document.uploaded_by?.name && (
              <span>• Người tải: <strong className="text-slate-700">{document.uploaded_by.name}</strong></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
