import React, { useState, useEffect } from 'react';
import {
  FileText, ArrowLeft, Printer, Download, Eye, Calendar,
  Building2, User, Phone, ShieldCheck, Clock, CheckCircle2,
  AlertCircle, FileCheck, History, DollarSign, MapPin, Loader2,
  Receipt, Stamp, ExternalLink, ChevronRight, Share2, Layers
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMyContractDetailThunk,
  fetchMyContractDocsThunk,
  clearSelectedContract,
} from '../../store/slices/customerContractSlice';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';
import ContractDepositSummaryCard from '../../components/deposits/ContractDepositSummaryCard';
import { contractDocumentApi } from '../../services/contractDocumentApi';
import ContractA4Document, {
  convertNumberToVietnameseWords,
  formatContractDate,
  formatCurrency,
} from '../../components/ContractA4Document';

export default function MyContractDetailPage({
  contractId,
  onBack,
  currentUser,
}) {
  const dispatch = useDispatch();
  const {
    selectedContract,
    detailLoading,
    detailError,
    myDocuments,
    docsLoading,
    docsError,
  } = useSelector((state) => state.customerContract);

  const [previewDoc, setPreviewDoc] = useState(null);
  const [activeViewMode, setActiveViewMode] = useState('a4'); // 'a4' | 'docs' | 'extensions'

  useEffect(() => {
    if (contractId) {
      dispatch(fetchMyContractDetailThunk(contractId));
      dispatch(fetchMyContractDocsThunk(contractId));
    }
    return () => {
      dispatch(clearSelectedContract());
    };
  }, [contractId, dispatch]);

  const handleDownload = async (doc) => {
    try {
      const blob = await contractDocumentApi.downloadMyDoc(doc.id);
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

  const handlePrint = () => {
    window.print();
  };


  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 0: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 1: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 4: return 'bg-teal-100 text-teal-800 border-teal-200';
      case 6: return 'bg-sky-100 text-sky-800 border-sky-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (detailLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600">Đang khởi tạo văn bản hợp đồng...</p>
      </div>
    );
  }

  if (detailError || !selectedContract) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Không tìm thấy hợp đồng</h3>
        <p className="text-xs text-slate-500 mb-6">
          {detailError || 'Hợp đồng này không tồn tại hoặc bạn không có quyền truy cập.'}
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>
      </div>
    );
  }

  const approvedExtensions = selectedContract.approved_extensions || [];
  const startDate = formatContractDate(selectedContract.start_date);
  const endDate = formatContractDate(selectedContract.end_date);
  const createdDate = formatContractDate(selectedContract.created_at || selectedContract.start_date);

  const rentalWords = convertNumberToVietnameseWords(selectedContract.rental_price);
  const depositWords = convertNumberToVietnameseWords(selectedContract.deposit_amount);

  const property = selectedContract.property || {};
  const customer = selectedContract.customer || {};
  const broker = selectedContract.broker || {};

  return (
    <div className="min-h-screen bg-slate-100/90 py-6 px-3 sm:px-6 lg:px-8">
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
              {selectedContract.contract_code}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
              {selectedContract.contract_name}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                window.location.hash = '#my-invoices';
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer"
              title="Xem các hóa đơn thanh toán của hợp đồng này"
            >
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Hóa đơn liên quan</span>
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
              <span>Hồ Sơ Đính Kèm ({myDocuments.length})</span>
            </button>

            {approvedExtensions.length > 0 && (
              <button
                onClick={() => setActiveViewMode('extensions')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeViewMode === 'extensions'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5 text-purple-600" />
                <span>Lịch Sử Gia Hạn ({approvedExtensions.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              selectedContract.status === 1
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {selectedContract.status_label || 'Đang có hiệu lực'}
            </span>

            {selectedContract.is_expiring_soon && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Còn {selectedContract.days_left} ngày</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 1.5 THẺ TIỀN CỌC HỢP ĐỒNG */}
      {Number(selectedContract?.deposit_amount || 0) > 0 && (
        <div className="max-w-5xl mx-auto mb-6 no-print">
          <ContractDepositSummaryCard contractId={selectedContract.id} isCustomerView={true} />
        </div>
      )}

      {/* 2. KHUNG HIỂN THỊ KHỔ GIẤY A4 CHÍNH XÁC TỪ TRÊN XUỐNG */}
      {activeViewMode === 'a4' && (
        <ContractA4Document
          contract={selectedContract}
          currentUser={currentUser}
          showWatermark={true}
        />
      )}

      {/* 3. CHẾ ĐỘ XEM HỒ SƠ TÀI LIỆU ĐÍNH KÈM */}
      {activeViewMode === 'docs' && (
        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Hồ Sơ Tài Liệu Số Hóa Của Hợp Đồng</h3>
                <p className="text-[11px] text-slate-300">
                  Bản quét hợp đồng gốc, phụ lục gia hạn và biên bản bàn giao
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-white/10 rounded-full text-blue-300">
              {myDocuments.length} tệp tài liệu
            </span>
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
            ) : myDocuments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-700">Chưa có tài liệu đính kèm số hóa nào</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Chuyên viên phụ trách đang hoàn tất hồ sơ lưu trữ. Quý khách vui lòng kiểm tra lại sau.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myDocuments.map((doc) => (
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
                            {doc.title}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getTypeBadgeClass(doc.document_type)}`}>
                            {doc.document_type_label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tệp: {doc.original_name} • {doc.file_size_formatted} • Ngày tải: {doc.created_at_formatted}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem</span>
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải về</span>
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
      {activeViewMode === 'extensions' && approvedExtensions.length > 0 && (
        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
          <div className="px-6 py-4 bg-purple-900 text-white flex items-center gap-2.5">
            <History className="w-5 h-5 text-purple-300" />
            <div>
              <h3 className="text-sm font-bold text-white">Lịch Sử Phụ Lục Gia Hạn Hợp Đồng</h3>
              <p className="text-[11px] text-purple-200">Các lần gia hạn và điều chỉnh thời gian thuê đã được phê duyệt</p>
            </div>
          </div>

          <div className="p-6 divide-y divide-slate-100">
            {approvedExtensions.map((ext, idx) => (
              <div key={ext.id || idx} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Gia hạn hợp lệ (Đợt {idx + 1}): Ngày duyệt {ext.approved_at || ext.created_at || '—'}</span>
                  </div>
                  <div className="text-slate-500 mt-1 pl-5.5 space-y-0.5">
                    {ext.new_end_date && (
                      <p>Thời hạn mới kéo dài đến: <strong className="text-blue-600 font-bold">{ext.new_end_date}</strong></p>
                    )}
                    {ext.new_rental_price && (
                      <p>Giá thuê điều chỉnh mới: <strong className="text-red-600 font-bold">{formatCurrency(ext.new_rental_price)} / tháng</strong></p>
                    )}
                  </div>
                </div>

                <span className="self-start sm:self-center px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                  Đã duyệt thành công
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal for Customer */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
          isCustomer={true}
        />
      )}
    </div>
  );
}
