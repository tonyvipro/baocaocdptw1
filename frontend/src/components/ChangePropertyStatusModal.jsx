import PropertyImage from './properties/PropertyImage';
import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, XCircle, Clock, Tag, Calendar, AlertTriangle, 
  RefreshCw, History, ShieldCheck, ArrowRight, FileText, Check, 
  Sparkles, Building2, MapPin, SlidersHorizontal, MessageSquare, Info
} from 'lucide-react';

export default function ChangePropertyStatusModal({ 
  isOpen, 
  onClose, 
  property, 
  onSuccess,
  currentUser,
  initialTab = 'change'
}) {
  const [selectedStatus, setSelectedStatus] = useState(1);
  const [reason, setReason] = useState('');
  const [expireDays, setExpireDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('change'); // 'change' | 'history'
  
  // History states
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Status Definitions
  const statusOptions = [
    {
      value: 1,
      label: 'Đang hiển thị',
      subtitle: 'Công khai trên sàn giao dịch',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      activeBorderClass: 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      badgeText: 'Active / Published',
      desc: 'BĐS được hiển thị công khai trên trang chủ, kết quả tìm kiếm và bản đồ. Khách hàng có thể xem chi tiết và đặt lịch hẹn xem nhà.',
    },
    {
      value: 2,
      label: 'Đã giao dịch (Bán/Thuê)',
      subtitle: 'Giao dịch hoàn tất thành công',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-300',
      activeBorderClass: 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20',
      icon: Tag,
      iconColor: 'text-blue-600',
      badgeText: 'Sold / Rented',
      desc: 'Bất động sản đã chốt hợp đồng mua bán hoặc cho thuê thành công. Gắn nhãn "Đã giao dịch" để ngừng nhận liên hệ mới.',
    },
    {
      value: 0,
      label: 'Chờ duyệt',
      subtitle: 'Đưa về hàng đợi kiểm duyệt',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-300',
      activeBorderClass: 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20',
      icon: Clock,
      iconColor: 'text-amber-600',
      badgeText: 'Pending Approval',
      desc: 'Tạm thời ẩn khỏi trang chủ. Bàn giao cho Ban Quản Trị hoặc kiểm duyệt viên thẩm định lại nội dung bài đăng.',
    },
    {
      value: 4,
      label: 'Tạm ẩn / Đã từ chối',
      subtitle: 'Ngừng hiển thị hoặc vi phạm',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-300',
      activeBorderClass: 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20',
      icon: XCircle,
      iconColor: 'text-rose-600',
      badgeText: 'Hidden / Rejected',
      desc: 'Ẩn bài đăng khỏi hệ thống (chủ nhà tạm ngừng đón khách, sửa chữa nhà, hoặc tin chưa đạt tiêu chuẩn quy định).',
    },
    {
      value: 3,
      label: 'Hết hạn',
      subtitle: 'Quá thời hạn hiển thị',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-300',
      activeBorderClass: 'border-purple-500 bg-purple-50/40 ring-2 ring-purple-500/20',
      icon: Calendar,
      iconColor: 'text-purple-600',
      badgeText: 'Expired',
      desc: 'Đánh dấu tin đã quá thời hạn hiển thị gói dịch vụ, yêu cầu người đăng thực hiện gia hạn để tiếp tục đăng tải.',
    },
  ];

  // Quick preset reasons for Reject / Hide (Status 4)
  const quickReasons = [
    'Hình ảnh chất lượng kém, bị mờ hoặc chứa logo/watermark sàn khác',
    'Mức giá bán / cho thuê không hợp lý so với thị trường',
    'Thiếu thông tin pháp lý bắt buộc (Sổ hồng / Sổ đỏ / HĐMB)',
    'Địa chỉ bất động sản không chính xác hoặc không tồn tại',
    'Chủ nhà tạm hoãn giao dịch / đang sửa chữa nâng cấp',
    'Không thể liên lạc được với người đăng để xác thực',
  ];

  // Quick transaction notes for Sold / Rented (Status 2)
  const quickTransactionNotes = [
    'Đã ký hợp đồng mua bán chuyển nhượng thành công',
    'Đã chốt hợp đồng cho thuê dài hạn',
    'Giao dịch thành công qua sàn giao dịch 3TV Land',
    'Khách hàng đã đặt cọc hoàn tất giao dịch',
  ];

  // Sync initial state when modal opens
  useEffect(() => {
    if (isOpen && property) {
      setSelectedStatus(property.status !== undefined && property.status !== null ? Number(property.status) : 1);
      setReason(property.rejection_reason || '');
      setExpireDays(30);
      setError(null);
      setActiveTab(initialTab || 'change');
    }
  }, [isOpen, property, initialTab]);

  // Fetch status history
  const fetchStatusHistory = async () => {
    if (!property?.id) return;
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('3tv_token');
      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch(`/api/properties/${property.id}/status-history`, { headers });
      if (!res.ok) {
        res = await fetch(`http://localhost:8080/api/properties/${property.id}/status-history`, { headers });
      }
      if (res.ok) {
        const json = await res.json();
        setHistoryLogs(json.data || []);
      }
    } catch (e) {
      console.warn('Lỗi tải lịch sử trạng thái:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchStatusHistory();
    }
  }, [isOpen, activeTab, property]);

  if (!isOpen || !property) return null;

  const currentStatusObj = statusOptions.find(s => s.value === Number(property.status)) || statusOptions[0];
  const isStatusChanged = selectedStatus !== Number(property.status);

  // Submit status update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (selectedStatus === 4 && !reason.trim()) {
      setError('Vui lòng chọn hoặc nhập lý do từ chối / tạm ẩn tin đăng.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const user = currentUser || JSON.parse(localStorage.getItem('3tv_user') || '{}');

      const payload = {
        status: selectedStatus,
        reason: reason.trim(),
        note: reason.trim(),
        expire_days: expireDays,
        user_id: user?.id,
        user_name: user?.name || 'Ban Quản Trị',
      };

      const headers = { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json' 
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch(`/api/properties/${property.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        res = await fetch(`http://localhost:8080/api/properties/${property.id}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi cập nhật trạng thái BĐS.');

      const updatedProp = {
        ...property,
        ...(data.data || {}),
        status: selectedStatus,
        rejection_reason: selectedStatus === 4 ? reason.trim() : null
      };

      if (onSuccess) {
        onSuccess(updatedProp, data.message || 'Cập nhật trạng thái tin thành công!');
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-dialog-layer fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn font-sans">
      <div 
        className="form-surface relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh] my-6"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm tracking-wide text-white uppercase">QUẢN LÝ TRẠNG THÁI TIN ĐĂNG</h3>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {property.code || `#${property.id}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                {property.title}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('change')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'change'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Chuyển Đổi Trạng Thái</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch Sử Thay Đổi (Audit Logs)</span>
              {historyLogs.length > 0 && (
                <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                  {historyLogs.length}
                </span>
              )}
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center gap-1.5">
            <span>Trạng thái hiện tại:</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${currentStatusObj.badgeClass}`}>
              <currentStatusObj.icon className="w-3 h-3" />
              {currentStatusObj.label}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {/* TAB 1: CẬP NHẬT TRẠNG THÁI */}
          {activeTab === 'change' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Error Notice */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2.5 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Mini Info Card of Selected Property */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-14 h-12 rounded-xl overflow-hidden bg-slate-200 border border-slate-300/60 shrink-0">
                    <PropertyImage
                      src={property.image}
                      alt={property.title}
                      className="w-full h-full object-cover"

                    />
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-extrabold text-slate-800 text-xs truncate">{property.title}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{property.address || `${property.district || ''}, ${property.city || 'TP.HCM'}`}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-medium">Giá niêm yết</span>
                  <span className="text-xs font-black text-red-600">
                    {property.price_sale_text || property.price_rent_text || `${property.price} đ`}
                  </span>
                </div>
              </div>

              {/* Status Radio Cards Selector */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5">
                  1. Chọn trạng thái mới cho bất động sản:
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {statusOptions.map((opt) => {
                    const isSelected = selectedStatus === opt.value;
                    const Icon = opt.icon;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => setSelectedStatus(opt.value)}
                        className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected 
                            ? opt.activeBorderClass + ' shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-white shadow-xs' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Icon className={`w-4 h-4 ${opt.iconColor}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-800 text-xs">{opt.label}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${opt.badgeClass}`}>
                                  {opt.badgeText}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                                {opt.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100/80 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Specific Options & Notes */}
              <div className="pt-2 space-y-3">
                
                {/* Specific Case: Status = 4 (Tạm ẩn / Đã từ chối) */}
                {selectedStatus === 4 && (
                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/90 space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Lý do tạm ẩn / từ chối tin đăng (*):</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">Gợi ý lý do phổ biến:</label>
                      <div className="flex flex-wrap gap-1.5">
                        {quickReasons.map((qr, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setReason(qr)}
                            className={`text-left text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              reason === qr 
                                ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'
                            }`}
                          >
                            {qr}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Nội dung chi tiết / Phản hồi cho người đăng:</label>
                      <textarea
                        rows="2"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Nhập lý do cụ thể để người đăng có thể chỉnh sửa lại hoặc lưu nội bộ..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-rose-500 text-xs font-medium"
                      ></textarea>
                    </div>
                  </div>
                )}

                {/* Specific Case: Status = 2 (Đã giao dịch) */}
                {selectedStatus === 2 && (
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/90 space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs">
                      <Tag className="w-4 h-4 text-blue-600" />
                      <span>Ghi chú thông tin giao dịch hoàn tất (Tùy chọn):</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {quickTransactionNotes.map((notePreset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReason(notePreset)}
                          className={`text-left text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            reason === notePreset 
                              ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                          }`}
                        >
                          {notePreset}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows="2"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ghi chú thêm về giao dịch (mã hợp đồng, người mua, giá chốt cuối cùng...)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-500 text-xs font-medium"
                    ></textarea>
                  </div>
                )}

                {/* Specific Case: Status = 1 (Đang hiển thị) */}
                {selectedStatus === 1 && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Kích hoạt công khai trên sàn giao dịch</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        Hiệu lực tức thì
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Bất động sản sẽ xuất hiện ngay lập tức trên trang chủ và danh mục tìm kiếm. Nếu tin đăng đã quá hạn, hệ thống sẽ tự động gia hạn thêm thời gian hiển thị mới.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-700">Thời hạn hiển thị mặc định:</span>
                      <select 
                        value={expireDays} 
                        onChange={(e) => setExpireDays(Number(e.target.value))}
                        className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="15">+15 ngày</option>
                        <option value="30">+30 ngày (Chuẩn 1 tháng)</option>
                        <option value="60">+60 ngày (2 tháng)</option>
                        <option value="90">+90 ngày (3 tháng)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Specific Case: Status = 0 (Chờ duyệt) or 3 (Hết hạn) */}
                {(selectedStatus === 0 || selectedStatus === 3) && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Ghi chú thay đổi trạng thái (Tùy chọn):</label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Nhập ghi chú hoặc lý do thay đổi..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-500 text-xs font-medium"
                    />
                  </div>
                )}

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="text-[11px] text-slate-400 font-medium">
                  {isStatusChanged ? (
                    <span className="text-blue-600 font-bold flex items-center gap-1">
                      <ArrowRight className="w-3.5 h-3.5" /> Chuyển từ [{currentStatusObj.label}] sang [{statusOptions.find(s => s.value === selectedStatus)?.label}]
                    </span>
                  ) : (
                    <span>Chưa có thay đổi trạng thái</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>

                  <button
                    type="submit"
                    disabled={loading || (!isStatusChanged && reason === (property.rejection_reason || ''))}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Xác Nhận Đổi Trạng Thái</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          )}

          {/* TAB 2: LỊCH SỬ THAY ĐỔI TRẠNG THÁI (AUDIT TRAIL TIMELINE) */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs">Lịch sử thay đổi & Nhật ký trạng thái</h4>
                  <p className="text-[11px] text-slate-500">Mọi hành vi chuyển đổi trạng thái và gia hạn tin đều được ghi nhận minh bạch.</p>
                </div>

                <button
                  type="button"
                  onClick={fetchStatusHistory}
                  disabled={historyLoading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors font-bold text-[11px] cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${historyLoading ? 'animate-spin text-blue-600' : ''}`} />
                  Làm mới
                </button>
              </div>

              {historyLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Đang tải nhật ký lịch sử trạng thái...
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-600" />
                  <p className="font-bold text-slate-600 text-xs">Chưa có lịch sử thay đổi trạng thái</p>
                  <p className="text-[11px] text-slate-400 mt-1">Khi bạn thay đổi trạng thái tin này, nhật ký chi tiết sẽ hiển thị tại đây.</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {historyLogs.map((log, index) => {
                    const oldSt = log.old_data?.status;
                    const newSt = log.new_data?.status;
                    const oldLabel = log.old_data?.status_name || (oldSt !== undefined ? statusOptions.find(s => s.value === oldSt)?.label : 'Chưa rõ');
                    const newLabel = log.new_data?.status_name || (newSt !== undefined ? statusOptions.find(s => s.value === newSt)?.label : 'Chưa rõ');
                    const reasonText = log.new_data?.reason || log.new_data?.note;
                    const changedBy = log.new_data?.changed_by || 'Ban Quản Trị';
                    const isExtend = log.action === 'EXTEND_PROPERTY';

                    return (
                      <div key={log.id || index} className="relative group">
                        {/* Dot */}
                        <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ring-slate-100 ${
                          isExtend ? 'bg-purple-600' : 
                          newSt === 1 ? 'bg-emerald-500' : 
                          newSt === 2 ? 'bg-blue-600' : 
                          newSt === 4 ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />

                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs group-hover:border-blue-300 transition-all space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-800 text-xs">
                                {isExtend ? 'GIA HẠN TIN ĐĂNG' : 'CHUYỂN TRẠNG THÁI'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                bởi <strong className="text-slate-700">{changedBy}</strong>
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-400 font-mono">
                              {log.formatted_time || new Date(log.created_at).toLocaleString('vi-VN')}
                              {log.relative_time && <span className="text-slate-400 ml-1.5">({log.relative_time})</span>}
                            </div>
                          </div>

                          {/* Transition Badges */}
                          {!isExtend && oldSt !== undefined && newSt !== undefined && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                {oldLabel}
                              </span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                newSt === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                newSt === 2 ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                newSt === 4 ? 'bg-rose-50 text-rose-700 border-rose-300' :
                                newSt === 3 ? 'bg-purple-50 text-purple-700 border-purple-300' :
                                'bg-amber-50 text-amber-700 border-amber-300'
                              }`}>
                                {newLabel}
                              </span>
                            </div>
                          )}

                          {isExtend && log.new_data?.days_extended && (
                            <div className="text-[11px] text-purple-800 font-bold bg-purple-50 p-2 rounded-xl border border-purple-200">
                              Gia hạn thêm: +{log.new_data.days_extended} ngày (Hạn mới: {log.new_data.expire_date})
                            </div>
                          )}

                          {reasonText && (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 font-medium">
                              <span className="font-bold text-slate-500">Ghi chú/Lý do: </span>
                              <span>"{reasonText}"</span>
                            </div>
                          )}

                          {log.ip_address && (
                            <div className="text-[9px] text-slate-400 font-mono">
                              IP: {log.ip_address}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            Hệ thống quản lý trạng thái tài sản sàn 3TV Land
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-200/60 text-xs transition-colors cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>
    </div>
  );
}
