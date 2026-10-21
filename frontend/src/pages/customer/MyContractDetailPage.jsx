import React, { useState, useEffect } from 'react';
import {
  FileText, ArrowLeft, Download, Eye, Calendar, Building2,
  User, Phone, ShieldCheck, Clock, CheckCircle2, AlertCircle,
  FileCheck, History, DollarSign, MapPin, Loader2, Sparkles
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMyContractDetailThunk,
  fetchMyContractDocsThunk,
  clearSelectedContract,
} from '../../store/slices/customerContractSlice';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';
import { contractDocumentApi } from '../../services/contractDocumentApi';

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

  const formatCurrency = (val) => {
    if (!val) return '0 ₫';
    return Number(val).toLocaleString('vi-VN') + ' ₫';
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 0: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 1: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 4: return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (detailLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600">Đang tải thông tin hợp đồng...</p>
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách hợp đồng</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
            {selectedContract.contract_code}
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            selectedContract.status === 1
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            {selectedContract.status_label}
          </span>
        </div>
      </div>

      {/* Contract Title Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {selectedContract.contract_name}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>{selectedContract.property_title} — {selectedContract.property_address}</span>
            </p>
          </div>

          {selectedContract.is_expiring_soon && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-amber-800 text-xs font-bold self-start md:self-auto">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Hợp đồng sắp hết hạn trong {selectedContract.days_until_expiration} ngày</span>
            </div>
          )}
        </div>
      </div>

      {/* Contract Core Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Thời gian & Hiệu lực */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Thời Gian Hiệu Lực</span>
          </div>
          <div>
            <p className="text-xs text-slate-400">Ngày bắt đầu:</p>
            <p className="text-sm font-bold text-slate-800">{selectedContract.start_date || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Ngày hết hạn:</p>
            <p className="text-sm font-bold text-blue-600">{selectedContract.end_date || '—'}</p>
          </div>
        </div>

        {/* Tài chính & Tiền cọc */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Tài Chính & Thanh Toán</span>
          </div>
          <div>
            <p className="text-xs text-slate-400">Giá thuê định kỳ:</p>
            <p className="text-base font-black text-red-600">{formatCurrency(selectedContract.rental_price)} / tháng</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Tiền đặt cọc:</p>
            <p className="text-sm font-bold text-slate-800">{formatCurrency(selectedContract.deposit_amount)}</p>
          </div>
        </div>

        {/* Thông tin môi giới phụ trách */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <User className="w-4 h-4 text-purple-600" />
            <span>Môi Giới Phụ Trách</span>
          </div>
          <div>
            <p className="text-xs text-slate-400">Họ và tên:</p>
            <p className="text-sm font-bold text-slate-800">{selectedContract.broker_contact?.name || 'Chuyên viên 3TV Land'}</p>
          </div>
          {selectedContract.broker_contact?.phone && (
            <div>
              <p className="text-xs text-slate-400">Số điện thoại hỗ trợ:</p>
              <a
                href={`tel:${selectedContract.broker_contact.phone}`}
                className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1.5 mt-0.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{selectedContract.broker_contact.phone}</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Thông tin 2 bên ký kết */}
      {(selectedContract.party_a_info || selectedContract.party_b_info) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
          {selectedContract.party_a_info && (
            <div>
              <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2">
                Bên Cho Thuê / Đại Diện (Bên A)
              </h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">
                {selectedContract.party_a_info}
              </p>
            </div>
          )}

          {selectedContract.party_b_info && (
            <div>
              <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2">
                Bên Thuê / Khách Hàng (Bên B)
              </h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">
                {selectedContract.party_b_info}
              </p>
            </div>
          )}
        </div>
      )}

      {/* KHỐI TÀI LIỆU HỢP ĐỒNG (Chỉ loại {0, 1, 4}) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Tài Liệu Hợp Đồng</h3>
              <p className="text-[11px] text-slate-300">
                Bản quét hợp đồng chính thức, phụ lục gia hạn và biên bản bàn giao
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
              <p className="text-xs font-bold text-slate-700">Chưa có tài liệu số hóa nào cho hợp đồng này</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chuyên viên phụ trách đang hoàn tất số hóa hồ sơ ký kết. Quý khách vui lòng kiểm tra lại sau.
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

      {/* KHỐI LỊCH SỬ GIA HẠN (Chỉ các gia hạn đã duyệt status = 2) */}
      {approvedExtensions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2.5">
            <History className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Lịch Sử Gia Hạn Đã Phê Duyệt</h3>
              <p className="text-[11px] text-slate-500">Các lần gia hạn và điều chỉnh thời gian thuê đã được xác nhận</p>
            </div>
          </div>

          <div className="p-6 divide-y divide-slate-100">
            {approvedExtensions.map((ext, idx) => (
              <div key={ext.id || idx} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Gia hạn ngày: {ext.extension_date || ext.created_at || '—'}</span>
                  </div>
                  <div className="text-slate-500 mt-1 pl-5.5 space-y-0.5">
                    {ext.new_end_date && (
                      <p>Thời hạn mới đến: <strong className="text-blue-600 font-bold">{ext.new_end_date}</strong></p>
                    )}
                    {ext.new_rental_price && (
                      <p>Giá thuê điều chỉnh: <strong className="text-red-600 font-bold">{formatCurrency(ext.new_rental_price)}/tháng</strong></p>
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
