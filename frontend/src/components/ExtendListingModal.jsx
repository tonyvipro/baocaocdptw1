import React, { useState, useEffect } from 'react';
import { 
  X, CalendarPlus, Calendar, Clock, Sparkles, CheckCircle2, 
  AlertTriangle, RefreshCw, History, ArrowRight, ShieldCheck, Check
} from 'lucide-react';

export default function ExtendListingModal({ 
  isOpen, 
  onClose, 
  property, 
  onSuccess 
}) {
  const [selectedDays, setSelectedDays] = useState(30);
  const [customDays, setCustomDays] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('extend'); // 'extend' | 'history'
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Preset extension duration options
  const durationOptions = [
    { days: 7, label: '7 Ngày', sub: '1 tuần', tag: 'Ngắn hạn' },
    { days: 15, label: '15 Ngày', sub: 'Nửa tháng', tag: 'Linh hoạt' },
    { days: 30, label: '30 Ngày', sub: '1 tháng', tag: 'Khuyên dùng ⭐', popular: true },
    { days: 60, label: '60 Ngày', sub: '2 tháng', tag: 'Tiết kiệm' },
    { days: 90, label: '90 Ngày', sub: '3 tháng', tag: 'Ưu đãi cao' },
  ];

  // Helper date format
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Chưa xác định';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const currentExpireDate = property?.expire_date ? new Date(property.expire_date) : null;
  const isExpired = currentExpireDate ? currentExpireDate < new Date() : false;

  // Calculate new expected expiry date
  const effectiveDays = isCustom ? (parseInt(customDays, 10) || 0) : selectedDays;
  const calculateNewExpiry = () => {
    if (!effectiveDays || effectiveDays <= 0) return null;
    const baseDate = (currentExpireDate && !isExpired) ? new Date(currentExpireDate) : new Date();
    baseDate.setDate(baseDate.getDate() + effectiveDays);
    return baseDate;
  };

  const newExpiryDate = calculateNewExpiry();

  // Fetch extension history
  const fetchHistory = async () => {
    if (!property?.id) return;
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('3tv_token');
      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/properties/${property.id}/extension-history`, { headers });
      if (res.ok) {
        const json = await res.json();
        setHistoryLogs(json.data || []);
      }
    } catch (e) {
      console.warn('Lỗi tải lịch sử gia hạn:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchHistory();
    }
  }, [isOpen, activeTab, property]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedDays(30);
      setIsCustom(false);
      setCustomDays('');
      setNote('');
      setActiveTab('extend');
    }
  }, [isOpen]);

  if (!isOpen || !property) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (effectiveDays <= 0) {
      setError('Vui lòng chọn hoặc nhập số ngày gia hạn hợp lệ (tối thiểu 1 ngày).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('3tv_token');
      const headers = { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/properties/${property.id}/extend`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          days: effectiveDays,
          note: note.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể gia hạn tin đăng. Vui lòng thử lại!');
      }

      if (onSuccess) {
        onSuccess(data.data, data.message);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra trong quá trình gia hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-dialog-layer fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div 
        className="form-surface bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="relative bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white p-5 sm:p-6 overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <CalendarPlus className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Dịch vụ tin đăng
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  GIA HẠN TIN ĐĂNG
                </h2>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Property Summary Header */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-purple-100">
            <div className="flex items-center gap-2 truncate max-w-[70%]">
              <span className="font-mono bg-white/20 px-2 py-0.5 rounded font-bold text-white text-[11px]">
                {property.code || `#BDS-${property.id}`}
              </span>
              <span className="truncate font-medium">{property.title}</span>
            </div>
            <div className="text-right shrink-0">
              {isExpired ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/80 text-white text-[10px] font-bold">
                  <AlertTriangle className="w-3 h-3" /> Đã hết hạn
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/80 text-white text-[10px] font-bold">
                  <Clock className="w-3 h-3" /> Hạn: {formatDate(property.expire_date)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab switch: Gia hạn | Lịch sử gia hạn */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('extend')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'extend'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Chọn Gói Gia Hạn
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Lịch Sử Gia Hạn ({historyLogs.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 font-medium animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'extend' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Duration Options */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5">
                  1. Chọn thời gian gia hạn
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {durationOptions.map((opt) => {
                    const isSelected = !isCustom && selectedDays === opt.days;
                    return (
                      <button
                        type="button"
                        key={opt.days}
                        onClick={() => {
                          setIsCustom(false);
                          setSelectedDays(opt.days);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-md shadow-purple-500/10'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-sm text-slate-900">{opt.label}</span>
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400">{opt.sub}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            opt.popular ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {opt.tag}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Custom Days Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustom(true);
                      if (!customDays) setCustomDays('45');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      isCustom
                        ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-md shadow-purple-500/10'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-sm text-slate-900">Tùy chọn</span>
                      {isCustom && (
                        <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium mt-1">
                      Nhập số ngày tự do
                    </span>
                  </button>
                </div>

                {/* Custom days input if selected */}
                {isCustom && (
                  <div className="mt-3 p-3.5 bg-purple-50/50 border border-purple-200 rounded-2xl flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 shrink-0">Số ngày gia hạn:</span>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      placeholder="VD: 45"
                      className="w-24 px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                      autoFocus
                    />
                    <span className="text-xs text-slate-500 font-medium">ngày (tối đa 365 ngày)</span>
                  </div>
                )}
              </div>

              {/* Renewal Effect & Expiry Date Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  2. Thông tin hạn hiển thị sau khi gia hạn
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Hạn sử dụng hiện tại</span>
                    <div className="font-extrabold text-slate-700 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(property.expire_date)}</span>
                    </div>
                    <span className={`text-[10px] font-semibold mt-1 inline-block ${
                      isExpired ? 'text-rose-600' : 'text-slate-500'
                    }`}>
                      {isExpired ? 'Đã hết hạn hiển thị' : 'Đang còn hiệu lực'}
                    </span>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50/50 rounded-xl border border-purple-200">
                    <span className="text-purple-700 block text-[10px] uppercase font-black flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" /> Hạn mới sau gia hạn (+{effectiveDays} ngày)
                    </span>
                    <div className="font-black text-purple-900 text-sm mt-1 flex items-center gap-1.5">
                      <CalendarPlus className="w-4 h-4 text-purple-600" />
                      <span>{newExpiryDate ? formatDate(newExpiryDate) : '---'}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Tự động hiển thị lại trang chủ
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 italic flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Tin đăng sẽ được làm mới hạn và ưu tiên xuất hiện trong danh sách tìm kiếm bất động sản.
                  </span>
                </div>
              </div>

              {/* Note input */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Ghi chú gia hạn (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Gia hạn tin để tiếp cận khách thuê đợt mới..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading || effectiveDays <= 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý gia hạn...</span>
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="w-4 h-4" />
                      <span>Xác Nhận Gia Hạn (+{effectiveDays} ngày)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-medium">
                Danh sách các lần gia hạn thời gian hiển thị của tin đăng này:
              </p>

              {historyLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                  <span className="text-xs font-semibold">Đang tải lịch sử gia hạn...</span>
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Chưa có lịch sử gia hạn nào</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Các lần gia hạn tin sẽ được lưu vết minh bạch tại đây.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historyLogs.map((log, idx) => (
                    <div key={log.id || idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-black text-[10px]">
                            +{log.details?.days_extended || 30} ngày
                          </span>
                          <span className="font-bold text-slate-800">
                            {log.details?.note || 'Gia hạn tin đăng'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Hạn mới: <strong>{formatDate(log.details?.expire_date)}</strong></span>
                          <span>•</span>
                          <span>Lúc: {new Date(log.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Thành công
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
