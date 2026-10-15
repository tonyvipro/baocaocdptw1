import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Plus, Search, Filter, RefreshCw, Edit, Trash2, 
  CheckCircle, XCircle, AlertCircle, ArrowUpDown, ChevronLeft, 
  ChevronRight, FolderTree, X, Check, Building2, HelpCircle
} from 'lucide-react';

// Dữ liệu mẫu chuẩn đồng bộ theo Mockup (Hình 11 trong đồ án)
const INITIAL_PROPERTY_TYPES = [
  {
    id: 1,
    name: 'Nhà ở',
    slug: 'nha-o',
    description: 'Các loại hình nhà ở dân dụng.',
    parent_id: null,
    parent_name: null,
    status: 1,
    properties_count: 150,
    created_at: '2026-09-30 08:00:00'
  },
  {
    id: 2,
    name: 'Căn hộ chung cư',
    slug: 'can-ho-chung-cu',
    description: 'Căn hộ chung cư cao cấp, trung cấp, studio và officetel.',
    parent_id: 1,
    parent_name: 'Nhà ở',
    status: 1,
    properties_count: 85,
    created_at: '2026-09-30 08:15:00'
  },
  {
    id: 3,
    name: 'Nhà phố liền kề',
    slug: 'nha-pho-lien-ke',
    description: 'Nhà phố thương mại, liền kề, shophouse và nhà riêng biệt lập.',
    parent_id: 1,
    parent_name: 'Nhà ở',
    status: 1,
    properties_count: 48,
    created_at: '2026-09-30 08:30:00'
  },
  {
    id: 4,
    name: 'Biệt thự nghỉ dưỡng',
    slug: 'biet-thu-nghi-duong',
    description: 'Biệt thự đơn lập, song lập và villa nghỉ dưỡng ven biển, đồi sinh thái.',
    parent_id: 1,
    parent_name: 'Nhà ở',
    status: 1,
    properties_count: 32,
    created_at: '2026-09-30 08:45:00'
  },
  {
    id: 5,
    name: 'Đất nền dự án',
    slug: 'dat-nen-du-an',
    description: 'Đất phân lô dự án, đất thổ cư pháp lý sổ hồng riêng.',
    parent_id: null,
    parent_name: null,
    status: 1,
    properties_count: 64,
    created_at: '2026-09-30 09:00:00'
  },
  {
    id: 6,
    name: 'Mặt bằng thương mại',
    slug: 'mat-bang-thuong-mai',
    description: 'Mặt bằng kinh doanh shophouse, sàn thương mại, tòa nhà văn phòng.',
    parent_id: null,
    parent_name: null,
    status: 1,
    properties_count: 22,
    created_at: '2026-09-30 09:15:00'
  },
  {
    id: 7,
    name: 'Kho xưởng công nghiệp',
    slug: 'kho-xuong-cong-nghiep',
    description: 'Nhà xưởng, kho bãi tiêu chuẩn và đất công nghiệp cho thuê.',
    parent_id: null,
    parent_name: null,
    status: 0,
    properties_count: 14,
    created_at: '2026-09-30 09:30:00'
  }
];

export default function PropertyTypesManager() {
  // State danh sách
  const [types, setTypes] = useState(() => {
    try {
      const saved = localStorage.getItem('3tv_property_types');
      return saved ? JSON.parse(saved) : INITIAL_PROPERTY_TYPES;
    } catch {
      return INITIAL_PROPERTY_TYPES;
    }
  });

  const [loading, setLoading] = useState(false);

  // Filter States (Đặc tả theo đúng thanh công cụ trong Mockup)
  const [searchTerm, setSearchTerm] = useState('');
  const [parentFilter, setParentFilter] = useState('all'); // 'all' | 'root' | id
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | '1' | '0'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States: Create & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = create new
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parent_id: '',
    description: '',
    status: 1
  });
  const [formErrors, setFormErrors] = useState({});

  // Delete Confirm Modal
  const [deletingItem, setDeletingItem] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
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

  // Tải danh sách từ API (với fallback localStorage)
  const fetchPropertyTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/property-types?all=1', { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setTypes(json.data);
          localStorage.setItem('3tv_property_types', JSON.stringify(json.data));
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API /api/property-types chưa sẵn sàng, dùng dữ liệu lưu trữ nội bộ:', err);
    }
    // Fallback: Lấy từ localStorage hoặc Initial
    try {
      const saved = localStorage.getItem('3tv_property_types');
      if (saved) {
        setTypes(JSON.parse(saved));
      } else {
        setTypes(INITIAL_PROPERTY_TYPES);
        localStorage.setItem('3tv_property_types', JSON.stringify(INITIAL_PROPERTY_TYPES));
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchPropertyTypes();
  }, []);

  // Tự động sinh slug khi nhập tên danh mục
  const handleNameChange = (e) => {
    const val = e.target.value;
    const autoSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    setFormData(prev => ({
      ...prev,
      name: val,
      slug: prev.slug === '' || !editingItem ? autoSlug : prev.slug
    }));
  };

  // Mở modal thêm mới
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      slug: '',
      parent_id: '',
      description: '',
      status: 1
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Mở modal sửa
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      slug: item.slug || '',
      parent_id: item.parent_id !== null && item.parent_id !== undefined ? String(item.parent_id) : '',
      description: item.description || '',
      status: item.status !== undefined ? item.status : 1
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Submit Form (Thêm hoặc Sửa)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập tên danh mục!';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim(),
      parent_id: formData.parent_id ? parseInt(formData.parent_id, 10) : null,
      status: parseInt(formData.status, 10)
    };

    let parentName = null;
    if (payload.parent_id) {
      const p = types.find(t => t.id === payload.parent_id);
      if (p) parentName = p.name;
    }

    try {
      if (editingItem) {
        // Gọi API PUT
        try {
          await fetch(`/api/property-types/${editingItem.id}`, {
            method: 'PUT',
            headers: getHeaders(true),
            body: JSON.stringify(payload)
          });
        } catch {}

        // Cập nhật State
        const updated = types.map(t => {
          if (t.id === editingItem.id) {
            return {
              ...t,
              ...payload,
              parent_name: parentName,
              updated_at: new Date().toISOString()
            };
          }
          return t;
        });
        setTypes(updated);
        localStorage.setItem('3tv_property_types', JSON.stringify(updated));
        showToast(`Đã cập nhật danh mục "${payload.name}" thành công!`, 'success');
      } else {
        // Tạo mới
        let newId = Date.now();
        try {
          const res = await fetch('/api/property-types', {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data && data.data.id) newId = data.data.id;
          }
        } catch {}

        const newItem = {
          id: newId,
          ...payload,
          parent_name: parentName,
          properties_count: 0,
          created_at: new Date().toISOString()
        };

        const updated = [newItem, ...types];
        setTypes(updated);
        localStorage.setItem('3tv_property_types', JSON.stringify(updated));
        showToast(`Đã thêm mới danh mục "${payload.name}" thành công!`, 'success');
      }

      setIsModalOpen(false);
    } catch (err) {
      showToast('Có lỗi xảy ra, vui lòng thử lại!', 'error');
    }
  };

  // Xác nhận Xóa
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    try {
      try {
        await fetch(`/api/property-types/${deletingItem.id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
      } catch {}

      const updated = types.filter(t => t.id !== deletingItem.id);
      setTypes(updated);
      localStorage.setItem('3tv_property_types', JSON.stringify(updated));
      showToast(`Đã xóa danh mục "${deletingItem.name}" thành công!`, 'success');
      setDeletingItem(null);
    } catch (err) {
      showToast('Không thể xóa danh mục, vui lòng thử lại!', 'error');
    }
  };

  // Danh sách danh mục cha khả dụng (loại trừ chính nó khi đang edit)
  const availableParents = useMemo(() => {
    return types.filter(t => !editingItem || t.id !== editingItem.id);
  }, [types, editingItem]);

  // Lọc và Tìm kiếm dữ liệu
  const filteredTypes = useMemo(() => {
    return types.filter(item => {
      // 1. Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = (item.name || '').toLowerCase().includes(term);
        const matchDesc = (item.description || '').toLowerCase().includes(term);
        const matchSlug = (item.slug || '').toLowerCase().includes(term);
        if (!matchName && !matchDesc && !matchSlug) return false;
      }

      // 2. Parent filter
      if (parentFilter !== 'all') {
        if (parentFilter === 'root') {
          if (item.parent_id !== null && item.parent_id !== undefined && item.parent_id !== '') return false;
        } else {
          if (String(item.parent_id) !== String(parentFilter)) return false;
        }
      }

      // 3. Status filter
      if (statusFilter !== 'all') {
        if (String(item.status) !== String(statusFilter)) return false;
      }

      return true;
    });
  }, [types, searchTerm, parentFilter, statusFilter]);

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredTypes.length / itemsPerPage));
  const paginatedTypes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTypes.slice(start, start + itemsPerPage);
  }, [filteredTypes, currentPage, itemsPerPage]);

  // Reset page khi thay đổi filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, parentFilter, statusFilter]);

  // Thống kê tổng quan
  const stats = useMemo(() => {
    const total = types.length;
    const active = types.filter(t => t.status === 1).length;
    const inactive = total - active;
    const totalProps = types.reduce((acc, cur) => acc + (cur.properties_count || 0), 0);
    return { total, active, inactive, totalProps };
  }, [types]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-bold text-white transition-all transform animate-fadeIn ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. KHỐI TIÊU ĐỀ: ĐẶC TẢ THEO ĐÚNG MOCKUP HÌNH 11                         */}
      {/* "PHÂN LOẠI BẤT ĐỘNG SẢN"                                                  */}
      {/* "Quản lý các danh mục và cấu trúc phân loại tài sản."                     */}
      {/* ========================================================================= */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-6 text-center shadow-xs">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase">
          PHÂN LOẠI BẤT ĐỘNG SẢN
        </h2>
        <p className="text-sm font-semibold text-slate-600 mt-1">
          Quản lý các danh mục và cấu trúc phân loại tài sản.
        </p>

        {/* Thống kê nhanh */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 pt-4 border-t border-slate-200/60 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Tổng danh mục: <strong className="text-blue-600">{stats.total}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Đang hoạt động: <strong className="text-emerald-600">{stats.active}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Tạm ẩn: <strong className="text-amber-600">{stats.inactive}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span>Tổng BĐS liên kết: <strong className="text-purple-600">{stats.totalProps}</strong></span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KHỐI BẢNG VÀ THANH CÔNG CỤ THEO ĐẶC TẢ MOCKUP                          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Toolbar: [Tìm kiếm Danh mục...] | [Loại cha v] | [Trạng thái v] | [THÊM DANH MỤC MỚI] */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Input Search [Tìm kiếm Danh mục...] */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="[Tìm kiếm Danh mục...]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Select [Loại cha v] */}
            <div className="relative">
              <select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value)}
                className="py-2 pl-3 pr-8 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer shadow-2xs"
              >
                <option value="all">Loại cha: Tất cả</option>
                <option value="root">Loại cha: Danh mục gốc (Cấp 1)</option>
                {types.filter(t => !t.parent_id).map(parent => (
                  <option key={parent.id} value={parent.id}>
                    Loại cha: {parent.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▾
              </div>
            </div>

            {/* Select [Trạng thái v] */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 pl-3 pr-8 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer shadow-2xs"
              >
                <option value="all">Trạng thái: Tất cả</option>
                <option value="1">Trạng thái: Đang hoạt động</option>
                <option value="0">Trạng thái: Tạm ẩn / Đã khóa</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▾
              </div>
            </div>

            {/* Nút Làm mới */}
            <button
              type="button"
              onClick={fetchPropertyTypes}
              className="p-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors shadow-2xs cursor-pointer"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>

          {/* Nút [THÊM DANH MỤC MỚI] */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wide transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>[THÊM DANH MỤC MỚI]</span>
          </button>
        </div>

        {/* Data Table: ID | TÊN DANH MỤC | MÔ TẢ | SỐ LƯỢNG BĐS | HÀNH ĐỘNG */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                <th className="py-3 px-4 w-16 text-center border-r border-slate-200">ID</th>
                <th className="py-3 px-5 border-r border-slate-200 w-1/4">TÊN DANH MỤC</th>
                <th className="py-3 px-5 border-r border-slate-200">MÔ TẢ</th>
                <th className="py-3 px-4 w-36 text-center border-r border-slate-200">SỐ LƯỢNG BĐS</th>
                <th className="py-3 px-4 w-32 text-center">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-800 font-medium">
              {loading && types.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải danh mục phân loại...
                  </td>
                </tr>
              ) : paginatedTypes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 font-semibold">
                    Không tìm thấy danh mục phân loại nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedTypes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* ID */}
                    <td className="py-3 px-4 text-center border-r border-slate-200 font-mono font-bold text-slate-600">
                      {item.id}
                    </td>

                    {/* TÊN DANH MỤC */}
                    <td className="py-3 px-5 border-r border-slate-200">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                          <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          <span className="text-slate-400 font-mono">slug: {item.slug}</span>
                          {item.parent_name && (
                            <span className="text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded font-semibold border border-purple-100">
                              Thuộc: {item.parent_name}
                            </span>
                          )}
                          {item.status === 0 && (
                            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-bold border border-amber-200">
                              Tạm ẩn
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* MÔ TẢ */}
                    <td className="py-3 px-5 border-r border-slate-200 text-slate-600 leading-relaxed">
                      {item.description || <span className="text-slate-400 italic">Chưa có mô tả chi tiết</span>}
                    </td>

                    {/* SỐ LƯỢNG BĐS */}
                    <td className="py-3 px-4 text-center border-r border-slate-200 font-extrabold">
                      <span className="inline-flex items-center justify-center min-w-[40px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black">
                        {item.properties_count || 0}
                      </span>
                    </td>

                    {/* HÀNH ĐỘNG: [Sửa] [Xóa] */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2 font-bold text-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="text-blue-600 hover:text-blue-800 hover:underline px-1 py-0.5 transition-colors cursor-pointer"
                          title="Chỉnh sửa danh mục"
                        >
                          [Sửa]
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setDeletingItem(item)}
                          className="text-red-600 hover:text-red-800 hover:underline px-1 py-0.5 transition-colors cursor-pointer"
                          title="Xóa danh mục"
                        >
                          [Xóa]
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ===================================================================== */}
        {/* 3. PHÂN TRANG THEO MOCKUP: < Trang 1 / 1 >                             */}
        {/* ===================================================================== */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-600">
          <div className="text-slate-500 font-semibold">
            Hiển thị <strong>{paginatedTypes.length}</strong> / <strong>{filteredTypes.length}</strong> danh mục phân loại
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs">
              &lt; Trang {currentPage} / {totalPages} &gt;
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL THÊM / CHỈNH SỬA DANH MỤC PHÂN LOẠI                              */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingItem ? 'Chỉnh Sửa Danh Mục BĐS' : 'Thêm Mới Danh Mục BĐS'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cập nhật thông tin phân loại tài sản theo cấu trúc danh mục
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 pt-4">
              
              {/* Tên danh mục */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Căn hộ cao cấp, Nhà phố liền kề..."
                  value={formData.name}
                  onChange={handleNameChange}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    formErrors.name ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Mã Slug */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Mã định danh (Slug)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Tự động sinh từ tên</span>
                </label>
                <input
                  type="text"
                  placeholder="slug-danh-muc"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Loại cha (Parent category) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thuộc danh mục cha (Cấu trúc phân cấp)
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                >
                  <option value="">-- Là danh mục gốc (Cấp 1, không có cha) --</option>
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name} (ID: #{parent.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả danh mục
                </label>
                <textarea
                  rows="3"
                  placeholder="Nhập mô tả chi tiết về loại hình tài sản này..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Trạng thái hoạt động
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    formData.status === 1 ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold ring-2 ring-emerald-400/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 1}
                      onChange={() => setFormData(prev => ({ ...prev, status: 1 }))}
                      className="sr-only"
                    />
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold">Đang hoạt động</span>
                  </label>

                  <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    formData.status === 0 ? 'bg-amber-50 border-amber-400 text-amber-800 font-bold ring-2 ring-amber-400/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 0}
                      onChange={() => setFormData(prev => ({ ...prev, status: 0 }))}
                      className="sr-only"
                    />
                    <XCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold">Tạm ẩn</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'Lưu Thay Đổi' : 'Thêm Danh Mục'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL XÁC NHẬN XÓA DANH MỤC                                            */}
      {/* ========================================================================= */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 text-center mb-1">
              Xác Nhận Xóa Danh Mục
            </h3>
            <p className="text-xs text-slate-600 text-center mb-4">
              Bạn có chắc chắn muốn xóa danh mục <strong className="text-slate-900">"{deletingItem.name}"</strong> (ID: #{deletingItem.id}) không?
            </p>

            {deletingItem.properties_count > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Cảnh báo:</strong> Đang có <strong>{deletingItem.properties_count}</strong> bất động sản thuộc danh mục này. Hãy đảm bảo đã chuyển các tin đăng sang danh mục khác trước khi xóa.
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="w-1/2 py-2 px-4 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-1/2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Đồng Ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
