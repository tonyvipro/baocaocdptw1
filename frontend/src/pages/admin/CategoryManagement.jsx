import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Layers, Search, Plus, Filter, RefreshCw, Eye, Edit3, Trash2, X,
  Check, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight,
  Building2, Home, Store, Briefcase, Key, Factory, LandPlot, Tag,
  Clock, Hash, FileText, CheckCircle, XCircle, ArrowRight, Lock, AlertTriangle
} from 'lucide-react';
import { broadcastDataChange, subscribeDataChange } from '../../services/tabSync';
import ConflictWarningBanner from '../../components/ConflictWarningBanner';

export default function CategoryManagement() {
  // 1. KHÔI PHỤC BỘ LỌC TỪ LOCALSTORAGE KHI F5 (F5 RELOAD PERSISTENCE)
  const savedFilter = (() => {
    try {
      return JSON.parse(localStorage.getItem('3tv_category_filter') || 'null');
    } catch {
      return null;
    }
  })();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() => (savedFilter?.searchTerm || '').slice(0, 250));
  const [statusFilter, setStatusFilter] = useState(() => savedFilter?.statusFilter || 'all');
  const [currentPage, setCurrentPage] = useState(() => savedFilter?.currentPage || 1);
  const [perPage, setPerPage] = useState(() => savedFilter?.perPage || 8);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 8,
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
  });
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });

  // 2. TRẠNG THÁI ĐỒNG BỘ ĐA TAB & KIỂM SOÁT XUNG ĐỘT (MULTI-TAB SYNC & CONFLICT PREVENTION)
  const [conflictEvent, setConflictEvent] = useState(null);
  const [conflictLocked, setConflictLocked] = useState(false);

  // Modals State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentCategory, setCurrentCategory] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State (Giới hạn tối đa 250 ký tự)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    icon: 'Building2',
    display_order: 1,
  });
  const [formErrors, setFormErrors] = useState({});

  // Lắng nghe sự kiện đồng bộ đa tab (BroadcastChannel & Storage Event)
  useEffect(() => {
    const unsubscribe = subscribeDataChange((event) => {
      if (event.entity === 'categories') {
        setConflictEvent(event);
        setConflictLocked(true);
      }
    });
    return unsubscribe;
  }, []);

  // Giải tỏa xung đột khi người dùng chọn Tải lại dữ liệu
  const handleResolveConflict = () => {
    setConflictEvent(null);
    setConflictLocked(false);
    fetchCategories(currentPage);
    showToast('Đã đồng bộ dữ liệu phiên bản mới nhất!', 'success');
  };

  // Lưu bộ lọc vào localStorage khi có thay đổi (F5 reload persistence)
  useEffect(() => {
    try {
      localStorage.setItem('3tv_category_filter', JSON.stringify({
        searchTerm: searchTerm.slice(0, 250),
        statusFilter,
        currentPage,
        perPage
      }));
    } catch (e) {}
  }, [searchTerm, statusFilter, currentPage, perPage]);

  // Thông báo Toast tự tắt
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 3. TRUY VẤN DỮ LIỆU TỪ BACKEND
  const fetchCategories = useCallback(async (page = currentPage) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim().slice(0, 250));
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`/api/categories?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) throw new Error('Không thể tải danh sách danh mục');

      const data = await res.json();
      if (data.status === 'success') {
        setCategories(data.data || []);
        setPagination(data.pagination || {
          total: data.data?.length || 0,
          per_page: perPage,
          current_page: page,
          last_page: 1,
          from: 1,
          to: data.data?.length || 0,
        });
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải danh mục từ cơ sở dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, perPage, currentPage]);

  useEffect(() => {
    fetchCategories(currentPage);
  }, [fetchCategories, currentPage]);

  // Xử lý Search với ràng buộc tối đa 250 ký tự
  const handleSearchChange = (e) => {
    const val = (e.target.value || '').slice(0, 250);
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // Mở modal Thêm mới (Kiểm tra nếu tab bị khóa xung đột thì không cho mở)
  const handleOpenCreateModal = () => {
    if (conflictLocked) {
      showToast('Thao tác tạm khóa do dữ liệu vừa thay đổi ở tab khác. Vui lòng bấm Tải lại dữ liệu!', 'error');
      return;
    }
    setModalMode('create');
    setCurrentCategory(null);
    setFormData({
      name: '',
      description: '',
      status: 'active',
      icon: 'Building2',
      display_order: (pagination.total || 0) + 1,
    });
    setFormErrors({});
    setShowAddEditModal(true);
  };

  // Mở modal Chỉnh sửa
  const handleOpenEditModal = (cat) => {
    if (conflictLocked) {
      showToast('Thao tác tạm khóa do dữ liệu vừa thay đổi ở tab khác. Vui lòng bấm Tải lại dữ liệu!', 'error');
      return;
    }
    setModalMode('edit');
    setCurrentCategory(cat);
    setFormData({
      name: (cat.name || '').slice(0, 250),
      description: (cat.description || '').slice(0, 250),
      status: cat.status || 'active',
      icon: cat.icon || 'Building2',
      display_order: cat.display_order ?? 1,
    });
    setFormErrors({});
    setShowAddEditModal(true);
  };

  // Mở modal Xem chi tiết
  const handleOpenDetailModal = (cat) => {
    setCurrentCategory(cat);
    setShowDetailModal(true);
  };

  // Mở modal Xác nhận Xóa
  const handleOpenDeleteModal = (cat) => {
    if (conflictLocked) {
      showToast('Thao tác tạm khóa do dữ liệu vừa thay đổi ở tab khác. Vui lòng bấm Tải lại dữ liệu!', 'error');
      return;
    }
    setCategoryToDelete(cat);
    setShowDeleteModal(true);
  };

  // 4. THAO TÁC CRUD: LƯU (CREATE / UPDATE) VÀ PHÁT BROADCAST
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (conflictLocked) {
      showToast('Không thể lưu: Dữ liệu đã thay đổi ở tab khác. Vui lòng tải lại trang!', 'error');
      return;
    }

    const trimmedName = (formData.name || '').trim().slice(0, 250);
    if (!trimmedName) {
      setFormErrors({ name: 'Vui lòng nhập tên danh mục' });
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const url = modalMode === 'create' ? '/api/categories' : `/api/categories/${currentCategory.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          ...formData,
          name: trimmedName,
          description: (formData.description || '').slice(0, 250),
        })
      });

      const resData = await res.json();
      if (!res.ok || resData.status === 'error') {
        throw new Error(resData.message || 'Lỗi khi lưu danh mục');
      }

      showToast(
        modalMode === 'create' ? 'Thêm mới danh mục thành công!' : 'Cập nhật danh mục thành công!',
        'success'
      );
      setShowAddEditModal(false);

      // Phát tín hiệu đồng bộ đa tab
      broadcastDataChange({
        entity: 'categories',
        action: modalMode === 'create' ? 'create' : 'update',
        id: resData.data?.id,
        name: trimmedName,
      });

      fetchCategories(modalMode === 'create' ? 1 : currentPage);
    } catch (err) {
      console.error(err);
      setFormErrors({ general: err.message || 'Có lỗi xảy ra, vui lòng thử lại' });
      showToast(err.message || 'Thao tác không thành công', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. THAO TÁC CRUD: XÓA (DELETE) VÀ PHÁT BROADCAST
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    if (conflictLocked) {
      showToast('Không thể xóa: Dữ liệu đã thay đổi ở tab khác. Vui lòng tải lại trang!', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const res = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const resData = await res.json();
      if (!res.ok || resData.status === 'error') {
        throw new Error(resData.message || 'Lỗi khi xóa danh mục');
      }

      showToast(`Đã xóa danh mục "${categoryToDelete.name}" thành công!`, 'success');
      setShowDeleteModal(false);

      // Phát tín hiệu đồng bộ đa tab
      broadcastDataChange({
        entity: 'categories',
        action: 'delete',
        id: categoryToDelete.id,
        name: categoryToDelete.name,
      });

      setCategoryToDelete(null);
      if (categories.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchCategories(currentPage);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Không thể xóa danh mục này', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. THAO TÁC CRUD: CHUYỂN ĐỔI NHANH TRẠNG THÁI (TOGGLE STATUS) VÀ PHÁT BROADCAST
  const handleToggleStatus = async (cat) => {
    if (conflictLocked) {
      showToast('Thao tác tạm khóa do dữ liệu vừa thay đổi ở tab khác. Vui lòng bấm Tải lại dữ liệu!', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('3tv_token') || '';
      const res = await fetch(`/api/categories/${cat.id}/status`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(`Đã đổi trạng thái sang "${data.data?.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}"`);

        // Phát tín hiệu đồng bộ đa tab
        broadcastDataChange({
          entity: 'categories',
          action: 'update',
          id: cat.id,
          name: cat.name,
        });

        fetchCategories(currentPage);
      }
    } catch (err) {
      showToast('Lỗi khi đổi trạng thái danh mục', 'error');
    }
  };

  // Helper render icon tương ứng
  const renderCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Home': return <Home className="w-5 h-5 text-emerald-400" />;
      case 'Store': return <Store className="w-5 h-5 text-amber-400" />;
      case 'Layers':
      case 'Castle': return <Layers className="w-5 h-5 text-purple-400" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5 text-blue-400" />;
      case 'Key': return <Key className="w-5 h-5 text-orange-400" />;
      case 'Factory': return <Factory className="w-5 h-5 text-rose-400" />;
      case 'LandPlot': return <LandPlot className="w-5 h-5 text-lime-400" />;
      default: return <Building2 className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all duration-300 animate-slide-up ${
          toastMessage.type === 'error'
            ? 'bg-rose-950/90 text-rose-200 border-rose-500/50 backdrop-blur-md'
            : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 backdrop-blur-md'
        }`}>
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* HEADER SECTION: TIÊU ĐỀ & NÚT THÊM MỚI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
              <Layers className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Quản Lý Danh Mục
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-red-600/20 text-red-400 border border-red-500/30">
                  Chuẩn Hình 50
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Quản lý các loại hình bất động sản, phân loại dữ liệu và cấu hình hiển thị toàn hệ thống
              </p>
            </div>
          </div>
        </div>

        {/* Nút Thêm Danh Mục Mới (Khóa khi phát hiện xung đột đa tab) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleResolveConflict()}
            title="Làm mới dữ liệu"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
          </button>
          
          <button
            onClick={handleOpenCreateModal}
            disabled={conflictLocked}
            title={conflictLocked ? 'Thao tác tạm khóa do phát hiện thay đổi ở tab khác. Vui lòng tải lại dữ liệu!' : 'Thêm danh mục mới'}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
              conflictLocked
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-900/30 border border-red-500/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
            }`}
          >
            {conflictLocked ? <Lock className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4" />}
            <span>{conflictLocked ? 'ĐÃ KHÓA THAO TÁC' : 'THÊM DANH MỤC MỚI'}</span>
          </button>
        </div>
      </div>

      {/* THẺ TỔNG HỢP NHANH (KPI METRICS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Tổng số danh mục</p>
            <h3 className="text-2xl font-black text-white mt-1">{summary.total || pagination.total || 0}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Đang hoạt động</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{summary.active || 0}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Tạm dừng / Ẩn</p>
            <h3 className="text-2xl font-black text-slate-400 mt-1">{summary.inactive || 0}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BANNER CẢNH BÁO XUNG ĐỘT ĐA TAB (YÊU CẦU 9) */}
      {conflictLocked && (
        <ConflictWarningBanner
          conflictEvent={conflictEvent}
          onReload={handleResolveConflict}
          entityName="Danh mục bất động sản"
        />
      )}

      {/* THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC (SEARCH & FILTER - YÊU CẦU 10: MAXLENGTH 250) */}
      <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Input Tìm kiếm Real-time (Giới hạn tối đa 250 ký tự) */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            maxLength={250}
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Tìm theo ID (CAT-001) hoặc tên danh mục (tối đa 250 ký tự)..."
            className="w-full pl-9 pr-14 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                className="text-slate-400 hover:text-white"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-[10px] font-mono text-slate-500 bg-slate-800/80 px-1 rounded">
              {searchTerm.length}/250
            </span>
          </div>
        </div>

        {/* Lọc trạng thái & Số lượng mỗi trang */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="w-full sm:w-auto px-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>

          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2.5 py-2 bg-slate-950/60 border border-slate-700/80 rounded-xl text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="8">8 / trang</option>
            <option value="15">15 / trang</option>
            <option value="25">25 / trang</option>
          </select>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU DANH MỤC (TABLE VIEW) */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-24">ID Danh Mục</th>
                <th className="py-3.5 px-4">Tên Danh Mục</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Mô Tả</th>
                <th className="py-3.5 px-4 text-center w-28">Số Lượng BĐS</th>
                <th className="py-3.5 px-4 text-center w-36">Trạng Thái</th>
                <th className="py-3.5 px-4 text-center w-32">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                // Skeleton loading rows
                [...Array(perPage)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-16" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-32" /></td>
                    <td className="py-4 px-4 hidden md:table-cell"><div className="h-4 bg-slate-800 rounded w-48" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-800 rounded w-12 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-800 rounded w-20 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-800 rounded w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Layers className="w-12 h-12 text-slate-700 mb-3" />
                      <p className="text-sm font-semibold text-slate-300">Không tìm thấy danh mục nào phù hợp</p>
                      <p className="text-xs text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bấm Thêm danh mục mới</p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* ID Danh mục */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-300 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 text-[11px] text-red-400">
                        {cat.code || `CAT-${String(cat.id).padStart(3, '0')}`}
                      </span>
                    </td>

                    {/* Tên danh mục & Icon */}
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 shrink-0">
                          {renderCategoryIcon(cat.icon)}
                        </span>
                        <div>
                          <p className="font-bold text-slate-100 group-hover:text-red-400 transition-colors">
                            {cat.name}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            /{cat.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Mô tả */}
                    <td className="py-3.5 px-4 text-slate-400 hidden md:table-cell max-w-xs truncate">
                      {cat.description || <span className="italic text-slate-600">Không có mô tả</span>}
                    </td>

                    {/* Số lượng BĐS liên quan */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-300 border border-slate-700/50">
                        {cat.properties_count || 0} tin
                      </span>
                    </td>

                    {/* Trạng thái (Click để toggle nhanh - Khóa khi có conflict) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => !conflictLocked && handleToggleStatus(cat)}
                        disabled={conflictLocked}
                        title={conflictLocked ? 'Đã tạm khóa do phát hiện thay đổi ở tab khác. Vui lòng tải lại dữ liệu!' : 'Bấm để chuyển đổi trạng thái'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                          conflictLocked
                            ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700'
                            : cat.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 hover:scale-105 cursor-pointer'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:scale-105 cursor-pointer'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cat.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        {cat.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                      </button>
                    </td>

                    {/* Cột Hành động (3 Icon: Xem chi tiết, Sửa, Xóa - Khóa khi có conflict) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. Xem chi tiết (Luôn cho phép xem) */}
                        <button
                          onClick={() => handleOpenDetailModal(cat)}
                          title="Xem chi tiết danh mục"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* 2. Chỉnh sửa (Khóa an toàn nếu conflict) */}
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          disabled={conflictLocked}
                          title={conflictLocked ? 'Đã tạm khóa do phát hiện thay đổi ở tab khác. Vui lòng tải lại dữ liệu!' : 'Chỉnh sửa danh mục'}
                          className={`p-1.5 rounded-lg transition ${
                            conflictLocked
                              ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed opacity-50'
                              : 'bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white cursor-pointer'
                          }`}
                        >
                          {conflictLocked ? <Lock className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        </button>

                        {/* 3. Xóa (Khóa an toàn nếu conflict) */}
                        <button
                          onClick={() => handleOpenDeleteModal(cat)}
                          disabled={conflictLocked}
                          title={conflictLocked ? 'Đã tạm khóa do phát hiện thay đổi ở tab khác. Vui lòng tải lại dữ liệu!' : 'Xóa danh mục'}
                          className={`p-1.5 rounded-lg transition ${
                            conflictLocked
                              ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed opacity-50'
                              : 'bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white cursor-pointer'
                          }`}
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

        {/* PHÂN TRANG (PAGINATION) */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Hiển thị <span className="font-bold text-white">{pagination.from || 0}</span> - <span className="font-bold text-white">{pagination.to || 0}</span> trong tổng số <span className="font-bold text-white">{pagination.total || 0}</span> danh mục
          </div>

          <div className="flex items-center gap-1.5">
            {/* Nút Prev */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1 || loading}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Các số trang */}
            {[...Array(pagination.last_page || 1)].map((_, i) => {
              const pageNumber = i + 1;
              if (
                pagination.last_page > 5 &&
                Math.abs(pageNumber - currentPage) > 2 &&
                pageNumber !== 1 &&
                pageNumber !== pagination.last_page
              ) {
                return null;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`min-w-8 h-8 px-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                    currentPage === pageNumber
                      ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                      : 'bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Nút Next */}
            <button
              onClick={() => setCurrentPage(Math.min(pagination.last_page || 1, currentPage + 1))}
              disabled={currentPage >= (pagination.last_page || 1) || loading}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: THÊM MỚI / CHỈNH SỬA (GLASSMORPHISM UI - YÊU CẦU 10: MAXLENGTH 250) */}
      {/* ======================================================== */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setShowAddEditModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <span className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
                {modalMode === 'create' ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
              </span>
              <div>
                <h3 className="text-base font-bold text-white">
                  {modalMode === 'create' ? 'Thêm Danh Mục Mới' : 'Cập Nhật Danh Mục'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {modalMode === 'create' ? 'Nhập thông tin danh mục (Toàn bộ các ô giới hạn tối đa 250 ký tự)' : `Mã: ${currentCategory?.code || currentCategory?.id}`}
                </p>
              </div>
            </div>

            {formErrors.general && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/80 border border-rose-600/50 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4">
              {/* Tên danh mục (maxLength 250) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Tên danh mục <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {formData.name.length}/250 ký tự
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={250}
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 250);
                    setFormData({ ...formData, name: val });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                  }}
                  placeholder="Ví dụ: Căn hộ cao cấp, Nhà phố liền kề (Tối đa 250 ký tự)..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                {formErrors.name && (
                  <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Mô tả (maxLength 250) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Mô tả chi tiết
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {formData.description.length}/250 ký tự
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={250}
                  value={formData.description}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 250);
                    setFormData({ ...formData, description: val });
                  }}
                  placeholder="Mô tả phạm vi áp dụng, đặc tính loại hình bất động sản (Tối đa 250 ký tự)..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* Trạng thái & Biểu tượng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm dừng (Ẩn)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Biểu tượng hiển thị
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="Building2">Building (Căn hộ/Tòa nhà)</option>
                    <option value="Home">Home (Nhà phố/Liền kề)</option>
                    <option value="Layers">Villa / Resort (Biệt thự/Villa)</option>
                    <option value="Store">Store (Shophouse/Mặt bằng)</option>
                    <option value="LandPlot">Land (Đất nền/Dự án)</option>
                    <option value="Briefcase">Office (Văn phòng)</option>
                    <option value="Key">Key (Phòng trọ/Studio)</option>
                    <option value="Factory">Factory (Kho xưởng)</option>
                  </select>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || conflictLocked}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-900/40 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{modalMode === 'create' ? 'LƯU DANH MỤC' : 'CẬP NHẬT'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: XEM CHI TIẾT DANH MỤC */}
      {/* ======================================================== */}
      {showDetailModal && currentCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <span className="p-3 rounded-2xl bg-slate-800 border border-slate-700">
                {renderCategoryIcon(currentCategory.icon)}
              </span>
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-red-400 border border-slate-700">
                  {currentCategory.code || `CAT-${currentCategory.id}`}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {currentCategory.name}
                </h3>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Đường dẫn tĩnh (Slug):</span>
                <span className="font-mono text-slate-200">/{currentCategory.slug}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Trạng thái vận hành:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  currentCategory.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {currentCategory.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Tin đăng thuộc danh mục:</span>
                <span className="font-bold text-white">{currentCategory.properties_count || 0} bất động sản</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block mb-1">Mô tả danh mục:</span>
                <p className="text-slate-300 leading-relaxed">
                  {currentCategory.description || 'Không có mô tả chi tiết.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
                <span>Ngày tạo: {currentCategory.created_at ? new Date(currentCategory.created_at).toLocaleDateString('vi-VN') : 'N/A'}</span>
                <span>Thứ tự: #{currentCategory.display_order || 0}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleOpenEditModal(currentCategory);
                }}
                disabled={conflictLocked}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  conflictLocked
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    : 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                }`}
              >
                {conflictLocked ? <Lock className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{conflictLocked ? 'Đã khóa' : 'Chỉnh sửa'}</span>
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: XÁC NHẬN XÓA (CONFIRM DELETE) */}
      {/* ======================================================== */}
      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-scale-up text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white mb-2">
              Xác Nhận Xóa Danh Mục?
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Bạn có chắc chắn muốn xóa danh mục <span className="font-bold text-white">"{categoryToDelete.name}"</span> ({categoryToDelete.code || categoryToDelete.id})? Bản ghi sẽ được xóa khỏi cơ sở dữ liệu.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setCategoryToDelete(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading || conflictLocked}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/40 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Đồng ý xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
