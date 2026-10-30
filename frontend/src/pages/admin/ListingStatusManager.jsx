import PropertyImage from '../../components/properties/PropertyImage';
import React, { useState, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal, CheckCircle2, Clock, Tag, Calendar, EyeOff,
  Search, RefreshCw, Filter, CheckSquare, Square, ChevronRight,
  AlertTriangle, History, ArrowRight, ShieldCheck, Sparkles, Building2,
  MapPin, Eye, ExternalLink, User, Phone, Check, X, AlertCircle,
  TrendingUp, Layers, HelpCircle, ArrowUpRight, Zap
} from 'lucide-react';
import ChangePropertyStatusModal from '../../components/ChangePropertyStatusModal';
import BulkChangePropertyStatusModal from '../../components/BulkChangePropertyStatusModal';
import PropertyModal from '../../components/PropertyModal';

export default function ListingStatusManager() {
  // 1. Navigation & View Modes
  const [currentTab, setCurrentTab] = useState('management'); // 'management' | 'logs' | 'lifecycle'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | '0' | '1' | '2' | '3' | '4'

  // 2. Data States
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    all_total: 0,
    total: 0,
    active: 0,
    sold: 0,
    expired: 0,
    pending: 0,
    hidden: 0
  });

  // 3. Search & Additional Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('all'); // 'all' | 'sale' | 'rent' | 'project'
  const [typeFilter, setTypeFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all'); // 'all' | 'expired' | 'expiring_soon' | 'active'
  const [sortBy, setSortBy] = useState('newest');

  // 4. Selection & Pagination
  const [selectedIds, setSelectedIds] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });

  // 5. System-wide Audit Logs
  const [systemLogs, setSystemLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logActionFilter, setLogActionFilter] = useState('all');

  // 6. Modal States
  const [statusModalProperty, setStatusModalProperty] = useState(null);
  const [statusModalInitialTab, setStatusModalInitialTab] = useState('change');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [previewProperty, setPreviewProperty] = useState(null);

  // 7. Feedback & Action Loading
  const [toast, setToast] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getHeaders = (hasBody = false) => {
    const token = localStorage.getItem('3tv_token') || '';
    const headers = { 'Accept': 'application/json' };
    if (hasBody) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // Status definitions & visual tokens
  const STATUS_CONFIG = {
    0: {
      label: 'Chờ duyệt',
      sublabel: 'Pending',
      bg: 'bg-amber-50 text-amber-800 border-amber-300',
      dotBg: 'bg-amber-500',
      icon: Clock,
      cardBorder: 'border-amber-300 hover:border-amber-400',
      activeRing: 'ring-2 ring-amber-500/30 bg-amber-50/50 border-amber-500',
      countKey: 'pending',
      desc: 'Tin mới đăng hoặc cập nhật, đang chờ BQT phê duyệt nội dung & pháp lý.'
    },
    1: {
      label: 'Đang hiển thị',
      sublabel: 'Active',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      dotBg: 'bg-emerald-500',
      icon: CheckCircle2,
      cardBorder: 'border-emerald-300 hover:border-emerald-400',
      activeRing: 'ring-2 ring-emerald-500/30 bg-emerald-50/50 border-emerald-500',
      countKey: 'active',
      desc: 'Tin đăng đạt chuẩn và đang hiển thị công khai trên cổng giao dịch.'
    },
    2: {
      label: 'Đã giao dịch',
      sublabel: 'Sold / Rented',
      bg: 'bg-blue-50 text-blue-800 border-blue-300',
      dotBg: 'bg-blue-500',
      icon: Tag,
      cardBorder: 'border-blue-300 hover:border-blue-400',
      activeRing: 'ring-2 ring-blue-500/30 bg-blue-50/50 border-blue-500',
      countKey: 'sold',
      desc: 'BĐS đã hoàn tất ký kết mua bán hoặc cho thuê, tạm ngưng nhận cuộc gọi.'
    },
    3: {
      label: 'Hết hạn',
      sublabel: 'Expired',
      bg: 'bg-purple-50 text-purple-800 border-purple-300',
      dotBg: 'bg-purple-500',
      icon: Calendar,
      cardBorder: 'border-purple-300 hover:border-purple-400',
      activeRing: 'ring-2 ring-purple-500/30 bg-purple-50/50 border-purple-500',
      countKey: 'expired',
      desc: 'Quá thời hạn gói đăng, cần gia hạn để tin hiển thị lại trên trang chủ.'
    },
    4: {
      label: 'Tạm ẩn / Đã từ chối',
      sublabel: 'Hidden / Rejected',
      bg: 'bg-rose-50 text-rose-800 border-rose-300',
      dotBg: 'bg-rose-500',
      icon: EyeOff,
      cardBorder: 'border-rose-300 hover:border-rose-400',
      activeRing: 'ring-2 ring-rose-500/30 bg-rose-50/50 border-rose-500',
      countKey: 'hidden',
      desc: 'Không đạt tiêu chuẩn kiểm duyệt hoặc người đăng chủ động ẩn khỏi hệ thống.'
    }
  };

  // Tải thống kê
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/properties/stats', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Lỗi tải thống kê trạng thái:', err);
    }
  };

  // Tải danh sách BĐS
  const fetchProperties = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        admin: '1',
        page: page.toString(),
        per_page: '15',
        sort: sortBy
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (purposeFilter !== 'all') params.append('purpose', purposeFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const res = await fetch(`/api/properties?${params.toString()}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Không thể tải danh sách bất động sản.');
      const json = await res.json();

      let items = json.data || [];

      // Filter client-side cho trạng thái hạn đăng nếu chọn
      if (expiryFilter === 'expired') {
        const now = new Date();
        items = items.filter(p => p.expire_date && new Date(p.expire_date) < now);
      } else if (expiryFilter === 'expiring_soon') {
        const now = new Date();
        const next7Days = new Date();
        next7Days.setDate(next7Days.getDate() + 7);
        items = items.filter(p => {
          if (!p.expire_date) return false;
          const exp = new Date(p.expire_date);
          return exp >= now && exp <= next7Days;
        });
      } else if (expiryFilter === 'active') {
        const now = new Date();
        items = items.filter(p => !p.expire_date || new Date(p.expire_date) > now);
      }

      setProperties(items);
      if (json.meta) {
        setPagination(json.meta);
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi tải dữ liệu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tải nhật ký hệ thống
  const fetchSystemLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/properties/status-logs?limit=50', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSystemLogs(data.data || []);
      }
    } catch (err) {
      console.warn('Lỗi tải nhật ký hệ thống:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchProperties(1);
    setSelectedIds([]);
  }, [statusFilter, searchTerm, purposeFilter, typeFilter, expiryFilter, sortBy]);

  useEffect(() => {
    if (currentTab === 'logs') {
      fetchSystemLogs();
    }
  }, [currentTab]);

  // Quick 1-click Extend (+30 Days)
  const handleQuickExtend = async (property) => {
    setActionLoadingId(property.id);
    try {
      const res = await fetch(`/api/properties/${property.id}/extend`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ days: 30 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gia hạn thất bại.');

      showToast(`Đã gia hạn thành công +30 ngày cho tin: "${property.title}"`);
      fetchProperties(pagination.current_page);
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick 1-click Approve
  const handleQuickApprove = async (property) => {
    setActionLoadingId(property.id);
    try {
      const res = await fetch(`/api/properties/${property.id}/status`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ status: 1, note: 'Phê duyệt nhanh từ Quản lý trạng thái' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Phê duyệt thất bại.');

      showToast(`Đã phê duyệt hiển thị: "${property.title}"`);
      fetchProperties(pagination.current_page);
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Status Modal
  const openStatusModal = (property, initialTab = 'change') => {
    setStatusModalProperty(property);
    setStatusModalInitialTab(initialTab);
    setIsStatusModalOpen(true);
  };

  // Multi-select helpers
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

  // Helper tính số ngày còn lại đến hạn
  const getExpiryBadge = (expireDate, currentStatus) => {
    if (!expireDate) {
      return (
        <span className="text-[11px] text-slate-400 italic">Vô thời hạn</span>
      );
    }

    const exp = new Date(expireDate);
    const now = new Date();
    const diffMs = exp - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const formattedDate = exp.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    if (diffDays < 0) {
      return (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            Hết hạn {Math.abs(diffDays)} ngày
          </span>
          <span className="text-[10px] text-slate-400">({formattedDate})</span>
        </div>
      );
    } else if (diffDays <= 7) {
      return (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            Còn {diffDays} ngày
          </span>
          <span className="text-[10px] text-slate-400">({formattedDate})</span>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Còn {diffDays} ngày
          </span>
          <span className="text-[10px] text-slate-400">({formattedDate})</span>
        </div>
      );
    }
  };

  // Format currency
  const formatPrice = (price, purpose) => {
    if (!price || isNaN(price)) return 'Thỏa thuận';
    const num = Number(price);
    if (purpose === 'rent') {
      if (num >= 1000000) return `${(num / 1000000).toLocaleString('vi-VN')} Tr/tháng`;
      return `${num.toLocaleString('vi-VN')} đ/tháng`;
    }
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2).replace(/\.00$/, '')} Tỷ`;
    if (num >= 1000000) return `${(num / 1000000).toLocaleString('vi-VN')} Triệu`;
    return `${num.toLocaleString('vi-VN')} đ`;
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

      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-3">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span>Trung Tâm Kiểm Soát Trạng Thái & Vòng Đời Tin Đăng</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              QUẢN LÝ TRẠNG THÁI TIN
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-2 leading-relaxed">
              Theo dõi toàn diện vòng đời 5 trạng thái tin đăng (Chờ duyệt, Đang hiện, Đã giao dịch, Hết hạn, Tạm ẩn), xử lý chuyển đổi trạng thái tức thì, gia hạn thời gian hiển thị và kiểm tra nhật ký kiểm toán hệ thống.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { fetchStats(); fetchProperties(pagination.current_page); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-colors backdrop-blur-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Làm mới dữ liệu
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-600/30"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Đổi trạng thái ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setCurrentTab('management')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'management'
                ? 'bg-white text-slate-900 shadow-md shadow-white/10'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Bảng Quản Lý Trạng Thái
          </button>
          <button
            onClick={() => setCurrentTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'logs'
                ? 'bg-white text-slate-900 shadow-md shadow-white/10'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Nhật Ký Thay Đổi Toàn Hệ Thống
          </button>
          <button
            onClick={() => setCurrentTab('lifecycle')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'lifecycle'
                ? 'bg-white text-slate-900 shadow-md shadow-white/10'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Quy Trình & Hướng Dẫn Vòng Đời
          </button>
        </div>
      </div>

      {/* 5 Status Interactive Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total All */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/30 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>Tất Cả Tin</span>
            <Building2 className={`w-4 h-4 ${statusFilter === 'all' ? 'text-blue-400' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-black">{stats.all_total || 0}</div>
          <div className={`text-[10px] mt-1 font-medium ${statusFilter === 'all' ? 'text-slate-400' : 'text-slate-400'}`}>Toàn bộ BĐS</div>
        </div>

        {/* 0: Chờ duyệt */}
        <div
          onClick={() => setStatusFilter('0')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === '0'
              ? STATUS_CONFIG[0].activeRing
              : `bg-white ${STATUS_CONFIG[0].cardBorder}`
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Chờ Duyệt</span>
            <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">{stats.pending || 0}</div>
          <div className="text-[10px] text-amber-600 mt-1 font-medium">Cần kiểm duyệt</div>
        </div>

        {/* 1: Đang hiển thị */}
        <div
          onClick={() => setStatusFilter('1')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === '1'
              ? STATUS_CONFIG[1].activeRing
              : `bg-white ${STATUS_CONFIG[1].cardBorder}`
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Đang Hiển Thị</span>
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.active || 0}</div>
          <div className="text-[10px] text-emerald-600 mt-1 font-medium">Đang công khai</div>
        </div>

        {/* 2: Đã giao dịch */}
        <div
          onClick={() => setStatusFilter('2')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === '2'
              ? STATUS_CONFIG[2].activeRing
              : `bg-white ${STATUS_CONFIG[2].cardBorder}`
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Đã Giao Dịch</span>
            <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700">{stats.sold || 0}</div>
          <div className="text-[10px] text-blue-600 mt-1 font-medium">Bán/Thuê xong</div>
        </div>

        {/* 3: Hết hạn */}
        <div
          onClick={() => setStatusFilter('3')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === '3'
              ? STATUS_CONFIG[3].activeRing
              : `bg-white ${STATUS_CONFIG[3].cardBorder}`
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Hết Hạn</span>
            <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">{stats.expired || 0}</div>
          <div className="text-[10px] text-purple-600 mt-1 font-medium">Cần gia hạn</div>
        </div>

        {/* 4: Tạm ẩn / Từ chối */}
        <div
          onClick={() => setStatusFilter('4')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === '4'
              ? STATUS_CONFIG[4].activeRing
              : `bg-white ${STATUS_CONFIG[4].cardBorder}`
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Tạm Ẩn / Từ Chối</span>
            <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center">
              <EyeOff className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">{stats.hidden || 0}</div>
          <div className="text-[10px] text-rose-600 mt-1 font-medium">Đã ẩn / Từ chối</div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: BẢNG QUẢN LÝ TRẠNG THÁI                            */}
      {/* ========================================================= */}
      {currentTab === 'management' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo Mã BĐS, tiêu đề, địa chỉ, người đăng, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter Dropdown */}
              <div className="md:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Tất cả trạng thái ({stats.all_total || 0})</option>
                  <option value="0">0: Chờ duyệt ({stats.pending || 0})</option>
                  <option value="1">1: Đang hiển thị ({stats.active || 0})</option>
                  <option value="2">2: Đã giao dịch ({stats.sold || 0})</option>
                  <option value="3">3: Hết hạn ({stats.expired || 0})</option>
                  <option value="4">4: Tạm ẩn / Đã từ chối ({stats.hidden || 0})</option>
                </select>
              </div>

              {/* Purpose Filter */}
              <div className="md:col-span-2">
                <select
                  value={purposeFilter}
                  onChange={(e) => setPurposeFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Mục đích: Tất cả</option>
                  <option value="sale">Cần bán</option>
                  <option value="rent">Cho thuê</option>
                  <option value="project">Dự án</option>
                </select>
              </div>

              {/* Expiry filter */}
              <div className="md:col-span-2">
                <select
                  value={expiryFilter}
                  onChange={(e) => setExpiryFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Thời hạn: Tất cả</option>
                  <option value="expired">Đã quá hạn</option>
                  <option value="expiring_soon">Sắp hết hạn (≤ 7 ngày)</option>
                  <option value="active">Còn hạn</option>
                </select>
              </div>
            </div>

            {/* Bulk Toolbar */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {selectedIds.length}
                  </span>
                  <span className="text-xs font-bold text-blue-900">
                    tin đăng đã được chọn
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsBulkModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Đổi trạng thái hàng loạt
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Listings Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 w-10 text-center">
                      <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                        {selectedIds.length > 0 && selectedIds.length === properties.length ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4 min-w-[260px]">Bất Động Sản</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Người Đăng</th>
                    <th className="py-3.5 px-4 min-w-[130px]">Hạn Hiển Thị</th>
                    <th className="py-3.5 px-4 min-w-[160px]">Trạng Thái Hiện Tại</th>
                    <th className="py-3.5 px-4 min-w-[180px]">Ghi Chú / Lý Do</th>
                    <th className="py-3.5 px-4 min-w-[150px] text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                        <p className="text-sm font-semibold">Đang tải dữ liệu tin đăng...</p>
                      </td>
                    </tr>
                  ) : properties.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-slate-400">
                        <SlidersHorizontal className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-600">Không tìm thấy tin đăng phù hợp</p>
                        <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.</p>
                      </td>
                    </tr>
                  ) : (
                    properties.map((p) => {
                      const cfg = STATUS_CONFIG[p.status] || {
                        label: 'Không xác định',
                        bg: 'bg-slate-100 text-slate-600 border-slate-300',
                        dotBg: 'bg-slate-400',
                        icon: HelpCircle
                      };
                      const IconComp = cfg.icon;
                      const isSelected = selectedIds.includes(p.id);

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelected ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-4 text-center">
                            <button onClick={() => toggleSelect(p.id)} className="text-slate-400 hover:text-slate-600">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Property Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-3">
                              <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                <PropertyImage
                                  src={p.image || p.images?.[0]?.image_url || p.images?.[0]?.image}
                                  alt={p.title}
                                  className="w-full h-full object-cover"

                                />
                                <span className={`absolute bottom-0 left-0 right-0 text-[9px] font-extrabold text-white text-center py-0.2 ${
                                  p.purpose === 'rent' ? 'bg-blue-600/90' : 'bg-rose-600/90'
                                }`}>
                                  {p.purpose === 'rent' ? 'THUÊ' : 'BÁN'}
                                </span>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    {p.code || `#${p.id}`}
                                  </span>
                                  <span className="font-bold text-rose-600 text-xs">
                                    {formatPrice(p.price, p.purpose)}
                                  </span>
                                </div>
                                <h4
                                  onClick={() => setPreviewProperty(p)}
                                  className="font-bold text-slate-800 hover:text-blue-600 truncate cursor-pointer text-xs mt-0.5"
                                  title={p.title}
                                >
                                  {p.title}
                                </h4>
                                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                                  <span>{p.address || p.district || p.city || 'Chưa cập nhật địa chỉ'}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Owner */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 truncate">
                                {p.contact_name || p.user?.name || 'Khách vãng lai'}
                              </span>
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {p.contact_phone || p.user?.phone || 'Chưa có SĐT'}
                              </span>
                              <span className="text-[10px] text-blue-600 font-medium">
                                {p.user?.role_id === 2 ? 'Môi giới' : p.user?.role_id === 1 ? 'Quản trị viên' : 'Chủ nhà / Khách'}
                              </span>
                            </div>
                          </td>

                          {/* Expiry Date */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              {getExpiryBadge(p.expire_date, p.status)}
                              {(p.status === 3 || (p.expire_date && new Date(p.expire_date) <= new Date())) && (
                                <button
                                  onClick={() => handleQuickExtend(p)}
                                  disabled={actionLoadingId === p.id}
                                  className="px-2 py-0.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-700 text-[10px] font-bold flex items-center gap-1 transition-colors"
                                  title="Gia hạn nhanh +30 ngày"
                                >
                                  <Zap className="w-2.5 h-2.5" />
                                  +30 ngày
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Status Badge (Clickable to change) */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => openStatusModal(p, 'change')}
                              className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-2xs hover:scale-105 ${cfg.bg}`}
                              title="Nhấn để đổi trạng thái tin này"
                            >
                              <span className={`w-2 h-2 rounded-full ${cfg.dotBg} ${p.status === 0 ? 'animate-ping' : ''}`}></span>
                              <span>{cfg.label}</span>
                              <SlidersHorizontal className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                            </button>
                          </td>

                          {/* Reason / Notes */}
                          <td className="py-3 px-4">
                            {p.rejection_reason ? (
                              <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-slate-50 p-1.5 rounded border border-slate-200">
                                "{p.rejection_reason}"
                              </p>
                            ) : p.status === 2 ? (
                              <span className="text-[11px] text-blue-600 font-medium">Đã chốt giao dịch</span>
                            ) : p.status === 0 ? (
                              <span className="text-[11px] text-amber-600 font-medium">Đang chờ kiểm duyệt</span>
                            ) : (
                              <span className="text-[11px] text-slate-400">-</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Approve button if pending */}
                              {p.status === 0 && (
                                <button
                                  onClick={() => handleQuickApprove(p)}
                                  disabled={actionLoadingId === p.id}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors border border-emerald-200"
                                  title="Phê duyệt nhanh tin này"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Open Status Modal */}
                              <button
                                onClick={() => openStatusModal(p, 'change')}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors border border-blue-200 font-semibold text-[11px] flex items-center gap-1"
                                title="Đổi trạng thái tin"
                              >
                                <SlidersHorizontal className="w-3 h-3" />
                                Đổi
                              </button>

                              {/* Open History */}
                              <button
                                onClick={() => openStatusModal(p, 'history')}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-700 hover:text-white transition-colors border border-slate-200"
                                title="Xem nhật ký lịch sử đổi trạng thái"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>

                              {/* Preview Property Modal */}
                              <button
                                onClick={() => setPreviewProperty(p)}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-700 hover:text-white transition-colors border border-slate-200"
                                title="Xem chi tiết BĐS"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > pagination.per_page && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 text-xs">
                <span className="text-slate-500">
                  Hiển thị {properties.length} trên tổng số {pagination.total} tin
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={pagination.current_page <= 1}
                    onClick={() => fetchProperties(pagination.current_page - 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1 font-bold text-slate-700">
                    Trang {pagination.current_page} / {pagination.last_page}
                  </span>
                  <button
                    disabled={pagination.current_page >= pagination.last_page}
                    onClick={() => fetchProperties(pagination.current_page + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: NHẬT KÝ THAY ĐỔI TOÀN HỆ THỐNG                     */}
      {/* ========================================================= */}
      {currentTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Nhật Ký Chuyển Đổi Trạng Thái & Gia Hạn
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ghi nhận kiểm toán chi tiết mọi biến động trạng thái tin đăng (Chờ duyệt, Duyệt, Bán/Thuê, Quá hạn, Ẩn/Từ chối) và gia hạn thời gian hiển thị.
              </p>
            </div>

            <button
              onClick={fetchSystemLogs}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              Làm mới nhật ký
            </button>
          </div>

          {logsLoading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
              <p className="text-xs font-semibold">Đang tải nhật ký kiểm toán...</p>
            </div>
          ) : systemLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-600">Chưa có nhật ký thay đổi trạng thái nào</p>
              <p className="text-xs text-slate-400 mt-1">Các thao tác đổi trạng thái và gia hạn tin sẽ được ghi nhận tại đây.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {systemLogs.map((log, idx) => {
                const isExtend = log.action === 'EXTEND_PROPERTY';
                const fromStatus = log.old_data?.status_name || log.old_data?.status || 'Chưa rõ';
                const toStatus = log.new_data?.status_name || log.new_data?.status || 'Đang hiển thị';
                const actorName = log.new_data?.changed_by || log.new_data?.extended_by || 'Ban Quản Trị';
                const note = log.new_data?.reason || log.new_data?.note || '';
                const propertyTitle = log.new_data?.property_title || `Bất động sản #${log.record_id}`;
                const propertyCode = log.new_data?.property_code || `#${log.record_id}`;

                return (
                  <div key={log.id || idx} className="relative flex items-start gap-4">
                    {/* Timeline bullet */}
                    <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${
                      isExtend ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {isExtend ? <Calendar className="w-2.5 h-2.5" /> : <SlidersHorizontal className="w-2.5 h-2.5" />}
                    </div>

                    <div className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl p-4 hover:shadow-xs transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {propertyCode}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            {propertyTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{log.formatted_time || log.created_at}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-blue-600 font-semibold">{log.relative_time}</span>
                        </div>
                      </div>

                      {/* Transition pills */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {isExtend ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            <span>Gia hạn tin đăng: +{log.new_data?.days || 30} ngày</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                              {fromStatus}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              {toStatus}
                            </span>
                          </div>
                        )}

                        <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          Người thực hiện: <strong className="text-slate-700">{actorName}</strong>
                        </span>
                      </div>

                      {/* Reason / note */}
                      {note && (
                        <div className="mt-2 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
                          <span className="font-semibold text-slate-700">Ghi chú:</span> {note}
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

      {/* ========================================================= */}
      {/* TAB 3: QUY TRÌNH & HƯỚNG DẪN VÒNG ĐỜI TIN ĐĂNG            */}
      {/* ========================================================= */}
      {currentTab === 'lifecycle' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Sơ Đồ Chu Chuẩn Vòng Đời Tin Đăng (5 Cấp Độ)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Hệ thống bất động sản 3TV Land áp dụng mô hình quản lý trạng thái chuẩn từ khởi tạo, kiểm duyệt pháp lý, hiển thị công khai, giao dịch thành công đến hết hạn và gia hạn tự động.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Step 0 */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                      Mã: 0
                    </span>
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <h4 className="font-bold text-sm text-amber-900">Chờ Kiểm Duyệt</h4>
                  <p className="text-xs text-amber-800/80 mt-2 leading-relaxed">
                    Tin đăng mới tạo từ khách hàng hoặc môi giới. Tin ở chế độ ẩn, chờ Ban Quản Trị thẩm định hình ảnh, giá bán và giấy tờ pháp lý.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-200 text-[11px] font-semibold text-amber-900 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                  Chuyển sang Đang hiện (1) hoặc Từ chối (4)
                </div>
              </div>

              {/* Step 1 */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                      Mã: 1
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-sm text-emerald-900">Đang Hiển Thị</h4>
                  <p className="text-xs text-emerald-800/80 mt-2 leading-relaxed">
                    Tin đăng đạt tiêu chuẩn kiểm duyệt, được hiển thị công khai trên cổng giao dịch, bản đồ và kết quả tìm kiếm. Khách hàng có thể đặt lịch hẹn.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-200 text-[11px] font-semibold text-emerald-900 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                  Hết hạn (3) hoặc Đã giao dịch (2)
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-200 text-blue-900">
                      Mã: 2
                    </span>
                    <Tag className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-sm text-blue-900">Đã Giao Dịch</h4>
                  <p className="text-xs text-blue-800/80 mt-2 leading-relaxed">
                    Bất động sản đã ký hợp đồng chuyển nhượng hoặc cho thuê thành công. Gắn nhãn badge "Đã giao dịch", ngừng tiếp nhận cuộc gọi và lịch hẹn mới.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-200 text-[11px] font-semibold text-blue-900 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                  Kết thúc giao dịch thành công
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-200 text-purple-900">
                      Mã: 3
                    </span>
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="font-bold text-sm text-purple-900">Hết Hạn</h4>
                  <p className="text-xs text-purple-800/80 mt-2 leading-relaxed">
                    Quá hạn thời gian gói đăng (mặc định 30 ngày). Hệ thống tự động chuyển từ trạng thái 1 sang 3 khi quét hạn.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-purple-200 text-[11px] font-semibold text-purple-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Gia hạn +30N để mở lại hiển thị
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                      Mã: 4
                    </span>
                    <EyeOff className="w-5 h-5 text-rose-600" />
                  </div>
                  <h4 className="font-bold text-sm text-rose-900">Tạm Ẩn / Từ Chối</h4>
                  <p className="text-xs text-rose-800/80 mt-2 leading-relaxed">
                    Bị Ban Quản Trị từ chối do vi phạm quy chế hoặc người đăng chủ động tạm ẩn bài viết. Tin không xuất hiện trên sàn công khai.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-rose-200 text-[11px] font-semibold text-rose-900 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                  Chỉnh sửa nội dung & gửi duyệt lại
                </div>
              </div>
            </div>
          </div>

          {/* Quy Tắc Tự Động */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                Cơ Chế Quét & Cập Nhật Hết Hạn Tự Động
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Hệ thống tự động rà soát trường <code>expire_date</code> mỗi khi có yêu cầu API quản lý.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Các tin có trạng thái <code>1 (Đang hiển thị)</code> và <code>expire_date &lt; hiện tại</code> sẽ tự động chuyển sang <code>3 (Hết hạn)</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Khi chuyển một tin hết hạn sang <code>1 (Đang hiển thị)</code>, hệ thống tự động gia hạn thêm +30 ngày nếu không chọn mốc khác.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Nhật Ký Kiểm Toán Toàn Diện (Audit Logs)
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Mọi thay đổi trạng thái đều ghi lại: Người đổi, trạng thái cũ, trạng thái mới, lý do, địa chỉ IP và dấu thời gian.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Admin và Chủ tin đăng đều có thể xem lịch sử để đảm bảo tính minh bạch và truy vết tranh chấp.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS INTEGRATION                                        */}
      {/* ========================================================= */}
      {/* 1. Modal đổi trạng thái đơn lẻ + Lịch sử */}
      <ChangePropertyStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        property={statusModalProperty}
        initialTab={statusModalInitialTab}
        onSuccess={(updatedProp, msg) => {
          showToast(msg || 'Cập nhật trạng thái thành công!');
          setIsStatusModalOpen(false);
          fetchProperties(pagination.current_page);
          fetchStats();
        }}
      />

      {/* 2. Modal đổi trạng thái hàng loạt */}
      <BulkChangePropertyStatusModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedIds={selectedIds}
        onSuccess={(msg) => {
          showToast(msg || 'Cập nhật hàng loạt thành công!');
          setIsBulkModalOpen(false);
          setSelectedIds([]);
          fetchProperties(pagination.current_page);
          fetchStats();
        }}
      />

      {/* 3. Modal xem trước chi tiết tin đăng */}
      {previewProperty && (
        <PropertyModal
          property={previewProperty}
          onClose={() => setPreviewProperty(null)}
          onContact={() => {}}
          onSave={() => {}}
          isSaved={false}
          currentUser={{ role_id: 1, name: 'Quản trị viên' }}
        />
      )}
    </div>
  );
}
