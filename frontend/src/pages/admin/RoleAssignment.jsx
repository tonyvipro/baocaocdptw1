import { useConfirm } from '../../components/forms/ConfirmProvider';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck, ShieldAlert, KeyRound, Users, Search, RefreshCw,
  CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, ArrowLeft,
  X, Check, Lock, Building2, Briefcase, Shield, User, Sparkles,
  ArrowRight, Undo2, AlertTriangle, Layers, UserCheck
} from 'lucide-react';
import { broadcastDataChange, subscribeDataChange } from '../../services/tabSync';
import ConflictWarningBanner from '../../components/ConflictWarningBanner';
import { resolveAvatarUrl } from '../../services/api';

export default function RoleAssignment({ onNavigateToDashboard }) {
  const confirm = useConfirm();
  // 1. KHÔI PHỤC BỘ LỌC TỪ LOCALSTORAGE KHI F5 (F5 RELOAD PERSISTENCE)
  const savedState = (() => {
    try {
      return JSON.parse(localStorage.getItem('3tv_role_assignment_filter') || 'null');
    } catch {
      return null;
    }
  })();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() => (savedState?.searchTerm || '').slice(0, 250));
  const [roleFilter, setRoleFilter] = useState(() => savedState?.roleFilter || 'all');
  const [currentPage, setCurrentPage] = useState(() => savedState?.currentPage || 1);
  const [perPage, setPerPage] = useState(() => savedState?.perPage || 8);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 8,
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
  });

  // Tài khoản đang được chọn để gán quyền mới
  const [selectedUser, setSelectedUser] = useState(null);
  // Vai trò mới được chọn trong form
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  // Ghi chú lý do phân quyền (Giới hạn tối đa 250 ký tự)
  const [assignmentNote, setAssignmentNote] = useState('');

  // Trạng thái thao tác & thông báo Toast
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // 2. TRẠNG THÁI ĐỒNG BỘ ĐA TAB & KIỂM SOÁT XUNG ĐỘT (MULTI-TAB SYNC & CONFLICT PREVENTION)
  const [conflictEvent, setConflictEvent] = useState(null);
  const [conflictLocked, setConflictLocked] = useState(false);

  // Lắng nghe sự kiện đồng bộ đa tab (BroadcastChannel & Storage Event)
  useEffect(() => {
    const unsubscribe = subscribeDataChange((event) => {
      if (event.entity === 'users' || event.entity === 'roles') {
        setConflictEvent(event);
        setConflictLocked(true);
      }
    });
    return unsubscribe;
  }, []);

  // Giải phóng xung đột khi người dùng chọn Tải lại dữ liệu
  const handleResolveConflict = () => {
    setSelectedUser(null); setSelectedRoleId(null);
    setConflictEvent(null);
    setConflictLocked(false);
    fetchUsers(currentPage);
    fetchRoles();
    showToast('Đã đồng bộ dữ liệu phiên bản mới nhất từ hệ thống!', 'success');
  };

  // Lưu trạng thái bộ lọc vào LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('3tv_role_assignment_filter', JSON.stringify({
        searchTerm: searchTerm.slice(0, 250),
        roleFilter,
        currentPage,
        perPage
      }));
    } catch (e) {}
  }, [searchTerm, roleFilter, currentPage, perPage]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 3. TẢI DANH SÁCH TẤT CẢ VAI TRÒ TỪ DATABASE
  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const res = await fetch('/api/roles', {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success') {
          setRoles(json.data || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  // 4. TẢI DANH SÁCH NGƯỜI DÙNG TỪ DATABASE
  const fetchUsers = useCallback(async (page = currentPage) => {
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
      if (roleFilter !== 'all') {
        params.append('role_id', roleFilter);
      }

      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) throw new Error('Không thể tải danh sách tài khoản');

      const data = await res.json();
      setUsers(data.data || []);
      setPagination({
        total: data.total || 0,
        per_page: data.per_page || perPage,
        current_page: data.current_page || page,
        last_page: data.last_page || 1,
        from: data.from || 0,
        to: data.to || 0,
      });

    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải danh sách người dùng từ cơ sở dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, perPage, currentPage, selectedUser, selectedRoleId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [fetchUsers, currentPage]);

  // Xử lý tìm kiếm với giới hạn tối đa 250 ký tự
  const handleSearchChange = (e) => {
    const val = (e.target.value || '').slice(0, 250);
    setSearchTerm(val);
    setCurrentPage(1);
  };

  // Thao tác nút [Đổi]: Chọn tài khoản cần gán vai trò mới
  const handleSelectUserToAssign = (user) => {
    if (conflictLocked) {
      showToast('Thao tác tạm khóa do dữ liệu vừa thay đổi ở tab khác. Vui lòng bấm Tải lại dữ liệu!', 'error');
      return;
    }
    setSelectedUser(user);
    setSelectedRoleId(user.role_id || 2); // Mặc định chọn vai trò hiện tại của user
    setAssignmentNote('');
  };

  // Thao tác nút "Hủy bỏ?": Reset lại trạng thái chọn quyền
  const handleCancelAssignment = () => {
    if (selectedUser) {
      setSelectedRoleId(selectedUser.role_id);
    } else {
      setSelectedRoleId(null);
    }
    setAssignmentNote('');
    showToast('Đã hủy bỏ thay đổi chọn vai trò', 'info');
  };

  // Thao tác nút [GÁN VAI TRÒ ĐÃ CHỌN]: Lưu quyền mới vào DB và phát Broadcast
  const handleSaveRoleAssignment = async () => {
    if (!selectedUser) {
      showToast('Vui lòng chọn một tài khoản từ bảng bên trái bằng nút [Đổi]', 'error');
      return;
    }

    if (!selectedRoleId) {
      showToast('Vui lòng chọn một vai trò mới để gán cho tài khoản', 'error');
      return;
    }

    if (conflictLocked) {
      showToast('Không thể lưu: Dữ liệu đã thay đổi ở tab khác. Vui lòng tải lại dữ liệu!', 'error');
      return;
    }

    // Nếu chọn đúng vai trò hiện tại
    if (selectedRoleId === selectedUser.role_id) {
      showToast(`Tài khoản "${selectedUser.name}" đã có vai trò này rồi!`, 'info');
      return;
    }

    if (true && !(await confirm({ title: 'Xác nhận cập nhật', message: "Gán vai trò đã chọn cho tài khoản này? Quyền truy cập sẽ thay đổi sau khi lưu." }))) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const res = await fetch(`/api/users/${selectedUser.id}/assign-role`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          role_id: selectedRoleId,
          note: assignmentNote.trim().slice(0, 250),
          version: selectedUser.version, last_updated_at: selectedUser.updated_at
        })
      });

      const resData = await res.json();
      if (!res.ok || resData.status === 'error') {
        throw new Error(resData.message || 'Lỗi khi gán vai trò cho tài khoản');
      }

      const assignedRole = roles.find(r => r.id === selectedRoleId);
      showToast(
        `Đã gán vai trò "${assignedRole?.name || 'Mới'}" cho tài khoản "${selectedUser.name}" thành công!`,
        'success'
      );

      // Phát tín hiệu đồng bộ đa tab (Multi-tab sync)
      broadcastDataChange({
        entity: 'users',
        action: 'role_assigned',
        id: selectedUser.id,
        name: selectedUser.name,
        role_id: selectedRoleId,
        role_name: assignedRole?.name,
      });

      // Cập nhật lại danh sách users và roles count
      fetchUsers(currentPage);
      fetchRoles();

      // Cập nhật lại user đang được chọn
      setSelectedUser(prev => prev ? {
        ...prev,
        version: resData.data?.version,
        role_id: selectedRoleId,
        role: assignedRole || prev.role,
        updated_at: resData.data?.updated_at || new Date().toISOString()
      } : null);

      setAssignmentNote('');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Thao tác gán vai trò thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper hiển thị badge vai trò với màu sắc chuẩn mực
  const getRoleBadge = (roleName, roleId) => {
    switch (roleId) {
      case 1:
      case 'Admin':
        return {
          bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-400',
          label: 'Admin (Quản trị viên)'
        };
      case 2:
      case 'BĐS':
        return {
          bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          dot: 'bg-blue-400',
          label: 'BĐS (Môi giới)'
        };
      case 3:
      case 'Owner':
        return {
          bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          dot: 'bg-purple-400',
          label: 'Owne (Owner / Chủ sở hữu)'
        };
      case 4:
      case 'Staff':
        return {
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
          label: 'Staf (Staff / Nhân viên)'
        };
      default:
        return {
          bg: 'bg-slate-700/40 text-slate-700 border-slate-600/50',
          dot: 'bg-slate-400',
          label: roleName || 'Khách hàng'
        };
    }
  };

  // Định nghĩa mô tả chuẩn cho 3 vai trò trọng tâm theo Hình 11
  const roleSpecs = useMemo(() => ({
    2: {
      key: 'BĐS',
      title: 'BĐS',
      subTitle: 'Quyền đăng và quản lý tin bất động sản',
      description: 'Cho phép đăng tin mua bán/cho thuê, quản lý danh sách tin cá nhân, xem lịch hẹn xem nhà và tiếp nhận khách quan tâm.',
      icon: Building2,
      badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
      activeBorder: 'border-blue-500 bg-blue-50 ring-1 ring-blue-500',
    },
    3: {
      key: 'Owner',
      title: 'Owne (Owner)',
      subTitle: 'Quyền chủ sở hữu và xem báo cáo',
      description: 'Cho phép quản lý tài sản chính chủ, theo dõi tình trạng cho thuê, theo dõi hợp đồng và xem báo cáo tài chính/vận hành liên quan.',
      icon: KeyRound,
      badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
      activeBorder: 'border-purple-500 bg-purple-50 ring-1 ring-purple-500',
    },
    4: {
      key: 'Staff',
      title: 'Staf (Staff)',
      subTitle: 'Quyền nhân viên quản lý hệ thống hạn chế',
      description: 'Quyền nhân viên vận hành hỗ trợ kiểm duyệt tin sơ bộ, điều phối lịch hẹn xem bất động sản và hỗ trợ khách hàng theo phân công.',
      icon: Briefcase,
      badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      activeBorder: 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500',
    },
    1: {
      key: 'Admin',
      title: 'Quản trị viên (Admin)',
      subTitle: 'Toàn quyền cấu hình và quản trị hệ thống',
      description: 'Quyền quản trị cấp cao nhất: phân quyền tài khoản, quản lý danh mục, duyệt hợp đồng và xem báo cáo doanh thu toàn diện.',
      icon: Shield,
      badgeColor: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
      activeBorder: 'border-rose-500 bg-rose-50 ring-1 ring-rose-500',
    },
    5: {
      key: 'Customer',
      title: 'Khách hàng (Customer)',
      subTitle: 'Quyền tìm kiếm và tương tác cơ bản',
      description: 'Quyền thành viên tiêu chuẩn: tìm kiếm tin đăng, lưu tin yêu thích, gửi yêu cầu liên hệ và đặt lịch hẹn xem nhà.',
      icon: User,
      badgeColor: 'border-slate-500/40 text-slate-700 bg-slate-50',
      activeBorder: 'border-slate-400 bg-white ring-1 ring-slate-400',
    }
  }), []);



  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all duration-300 animate-slide-up ${
          toastMessage.type === 'error'
            ? 'bg-rose-950/90 text-rose-200 border-rose-500/50 backdrop-blur-md'
            : toastMessage.type === 'info'
              ? 'bg-blue-950/90 text-blue-200 border-blue-500/50 backdrop-blur-md'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 backdrop-blur-md'
        }`}>
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : toastMessage.type === 'info' ? (
            <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* HEADER SECTION: TIÊU ĐỀ & ĐIỀU HƯỚNG QUAY LẠI DASHBOARD */}
      <div className="giang-page-heading flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-3 rounded-xl bg-gradient-to-br from-red-600/20 to-rose-600/20 text-red-400 border border-red-500/30">
            <ShieldCheck className="w-6 h-6" />
          </span>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Quản trị viên: Gán vai trò (Phân quyền)
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Quản lý vai trò và quyền truy cập của từng tài khoản trong hệ thống.
            </p>
          </div>
        </div>

        {/* Nút hành động header */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Nút Làm mới dữ liệu */}
          <button
            onClick={handleResolveConflict}
            title="Tải lại dữ liệu mới nhất"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading || rolesLoading ? 'animate-spin text-red-500' : ''}`} />
          </button>

          {/* Liên kết "Quay lại Bảng điều khiển" */}
          <button
            onClick={() => {
              if (onNavigateToDashboard) {
                onNavigateToDashboard();
              } else {
                window.location.hash = '#admin/dashboard';
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-600 text-xs font-bold transition-all shadow-sm cursor-pointer hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 text-red-400" />
            <span>Quay lại Bảng điều khiển</span>
          </button>
        </div>
      </div>

      {/* BANNER CẢNH BÁO XUNG ĐỘT ĐA TAB (YÊU CẦU 5) */}
      {conflictLocked && (
        <ConflictWarningBanner
          conflictEvent={conflictEvent}
          onReload={handleResolveConflict}
          entityName="Phân quyền tài khoản người dùng"
        />
      )}



      {/* BỐ CỤC CHIA 2 PHẦN RÕ RỆT (CHUẨN HÌNH 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ======================================================== */}
        {/* PHẦN 1 (BÊN TRÁI): BẢNG TÌM KIẾM & DANH SÁCH TÀI KHOẢN (7 CỘT) */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 bg-white backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-red-500" />
                Danh Sách Tài Khoản Người Dùng
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tìm kiếm tài khoản và nhấn nút <span className="font-bold text-red-400">[Đổi]</span> để phân quyền
              </p>
            </div>
            
            {/* Lọc nhanh theo vai trò */}
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="all">Tất cả vai trò</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.users_count || 0})</option>
              ))}
            </select>
          </div>

          {/* Ô TÌM KIẾM TÀI KHOẢN REAL-TIME (YÊU CẦU 2 & 5: GIỚI HẠN TỐI ĐA 250 KÝ TỰ) */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              maxLength={250}
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Nhập tên hoặc email tài khoản để lọc real-time (tối đa 250 ký tự)..."
              className="w-full pl-9 pr-16 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                  className="text-slate-400 hover:text-slate-900"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                {searchTerm.length}/250
              </span>
            </div>
          </div>

          {/* BẢNG DANH SÁCH TÀI KHOẢN */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3.5 w-16">ID</th>
                    <th className="py-3 px-3.5">Tài Khoản</th>
                    <th className="py-3 px-3.5 text-center">Vai Trò Hiện Tại</th>
                    <th className="py-3 px-3.5 text-center w-24">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    // Skeleton rows
                    [...Array(perPage)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5 px-3.5"><div className="h-4 bg-slate-50 rounded w-8" /></td>
                        <td className="py-3.5 px-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-50" />
                            <div className="space-y-1">
                              <div className="h-3.5 bg-slate-50 rounded w-28" />
                              <div className="h-3 bg-slate-50 rounded w-36" />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 text-center"><div className="h-5 bg-slate-50 rounded-full w-24 mx-auto" /></td>
                        <td className="py-3.5 px-3.5 text-center"><div className="h-6 bg-slate-50 rounded w-14 mx-auto" /></td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-10 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <Users className="w-10 h-10 text-slate-700 mb-2" />
                          <p className="font-semibold text-slate-700">Không tìm thấy tài khoản nào</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Vui lòng thay đổi từ khóa hoặc bỏ lọc vai trò</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSelected = selectedUser?.id === u.id;
                      const badge = getRoleBadge(u.role?.name, u.role_id);
                      return (
                        <tr
                          key={u.id}
                          className={`transition-colors ${
                            isSelected
                              ? 'bg-red-950/30 border-l-4 border-l-red-500'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* ID Tài khoản */}
                          <td className="py-3 px-3.5 font-mono text-slate-400 font-bold">
                            #{u.id}
                          </td>

                          {/* Thông tin: Avatar, Tên & Email */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-900 font-bold text-xs shrink-0 overflow-hidden">
                                {u.avatar ? (
                                  <img
                                    src={resolveAvatarUrl(u.avatar)}
                                    alt={u.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  u.name?.charAt(0) || 'U'
                                )}
                              </div>
                              <div className="overflow-hidden">
                                <p className={`font-bold truncate ${isSelected ? 'text-red-400' : 'text-slate-700'}`}>
                                  {u.name}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Vai trò hiện tại */}
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {u.role?.name || 'Chưa phân quyền'}
                            </span>
                          </td>

                          {/* Nút thao tác [Đổi] (Yêu cầu 2: Nút [Đổi] để chọn nhanh tài khoản cần gán quyền mới) */}
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleSelectUserToAssign(u)}
                              disabled={conflictLocked}
                              title={conflictLocked ? 'Thao tác tạm khóa do phát hiện thay đổi ở tab khác' : `Chọn ${u.name} để đổi vai trò`}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                isSelected
                                  ? 'bg-red-600 text-white shadow-red-900/50 ring-2 ring-red-400 cursor-default'
                                  : conflictLocked
                                    ? 'bg-slate-50 text-slate-500 border border-slate-200 cursor-not-allowed opacity-50'
                                    : 'bg-slate-50 hover:bg-red-600 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-red-500 cursor-pointer active:scale-95'
                              }`}
                            >
                              {isSelected ? 'Đang chọn' : 'Đổi'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang danh sách tài khoản */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px]">
                Hiển thị <span className="font-bold text-slate-900">{pagination.from || 0}</span> - <span className="font-bold text-slate-900">{pagination.to || 0}</span> / <span className="font-bold text-slate-900">{pagination.total || 0}</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1 || loading}
                  className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-2 font-mono text-[11px] text-slate-700">
                  {currentPage} / {pagination.last_page || 1}
                </span>

                <button
                  onClick={() => setCurrentPage(Math.min(pagination.last_page || 1, currentPage + 1))}
                  disabled={currentPage >= (pagination.last_page || 1) || loading}
                  className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Trang sau"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PHẦN 2 (BÊN PHẢI): KHU VỰC CHỌN NHÓM VAI TRÒ MỚI (5 CỘT) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 bg-white backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="pb-3 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-red-500" />
              Khu Vực Gán Vai Trò Mới
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chọn một trong các nhóm vai trò dưới đây để cấp quyền trực tiếp
            </p>
          </div>

          {/* KHỐI THÔNG TIN TÀI KHOẢN ĐƯỢC CHỌN */}
          {selectedUser ? (
            <div className="p-4 rounded-xl bg-white border border-red-500/40 relative overflow-hidden shadow-inner">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 border-2 border-red-500 flex items-center justify-center text-slate-900 font-bold text-sm shrink-0 overflow-hidden shadow-md">
                  {selectedUser.avatar ? (
                    <img
                      src={resolveAvatarUrl(selectedUser.avatar)}
                      alt={selectedUser.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    selectedUser.name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 text-sm truncate">{selectedUser.name}</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-50 text-red-400 border border-slate-200">
                      ID: #{selectedUser.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px]">
                    <span className="text-slate-500">Vai trò hiện tại:</span>
                    <span className="font-bold text-slate-700">
                      {selectedUser.role?.name || 'Chưa phân quyền'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-white border border-dashed border-slate-200 text-center">
              <UserCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Chưa chọn tài khoản nào</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Vui lòng nhấn nút <span className="text-red-400 font-bold">[Đổi]</span> ở cột thao tác bên trái để chọn tài khoản cần gán quyền
              </p>
            </div>
          )}

          {/* CÁC TÙY CHỌN GÁN VAI TRÒ MỚI (YÊU CẦU 3: BĐS, OWNE, STAF) */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chọn Nhóm Quyền Mới (Radio Tùy Chọn) <span className="text-red-500">*</span>
            </label>

            {/* Danh sách các vai trò chính (Đặc biệt 3 vai trò BĐS, Owne, Staf theo Hình 11) */}
            <div className="space-y-2.5">
              {[2, 3, 4, 1].map((roleId) => {
                const spec = roleSpecs[roleId];
                if (!spec) return null;
                const isChecked = selectedRoleId === roleId;
                const isCurrentRole = selectedUser?.role_id === roleId;
                const IconComponent = spec.icon;

                return (
                  <label
                    key={roleId}
                    onClick={() => {
                      if (!conflictLocked && selectedUser) {
                        setSelectedRoleId(roleId);
                      }
                    }}
                    className={`block p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isChecked
                        ? spec.activeBorder
                        : 'bg-white border-slate-200 hover:border-slate-200 hover:bg-slate-50'
                    } ${conflictLocked || !selectedUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Radio button tròn */}
                      <div className="pt-0.5 shrink-0">
                        <input
                          type="radio"
                          name="assignedRole"
                          checked={isChecked}
                          onChange={() => {
                            if (!conflictLocked && selectedUser) {
                              setSelectedRoleId(roleId);
                            }
                          }}
                          disabled={conflictLocked || !selectedUser}
                          className="w-4 h-4 text-red-600 bg-white border-slate-200 focus:ring-red-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`p-1 rounded-md border text-xs ${spec.badgeColor}`}>
                              <IconComponent className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {spec.title}
                            </span>
                          </div>

                          {/* Huy hiệu vai trò hiện tại của user */}
                          {isCurrentRole && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-amber-400 border border-amber-500/30">
                              Hiện tại
                            </span>
                          )}
                        </div>

                        {/* Tiêu đề phụ quyền hạn (Hình 11) */}
                        <p className="text-[11px] font-semibold text-slate-700 mt-1">
                          {spec.subTitle}
                        </p>

                        {/* Mô tả chi tiết quyền hạn */}
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          {spec.description}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Ô GHI CHÚ PHÂN QUYỀN (GIỚI HẠN TỐI ĐA 250 KÝ TỰ - YÊU CẦU 5) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Ghi chú lý do phân quyền (Tùy chọn)
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                {assignmentNote.length}/250 ký tự
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={250}
              value={assignmentNote}
              onChange={(e) => setAssignmentNote(e.target.value.slice(0, 250))}
              placeholder="Nhập ghi chú lý do cấp/đổi quyền cho tài khoản này (tối đa 250 ký tự)..."
              disabled={conflictLocked || !selectedUser}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
            />
          </div>

          {/* HÀNH ĐỘNG VÀ ĐIỀU HƯỚNG (YÊU CẦU 4) */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            {/* Nút chính: [GÁN VAI TRÒ ĐÃ CHỌN] */}
            <button
              type="button"
              onClick={handleSaveRoleAssignment}
              disabled={actionLoading || conflictLocked || !selectedUser || !selectedRoleId}
              className={`primary-action w-full py-3 px-4 rounded-none text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                actionLoading || conflictLocked || !selectedUser || !selectedRoleId
                  ? 'bg-slate-50 text-slate-500 border border-slate-200 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-slate-900 shadow-red-900/40 border border-red-500/50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
              }`}
            >
              {actionLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : conflictLocked ? (
                <Lock className="w-4 h-4 text-amber-400" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>
                {conflictLocked
                  ? 'ĐÃ KHÓA THAO TÁC (DỮ LIỆU ĐÃ THAY ĐỔI)'
                  : 'GÁN VAI TRÒ ĐÃ CHỌN'}
              </span>
            </button>

            {/* Nhóm nút phụ: "Hủy bỏ?" và "Quay lại Bảng điều khiển" */}
            <div className="flex items-center justify-between gap-3 text-xs">
              {/* Nút "Hủy bỏ?": Reset lại trạng thái chọn quyền */}
              <button
                type="button"
                onClick={handleCancelAssignment}
                disabled={!selectedUser}
                className="text-slate-400 hover:text-slate-900 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-medium py-1"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Hủy bỏ?</span>
              </button>

              {/* Liên kết "Quay lại Bảng điều khiển" */}
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToDashboard) {
                    onNavigateToDashboard();
                  } else {
                    window.location.hash = '#admin/dashboard';
                  }
                }}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 transition cursor-pointer font-bold py-1"
              >
                <span>Quay lại Bảng điều khiển</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
