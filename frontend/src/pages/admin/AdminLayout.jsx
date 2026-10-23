import React, { useState, useEffect } from 'react';
import { 
  Building2, Calendar, Users, LayoutDashboard, 
  Settings, LogOut, Menu, X, ArrowLeft, RefreshCw, CheckCircle, ShieldCheck, XCircle, User, Phone, MapPin, FileText, Clock, BarChart3, SlidersHorizontal, Layers, KeyRound, UserCheck, FolderOpen, Receipt
} from 'lucide-react';
import ContractsManager from './ContractsManager';
import ContractDocumentsManager from './ContractDocumentsManager';
import InvoicesManager from './InvoicesManager';
import InvoiceDetailPage from './InvoiceDetailPage';
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
      { id: 'users', label: 'Quản lý Người Dùng', icon: Users, roles: [1] }, // Chỉ admin
      { id: 'roles', label: 'Gán vai trò (Phân quyền)', icon: KeyRound, roles: [1] }, // Chuẩn Hình 11
      { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings, roles: [1] }, // Chỉ admin
      { id: 'reports', label: 'Báo cáo thống kê', icon: BarChart3, roles: [1] }, // Chỉ admin
    ];

    return items.filter(item => item.roles.includes(currentUser?.role_id));
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      
      {/* Sidebar Mobile Overlay */}
      {!sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out
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
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">
            Menu Quản Lý
          </div>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleSelectMenu(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeMenu === item.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${activeMenu === item.id ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10 shadow-sm shrink-0">
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
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
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
          {activeMenu === 'users' && <UserManagement />}
          {activeMenu === 'roles' && <RoleAssignment onNavigateToDashboard={() => handleSelectMenu('dashboard')} />}
          {activeMenu === 'reports' && <StatisticalReport />}
          {activeMenu !== 'demands' && activeMenu !== 'notifications' && activeMenu !== 'dashboard' && activeMenu !== 'categories' && activeMenu !== 'brokers' && activeMenu !== 'customers' && activeMenu !== 'approvals' && activeMenu !== 'listing-status' && activeMenu !== 'property-types' && activeMenu !== 'properties' && activeMenu !== 'appointments' && activeMenu !== 'contracts' && activeMenu !== 'contract-documents' && activeMenu !== 'invoices' && activeMenu !== 'users' && activeMenu !== 'roles' && activeMenu !== 'reports' && (
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
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
    if (!window.confirm('Xác nhận duyệt lịch hẹn này?')) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch(`/api/appointments/${id}/confirm`, {
        method: 'PATCH',
        headers
      });
      if (!res.ok) {
        res = await fetch(`http://localhost:8080/api/appointments/${id}/confirm`, {
          method: 'PATCH',
          headers
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi không xác định.');
      alert(data.message || 'Xác nhận thành công!');
      setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: 1 } : app));
    } catch (err) {
      alert(`[LỖI]: ${err.message}`);
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
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
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ID: #{app.id}</span>
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
                    <div className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50">
                      <span className="font-bold text-amber-700">Ghi chú: </span>
                      {app.note}
                    </div>
                  )}
                </div>

                {app.status === 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleConfirm(app.id)}
                      disabled={actionLoading === app.id}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                    >
                      {actionLoading === app.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                      Xác Nhận
                    </button>
                    <button 
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Từ Chối
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
