import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, XCircle, Clock, AlertTriangle, Search, Filter, 
  RefreshCw, Eye, CheckSquare, Square, Building2, MapPin, Tag, User, Phone, 
  Calendar, Layers, Compass, DollarSign, FileText, Check, X, AlertCircle,
  ExternalLink, ChevronRight, Grid, List, ShieldAlert, Sparkles, Send, Trash2
} from 'lucide-react';

export default function ListingApprovalsManager() {
  // 1. Data States
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    sold: 0,
    pending: 0,
    hidden: 0
  });

  // 2. Filter & View States
  const [statusFilter, setStatusFilter] = useState(() => {
    return sessionStorage.getItem('3tv_approval_status_filter') || '0';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // 3. Selection & Pagination
  const [selectedIds, setSelectedIds] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0
  });

  // 4. Modals State
  const [inspectingProperty, setInspectingProperty] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [rejectingItem, setRejectingItem] = useState(null); // Property object or 'bulk'
  const [rejectReason, setRejectReason] = useState('');
  const [selectedQuickReason, setSelectedQuickReason] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Common quick reject reasons
  const quickReasons = [
    'Hình ảnh chất lượng kém, mờ hoặc có chứa logo/watermark từ sàn khác',
    'Mức giá bán/cho thuê không hợp lý so với thị trường hoặc sai định dạng',
    'Thiếu thông tin pháp lý bắt buộc (Sổ đỏ / Sổ hồng / Hợp đồng mua bán)',
    'Địa chỉ bất động sản không chính xác hoặc không tồn tại',
    'Mô tả tin đăng chứa thông tin quảng cáo spam, vi phạm quy định',
    'Thông tin liên hệ người đăng không thể liên lạc hoặc không chính chủ',
  ];

  const showToast = (message, type = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const getHeaders = (hasBody = false) => {
    const token = localStorage.getItem('3tv_token') || '';
    const headers = { 'Accept': 'application/json' };
    if (hasBody) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // 5. Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/properties/stats', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Lỗi tải thống kê kiểm duyệt:', err);
    }
  };

  // 6. Fetch Listing for Review
  const fetchProperties = async (page = 1) => {
    setLoading(true);
    setSelectedIds([]);
    try {
      const params = new URLSearchParams({
        admin: '1',
        page: page.toString(),
        per_page: '12',
        sort: sortBy
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      } else {
        // Tổng số BĐS chính thức - loại trừ tin đang chờ duyệt
        params.append('exclude_pending', '1');
      }
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (purposeFilter !== 'all') params.append('purpose', purposeFilter);
      if (cityFilter !== 'all') params.append('city', cityFilter);

      const res = await fetch(`/api/properties?${params.toString()}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Không thể tải danh sách tin cần duyệt.');
      const json = await res.json();

      setProperties(json.data || []);
      if (json.meta) {
        setPagination(json.meta);
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi tải dữ liệu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('3tv_approval_status_filter', statusFilter);
    fetchProperties(1);
  }, [statusFilter, searchTerm, typeFilter, purposeFilter, cityFilter, sortBy]);

  // 7. Single Approve Action
  const handleApprove = async (property) => {
    setActionLoadingId(property.id);
    try {
      const res = await fetch(`/api/properties/${property.id}/status`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ status: 1 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Phê duyệt thất bại.');

      showToast(`Đã duyệt tin: "${property.title}"`);
      if (inspectingProperty?.id === property.id) {
        setInspectingProperty(null);
      }
      fetchProperties(pagination.current_page);
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 8. Single or Bulk Reject Action
  const confirmReject = async () => {
    const finalReason = selectedQuickReason 
      ? (rejectReason ? `${selectedQuickReason}. Ghi chú: ${rejectReason}` : selectedQuickReason)
      : (rejectReason || 'Không đạt tiêu chuẩn kiểm duyệt tin đăng của 3TV Land.');

    if (rejectingItem === 'bulk') {
      // Bulk reject
      if (selectedIds.length === 0) return;
      try {
        const res = await fetch('/api/properties/bulk-action', {
          method: 'POST',
          headers: getHeaders(true),
          body: JSON.stringify({ 
            action: 'reject', 
            ids: selectedIds,
            reason: finalReason 
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Từ chối thất bại.');
        showToast(`Đã từ chối ${selectedIds.length} tin đăng đã chọn.`);
        setRejectingItem(null);
        setRejectReason('');
        setSelectedQuickReason('');
        fetchProperties(pagination.current_page);
        fetchStats();
      } catch (err) {
        showToast(err.message, 'error');
      }
    } else if (rejectingItem) {
      // Single reject
      setActionLoadingId(rejectingItem.id);
      try {
        const res = await fetch(`/api/properties/${rejectingItem.id}/status`, {
          method: 'PATCH',
          headers: getHeaders(true),
          body: JSON.stringify({ 
            status: 4, 
            reason: finalReason 
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Từ chối thất bại.');
        showToast(`Đã từ chối tin: "${rejectingItem.title}"`);
        if (inspectingProperty?.id === rejectingItem.id) {
          setInspectingProperty(null);
        }
        setRejectingItem(null);
        setRejectReason('');
        setSelectedQuickReason('');
        fetchProperties(pagination.current_page);
        fetchStats();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  // 9. Bulk Approve Action
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một tin đăng để phê duyệt!', 'error');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn PHÊ DUYỆT ${selectedIds.length} tin đăng đã chọn để hiển thị công khai?`)) return;

    try {
      const res = await fetch('/api/properties/bulk-action', {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ action: 'approve', ids: selectedIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Phê duyệt hàng loạt thất bại.');

      showToast(`Đã phê duyệt thành công ${selectedIds.length} tin đăng!`);
      setSelectedIds([]);
      fetchProperties(pagination.current_page);
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 10. Selection helpers
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === properties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(properties.map(p => p.id));
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (Number(status)) {
      case 0:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Chờ duyệt
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đang hiển thị
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Đã giao dịch
          </span>
        );
      case 4:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Đã từ chối / Ẩn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
            Khác
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast popup */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all animate-bounce ${
          toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header & Stats Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-2xl font-black text-slate-800 tracking-tight">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span>DUYỆT TIN ĐĂNG BẤT ĐỘNG SẢN</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm tra thông tin pháp lý, hình ảnh, mức giá và phê duyệt tin đăng từ người dùng & môi giới trước khi hiển thị công khai.
          </p>
        </div>

        <button 
          onClick={() => { fetchStats(); fetchProperties(pagination.current_page); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-xs w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('0')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === '0' 
              ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30' 
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Chờ Kiểm Duyệt</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">{stats.pending}</div>
          <div className="text-[11px] text-amber-600/80 mt-1 font-medium">Cần xử lý ngay</div>
        </div>

        <div 
          onClick={() => setStatusFilter('1')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === '1' 
              ? 'bg-emerald-500/10 border-emerald-400 ring-2 ring-emerald-400/30' 
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Đã Duyệt / Đang Hiện</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.active}</div>
          <div className="text-[11px] text-emerald-600/80 mt-1 font-medium">Đang hiển thị công khai</div>
        </div>

        <div 
          onClick={() => setStatusFilter('4')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === '4' 
              ? 'bg-rose-500/10 border-rose-400 ring-2 ring-rose-400/30' 
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Đã Từ Chối / Đã Ẩn</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">{stats.hidden}</div>
          <div className="text-[11px] text-rose-600/80 mt-1 font-medium">Không đạt yêu cầu / Ẩn</div>
        </div>

        <div 
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'all' 
              ? 'bg-blue-500/10 border-blue-400 ring-2 ring-blue-400/30' 
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Tổng Số BĐS</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">BĐS đã kiểm duyệt</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Tìm theo Mã BĐS, tiêu đề, tên người đăng, số điện thoại, địa chỉ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-amber-500"
          >
            <option value="0">Trạng thái: Chỉ Chờ duyệt ({stats.pending})</option>
            <option value="1">Trạng thái: Đang hiển thị ({stats.active})</option>
            <option value="4">Trạng thái: Đã từ chối ({stats.hidden})</option>
            <option value="all">Tất cả BĐS đã duyệt ({stats.total})</option>
          </select>

          {/* Purpose Filter */}
          <select 
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">Mục đích: Tất cả</option>
            <option value="sale">Cần bán</option>
            <option value="rent">Cho thuê</option>
            <option value="project">Dự án mới</option>
          </select>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              title="Xem dạng Bảng"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              title="Xem dạng Lưới"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Sticky Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-20 bg-amber-500 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
            <CheckSquare className="w-4 h-4" />
            <span>Đã chọn {selectedIds.length} tin đăng</span>
          </div>

          <div className="flex items-center gap-2">
            {statusFilter !== '4' && (
              <button 
                onClick={handleBulkApprove}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white shadow-sm transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Duyệt tất cả đã chọn
              </button>
            )}
            {statusFilter !== '4' && (
              <button 
                onClick={() => setRejectingItem('bulk')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-sm transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Từ chối đã chọn
              </button>
            )}
            <button 
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold transition-colors"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Main Content: Table or Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-3" />
          <p className="text-sm font-semibold text-slate-600">Đang tải danh sách tin kiểm duyệt...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="py-16 px-4 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">
            {statusFilter === '0' 
              ? 'Không có tin nào đang chờ kiểm duyệt' 
              : 'Không tìm thấy tin đăng phù hợp'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md text-center mb-5">
            {statusFilter === '0' 
              ? 'Tất cả tin đăng gửi lên đã được xử lý (đã duyệt hoặc đã từ chối). Bấm các mục bên dưới để kiểm tra các tin đã xử lý.' 
              : 'Không có tin đăng nào khớp với điều kiện lọc hiện tại.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {stats.pending > 0 && statusFilter !== '0' && (
              <button 
                onClick={() => setStatusFilter('0')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                Chờ duyệt ({stats.pending})
              </button>
            )}
            {stats.active > 0 && statusFilter !== '1' && (
              <button 
                onClick={() => setStatusFilter('1')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Đã duyệt / Đang hiện ({stats.active})
              </button>
            )}
            {stats.hidden > 0 && statusFilter !== '4' && (
              <button 
                onClick={() => setStatusFilter('4')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Đã từ chối ({stats.hidden})
              </button>
            )}
            {statusFilter !== 'all' && (
              <button 
                onClick={() => setStatusFilter('all')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Tất cả BĐS đã duyệt ({stats.total})
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-extrabold text-[11px] tracking-wider">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input 
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === properties.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-3">Bất Động Sản</th>
                  <th className="py-3.5 px-3">Loại / Mục Đích</th>
                  <th className="py-3.5 px-3">Mức Giá & Diện Tích</th>
                  <th className="py-3.5 px-3">Người Đăng / SĐT</th>
                  <th className="py-3.5 px-3">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác Duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((prop) => {
                  const isSelected = selectedIds.includes(prop.id);
                  const isActionLoading = actionLoadingId === prop.id;

                  return (
                    <tr 
                      key={prop.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(prop.id)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>

                      {/* Property Info */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3 max-w-sm">
                          <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <img 
                              src={prop.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300'} 
                              alt={prop.title}
                              className="w-full h-full object-cover"
                            />
                            {prop.images?.length > 1 && (
                              <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-[9px] text-white px-1 rounded font-bold">
                                +{prop.images.length}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {prop.code || `#BDS-${prop.id}`}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {prop.created_at ? new Date(prop.created_at).toLocaleDateString('vi-VN') : ''}
                              </span>
                            </div>
                            <h4 
                              onClick={() => setInspectingProperty(prop)}
                              className="font-bold text-slate-800 text-xs truncate hover:text-amber-600 cursor-pointer mt-0.5"
                            >
                              {prop.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              {prop.address || `${prop.district || ''}, ${prop.city || 'TP.HCM'}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type & Purpose */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                            prop.purpose === 'rent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {prop.purpose === 'rent' ? 'Cho thuê' : 'Cần bán'}
                          </span>
                          <div className="text-[11px] font-medium text-slate-600">
                            {prop.type || prop.property_type?.name || 'Nhà đất'}
                          </div>
                        </div>
                      </td>

                      {/* Price & Area */}
                      <td className="py-3.5 px-3">
                        <div className="font-black text-rose-600 text-xs">
                          {prop.price_sale_text || prop.price_rent_text || `${prop.price} đ`}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {prop.area} m² {prop.unit_price ? `• ${prop.unit_price}` : ''}
                        </div>
                      </td>

                      {/* Poster */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {prop.owner_name || prop.user?.name || 'Chưa cập nhật'}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {prop.owner_phone || prop.user?.phone || 'Chưa có SĐT'}
                          </div>
                        </div>
                      </td>

                      {/* Status & Rejection Reason */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          {renderStatusBadge(prop.status)}
                          {prop.status === 4 && (
                            <div className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 max-w-xs leading-snug">
                              Lý do: {prop.rejection_reason || 'Không đạt tiêu chuẩn kiểm duyệt'}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Modal Trigger */}
                          <button 
                            onClick={() => setInspectingProperty(prop)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors shadow-2xs"
                            title="Xem chi tiết & Thẩm định"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Chỉ tin Chờ duyệt (status === 0) mới hiển thị nút Duyệt và Từ chối */}
                          {prop.status === 0 && (
                            <>
                              <button 
                                disabled={isActionLoading}
                                onClick={() => handleApprove(prop)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                                title="Phê duyệt tin này"
                              >
                                <Check className="w-3 h-3" />
                                Duyệt
                              </button>

                              <button 
                                disabled={isActionLoading}
                                onClick={() => {
                                  setRejectingItem(prop);
                                  setRejectReason('');
                                  setSelectedQuickReason('');
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                                title="Từ chối tin"
                              >
                                <X className="w-3 h-3" />
                                Từ chối
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((prop) => {
            const isSelected = selectedIds.includes(prop.id);
            const isActionLoading = actionLoadingId === prop.id;

            return (
              <div 
                key={prop.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-xs hover:shadow-md flex flex-col ${
                  isSelected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200'
                }`}
              >
                {/* Image & Top Badges */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img 
                    src={prop.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500'} 
                    alt={prop.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Checkbox select */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(prop.id)}
                      className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    {renderStatusBadge(prop.status)}
                  </div>

                  {/* Price & Code overlay */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
                    <div>
                      <div className="text-[10px] font-mono text-amber-300 font-bold">
                        {prop.code || `#BDS-${prop.id}`}
                      </div>
                      <div className="text-base font-black text-white">
                        {prop.price_sale_text || prop.price_rent_text || `${prop.price} đ`}
                      </div>
                    </div>
                    <span className="text-xs font-semibold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded">
                      {prop.area} m²
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 
                      onClick={() => setInspectingProperty(prop)}
                      className="font-bold text-slate-800 text-sm hover:text-amber-600 cursor-pointer line-clamp-2"
                    >
                      {prop.title}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {prop.address || `${prop.district || ''}, ${prop.city || ''}`}
                    </p>
                  </div>

                  {/* User info */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                        {(prop.owner_name || prop.user?.name || 'U').charAt(0)}
                      </div>
                      <span className="font-semibold truncate">{prop.owner_name || prop.user?.name || 'Người dùng'}</span>
                    </div>
                    <span className="text-slate-400">{prop.owner_phone || prop.user?.phone || ''}</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <button 
                      onClick={() => setInspectingProperty(prop)}
                      className="flex-1 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Thẩm định
                    </button>

                    {/* Chỉ tin Chờ duyệt (status === 0) mới hiển thị nút Duyệt và Từ chối */}
                    {prop.status === 0 && (
                      <>
                        <button 
                          disabled={isActionLoading}
                          onClick={() => handleApprove(prop)}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Duyệt
                        </button>

                        <button 
                          disabled={isActionLoading}
                          onClick={() => {
                            setRejectingItem(prop);
                            setRejectReason('');
                            setSelectedQuickReason('');
                          }}
                          className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                          title="Từ chối tin"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-500">
            Hiển thị trang <strong className="text-slate-800">{pagination.current_page}</strong> / {pagination.last_page} ({pagination.total} tin)
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              disabled={pagination.current_page === 1}
              onClick={() => fetchProperties(pagination.current_page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-40 hover:bg-slate-50"
            >
              Trước
            </button>
            {Array.from({ length: pagination.last_page }).map((_, idx) => (
              <button 
                key={idx + 1}
                onClick={() => fetchProperties(idx + 1)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  pagination.current_page === idx + 1 
                    ? 'bg-amber-500 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button 
              disabled={pagination.current_page === pagination.last_page}
              onClick={() => fetchProperties(pagination.current_page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-40 hover:bg-slate-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: THẨM ĐỊNH TOÀN DIỆN CHI TIẾT BẤT ĐỘNG SẢN (FULL INSPECTION MODAL) */}
      {/* ========================================================================= */}
      {inspectingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  {inspectingProperty.code || `#BDS-${inspectingProperty.id}`}
                </span>
                <span className="text-xs text-slate-500">
                  Đăng ngày: {new Date(inspectingProperty.created_at || Date.now()).toLocaleDateString('vi-VN')}
                </span>
                {renderStatusBadge(inspectingProperty.status)}
              </div>

              <button 
                onClick={() => setInspectingProperty(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Title & Quick Info */}
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-snug">
                  {inspectingProperty.title}
                </h2>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                  {inspectingProperty.address || 'Địa chỉ đang cập nhật'} - {inspectingProperty.district}, {inspectingProperty.city}
                </p>
              </div>

              {/* Rejection reason banner */}
              {inspectingProperty.status === 4 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-rose-900 block mb-0.5">Lý do tin bị từ chối / đã ẩn:</strong>
                    <span className="font-medium leading-relaxed">{inspectingProperty.rejection_reason || 'Không đạt tiêu chuẩn kiểm duyệt của ban quản trị.'}</span>
                  </div>
                </div>
              )}

              {/* Layout 2 Columns: Media Gallery & Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left: Images Gallery */}
                <div className="space-y-3">
                  <div className="relative h-64 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img 
                      src={
                        inspectingProperty.images && inspectingProperty.images.length > 0 
                          ? inspectingProperty.images[activeImageIndex]?.image_url || inspectingProperty.images[activeImageIndex]?.image || inspectingProperty.image
                          : inspectingProperty.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600'
                      } 
                      alt="Property" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-full font-bold">
                      Ảnh {activeImageIndex + 1} / {(inspectingProperty.images?.length || 1)}
                    </div>
                  </div>

                  {/* Thumbnails */}
                  {inspectingProperty.images && inspectingProperty.images.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {inspectingProperty.images.map((img, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-14 h-11 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                            activeImageIndex === idx ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img.image_url || img.image} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Map / Coordinates info */}
                  {(inspectingProperty.lat || inspectingProperty.latitude) && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                      <span className="font-semibold">Toạ độ định vị:</span>
                      <span className="font-mono text-slate-500">
                        {inspectingProperty.lat || inspectingProperty.latitude}, {inspectingProperty.lng || inspectingProperty.longitude}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Specifications & Pricing */}
                <div className="space-y-4">
                  {/* Price Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md">
                    <div className="text-xs uppercase font-bold opacity-80">Mức giá niêm yết</div>
                    <div className="text-2xl font-black mt-0.5">
                      {inspectingProperty.price_sale_text || inspectingProperty.price_rent_text || `${inspectingProperty.price} VNĐ`}
                    </div>
                    <div className="text-xs opacity-90 mt-1 flex items-center gap-2">
                      <span>Mục đích: <strong>{inspectingProperty.purpose === 'rent' ? 'Cho thuê' : 'Bán'}</strong></span>
                      {inspectingProperty.unit_price && <span>• Đơn giá: <strong>{inspectingProperty.unit_price}</strong></span>}
                    </div>
                  </div>

                  {/* Technical Specs Grid */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Diện tích</span>
                      <strong className="text-slate-800 text-sm font-black">{inspectingProperty.area} m²</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Loại hình</span>
                      <strong className="text-slate-800 font-bold">{inspectingProperty.type || 'Căn hộ'}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Phòng ngủ / WC</span>
                      <strong className="text-slate-800 font-bold">{inspectingProperty.bedrooms || 0} PN / {inspectingProperty.bathrooms || 0} WC</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Hướng nhà / Số tầng</span>
                      <strong className="text-slate-800 font-bold">{inspectingProperty.direction || 'Không xác định'} / {inspectingProperty.floors || 1} tầng</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Pháp lý</span>
                      <strong className="text-slate-800 font-bold">{inspectingProperty.legal_status || inspectingProperty.legal || 'Đang cập nhật'}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Nội thất</span>
                      <strong className="text-slate-800 font-bold">{inspectingProperty.furniture || 'Cơ bản'}</strong>
                    </div>
                  </div>

                  {/* Poster / Submitter Information Box */}
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                    <div className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Thông tin người đăng bài
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Họ tên:</span>
                        <strong className="text-slate-800 font-bold">{inspectingProperty.owner_name || inspectingProperty.user?.name || 'Khách hàng'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Số điện thoại:</span>
                        <strong className="text-slate-800 font-bold flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {inspectingProperty.owner_phone || inspectingProperty.user?.phone || 'Chưa cung cấp'}
                        </strong>
                      </div>
                      {inspectingProperty.user?.email && (
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[10px]">Email tài khoản:</span>
                          <span className="text-slate-700">{inspectingProperty.user.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Description Content */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  Nội dung mô tả chi tiết
                </h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {inspectingProperty.description || 'Chưa có nội dung mô tả cho tin đăng này.'}
                </div>
              </div>

              {/* Amenities if available */}
              {inspectingProperty.amenities && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                    Tiện ích đi kèm
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
                    {inspectingProperty.amenities}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Decision Bar */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <button 
                onClick={() => setInspectingProperty(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
              >
                Đóng xem
              </button>

              <div className="flex items-center gap-3">
                {inspectingProperty.status === 0 && (
                  <>
                    <button 
                      disabled={actionLoadingId === inspectingProperty.id}
                      onClick={() => {
                        setRejectingItem(inspectingProperty);
                        setRejectReason('');
                        setSelectedQuickReason('');
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      Từ chối phê duyệt
                    </button>

                    <button 
                      disabled={actionLoadingId === inspectingProperty.id}
                      onClick={() => handleApprove(inspectingProperty)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      {actionLoadingId === inspectingProperty.id ? 'Đang duyệt...' : 'Phê Duyệt & Hiển Thị Ngay'}
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TỪ CHỐI TIN ĐĂNG VỚI LÝ DO (REJECT REASON DIALOG)                */}
      {/* ========================================================================= */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-scale-up border border-slate-100">
            
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-900">
                  {rejectingItem === 'bulk' ? `Từ chối ${selectedIds.length} tin đăng đã chọn` : 'Từ chối tin đăng'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vui lòng chọn hoặc nhập lý do từ chối để thông báo cho người đăng bài chỉnh sửa.
                </p>
              </div>
              <button 
                onClick={() => setRejectingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Reasons Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Lý do thường gặp (chọn nhanh):</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {quickReasons.map((reason, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => setSelectedQuickReason(reason)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      selectedQuickReason === reason 
                        ? 'border-rose-500 bg-rose-50 text-rose-800 font-bold' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    • {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Ghi chú hoặc phản hồi thêm cho người đăng (không bắt buộc):
              </label>
              <textarea 
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập chi tiết hướng dẫn để người đăng biết cách sửa đổi tin..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                type="button"
                onClick={confirmReject}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors"
              >
                Xác nhận từ chối
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
