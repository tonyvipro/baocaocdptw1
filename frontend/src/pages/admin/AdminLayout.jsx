import React, { useState, useEffect } from 'react';
import { 
  Building2, Calendar, Users, LayoutDashboard, 
  Settings, LogOut, Menu, X, ArrowLeft, RefreshCw, CheckCircle, ShieldCheck, XCircle, User, Phone, MapPin, FileText, Clock, BarChart3, SlidersHorizontal, Layers, KeyRound, UserCheck, FolderOpen, Receipt, DollarSign, CreditCard, Wallet
} from 'lucide-react';
import ContractsManager from './ContractsManager';
import ContractDocumentsManager from './ContractDocumentsManager';
import InvoicesManager from './InvoicesManager';
import InvoiceDetailPage from './InvoiceDetailPage';
import RentManagementPage from './RentManagementPage';
import PaymentsPage from './PaymentsPage';
import DepositsPage from './DepositsPage';
// 1. Gộp tất cả các import cần thiết lại với nhau
import { resolveAvatarUrl } from '../../services/api';
import PropertiesManager from './PropertiesManager';
import PropertyTypesManager from './PropertyTypesManager';
import ListingApprovalsManager from './ListingApprovalsManager';
import ListingStatusManager from './ListingStatusManager';
import UserManagement from '../UserManagement';
import StatisticalReport from './StatisticalReport';
import DashboardOverview from './DashboardOverview';
import CategoryManagement from './CategoryManagement';
import RoleAssignment from './RoleAssignment';
import BrokerManagement from './BrokerManagement';
import CustomerManagement from './CustomerManagement';
import DemandManagement from './DemandManagement';
import { ClipboardList } from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';
import NotificationsPage from '../NotificationsPage';
import { Bell } from 'lucide-react';

// Giang's nine admin screens cover management, reporting and CRM features.
const GIANG_MENUS = new Set(['dashboard', 'categories', 'brokers', 'customers', 'demands', 'notifications', 'users', 'roles', 'reports']);

export default function AdminLayout({ currentUser, onLogout, onExitAdmin, onOpenProfile }) {
  // 1. Khôi phục tab menu đang đứng từ URL hash hoặc localStorage khi F5/reload
  const getInitialActiveMenu = () => {
    try {
      const hash = window.location.hash || '';
      const match = hash.match(/#(?:admin\/)?([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return match[1];
      }
      return localStorage.getItem('3tv_admin_active_menu') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  };

  const [activeMenu, setActiveMenu] = useState(getInitialActiveMenu);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(() => {
    const hash = window.location.hash || '';
    const match = hash.match(/^#admin\/invoices\/(\d+)/);
    return match ? Number(match[1]) : null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Đồng bộ hóa trạng thái activeMenu với URL hash và localStorage
  const handleSelectMenu = (menuId) => {
    setActiveMenu(menuId);
    setSelectedInvoiceId(null);
    localStorage.setItem('3tv_admin_active_menu', menuId);
    if (window.location.hash !== `#admin/${menuId}`) {
      window.location.hash = `#admin/${menuId}`;
    }
  };

  // Lắng nghe sự kiện hashchange để hỗ trợ nút Back/Forward của trình duyệt
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash || '';
      const invoiceMatch = hash.match(/^#admin\/invoices\/(\d+)/);
      if (invoiceMatch) {
        setActiveMenu('invoices');
        setSelectedInvoiceId(Number(invoiceMatch[1]));
        return;
      }

      const match = hash.match(/#(?:admin\/)?([a-zA-Z0-9_-]+)/);
      if (match && match[1] && match[1] !== activeMenu) {
        setActiveMenu(match[1]);
        setSelectedInvoiceId(null);
        localStorage.setItem('3tv_admin_active_menu', match[1]);
      }
    };
    window.addEventListener('hashchange', onHashChange);

    // Đảm bảo URL hash đồng bộ với tab ban đầu khi vừa mount
    if (!window.location.hash.startsWith('#admin/')) {
      window.location.hash = `#admin/${activeMenu}`;
    }

    return () => window.removeEventListener('hashchange', onHashChange);
  }, [activeMenu]);

  // Tải số lượng tin chờ duyệt cho badge sidebar
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const token = localStorage.getItem('3tv_token') || '';
        const res = await fetch('/api/properties/stats', {
          headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          setPendingCount(data.pending || 0);
        }
      } catch (e) {}
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000);
    return () => clearInterval(interval);
  }, []);

  // 1. Phân quyền hiển thị Menu bên trái
  const getMenuItems = () => {
    const items = [
      { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, roles: [1, 2] },
      { id: 'categories', label: 'Quản lý Danh mục', icon: Layers, roles: [1, 2] },
      { id: 'brokers', label: 'Quản lý Môi giới & Phân công', icon: UserCheck, roles: [1, 2] },
      { id: 'customers', label: 'Quản lý khách hàng', icon: Users, roles: [1, 2] },
      { id: 'demands', label: 'Quản lý nhu cầu', icon: ClipboardList, roles: [1, 2] },
      { id: 'notifications', label: 'Thông báo & Nhật ký', icon: Bell, roles: [1, 2] },
      { id: 'approvals', label: 'Duyệt Tin Đăng', icon: ShieldCheck, badgeCount: pendingCount, roles: [1, 2] },
      { id: 'listing-status', label: 'Quản Lý Trạng Thái Tin', icon: SlidersHorizontal, roles: [1, 2] },
      { id: 'property-types', label: 'Phân loại Bất Động Sản', icon: Layers, roles: [1, 2] },
      { id: 'properties', label: 'Quản lý Bất Động Sản', icon: Building2, roles: [1, 2] },
      { id: 'appointments', label: 'Quản lý Lịch Hẹn', icon: Calendar, roles: [1, 2] },
      { id: 'contracts', label: 'Quản lý Hợp Đồng', icon: FileText, roles: [1, 2] },
      { id: 'contract-documents', label: 'Quản lý Tài liệu Hợp đồng', icon: FolderOpen, roles: [1, 2] },
      { id: 'invoices', label: 'Quản lý Hóa đơn', icon: Receipt, roles: [1, 2] },
      { id: 'rent-management', label: 'Quản lý tiền thuê', icon: DollarSign, roles: [1, 2] },
      { id: 'deposits', label: 'Quản lý tiền cọc', icon: Wallet, roles: [1, 2] },
      { id: 'payments', label: 'Quản lý thanh toán', icon: CreditCard, roles: [1, 2] },
      { id: 'users', label: 'Quản lý Người Dùng', icon: Users, roles: [1] }, // Chỉ admin
      { id: 'roles', label: 'Gán vai trò (Phân quyền)', icon: KeyRound, roles: [1] }, // Chuẩn Hình 11
      { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings, roles: [1] }, // Chỉ admin
      { id: 'reports', label: 'Báo cáo thống kê', icon: BarChart3, roles: [1] }, // Chỉ admin
    ];

    return items.filter(item => item.roles.includes(currentUser?.role_id));
  };

  const menuItems = getMenuItems();

  return (
    <div className="admin-shell flex h-dvh w-full bg-slate-50 overflow-hidden font-sans">
      
      {/* Sidebar Mobile Overlay */}
      {!sidebarOpen && (
        <div 
          className="app-dialog-layer fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 no-print
        w-64 shrink-0 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
      `}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-extrabold text-xl cursor-pointer" onClick={onExitAdmin}>
            <Building2 className="w-6 h-6 text-red-500" />
            3TV<span className="text-red-500">LAND</span>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(true)}>
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* User Info */}
        <div 
          onClick={onOpenProfile} 
          className="px-6 py-5 border-b border-slate-800 flex items-center gap-3 cursor-pointer hover:bg-slate-800/60 transition-colors group"
          title="Nhấn để cập nhật hồ sơ"
        >
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white shadow-inner overflow-hidden border border-slate-600 shrink-0">
            {currentUser?.avatar ? (
              <img 
                src={resolveAvatarUrl(currentUser.avatar)} 
                alt={currentUser.name} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              currentUser?.name?.charAt(0) || 'U'
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">{currentUser?.name}</p>
            <p className="text-[11px] text-emerald-400 font-semibold truncate">
              {currentUser?.role_id === 1 ? 'Quản Trị Viên (Admin)' : 'Môi Giới (Broker)'}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="admin-sidebar-nav flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">
            Menu Quản Lý
          </div>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleSelectMenu(item.id)}
              className={`w-full min-w-0 flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeMenu === item.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3 text-left">
                <item.icon className={`mt-0.5 h-4 w-4 shrink-0 ${activeMenu === item.id ? 'text-white' : 'text-slate-500'}`} />
                <span className="min-w-0 whitespace-normal break-normal text-left leading-5">{item.label}</span>
              </div>
              {item.badgeCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-slate-950 animate-pulse shadow-xs">
                  {item.badgeCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button 
            onClick={onExitAdmin}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Về Trang Khách
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Đăng Xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10 shadow-sm shrink-0 no-print">
          <div className="flex min-w-0 items-center gap-4">
            <button 
              className="lg:hidden shrink-0 p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="truncate text-base sm:text-xl font-bold text-slate-800 capitalize">
              {menuItems.find(i => i.id === activeMenu)?.label || 'Bảng điều khiển'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationBell currentUser={currentUser} onOpen={() => handleSelectMenu('notifications')} />
            <div className="hidden sm:block text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              Chế độ Quản Trị Hệ Thống
            </div>
            {onOpenProfile && (
              <button 
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 text-xs font-semibold text-slate-700"
                title="Cập nhật hồ sơ & đổi mật khẩu"
              >
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden border border-slate-300">
                  {currentUser?.avatar ? (
                    <img src={resolveAvatarUrl(currentUser.avatar)} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    currentUser?.name?.charAt(0) || 'A'
                  )}
                </div>
                <span className="hidden md:inline font-bold text-slate-800">{currentUser?.name || 'Admin'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className={`admin-page-content min-w-0 flex-1 overflow-auto p-3 sm:p-5 lg:p-6 ${GIANG_MENUS.has(activeMenu) ? 'giang-workspace' : ''}`}>
          {activeMenu === 'dashboard' && <DashboardOverview />}
          {activeMenu === 'demands' && <DemandManagement key={currentUser?.id || 'guest'} currentUser={currentUser} />}
          {activeMenu === 'notifications' && <NotificationsPage key={currentUser?.id || 'guest'} currentUser={currentUser} embedded />}
          {activeMenu === 'categories' && <CategoryManagement />}
          {activeMenu === 'brokers' && <BrokerManagement />}
          {activeMenu === 'customers' && (currentUser && [1, 2].includes(Number(currentUser.role_id)) ? <CustomerManagement currentUser={currentUser} /> : <p className="text-sm text-slate-500">Vui lòng đăng nhập bằng tài khoản Admin hoặc Môi giới để quản lý khách hàng.</p>)}
          {activeMenu === 'approvals' && <ListingApprovalsManager />}
          {activeMenu === 'listing-status' && <ListingStatusManager />}
          {activeMenu === 'property-types' && <PropertyTypesManager />}
          {activeMenu === 'properties' && <PropertiesManager />}
          {activeMenu === 'appointments' && <AppointmentsManager />}
          {activeMenu === 'contracts' && <ContractsManager currentUser={currentUser} />}
          {activeMenu === 'contract-documents' && <ContractDocumentsManager currentUser={currentUser} onNavigateToContracts={() => handleSelectMenu('contracts')} />}
          {activeMenu === 'invoices' && (
            selectedInvoiceId ? (
              <InvoiceDetailPage
                invoiceId={selectedInvoiceId}
                onBack={() => {
                  setSelectedInvoiceId(null);
                  window.location.hash = '#admin/invoices';
                }}
              />
            ) : (
              <InvoicesManager
                currentUser={currentUser}
                onSelectInvoice={(id) => {
                  setSelectedInvoiceId(id);
                  window.location.hash = `#admin/invoices/${id}`;
                }}
              />
            )
          )}
          {activeMenu === 'rent-management' && (
            <RentManagementPage
              currentUser={currentUser}
              onNavigateToInvoice={(id) => {
                setSelectedInvoiceId(id);
                setActiveMenu('invoices');
                window.location.hash = `#admin/invoices/${id}`;
              }}
            />
          )}
          {activeMenu === 'payments' && <PaymentsPage currentUser={currentUser} />}
          {activeMenu === 'deposits' && (
            <DepositsPage
              currentUser={currentUser}
              onNavigateToInvoice={(id) => {
                setSelectedInvoiceId(id);
                setActiveMenu('invoices');
                window.location.hash = `#admin/invoices/${id}`;
              }}
            />
          )}
          {activeMenu === 'users' && <UserManagement />}
          {activeMenu === 'roles' && <RoleAssignment onNavigateToDashboard={() => handleSelectMenu('dashboard')} />}
          {activeMenu === 'reports' && <StatisticalReport />}
          {activeMenu !== 'demands' && activeMenu !== 'notifications' && activeMenu !== 'dashboard' && activeMenu !== 'categories' && activeMenu !== 'brokers' && activeMenu !== 'customers' && activeMenu !== 'approvals' && activeMenu !== 'listing-status' && activeMenu !== 'property-types' && activeMenu !== 'properties' && activeMenu !== 'appointments' && activeMenu !== 'contracts' && activeMenu !== 'contract-documents' && activeMenu !== 'invoices' && activeMenu !== 'rent-management' && activeMenu !== 'payments' && activeMenu !== 'deposits' && activeMenu !== 'users' && activeMenu !== 'roles' && activeMenu !== 'reports' && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
              <LayoutDashboard className="w-12 h-12 mb-4 opacity-20" />
              <h2 className="text-lg font-bold text-slate-600 mb-2">Trang đang được xây dựng</h2>
              <p className="text-sm">Chức năng {menuItems.find(i => i.id === activeMenu)?.label} sẽ được cập nhật trong phiên bản tới.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------
// COMPONENT: QUẢN LÝ LỊCH HẸN (Dành riêng cho màn hình Admin)
// ---------------------------------------------------------
function AppointmentsManager() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal Đổi lịch (F03)
  const [rescheduleModalApp, setRescheduleModalApp] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('09:00');
  const [rescheduleError, setRescheduleError] = useState('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  // Modal Hủy / Từ chối lịch (F04)
  const [cancelModalApp, setCancelModalApp] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMsg({ text: msg, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    fetchAppointments();
  }, [searchTerm, statusFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== '') params.append('status', statusFilter);

      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch(`/api/appointments?${params.toString()}`, { headers });
      if (!res.ok) {
        res = await fetch(`http://localhost:8080/api/appointments?${params.toString()}`, { headers });
      }
      if (!res.ok) throw new Error('API chưa sẵn sàng.');
      const data = await res.json();
      setAppointments(data.data || []);
    } catch (err) {
      console.warn("Lỗi tải appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch(`/api/appointments/${id}/confirm`, {
        method: 'PATCH',
        headers
      });
      if (!res.ok && res.status >= 500) {
        res = await fetch(`http://localhost:8080/api/appointments/${id}/confirm`, {
          method: 'PATCH',
          headers
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi không xác định.');
      showToast(data.message || 'Xác nhận lịch hẹn thành công!', 'success');
      setAppointments(prev => prev.map(app => app.id === id ? { ...app, ...(data.data || {}), status: 1 } : app));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const openRescheduleModal = (app) => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    setRescheduleDate(d.toISOString().split('T')[0]);
    setRescheduleTime('10:00');
    setRescheduleError('');
    setRescheduleModalApp(app);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleModalApp) return;
    setRescheduleError('');
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError('Vui lòng chọn ngày và giờ hẹn mới.');
      return;
    }

    const newAppointmentTime = `${rescheduleDate} ${rescheduleTime}:00`;
    setRescheduleSubmitting(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/appointments/${rescheduleModalApp.id}/reschedule`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          new_appointment_time: newAppointmentTime,
          version: rescheduleModalApp.version || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const firstErr = data.errors ? Object.values(data.errors).flat()[0] : null;
        setRescheduleError(firstErr || data.message || 'Không thể thay đổi lịch hẹn.');
        return;
      }

      showToast(data.message || 'Thay đổi lịch hẹn thành công!', 'success');
      setAppointments(prev => prev.map(app => app.id === rescheduleModalApp.id ? {
        ...app,
        ...(data.data || {}),
        appointment_time: newAppointmentTime,
        version: (app.version || 1) + 1,
      } : app));
      setRescheduleModalApp(null);
    } catch (err) {
      setRescheduleError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  const openCancelModal = (app) => {
    setCancelReason('');
    setCancelError('');
    setCancelModalApp(app);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalApp) return;
    setCancelError('');

    setCancelSubmitting(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/appointments/${cancelModalApp.id}/cancel`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          cancel_reason: cancelReason.trim(),
          version: cancelModalApp.version || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const firstErr = data.errors ? Object.values(data.errors).flat()[0] : null;
        setCancelError(firstErr || data.message || 'Không thể hủy lịch hẹn.');
        return;
      }

      showToast(data.message || 'Đã hủy lịch hẹn thành công!', 'success');
      setAppointments(prev => prev.map(app => app.id === cancelModalApp.id ? {
        ...app,
        ...(data.data || {}),
        status: 3,
        cancel_reason: cancelReason.trim(),
        version: (app.version || 1) + 1,
      } : app));
      setCancelModalApp(null);
    } catch (err) {
      setCancelError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa lịch hẹn #${id}?`)) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể xóa lịch hẹn.');

      showToast(data.message || 'Đã xóa lịch hẹn thành công!', 'success');
      setAppointments(prev => prev.filter(app => app.id !== id));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 0: return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Chờ xác nhận</span>;
      case 1: return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3" /> Đã xác nhận</span>;
      case 2: return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1 w-max"><ShieldCheck className="w-3 h-3" /> Hoàn thành</span>;
      case 3: return <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center gap-1 w-max"><XCircle className="w-3 h-3" /> Đã hủy</span>;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full relative">
      {toastMsg && (
        <div className={`mx-4 mt-3 px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
          toastMsg.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between bg-slate-50 shrink-0 gap-4">
        <h3 className="font-bold text-slate-800 text-base">Danh sách lịch hẹn</h3>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input 
            type="text" 
            maxLength={250}
            placeholder="Tìm KH hoặc Môi giới..." 
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value.slice(0, 250))}
          />
          <select 
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full sm:w-40"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="0">Chờ xác nhận</option>
            <option value="1">Đã xác nhận</option>
            <option value="2">Hoàn thành</option>
            <option value="3">Đã hủy</option>
          </select>
          <button onClick={fetchAppointments} className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors w-full sm:w-auto">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-5 overflow-y-auto">
        {loading && appointments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-blue-600" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {appointments.map((app) => (
              <div key={app.id} className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col relative overflow-hidden group">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  app.status === 0 ? 'bg-amber-400' : 
                  app.status === 1 ? 'bg-blue-500' : 
                  app.status === 2 ? 'bg-emerald-500' : 'bg-red-500'
                }`} />

                <div className="flex justify-between items-start mb-4">
                  {getStatusBadge(app.status)}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ID: #{app.id}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAppointment(app.id)}
                      className="text-[10px] font-bold text-slate-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                      title="Xóa lịch hẹn"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">
                      {app.property_title}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="line-clamp-1">{app.property_address}</span>
                    </p>
                  </div>

                  <div className="bg-slate-50/50 rounded-lg p-3 space-y-2 border border-slate-100">
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {app.customer_name}
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {app.customer_phone}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/50 p-1.5 rounded">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(app.appointment_time).toLocaleString('vi-VN')}
                    </div>
                  </div>

                  {app.note && (
                    <div className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50 break-all whitespace-pre-wrap">
                      <span className="font-bold text-amber-700">Ghi chú: </span>
                      {app.note}
                    </div>
                  )}

                  {app.status === 3 && app.cancel_reason && (
                    <div className="text-[11px] text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-100 break-all whitespace-pre-wrap">
                      <span className="font-bold">Lý do hủy: </span>
                      {app.cancel_reason}
                    </div>
                  )}
                </div>

                {(app.status === 0 || app.status === 1) && (
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                    {app.status === 0 && (
                      <button 
                        onClick={() => handleConfirm(app.id)}
                        disabled={actionLoading === app.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                      >
                        {actionLoading === app.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                        Xác Nhận
                      </button>
                    )}
                    <button 
                      onClick={() => openRescheduleModal(app)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Đổi Lịch
                    </button>
                    <button 
                      onClick={() => openCancelModal(app)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {app.status === 0 ? 'Từ Chối / Hủy' : 'Hủy Lịch'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL ĐỔI LỊCH HẸN (F03) */}
      {rescheduleModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="font-bold text-slate-900 text-sm">Thay Đổi Thời Gian Lịch Hẹn #{rescheduleModalApp.id}</h4>
              <button onClick={() => setRescheduleModalApp(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p><strong>BĐS:</strong> {rescheduleModalApp.property_title}</p>
                <p><strong>Khách hàng:</strong> {rescheduleModalApp.customer_name}</p>
                <p><strong>Giờ hẹn hiện tại:</strong> {new Date(rescheduleModalApp.appointment_time).toLocaleString('vi-VN')}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày hẹn mới <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giờ mới (08:00 - 20:00) <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              {rescheduleError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {rescheduleError}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalApp(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={rescheduleSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg"
                >
                  {rescheduleSubmitting ? 'Đang lưu...' : 'Lưu Giờ Hẹn Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HỦY / TỪ CHỐI LỊCH HẸN (F04) */}
      {cancelModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="font-bold text-slate-900 text-sm">Hủy / Từ Chối Lịch Hẹn #{cancelModalApp.id}</h4>
              <button onClick={() => setCancelModalApp(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p><strong>BĐS:</strong> {cancelModalApp.property_title}</p>
                <p><strong>Khách hàng:</strong> {cancelModalApp.customer_name}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do hủy lịch hẹn <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    setCancelError('');
                  }}
                  placeholder="Nhập lý do hủy hoặc từ chối lịch hẹn..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              {cancelError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {cancelError}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalApp(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg"
                >
                  {cancelSubmitting ? 'Đang xử lý...' : 'Xác Nhận Hủy Lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
