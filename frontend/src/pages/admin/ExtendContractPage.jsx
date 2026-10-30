import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FileText, ArrowLeft, Save, Send, UploadCloud, Trash2, File, CheckCircle2,
  AlertTriangle, Calendar, DollarSign, Clock, ShieldAlert, Check, X, Info,
  ExternalLink, RefreshCw, FileCheck2, Paperclip, ChevronRight
} from 'lucide-react';
import {
  checkEligibilityThunk,
  saveDraftThunk,
  submitExtensionThunk,
  uploadDocumentsThunk,
  deleteDocumentThunk,
  deleteDraftThunk,
  clearMessages,
  resetDraftState
} from '../../store/slices/contractExtensionSlice';

export default function ExtendContractPage({ contractId, onBack, currentUser }) {
  const dispatch = useDispatch();
  const {
    eligibility,
    activeDraft,
    documents,
    loading,
    saving,
    submitting,
    uploading,
    error,
    successMessage
  } = useSelector((state) => state.contractExtension);

  // Form states
  const [extensionType, setExtensionType] = useState(1); // 0: Auto, 1: Manual, 2: New terms
  const [durationMonths, setDurationMonths] = useState(12); // 3, 6, 12
  const [newStartDate, setNewStartDate] = useState('');
  const [newRentalPrice, setNewRentalPrice] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);

  // Load contract eligibility and existing draft on mount
  useEffect(() => {
    if (contractId) {
      dispatch(checkEligibilityThunk(contractId));
    }
    return () => {
      dispatch(resetDraftState());
    };
  }, [contractId, dispatch]);

  // Sync draft or contract defaults into form
  useEffect(() => {
    if (activeDraft) {
      setExtensionType(activeDraft.extension_type ?? 1);
      setDurationMonths(activeDraft.duration_months ?? 12);
      if (activeDraft.new_start_date) {
        setNewStartDate(activeDraft.new_start_date.substring(0, 10));
      }
      setNewRentalPrice(activeDraft.new_rental_price ? String(activeDraft.new_rental_price) : '');
      setReason(activeDraft.reason || '');
      setNote(activeDraft.note || '');
    } else if (eligibility?.contract) {
      const contract = eligibility.contract;
      // Default start date = old end date + 1 day
      const effectiveEndDate = contract.end_date || contract.current_end_date;
      if (effectiveEndDate) {
        const d = new Date(effectiveEndDate);
        d.setDate(d.getDate() + 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setNewStartDate(`${yyyy}-${mm}-${dd}`);
      }
      const effectivePrice = contract.rental_price ?? contract.current_rental_price;
      setNewRentalPrice(effectivePrice ? String(effectivePrice) : '');
    }
  }, [activeDraft, eligibility]);

  // Automatically calculate new end date: new_start_date + duration_months - 1 day
  const calculatedEndDate = useMemo(() => {
    if (!newStartDate || !durationMonths) return '';
    try {
      const start = new Date(newStartDate);
      if (isNaN(start.getTime())) return '';
      // Clone date and add months
      const end = new Date(start);
      end.setMonth(end.getMonth() + parseInt(durationMonths, 10));
      // Subtract 1 day
      end.setDate(end.getDate() - 1);
      const yyyy = end.getFullYear();
      const mm = String(end.getMonth() + 1).padStart(2, '0');
      const dd = String(end.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return '';
    }
  }, [newStartDate, durationMonths]);

  // Price difference percentage calculation and warning (> 30%)
  const priceAnalysis = useMemo(() => {
    const oldPrice = parseFloat(eligibility?.contract?.rental_price ?? eligibility?.contract?.current_rental_price) || 0;
    const newPrice = parseFloat(newRentalPrice) || 0;
    if (oldPrice <= 0 || newPrice <= 0) return { diffPct: 0, isHighDiff: false };

    const diff = newPrice - oldPrice;
    const diffPct = Math.round((Math.abs(diff) / oldPrice) * 100);
    const isHighDiff = diffPct > 30;

    return {
      diffPct,
      isHighDiff,
      isIncrease: diff > 0,
      diffAmount: Math.abs(diff),
      oldPrice,
      newPrice
    };
  }, [eligibility, newRentalPrice]);

  // Validation
  const validateForm = (isSubmitting = false) => {
    const errors = {};
    if (!newStartDate) {
      errors.newStartDate = 'Vui lòng chọn ngày bắt đầu gia hạn.';
    }
    if (newRentalPrice && (isNaN(newRentalPrice) || parseFloat(newRentalPrice) < 0)) {
      errors.newRentalPrice = 'Giá trị hợp đồng mới không hợp lệ.';
    }
    if (isSubmitting) {
      if (!reason.trim()) {
        errors.reason = 'Lý do gia hạn là bắt buộc khi gửi yêu cầu lên cấp trên.';
      } else if (reason.length > 2000) {
        errors.reason = 'Lý do gia hạn không được vượt quá 2000 ký tự.';
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Save Draft
  const handleSaveDraft = async () => {
    if (!validateForm(false)) return;

    const payload = {
      extension_type: parseInt(extensionType, 10),
      duration_months: parseInt(durationMonths, 10),
      new_start_date: newStartDate,
      new_rental_price: newRentalPrice ? parseFloat(newRentalPrice) : null,
      reason: reason.trim(),
      note: note.trim()
    };

    const res = await dispatch(
      saveDraftThunk({
        contractId,
        payload,
        extensionId: activeDraft?.id
      })
    );

    // If new files were selected, upload them after saving draft
    if (res.meta.requestStatus === 'fulfilled' && selectedFiles.length > 0) {
      const extId = res.payload.data?.id || activeDraft?.id;
      if (extId) {
        await dispatch(uploadDocumentsThunk({ extensionId: extId, files: selectedFiles }));
        setSelectedFiles([]);
      }
    }
  };

  // Handle Submit Extension
  const handleSubmitExtension = async () => {
    if (!validateForm(true)) return;

    if (!window.confirm('Bạn có chắc chắn muốn gửi yêu cầu gia hạn này lên cấp trên phê duyệt?')) {
      return;
    }

    // Step 1: Save draft first to make sure ID and changes are synced
    const payload = {
      extension_type: parseInt(extensionType, 10),
      duration_months: parseInt(durationMonths, 10),
      new_start_date: newStartDate,
      new_rental_price: newRentalPrice ? parseFloat(newRentalPrice) : null,
      reason: reason.trim(),
      note: note.trim()
    };

    const saveRes = await dispatch(
      saveDraftThunk({
        contractId,
        payload,
        extensionId: activeDraft?.id
      })
    );

    if (saveRes.meta.requestStatus !== 'fulfilled') return;

    const extId = saveRes.payload.data?.id || activeDraft?.id;

    // Upload files if any selected
    if (selectedFiles.length > 0) {
      await dispatch(uploadDocumentsThunk({ extensionId: extId, files: selectedFiles }));
      setSelectedFiles([]);
    }

    // Step 2: Submit to pending
    const submitRes = await dispatch(
      submitExtensionThunk({
        extensionId: extId,
        payload: {
          reason: reason.trim(),
          note: note.trim()
        }
      })
    );

    if (submitRes.meta.requestStatus === 'fulfilled') {
      setTimeout(() => {
        onBack();
      }, 1500);
    }
  };

  // Handle File selection
  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(file => {
        const isValidSize = file.size <= 10 * 1024 * 1024;
        if (!isValidSize) {
          alert(`File ${file.name} vượt quá dung lượng cho phép 10MB.`);
        }
        return isValidSize;
      });
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      const validFiles = filesArray.filter(f => f.size <= 10 * 1024 * 1024);
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleRemoveLocalFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteUploadedDoc = async (docId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      await dispatch(deleteDocumentThunk(docId));
    }
  };

  const handleDeleteDraft = async () => {
    if (!activeDraft?.id) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ bản nháp gia hạn này?')) {
      const res = await dispatch(deleteDraftThunk(activeDraft.id));
      if (res.meta.requestStatus === 'fulfilled') {
        dispatch(checkEligibilityThunk(contractId));
      }
    }
  };

  const formatVnd = (amount) => {
    if (!amount && amount !== 0) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  if (loading && !eligibility) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 p-8">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <h3 className="text-base font-bold text-slate-700">Đang kiểm tra thông tin hợp đồng...</h3>
        <p className="text-xs text-slate-500 mt-1">Hệ thống đang rà soát điều kiện thời hạn và các phụ lục liên quan.</p>
      </div>
    );
  }

  const contract = eligibility?.contract;
  const isEligible = eligibility ? (eligibility.is_eligible ?? eligibility.eligible ?? true) : true;
  const isNotEligible = eligibility ? !isEligible : false;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Top Navigation & Action Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-colors border border-slate-200"
            title="Quay lại danh sách hợp đồng"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/50">
                Gia Hạn Hợp Đồng
              </span>
              {activeDraft?.status === 0 && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Bản Nháp #{activeDraft.id}
                </span>
              )}
              {activeDraft?.status === 1 && (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Đang Chờ Cấp Trên Duyệt
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              Phụ lục gia hạn Hợp đồng {contract?.contract_code || ''}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {activeDraft?.id && activeDraft?.status === 0 && (
            <button
              onClick={handleDeleteDraft}
              className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5"
              title="Xóa toàn bộ bản nháp"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">Xóa bản nháp</span>
            </button>
          )}

          {(!activeDraft || activeDraft.status === 0) && !isNotEligible && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving || submitting}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                ) : (
                  <Save className="w-4 h-4 text-slate-600" />
                )}
                <span>Lưu Nháp</span>
              </button>

              <button
                onClick={handleSubmitExtension}
                disabled={saving || submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/25 hover:shadow-md disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Gửi Yêu Cầu Gia Hạn</span>
              </button>
            </>
          )}

          {activeDraft?.status === 1 && (
            <div className="px-4 py-2 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 text-xs font-bold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Yêu cầu đang chờ duyệt</span>
            </div>
          )}
        </div>
      </div>

      {/* Global Alerts / Toasts */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => dispatch(clearMessages())}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => dispatch(clearMessages())}
            className="text-rose-600 hover:text-rose-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KHU 1: THÔNG TIN HỢP ĐỒNG HIỆN TẠI (Read-Only) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Khu 1: Thông Tin Hợp Đồng Hiện Tại
              </h2>
              <p className="text-xs text-slate-400">Dữ liệu hợp đồng đang được gia hạn (chỉ đọc)</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            Mã HĐ: {contract?.contract_code || '—'}
          </span>
        </div>

        {/* Thông tin tóm tắt */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Tên Hợp Đồng
            </span>
            <p className="text-xs font-bold text-slate-800 line-clamp-2">
              {contract?.contract_name || '—'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Khách Hàng (Bên B)
            </span>
            <p className="text-xs font-bold text-slate-800">
              {contract?.customer?.name || contract?.party_b_info?.split('\n')[0] || 'Khách hàng'}
            </p>
            <p className="text-[11px] text-slate-500">
              {contract?.customer?.phone || 'Chưa có SĐT'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Ngày Kết Thúc Hiện Tại
            </span>
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              {formatDate(contract?.end_date || contract?.current_end_date)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Bắt đầu: {formatDate(contract?.start_date)}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Giá Trị Thuê Hiện Tại
            </span>
            <p className="text-xs font-black text-emerald-700">
              {formatVnd(contract?.rental_price ?? contract?.current_rental_price)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cọc: {formatVnd(contract?.deposit_amount)}
            </p>
          </div>
        </div>

        {/* Hộp Cảnh Báo Thời Gian / Điều Kiện Gia Hạn */}
        <div className="mt-4">
          {isNotEligible ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                  Hợp Đồng Không Đủ Điều Kiện Gia Hạn
                </h4>
                <p className="text-xs text-rose-700 mt-1">
                  {eligibility?.reason || 'Hợp đồng đã quá hạn quá 30 ngày (hết thời gian gia hạn) hoặc đang có yêu cầu khác được xử lý.'}
                </p>
                <p className="text-[11px] text-rose-600 mt-1">
                  💡 Quy tắc: Hợp đồng quá hạn vượt quá 30 ngày phải tiến hành lập Hợp Đồng Mới, không được áp dụng phụ lục gia hạn.
                </p>
              </div>
            </div>
          ) : eligibility?.in_grace_period ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Hợp Đồng Đang Trong Thời Gian Ân Hạn (30 Ngày)
                </h4>
                <p className="text-xs text-amber-700 mt-1">
                  Hợp đồng đã quá ngày hết hạn nhưng vẫn nằm trong phạm vi 30 ngày ân hạn theo quy định. Bạn vẫn có thể gửi yêu cầu gia hạn để cứu hợp đồng này.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-800">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Hợp đồng còn <span className="font-bold underline">{eligibility?.days_left ?? '—'}</span> ngày nữa sẽ đến hạn kết thúc.
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-md">
                Đủ điều kiện gia hạn
              </span>
            </div>
          )}
        </div>
      </div>

      {/* KHU 2: CHI TIẾT GIA HẠN */}
      <div className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-xs ${isNotEligible ? 'opacity-60 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Khu 2: Chi Tiết Gia Hạn
            </h2>
            <p className="text-xs text-slate-400">Chọn phương thức, thời gian và giá trị thuê mới</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. Loại gia hạn (Radio 3 options) */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2.5">
              1. Loại Hình Gia Hạn <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: 0,
                  title: 'Tự Động Gia Hạn',
                  desc: 'Áp dụng nguyên trạng các điều khoản & giá trị hợp đồng cũ'
                },
                {
                  id: 1,
                  title: 'Gia Hạn Thủ Công',
                  desc: 'Thương lượng lại thời gian thuê và giá trị thuê mới'
                },
                {
                  id: 2,
                  title: 'Gia Hạn Kèm Điều Khoản Mới',
                  desc: 'Bổ sung các điều khoản đặc biệt và phụ lục sửa đổi mới'
                }
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${extensionType === opt.id
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-800">{opt.title}</span>
                    <input
                      type="radio"
                      name="extensionType"
                      value={opt.id}
                      checked={extensionType === opt.id}
                      onChange={() => setExtensionType(opt.id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Grid các trường: Thời gian gia hạn, Ngày bắt đầu, Ngày kết thúc mới */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Thời gian gia hạn (3, 6, 12 tháng) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                2. Thời Gian Gia Hạn <span className="text-rose-500">*</span>
              </label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value={12}>1 Năm (12 Tháng)</option>
                <option value={6}>6 Tháng</option>
                <option value={3}>3 Tháng</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Chỉ cho phép chọn 3, 6 hoặc 12 tháng.
              </span>
            </div>

            {/* Ngày bắt đầu mới */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                3. Ngày Bắt Đầu Mới <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className={`w-full h-10 px-3 text-xs font-semibold bg-white border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${validationErrors.newStartDate ? 'border-rose-500' : 'border-slate-300'
                    }`}
                />
              </div>
              {validationErrors.newStartDate && (
                <span className="text-[11px] font-semibold text-rose-500 mt-1 block">
                  {validationErrors.newStartDate}
                </span>
              )}
            </div>

            {/* Ngày kết thúc mới (Read-only output) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                <span>4. Ngày Kết Thúc Mới</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Tự động tính
                </span>
              </label>
              <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono font-bold text-slate-800">
                <span>{calculatedEndDate ? formatDate(calculatedEndDate) : 'Chưa xác định'}</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Công thức: Ngày bắt đầu + {durationMonths} tháng - 1 ngày
              </span>
            </div>
          </div>

          {/* 3. Giá thuê mới & Cảnh báo chênh lệch > 30% */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              5. Giá Thuê Hợp Đồng Mới (VND)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={newRentalPrice}
                  onChange={(e) => setNewRentalPrice(e.target.value)}
                  placeholder="Nhập giá thuê mới (VND)..."
                  className={`w-full h-10 px-3 text-xs font-semibold bg-white border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${validationErrors.newRentalPrice ? 'border-rose-500' : 'border-slate-300'
                    }`}
                />
                <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                  Hiển thị: {formatVnd(parseFloat(newRentalPrice) || 0)}
                </span>
              </div>

              {/* Box phân tích giá */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Giá Hợp Đồng Hiện Tại
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {formatVnd(priceAnalysis.oldPrice)}
                  </span>
                </div>
                {priceAnalysis.diffPct > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Biến động giá
                    </span>
                    <span
                      className={`text-xs font-extrabold ${priceAnalysis.isHighDiff ? 'text-amber-600' : 'text-slate-800'
                        }`}
                    >
                      {priceAnalysis.isIncrease ? '+' : '-'} {priceAnalysis.diffPct}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cảnh báo nếu thay đổi > 30% */}
            {priceAnalysis.isHighDiff && (
              <div className="mt-2.5 bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Cảnh báo biến động giá cao:</strong> Giá mới chênh lệch{' '}
                  <strong className="underline">{priceAnalysis.diffPct}%</strong> so với giá hợp đồng cũ ({formatVnd(priceAnalysis.oldPrice)}). Vui lòng xác nhận sự thống nhất văn bản giữa bên A và bên B.
                </span>
              </div>
            )}
          </div>

          {/* 4. Lý do gia hạn (Bắt buộc khi gửi duyệt) */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
              <span>
                6. Lý Do Gia Hạn Hợp Đồng <span className="text-rose-500">*</span>
              </span>
              <span className={`text-[10px] font-mono ${reason.length > 2000 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                {reason.length}/2000 ký tự
              </span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nêu rõ lý do gia hạn (Khách hàng có nhu cầu tiếp tục thuê, thỏa thuận gia hạn 1 năm, giữ nguyên tiền cọc...)"
              className={`w-full p-3 text-xs bg-white border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${validationErrors.reason ? 'border-rose-500' : 'border-slate-300'
                }`}
            />
            {validationErrors.reason && (
              <span className="text-[11px] font-semibold text-rose-500 mt-1 block">
                {validationErrors.reason}
              </span>
            )}
          </div>

          {/* 5. Ghi chú bổ sung */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              7. Ghi Chú & Điều Khoản Phụ Lục Bổ Sung (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú chi tiết cho ban quản trị hoặc lưu ý cho bên kế toán/thu ngân..."
              className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* KHU 3: TÀI LIỆU ĐÍNH KÈM (PHỤ LỤC HỢP ĐỒNG) */}
      <div className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-xs ${isNotEligible ? 'opacity-60 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            3
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Khu 3: Tài Liệu Đính Kèm (Phụ Lục Hợp Đồng)
            </h2>
            <p className="text-xs text-slate-400">Tải lên các tài liệu scan, phụ lục hợp đồng, biên bản thỏa thuận</p>
          </div>
        </div>

        {/* Drag & Drop Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${isDragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/40'
            }`}
        >
          <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">
            Kéo thả tài liệu vào đây hoặc{' '}
            <label className="text-blue-600 hover:underline cursor-pointer">
              chọn từ máy tính
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Định dạng hỗ trợ: PDF, DOC, DOCX, JPG, PNG (Tối đa 10MB mỗi file)
          </p>
        </div>

        {/* Danh sách file đang chọn chờ lưu */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              File mới chọn (sẽ lưu cùng bản nháp) ({selectedFiles.length}):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-blue-50/50 border border-blue-200/60 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveLocalFile(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Danh sách file đã lưu trên hệ thống */}
        {documents && documents.length > 0 && (
          <div className="mt-5 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tài liệu đã lưu trên hệ thống ({documents.length}):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 shadow-xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <File className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {doc.original_name || doc.file_name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : 'Tài liệu phụ lục'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <a
                      href={doc.file_url || `/storage/${doc.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                      title="Xem tài liệu"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {(!activeDraft || activeDraft.status === 0) && (
                      <button
                        onClick={() => handleDeleteUploadedDoc(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Xóa tài liệu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
