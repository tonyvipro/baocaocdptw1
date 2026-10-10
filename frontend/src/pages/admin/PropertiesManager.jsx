import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Plus, Search, Filter, RefreshCw, Eye, Edit, Trash2, RotateCcw, 
  CheckCircle2, XCircle, AlertTriangle, Clock, MapPin, DollarSign, Home, 
  Layers, Compass, ShieldCheck, Check, Calendar, ArrowRight, ArrowLeft,
  X, CheckSquare, Square, Tag, ExternalLink, CalendarPlus, AlertCircle
} from 'lucide-react';

export default function PropertiesManager() {
  // Navigation Tabs: 'list' | 'create' | 'trash' | 'review'
  const [activeTab, setActiveTab] = useState('list');

  // Stats State
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    sold: 0,
    pending: 0,
    hidden: 0,
    trash: 0,
    total_value_text: '0 tỷ'
  });

  // Property List State
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0
  });

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Trash State
  const [trashList, setTrashList] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashPagination, setTrashPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [selectedTrashIds, setSelectedTrashIds] = useState([]);

  // Modals State
  const [viewingProperty, setViewingProperty] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Status Notification popup
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  const showToast = (message, type = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper auth headers
  const getHeaders = (hasBody = false) => {
    const token = localStorage.getItem('3tv_token') || '';
    const headers = { 'Accept': 'application/json' };
    if (hasBody) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // 1. Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/properties/stats', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Lỗi tải thống kê BĐS:', err);
    }
  };

  // 2. Fetch Property List
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
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (purposeFilter !== 'all') params.append('purpose', purposeFilter);
      if (cityFilter !== 'all') params.append('city', cityFilter);

      const res = await fetch(`/api/properties?${params.toString()}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Không thể tải danh sách bất động sản.');
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

  // 3. Fetch Trash List
  const fetchTrash = async (page = 1) => {
    setTrashLoading(true);
    setSelectedTrashIds([]);
    try {
      const res = await fetch(`/api/properties/trash?page=${page}`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setTrashList(json.data || []);
        if (json.meta) setTrashPagination(json.meta);
      }
    } catch (err) {
      showToast('Lỗi khi tải thùng rác.', 'error');
    } finally {
      setTrashLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'list' || activeTab === 'review') {
      fetchProperties(1);
    } else if (activeTab === 'trash') {
      fetchTrash(1);
    }
  }, [activeTab, searchTerm, typeFilter, statusFilter, purposeFilter, cityFilter, sortBy]);

  // Handle Soft Delete
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn chuyển BĐS "${title}" vào Thùng rác?`)) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Xóa thất bại.');
      showToast(data.message || 'Đã chuyển BĐS vào Thùng rác.');
      fetchProperties(pagination.current_page);
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Restore
  const handleRestore = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/properties/${id}/restore`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Khôi phục thất bại.');
      showToast(data.message || 'Khôi phục thành công!');
      fetchTrash(trashPagination.current_page);
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Force Delete
  const handleForceDelete = async (id) => {
    if (!window.confirm('CẢNH BÁO: Hành động này sẽ xóa VĨNH VIỄN bất động sản và không thể hoàn tác! Bạn có chắc chắn?')) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/properties/${id}/force`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Xóa vĩnh viễn thất bại.');
      showToast(data.message || 'Đã xóa vĩnh viễn khỏi hệ thống.');
      fetchTrash(trashPagination.current_page);
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Quick Change Status (0: Chờ duyệt, 1: Hiển thị, 2: Đã bán, 4: Đã ẩn)
  const handleChangeStatus = async (id, newStatus) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/properties/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật trạng thái.');
      showToast(data.message);
      fetchProperties(pagination.current_page);
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Extend (Gia hạn tin 30 ngày)
  const handleExtend = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/properties/${id}/extend`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ days: 30 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gia hạn thất bại.');
      showToast(data.message);
      fetchProperties(pagination.current_page);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Bulk Action
  const handleBulkAction = async (action, isTrash = false) => {
    const ids = isTrash ? selectedTrashIds : selectedIds;
    if (ids.length === 0) {
      showToast('Vui lòng chọn ít nhất một bất động sản!', 'error');
      return;
    }

    const actionText = {
      delete: 'chuyển vào Thùng rác',
      restore: 'khôi phục',
      force_delete: 'XÓA VĨNH VIỄN',
      hide: 'tạm ẩn',
      show: 'bật hiển thị',
      approve: 'phê duyệt'
    }[action] || action;

    if (!window.confirm(`Bạn có chắc muốn ${actionText} ${ids.length} bất động sản đã chọn?`)) return;

    try {
      const res = await fetch('/api/properties/bulk-action', {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ action, ids })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Thao tác thất bại.');
      showToast(data.message);
      if (isTrash) {
        fetchTrash(1);
      } else {
        fetchProperties(pagination.current_page);
      }
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Toggle selection
  const toggleSelect = (id, isTrash = false) => {
    if (isTrash) {
      setSelectedTrashIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  const toggleSelectAll = (isTrash = false) => {
    if (isTrash) {
      if (selectedTrashIds.length === trashList.length) {
        setSelectedTrashIds([]);
      } else {
        setSelectedTrashIds(trashList.map(p => p.id));
      }
    } else {
      if (selectedIds.length === properties.length) {
        setSelectedIds([]);
      } else {
        setSelectedIds(properties.map(p => p.id));
      }
    }
  };

  // Badge status render
  const renderStatusBadge = (status) => {
    switch (Number(status)) {
      case 0:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3 h-3" /> Chờ duyệt</span>;
      case 1:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Đang hiển thị</span>;
      case 2:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200"><Tag className="w-3 h-3" /> Đã giao dịch</span>;
      case 3:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"><Calendar className="w-3 h-3" /> Hết hạn</span>;
      case 4:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200"><XCircle className="w-3 h-3" /> Đã ẩn / Từ chối</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">Khác</span>;
    }
  };

  const renderPurposeBadge = (purpose) => {
    if (purpose === 'sale') return <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Bán</span>;
    if (purpose === 'rent') return <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Thuê</span>;
    return <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Dự án</span>;
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all animate-bounce ${
          toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-red-600" />
            QUẢN LÝ BẤT ĐỘNG SẢN
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Danh sách, kiểm duyệt, cập nhật thông tin và trạng thái các tài sản trên hệ thống 3TV Land.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Danh sách BĐS ({stats.total})
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'create' 
                ? 'bg-red-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-red-600'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Thêm BĐS mới
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`relative px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'review' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kiểm duyệt ({stats.pending})
            {stats.pending > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('trash')}
            className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'trash' 
                ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm' 
                : 'text-slate-500 hover:text-rose-600'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" /> Thùng rác ({stats.trash})
          </button>
        </div>
      </div>

      {/* Quick Dashboard Cards  */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Tổng Tài Sản</div>
            <div className="text-xl font-black text-slate-800">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Đang Bán / Đang hiện</div>
            <div className="text-xl font-black text-emerald-600">{stats.active}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Đã Giao Dịch</div>
            <div className="text-xl font-black text-purple-600">{stats.sold}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Chờ Kiểm Duyệt</div>
            <div className="text-xl font-black text-amber-600">{stats.pending}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 col-span-2 lg:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Tổng Giá Trị Quản Lý</div>
            <div className="text-base font-black text-slate-800">{stats.total_value_text}</div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DANH SÁCH BẤT ĐỘNG SẢN           */}
      {/* ========================================================= */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          
          {/* Filter & Search Toolbar */}
          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              
              {/* Search input */}
              <div className="lg:col-span-2 relative group">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nhập Địa chỉ, Mã BĐS, Tiêu đề..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              {/* Type filter */}
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-red-500"
                >
                  <option value="all">Tất cả loại BĐS</option>
                  <option value="Căn hộ cao cấp">Căn hộ cao cấp</option>
                  <option value="Nhà phố liền kề">Nhà phố liền kề</option>
                  <option value="Biệt thự đơn lập">Biệt thự đơn lập</option>
                  <option value="Shophouse thương mại">Shophouse</option>
                  <option value="Đất nền dự án">Đất nền dự án</option>
                  <option value="Penthouse Sky Villa">Penthouse</option>
                </select>
              </div>

              {/* Purpose filter */}
              <div>
                <select
                  value={purposeFilter}
                  onChange={(e) => setPurposeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-red-500"
                >
                  <option value="all">Tất cả mục đích</option>
                  <option value="sale">Mua bán</option>
                  <option value="rent">Cho thuê</option>
                  <option value="project">Dự án</option>
                </select>
              </div>

              {/* Status filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-red-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="1">Đang hiển thị</option>
                  <option value="0">Chờ duyệt</option>
                  <option value="2">Đã giao dịch</option>
                  <option value="4">Đã ẩn</option>
                </select>
              </div>

              {/* Sort by */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-red-500"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="price_asc">Giá: Thấp → Cao</option>
                  <option value="price_desc">Giá: Cao → Thấp</option>
                  <option value="area_desc">Diện tích: Lớn → Nhỏ</option>
                </select>
              </div>
            </div>

            {/* Bulk Action Bar (Hiển thị khi tích chọn) */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-slate-50/80 p-2.5 rounded-xl">
                <span className="text-xs font-semibold text-slate-700">
                  Đã chọn <strong className="text-red-600">{selectedIds.length}</strong> bất động sản
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                  >
                    Chuyển vào Thùng rác
                  </button>
                  <button
                    onClick={() => handleBulkAction('hide')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                  >
                    Tạm ẩn
                  </button>
                  <button
                    onClick={() => handleBulkAction('show')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                    Bật hiển thị
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Properties Table */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-2xl shadow-slate-200/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase font-black text-[10px] tracking-widest">
                    <th className="py-4 px-5 w-10 border-b border-slate-800">
                      <button 
                        type="button" 
                        onClick={() => toggleSelectAll(false)}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {selectedIds.length > 0 && selectedIds.length === properties.length ? (
                          <CheckSquare className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-3 w-16 border-b border-slate-800">Mã BĐS</th>
                    <th className="py-4 px-3 w-20 border-b border-slate-800">Ảnh</th>
                    <th className="py-4 px-4 min-w-[220px] border-b border-slate-800">Bất Động Sản & Địa Chỉ</th>
                    <th className="py-4 px-3 min-w-[130px] border-b border-slate-800">Loại & Diện tích</th>
                    <th className="py-4 px-3 min-w-[120px] border-b border-slate-800">Mức Giá</th>
                    <th className="py-4 px-3 min-w-[120px] border-b border-slate-800">Trạng Thái</th>
                    <th className="py-4 px-3 min-w-[110px] border-b border-slate-800">Phụ trách</th>
                    <th className="py-4 px-5 text-right min-w-[160px] border-b border-slate-800">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-red-600" />
                        Đang tải danh sách bất động sản...
                      </td>
                    </tr>
                  ) : properties.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-400">
                        <Home className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        Không tìm thấy bất động sản nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    properties.map((prop) => (
                      <tr 
                        key={prop.id} 
                        className={`group hover:bg-blue-50/40 transition-all duration-300 ${
                          selectedIds.includes(prop.id) ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        <td className="py-3 px-5 border-b border-slate-50/50">
                          <button 
                            type="button"
                            onClick={() => toggleSelect(prop.id, false)}
                            className="text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                          >
                            {selectedIds.includes(prop.id) ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-slate-400 text-[11px] border-b border-slate-50/50 group-hover:text-blue-600 transition-colors">
                          {prop.code || `#${prop.id}`}
                        </td>

                        <td className="py-3 px-3 border-b border-slate-50/50">
                          <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 shrink-0 shadow-sm group-hover:shadow-md group-hover:border-blue-200 transition-all">
                            <img
                              src={prop.image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&auto=format&fit=crop&q=80'}
                              alt={prop.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&auto=format&fit=crop&q=80';
                              }}
                            />
                          </div>
                        </td>

                        <td className="py-3 px-4 border-b border-slate-50/50">
                          <div className="flex items-center gap-2 mb-1">
                            {renderPurposeBadge(prop.purpose)}
                            <div className="font-extrabold text-slate-800 line-clamp-1 group-hover:text-blue-600 cursor-pointer transition-colors" onClick={() => setViewingProperty(prop)}>
                              {prop.title}
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 line-clamp-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-blue-500 transition-colors" />
                            {prop.address || `${prop.district || ''}, ${prop.city || 'TP.HCM'}`}
                          </div>
                        </td>

                        <td className="py-3 px-3 border-b border-slate-50/50">
                          <div className="font-bold text-slate-700">{prop.type || 'Căn hộ'}</div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                            <span className="text-slate-800">{prop.area}</span> m² {prop.bedrooms ? `• ${prop.bedrooms} PN` : ''}
                          </div>
                        </td>

                        <td className="py-3 px-3 border-b border-slate-50/50">
                          <div className="font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500 text-sm drop-shadow-sm">
                            {prop.price_sale_text || prop.price_rent_text || `${prop.price} đ`}
                          </div>
                        </td>

                        <td className="py-3 px-3 border-b border-slate-50/50">
                          {renderStatusBadge(prop.status)}
                        </td>

                        <td className="py-3 px-3 border-b border-slate-50/50">
                          <div className="font-bold text-slate-700 truncate max-w-[100px]">
                            {prop.user?.name || prop.owner_name || 'Admin'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {prop.owner_phone || '0901234567'}
                          </div>
                        </td>

                        <td className="py-3 px-5 text-right border-b border-slate-50/50">
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            {/* Nút Xem chi tiết */}
                            <button
                              onClick={() => setViewingProperty(prop)}
                              title="Xem chi tiết"
                              className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-sm transition-all cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Nút Sửa */}
                            <button
                              onClick={() => setEditingProperty(prop)}
                              title="Chỉnh sửa thông tin"
                              className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:shadow-sm transition-all cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Nút Gia hạn tin */}
                            <button
                              onClick={() => handleExtend(prop.id)}
                              title="Gia hạn tin (+30 ngày)"
                              className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 hover:shadow-sm transition-all cursor-pointer"
                            >
                              <CalendarPlus className="w-4 h-4" />
                            </button>

                            {/* Nút Ẩn/Hiện */}
                            <button
                              onClick={() => handleChangeStatus(prop.id, prop.status === 1 ? 4 : 1)}
                              title={prop.status === 1 ? 'Tạm ẩn bài đăng' : 'Bật hiển thị'}
                              className={`p-2 rounded-xl transition-all hover:shadow-sm cursor-pointer ${
                                prop.status === 1 
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' 
                                  : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {prop.status === 1 ? <Eye className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>

                            {/* Nút Xóa (Vào thùng rác) */}
                            <button
                              onClick={() => handleDelete(prop.id, prop.title)}
                              title="Chuyển vào Thùng rác"
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:shadow-sm transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.total > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
                <div>
                  Hiển thị trang <strong className="text-slate-800">{pagination.current_page}</strong> / {pagination.last_page} (Tổng {pagination.total} BĐS)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={pagination.current_page <= 1}
                    onClick={() => fetchProperties(pagination.current_page - 1)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Trang trước
                  </button>
                  <button
                    disabled={pagination.current_page >= pagination.last_page}
                    onClick={() => fetchProperties(pagination.current_page + 1)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TẠO TIN ĐĂNG / THÊM BĐS MỚI                */}
      {/* ========================================================= */}
      {activeTab === 'create' && (
        <CreatePropertyForm 
          onSuccess={() => {
            showToast('Tạo tin đăng bất động sản thành công!');
            setActiveTab('list');
            fetchStats();
            fetchProperties(1);
          }}
          onCancel={() => setActiveTab('list')}
        />
      )}

      {/* ========================================================= */}
      {/* KIỂM DUYỆT BĐS CHỜ DUYỆT                   */}
      {/* ========================================================= */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <strong className="font-bold">Màn hình Kiểm duyệt Tin đăng:</strong> Quản trị viên kiểm tra kỹ nội dung, hình ảnh, tính pháp lý và giá trị của bài đăng trước khi duyệt hiển thị công khai trên website.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px]">
                  <th className="py-3 px-4">Mã BĐS</th>
                  <th className="py-3 px-3">Ảnh</th>
                  <th className="py-3 px-4">Tiêu Đề</th>
                  <th className="py-3 px-3">Loại</th>
                  <th className="py-3 px-3">Mức Giá</th>
                  <th className="py-3 px-3">Người Đăng</th>
                  <th className="py-3 px-4 text-right">Phê Duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.filter(p => p.status === 0).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                      Hiện tại không có tin đăng nào đang chờ duyệt!
                    </td>
                  </tr>
                ) : (
                  properties.filter(p => p.status === 0).map(prop => (
                    <tr key={prop.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{prop.code || `#${prop.id}`}</td>
                      <td className="py-3 px-3">
                        <img src={prop.image} className="w-12 h-9 rounded object-cover" />
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{prop.title}</td>
                      <td className="py-3 px-3">{prop.type}</td>
                      <td className="py-3 px-3 font-bold text-red-600">{prop.price_sale_text || prop.price}</td>
                      <td className="py-3 px-3">{prop.owner_name || prop.user?.name}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleChangeStatus(prop.id, 1)}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleChangeStatus(prop.id, 4)}
                            className="px-2.5 py-1 rounded bg-rose-100 text-rose-700 font-bold text-[11px] hover:bg-rose-200"
                          >
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* THÙNG RÁC - XÓA / KHÔI PHỤC BĐS            */}
      {/* ========================================================= */}
      {activeTab === 'trash' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Thùng rác Bất Động Sản</h3>
              <p className="text-xs text-slate-500">Các bất động sản đã bị xóa tạm thời. Bạn có thể khôi phục lại hoặc xóa vĩnh viễn.</p>
            </div>

            {selectedTrashIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('restore', true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                >
                  Khôi phục đã chọn ({selectedTrashIds.length})
                </button>
                <button
                  onClick={() => handleBulkAction('force_delete', true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
                >
                  Xóa vĩnh viễn đã chọn ({selectedTrashIds.length})
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px]">
                  <th className="py-3 px-4 w-10">
                    <button type="button" onClick={() => toggleSelectAll(true)}>
                      {selectedTrashIds.length > 0 && selectedTrashIds.length === trashList.length ? (
                        <CheckSquare className="w-4 h-4 text-red-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">Mã BĐS</th>
                  <th className="py-3 px-4">Tiêu Đề</th>
                  <th className="py-3 px-3">Địa Chỉ</th>
                  <th className="py-3 px-3">Giá</th>
                  <th className="py-3 px-3">Ngày Xóa</th>
                  <th className="py-3 px-4 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trashLoading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-red-600" />
                      Đang tải thùng rác...
                    </td>
                  </tr>
                ) : trashList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <Trash2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      Thùng rác rỗng. Không có tài sản nào bị xóa tạm.
                    </td>
                  </tr>
                ) : (
                  trashList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <button type="button" onClick={() => toggleSelect(item.id, true)}>
                          {selectedTrashIds.includes(item.id) ? (
                            <CheckSquare className="w-4 h-4 text-red-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-500">{item.code || `#${item.id}`}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{item.title}</td>
                      <td className="py-3 px-3 text-slate-500">{item.address}</td>
                      <td className="py-3 px-3 font-bold text-red-600">{item.price_sale_text || item.price}</td>
                      <td className="py-3 px-3 text-slate-400">{new Date(item.deleted_at).toLocaleString('vi-VN')}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold border border-emerald-200 flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Khôi phục
                          </button>
                          <button
                            onClick={() => handleForceDelete(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold border border-rose-200 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa vĩnh viễn
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: XEM CHI TIẾT BẤT ĐỘNG SẢN               */}
      {/* ========================================================= */}
      {viewingProperty && (
        <PropertyDetailModal
          property={viewingProperty}
          onClose={() => setViewingProperty(null)}
          onEdit={() => {
            setEditingProperty(viewingProperty);
            setViewingProperty(null);
          }}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CHỈNH SỬA THÔNG TIN BĐS                  */}
      {/* ========================================================= */}
      {editingProperty && (
        <EditPropertyModal
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
          onSuccess={() => {
            showToast('(Cập nhật thành công, giữ lại ảnh cũ) Cập nhật sản phẩm thành công!');
            setEditingProperty(null);
            fetchProperties(pagination.current_page);
            fetchStats();
          }}
        />
      )}

    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: FORM TẠO TIN ĐĂNG / THÊM BĐS MỚI 
// -------------------------------------------------------------
function CreatePropertyForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    purpose: 'sale',
    type: 'Căn hộ cao cấp',
    price: '',
    area: '',
    bedrooms: '2',
    bathrooms: '2',
    floors: '1',
    direction: 'Đông Nam',
    legal_status: 'Sổ hồng',
    build_year: '2024',
    address: '',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    street: '',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
    owner_name: 'Nguyễn Quản Trị',
    owner_phone: '0901234567',
    description: '',
    amenities: ['Hồ bơi', 'Phòng gym', 'Bảo vệ 24/7', 'Thang máy']
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableAmenities = [
    'Hồ bơi', 'Phòng gym', 'Bảo vệ 24/7', 'Thang máy', 
    'Công viên', 'Khu BBQ', 'Sân tennis', 'Chỗ đậu ô tô', 
    'Siêu thị mini', 'Khu vui chơi trẻ em'
  ];

  const handleToggleAmenity = (item) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(item)
        ? prev.amenities.filter(a => a !== item)
        : [...prev.amenities, item]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();
    setError('');

    // Validation theo Chương 6 Báo cáo
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tên sản phẩm. / Tên không được để trống.');
      return;
    }
    if (formData.title.length > 255) {
      setError('Tên sản phẩm không được vượt quá 255 ký tự.');
      return;
    }
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      setError('Vui lòng nhập giá. / Giá sản phẩm phải là một số (không được là số âm).');
      return;
    }
    if (!formData.area || isNaN(formData.area) || Number(formData.area) <= 0) {
      setError('Vui lòng nhập diện tích hợp lệ.');
      return;
    }
    if (!formData.address.trim()) {
      setError('Vui lòng nhập địa chỉ chi tiết.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        area: Number(formData.area),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        floors: Number(formData.floors),
        build_year: Number(formData.build_year),
        status: isDraft ? 0 : 1
      };

      const token = localStorage.getItem('3tv_token') || '';
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch('/api/properties', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        res = await fetch('http://localhost:8080/api/properties', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi khi tạo bất động sản.');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-red-600" /> TẠO TIN ĐĂNG MỚI 
          </h2>
          <p className="text-xs text-slate-500">Điền thông tin chi tiết bất động sản để đăng tải lên hệ thống.</p>
        </div>
        <button onClick={onCancel} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-5 text-xs">
        {/* Hàng 1: Tiêu đề & Mục đích */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="font-bold text-slate-700">Tiêu đề tin (*):</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ví dụ: Bán căn hộ 3PN Vinhomes Central Park view sông cực đẹp..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Chuyên mục / Mục đích (*):</label>
            <select
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 font-medium"
            >
              <option value="sale">Mua bán</option>
              <option value="rent">Cho thuê</option>
              <option value="project">Dự án mới</option>
            </select>
          </div>
        </div>

        {/* Hàng 2: Loại BĐS, Giá, Diện tích */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Loại bất động sản (*):</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 font-medium"
            >
              <option value="Căn hộ cao cấp">Căn hộ cao cấp</option>
              <option value="Nhà phố liền kề">Nhà phố liền kề</option>
              <option value="Biệt thự đơn lập">Biệt thự đơn lập</option>
              <option value="Shophouse thương mại">Shophouse thương mại</option>
              <option value="Đất nền dự án">Đất nền dự án</option>
              <option value="Penthouse Sky Villa">Penthouse Sky Villa</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Giá tài sản (* VNĐ):</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="VD: 3500000000 (3.5 tỷ)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 font-medium font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Diện tích (* m²):</label>
            <input
              type="number"
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder="VD: 85"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 font-medium font-mono"
            />
          </div>
        </div>

        {/* Hàng 3: Chi tiết phòng, tầng, hướng, pháp lý */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Số phòng ngủ:</label>
            <input
              type="number"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Số phòng tắm:</label>
            <input
              type="number"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Hướng nhà:</label>
            <select
              name="direction"
              value={formData.direction}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-red-500"
            >
              <option value="Đông Nam">Đông Nam</option>
              <option value="Đông">Đông</option>
              <option value="Tây">Tây</option>
              <option value="Nam">Nam</option>
              <option value="Bắc">Bắc</option>
              <option value="Tây Nam">Tây Nam</option>
              <option value="Đông Bắc">Đông Bắc</option>
              <option value="Tây Bắc">Tây Bắc</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Pháp lý:</label>
            <input
              type="text"
              name="legal_status"
              value={formData.legal_status}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Hàng 4: Địa chỉ, Tỉnh thành, Quận huyện */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Địa chỉ chi tiết (*):</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="VD: 208 Nguyễn Hữu Cảnh, P. 22"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Tỉnh / Thành phố:</label>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-red-500"
            >
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="TP. Hà Nội">TP. Hà Nội</option>
              <option value="TP. Đà Nẵng">TP. Đà Nẵng</option>
              <option value="Bình Dương">Bình Dương</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Quận / Huyện:</label>
            <input
              type="text"
              name="district"
              value={formData.district}
              onChange={handleChange}
              placeholder="VD: Bình Thạnh, Quận 1..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Hàng 5: Tiện ích */}
        <div className="space-y-2">
          <label className="font-bold text-slate-700">Tiện ích đi kèm:</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {availableAmenities.map(am => (
              <label 
                key={am} 
                className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer select-none transition-colors ${
                  formData.amenities.includes(am)
                    ? 'border-red-500 bg-red-50/50 text-red-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(am)}
                  onChange={() => handleToggleAmenity(am)}
                  className="rounded text-red-600 focus:ring-0"
                />
                <span className="text-[11px]">{am}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Hàng 6: Ảnh & Thông tin liên hệ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="font-bold text-slate-700">Link hình ảnh đại diện:</label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Số điện thoại liên hệ:</label>
            <input
              type="text"
              name="owner_phone"
              value={formData.owner_phone}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Hàng 7: Mô tả chi tiết */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700">Mô tả chi tiết bài đăng:</label>
          <textarea
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả ưu điểm vị trí, tiện ích nội thất, view sông, chính sách thanh toán..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
          ></textarea>
        </div>

        {/* Nút hành động (Footer) */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={(e) => handleSubmit(e, true)}
            className="px-5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 font-bold hover:bg-amber-100 transition-colors"
          >
            Lưu nháp
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={(e) => handleSubmit(e, false)}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-sm flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Đăng tin mới
          </button>
        </div>
      </form>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: MODAL XEM CHI TIẾT BĐS 
// -------------------------------------------------------------
function PropertyDetailModal({ property, onClose, onEdit }) {
  if (!property) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-sm tracking-wide">CHI TIẾT BẤT ĐỘNG SẢN: {property.code || `#${property.id}`}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Scroll */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Ảnh lớn */}
          <div className="w-full h-56 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <img 
              src={property.image} 
              className="w-full h-full object-cover" 
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80'; }}
            />
          </div>

          <div>
            <div className="text-lg font-black text-slate-800 leading-snug">{property.title}</div>
            <div className="text-slate-500 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>{property.address || `${property.district}, ${property.city}`}</span>
            </div>
          </div>

          {/* Grid thông số */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px]">Mức giá</span>
              <strong className="text-sm font-black text-red-600">{property.price_sale_text || property.price_rent_text || `${property.price} đ`}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Diện tích</span>
              <strong className="text-sm font-black text-slate-800">{property.area} m²</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Phòng ngủ / Tắm</span>
              <strong className="text-sm font-black text-slate-800">{property.bedrooms || 0} PN • {property.bathrooms || 0} WC</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Hướng / Pháp lý</span>
              <strong className="text-sm font-black text-slate-800">{property.direction || '—'} / {property.legal_status || 'Sổ hồng'}</strong>
            </div>
          </div>

          {/* Tiện ích */}
          {property.amenities && (
            <div className="space-y-1.5">
              <div className="font-bold text-slate-700">Tiện ích nổi bật:</div>
              <div className="flex flex-wrap gap-1.5">
                {property.amenities.split(',').map((am, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium">
                    ✓ {am.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mô tả */}
          {property.description && (
            <div className="space-y-1.5">
              <div className="font-bold text-slate-700">Mô tả bài đăng:</div>
              <p className="text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                {property.description}
              </p>
            </div>
          )}

          {/* Người phụ trách */}
          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-slate-500 text-[11px]">
            <div>Người đăng / Phụ trách: <strong className="text-slate-800">{property.user?.name || property.owner_name || 'Admin'}</strong> ({property.owner_phone || '0901234567'})</div>
            <div>Cập nhật: {new Date(property.updated_at || Date.now()).toLocaleDateString('vi-VN')}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100">
            Đóng
          </button>
          <button onClick={onEdit} className="px-5 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 flex items-center gap-1.5">
            <Edit className="w-3.5 h-3.5" /> Chỉnh sửa BĐS
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: MODAL CHỈNH SỬA THÔNG TIN BĐS 
// -------------------------------------------------------------
function EditPropertyModal({ property, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: property.title || '',
    type: property.type || 'Căn hộ cao cấp',
    purpose: property.purpose || 'sale',
    price: property.price || '',
    area: property.area || '',
    bedrooms: property.bedrooms || 1,
    bathrooms: property.bathrooms || 1,
    direction: property.direction || 'Đông Nam',
    legal_status: property.legal_status || 'Sổ hồng',
    address: property.address || '',
    city: property.city || 'TP. Hồ Chí Minh',
    district: property.district || '',
    status: property.status ?? 1,
    description: property.description || '',
    image: property.image || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Vui lòng nhập tên sản phẩm. / Tên không được để trống.');
      return;
    }
    if (formData.title.length > 255) {
      setError('Tên sản phẩm không được vượt quá 255 ký tự.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        res = await fetch(`http://localhost:8080/api/properties/${property.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi cập nhật BĐS.');

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm">CHỈNH SỬA THÔNG TIN BĐS </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Tiêu đề BĐS (*):</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Mức giá (* VNĐ):</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 font-bold font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Diện tích (m²):</label>
              <input
                type="number"
                name="area"
                value={formData.area}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Loại BĐS:</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Căn hộ cao cấp">Căn hộ cao cấp</option>
                <option value="Nhà phố liền kề">Nhà phố liền kề</option>
                <option value="Biệt thự đơn lập">Biệt thự đơn lập</option>
                <option value="Shophouse thương mại">Shophouse thương mại</option>
                <option value="Đất nền dự án">Đất nền dự án</option>
                <option value="Penthouse Sky Villa">Penthouse Sky Villa</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Trạng thái:</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
              >
                <option value="1">Đang hiển thị</option>
                <option value="0">Chờ duyệt</option>
                <option value="2">Đã giao dịch</option>
                <option value="4">Đã ẩn</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Địa chỉ chi tiết:</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Hình ảnh URL:</label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="(Để trống để giữ lại ảnh cũ)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Mô tả bài đăng:</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Cập nhật thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
