import React, { useState, useEffect } from 'react';
import {
  X, Download, ZoomIn, ZoomOut, RotateCw, FileText,
  AlertCircle, Loader2, Eye, ShieldCheck, File, Table,
  Printer, RefreshCw, FileSpreadsheet
} from 'lucide-react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { contractDocumentApi } from '../services/contractDocumentApi';

/**
 * Lấy phần mở rộng file an toàn
 */
const getFileExtension = (doc) => {
  if (!doc) return '';
  if (doc.file_extension) return doc.file_extension.toLowerCase().replace(/^\./, '');
  const name = doc.original_name || doc.title || doc.file_url || '';
  const dotIdx = name.lastIndexOf('.');
  return dotIdx !== -1 ? name.substring(dotIdx + 1).toLowerCase() : '';
};

/**
 * Reusable Document Preview Modal
 * Hỗ trợ toàn diện xem trước cho:
 * 1. PDF (iframe nhúng)
 * 2. Ảnh (PNG, JPG, JPEG, WEBP, GIF, SVG) kèm zoom in/out, xoay 90 độ
 * 3. DOCX (Microsoft Word parse trực tiếp bằng Mammoth sang HTML)
 * 4. XLSX, XLS, CSV (Microsoft Excel parse bằng SheetJS kèm chuyển Sheet Tabs)
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
  
  // Trạng thái cho ảnh
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  // Trạng thái cho Word (DOCX)
  const [wordHtml, setWordHtml] = useState(null);
  const [wordParsing, setWordParsing] = useState(false);
  const [wordError, setWordError] = useState(null);

  // Trạng thái cho Excel (XLSX, XLS, CSV)
  const [excelSheets, setExcelSheets] = useState([]);
  const [activeSheetName, setActiveSheetName] = useState('');
  const [sheetRows, setSheetRows] = useState([]);
  const [workbookRef, setWorkbookRef] = useState(null);
  const [excelParsing, setExcelParsing] = useState(false);
  const [excelError, setExcelError] = useState(null);

  const ext = getFileExtension(document);
  const mime = (document?.mime_type || '').toLowerCase();

  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext) || mime.startsWith('image/');
  const isPdf = ext === 'pdf' || mime.includes('pdf');
  const isDocx = ext === 'docx';
  const isDoc = ext === 'doc' && !isDocx;
  const isExcel = ['xlsx', 'xls', 'csv'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv');

  // Khi chuyển activeSheetName trong Excel
  useEffect(() => {
    if (workbookRef && activeSheetName && workbookRef.Sheets[activeSheetName]) {
      try {
        const worksheet = workbookRef.Sheets[activeSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        setSheetRows(rawJson || []);
      } catch (e) {
        setSheetRows([]);
      }
    }
  }, [activeSheetName, workbookRef]);

  useEffect(() => {
    if (!isOpen || !document) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setZoom(100);
      setRotation(0);
      setError(null);
      setWordHtml(null);
      setWordError(null);
      setExcelSheets([]);
      setActiveSheetName('');
      setSheetRows([]);
      setWorkbookRef(null);
      setExcelError(null);
      return;
    }

    let active = true;

    const fetchAndProcess = async () => {
      setLoading(true);
      setError(null);
      setWordHtml(null);
      setWordError(null);
      setExcelError(null);

      try {
        const fetchMethod = isCustomer
          ? contractDocumentApi.previewMyDoc
          : contractDocumentApi.previewDoc;

        const blob = await fetchMethod(document.id);
        if (!active) return;

        // 1. Nếu là PDF hoặc Ảnh: Tạo Blob URL
        if (isPdf || isImage) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }

        // 2. Nếu là DOCX: Dùng Mammoth convert sang HTML
        if (isDocx) {
          setWordParsing(true);
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const result = await mammoth.convertToHtml(
              { arrayBuffer },
              {
                styleMap: [
                  "p[style-name='Heading 1'] => h1:fresh",
                  "p[style-name='Heading 2'] => h2:fresh",
                  "p[style-name='Heading 3'] => h3:fresh",
                  "table => table.table-auto.w-full.border-collapse.border.border-slate-300:fresh",
                  "th => th.border.border-slate-300.p-2.bg-slate-100.font-bold:fresh",
                  "td => td.border.border-slate-300.p-2:fresh",
                ],
              }
            );
            if (active) {
              setWordHtml(result.value || '<p class="text-slate-400 italic">Tài liệu không có nội dung văn bản.</p>');
            }
          } catch (err) {
            if (active) {
              setWordError('Không thể giải mã cấu trúc tệp Word này. Quý khách vui lòng tải về để mở trên máy.');
            }
          } finally {
            if (active) setWordParsing(false);
          }
        }

        // 3. Nếu là Excel (XLSX, XLS, CSV): Dùng SheetJS
        if (isExcel) {
          setExcelParsing(true);
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            if (active) {
              setWorkbookRef(workbook);
              setExcelSheets(workbook.SheetNames || []);
              if (workbook.SheetNames?.length > 0) {
                const firstSheet = workbook.SheetNames[0];
                setActiveSheetName(firstSheet);
                const rawJson = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1, defval: '' });
                setSheetRows(rawJson || []);
              }
            }
          } catch (err) {
            if (active) {
              setExcelError('Không thể đọc dữ liệu bảng tính. Quý khách vui lòng tải về để mở bằng Microsoft Excel.');
            }
          } finally {
            if (active) setExcelParsing(false);
          }
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Không thể xem trước tệp tài liệu này hoặc tệp chưa tồn tại trên máy chủ.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAndProcess();

    return () => {
      active = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, document?.id]);

  if (!isOpen || !document) return null;

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

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetZoom = () => {
    setZoom(100);
    setRotation(0);
  };

  const getDocTypeIcon = () => {
    if (isPdf) return <FileText className="w-5 h-5 text-red-400" />;
    if (isImage) return <Eye className="w-5 h-5 text-emerald-400" />;
    if (isDocx || isDoc) return <FileText className="w-5 h-5 text-blue-400" />;
    if (isExcel) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="app-dialog-layer fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-5 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="form-surface bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              {getDocTypeIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate" title={document.title || document.original_name}>
                {document.title || document.original_name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="font-semibold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded text-[11px] uppercase">
                  {ext || document.document_type_label || 'Tài liệu'}
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
                  className="p-1.5 hover:bg-white/20 rounded hover:text-white transition-colors cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="text-xs px-1.5 py-0.5 hover:bg-white/20 rounded font-mono cursor-pointer"
                  title="Đặt lại tỉ lệ 100%"
                >
                  {zoom}%
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-white/20 rounded hover:text-white transition-colors cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1.5 hover:bg-white/20 rounded hover:text-white transition-colors ml-1 cursor-pointer"
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
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
          {/* Trạng thái tải chung */}
          {loading && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-sm font-semibold">Đang nạp dữ liệu xem trước bảo mật...</p>
            </div>
          )}

          {/* Lỗi tải */}
          {!loading && error && (
            <div className="h-full flex items-center justify-center p-6">
              <div className="p-6 text-center max-w-md bg-white rounded-2xl shadow-sm border border-red-200">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-base mb-1">Không thể hiển thị tài liệu</h4>
                <p className="text-xs text-slate-600 mb-4">{error}</p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Tải về để mở trực tiếp
                </button>
              </div>
            </div>
          )}

          {/* 1. HIỂN THỊ PDF */}
          {!loading && !error && isPdf && blobUrl && (
            <iframe
              src={blobUrl}
              title={document.title || 'PDF Preview'}
              className="w-full h-full border-0"
            />
          )}

          {/* 2. HIỂN THỊ ẢNH (PNG, JPG, JPEG, WEBP, GIF, SVG) */}
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

          {/* 3. HIỂN THỊ WORD (DOCX) */}
          {!loading && !error && isDocx && (
            <div className="w-full h-full overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200/70">
              {wordParsing ? (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-500 my-auto">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-xs font-semibold">Đang chuyển đổi tài liệu Word...</span>
                </div>
              ) : wordError ? (
                <div className="my-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Chưa thể xem trực tiếp</h4>
                  <p className="text-xs text-slate-500 mb-4">{wordError}</p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Tải về tệp Word
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-slate-200 p-8 sm:p-12 min-h-full">
                  <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" /> Bản xem trước tài liệu Word
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> In trang
                    </button>
                  </div>
                  <div
                    className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm space-y-4"
                    dangerouslySetInnerHTML={{ __html: wordHtml }}
                  />
                </div>
              )}
            </div>
          )}

          {/* 4. TỆP WORD CŨ (.DOC binary) */}
          {!loading && !error && isDoc && (
            <div className="h-full flex items-center justify-center p-6">
              <div className="p-8 text-center max-w-md bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base mb-1.5">Tệp Word định dạng cũ (.DOC)</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-5">
                  Định dạng binary .DOC không hỗ trợ đọc trực tiếp an toàn trên trình duyệt. Quý khách vui lòng tải về hoặc chuyển đổi sang định dạng .DOCX chuẩn để xem trước.
                </p>
                <button
                  onClick={handleDownload}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Tải tệp Word về máy ({document.file_size_formatted})
                </button>
              </div>
            </div>
          )}

          {/* 5. HIỂN THỊ EXCEL (XLSX, XLS, CSV) */}
          {!loading && !error && isExcel && (
            <div className="w-full h-full flex flex-col overflow-hidden bg-slate-50">
              {excelParsing ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  <span className="text-xs font-semibold">Đang xử lý bảng tính Excel...</span>
                </div>
              ) : excelError ? (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
                    <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Chưa thể xem trước</h4>
                    <p className="text-xs text-slate-500 mb-4">{excelError}</p>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Tải về tệp Excel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Bảng dữ liệu Grid */}
                  <div className="flex-1 overflow-auto p-4">
                    <div className="inline-block min-w-full align-middle bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200 border-collapse text-xs">
                        <thead>
                          {sheetRows.length > 0 && (
                            <tr className="bg-slate-100">
                              <th className="px-3 py-2 text-center font-bold text-slate-400 bg-slate-200/80 border-r border-slate-300 w-12 select-none">
                                #
                              </th>
                              {sheetRows[0].map((headerVal, colIdx) => (
                                <th
                                  key={colIdx}
                                  className="px-3 py-2 text-left font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap bg-slate-100"
                                >
                                  {headerVal !== undefined && headerVal !== '' ? String(headerVal) : `Cột ${colIdx + 1}`}
                                </th>
                              ))}
                            </tr>
                          )}
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {sheetRows.slice(1).map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-blue-50/40 transition-colors">
                              <td className="px-3 py-1.5 text-center font-mono text-[11px] text-slate-400 bg-slate-50 border-r border-slate-200 select-none">
                                {rowIdx + 2}
                              </td>
                              {sheetRows[0].map((_, colIdx) => (
                                <td
                                  key={colIdx}
                                  className="px-3 py-1.5 text-slate-800 border-r border-slate-200 whitespace-nowrap text-xs max-w-xs truncate"
                                  title={row[colIdx] !== undefined ? String(row[colIdx]) : ''}
                                >
                                  {row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]) : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {sheetRows.length <= 1 && (
                            <tr>
                              <td colSpan="10" className="px-4 py-8 text-center text-slate-400 text-xs italic">
                                Trang tính trống hoặc không có dòng dữ liệu.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Excel Sheet Tabs Bar (phía dưới giống Excel) */}
                  {excelSheets.length > 0 && (
                    <div className="px-4 py-2 bg-slate-200/90 border-t border-slate-300 flex items-center gap-1 overflow-x-auto shrink-0 text-xs">
                      <span className="text-[11px] font-bold text-slate-500 mr-2 flex items-center gap-1 shrink-0">
                        <Table className="w-3.5 h-3.5 text-emerald-600" /> Trang tính:
                      </span>
                      {excelSheets.map((sName) => (
                        <button
                          key={sName}
                          onClick={() => setActiveSheetName(sName)}
                          className={`px-3 py-1 rounded-t-md font-medium text-xs transition-colors shrink-0 cursor-pointer ${
                            activeSheetName === sName
                              ? 'bg-white text-emerald-700 font-bold shadow-xs border-t-2 border-emerald-500'
                              : 'bg-slate-100/70 hover:bg-white text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {sName}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 6. ĐỊNH DẠNG KHÁC */}
          {!loading && !error && !isPdf && !isImage && !isDocx && !isDoc && !isExcel && (
            <div className="h-full flex items-center justify-center p-6">
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
