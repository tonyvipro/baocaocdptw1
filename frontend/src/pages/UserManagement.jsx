import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, Trash2, Plus, X, CheckCircle2, AlertCircle } from 'lucide-react';

const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('3tv_token');
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(url, { ...options, headers });
  if (!res.ok) {
      if (res.status === 404) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Không tìm thấy hoặc đã bị xóa.');
      }
      
      const errorData = await res.json().catch(() => ({}));
      
      if (res.status === 422 && errorData.errors) {
          const firstError = Object.values(errorData.errors)[0][0];
          throw new Error(firstError);
      }
      
      throw new Error(errorData.message || 'Đã có lỗi xảy ra từ máy chủ.');
  }
  return res.json();
};
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, total: 1, from: 0, to: 0, total_records: 0 });
  const [statusMessage, setStatusMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [currentUser, setCurrentUser] = useState(null);
  
  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, userId: null });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: 2,
    is_active: true
  });

  const fetchUsers = async (page = 1, searchQuery = '') => {
    setLoading(true);
    try {
      let url = `/api/users?page=${page}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      
      const res = await apiFetch(url);
      if (res.data) {
        setUsers(res.data);
        setPagination({
          current: res.current_page,
          total: res.last_page,
          from: res.from || 0,
          to: res.to || 0,
          total_records: res.total || 0
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, search);
  }, [search]);

  const showMessage = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const confirmDelete = (id) => {
    setConfirmModal({ isOpen: true, userId: id });
  };

  const executeDelete = async () => {
    const id = confirmModal.userId;
    setConfirmModal({ isOpen: false, userId: null });
    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
      showMessage('success', 'Xóa người dùng thành công.');
      fetchUsers(pagination.current, search);
    } catch (err) {
      const errorMsg = err.message || 'Xóa không hợp lệ! Mục này có thể đã bị xóa trước đó.';
      showMessage('error', errorMsg);
      fetchUsers(pagination.current, search); 
    }
  };

  const cancelDelete = () => {
    setConfirmModal({ isOpen: false, userId: null });
  };

  const handleEditClick = async (id) => {
    try {
        const res = await apiFetch(`/api/users/${id}`);
        setCurrentUser(res);
        setFormData({
            name: res.name,
            email: res.email,
            password: '',
            role_id: res.role_id,
            is_active: res.is_active
        });
        setModalMode('edit');
        setIsModalOpen(true);
    } catch (err) {
        const errorMsg = err.message || 'Sửa không hợp lệ! Mục này có thể đã bị xóa trước đó.';
        showMessage('error', errorMsg);
        fetchUsers(pagination.current, search);
    }
  };

  const handleViewClick = async (id) => {
    try {
        const res = await apiFetch(`/api/users/${id}`);
        setCurrentUser(res);
        setModalMode('view');
        setIsModalOpen(true);
    } catch (err) {
        const errorMsg = err.message || 'Mục này có thể đã bị xóa trước đó.';
        showMessage('error', errorMsg);
        fetchUsers(pagination.current, search);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Đóng form ngay lập tức theo chuẩn thiết kế mới
    setIsModalOpen(false);
    showMessage('success', modalMode === 'add' ? 'Đang thêm người dùng...' : 'Đang cập nhật thông tin...');

    try {
      if (modalMode === 'add') {
        await apiFetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        showMessage('success', 'Thêm người dùng mới thành công.');
      } else if (modalMode === 'edit') {
        const updateData = { ...formData, last_updated_at: currentUser.updated_at };
        if (!updateData.password) delete updateData.password;
        
        await apiFetch(`/api/users/${currentUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData)
        });
        showMessage('success', 'Cập nhật thông tin thành công.');
      }
      fetchUsers(pagination.current, search);
    } catch (err) {
      showMessage('error', err.message || 'Đã có lỗi xảy ra.');
      // Wait for error message to finish showing before re-opening the form
      setTimeout(() => {
        setIsModalOpen(true);
      }, 2500);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
      setFormData({ name: '', email: '', password: '', role_id: 2, is_active: true });
      setModalMode('add');
      setIsModalOpen(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-800">QUẢN LÝ NGƯỜI DÙNG</h1>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-3 shadow-sm transition-all duration-300 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
            : 'bg-red-50 text-red-800 border border-red-100'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Tìm kiếm người dùng..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
          />
        </div>
        <button 
          onClick={openAddModal}
          className="w-full md:w-auto px-6 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 uppercase text-sm"
        >
           THÊM NGƯỜI DÙNG MỚI
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-semibold text-slate-700">Danh sách Người dùng</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm font-medium text-slate-500 bg-white">
                <th className="p-4 py-3">Tên Người dùng</th>
                <th className="p-4 py-3">Vai trò</th>
                <th className="p-4 py-3">Căn hộ/Đơn vị</th>
                <th className="p-4 py-3">Trạng thái</th>
                <th className="p-4 py-3">Ngày tham gia</th>
                <th className="p-4 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">Không tìm thấy người dùng nào.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 max-w-[200px] md:max-w-[300px] break-words whitespace-normal">
                        <div className="line-clamp-2" title={user.name}>
                            {user.name?.length > 100 ? user.name.substring(0, 100) + '...' : user.name}
                        </div>
                    </td>
                    <td className="p-4">{user.role?.name || 'Người thuê'}</td>
                    <td className="p-4">{user.unit || 'A101'}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-md text-xs font-medium whitespace-nowrap">
                        {user.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3 text-slate-400 min-w-[80px]">
                        <button onClick={() => handleViewClick(user.id)} className="hover:text-blue-600 transition-colors" title="Xem chi tiết"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleEditClick(user.id)} className="hover:text-amber-600 transition-colors" title="Chỉnh sửa"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => confirmDelete(user.id)} className="hover:text-red-600 transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 text-sm text-slate-600 bg-white">
          <div>
            Hiển thị {pagination.from}-{pagination.to} trong tổng số {pagination.total_records} người dùng
          </div>
          <div className="flex gap-1 mt-3 sm:mt-0">
            {Array.from({ length: pagination.total }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => fetchUsers(page, search)}
                className={`w-8 h-8 flex items-center justify-center rounded-md ${
                  pagination.current === page 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-transparent hover:bg-slate-100 text-slate-700'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-lg text-slate-800 uppercase">
                {modalMode === 'add' ? 'Thêm Người Dùng' : modalMode === 'edit' ? 'Chỉnh Sửa Người Dùng' : 'Chi Tiết Người Dùng'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              {modalMode === 'view' && currentUser ? (
                <div className="space-y-4">
                  <div><label className="text-xs font-semibold text-slate-500 uppercase">Tên người dùng</label><p className="text-slate-800">{currentUser.name}</p></div>
                  <div><label className="text-xs font-semibold text-slate-500 uppercase">Email</label><p className="text-slate-800">{currentUser.email}</p></div>
                  <div><label className="text-xs font-semibold text-slate-500 uppercase">Vai trò</label><p className="text-slate-800">{currentUser.role?.name || 'Người thuê'}</p></div>
                  <div><label className="text-xs font-semibold text-slate-500 uppercase">Đơn vị</label><p className="text-slate-800">{currentUser.unit || 'A101'}</p></div>
                  <div><label className="text-xs font-semibold text-slate-500 uppercase">Ngày tham gia</label><p className="text-slate-800">{new Date(currentUser.created_at).toLocaleDateString('vi-VN')}</p></div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tên người dùng</label>
                      <input type="text" maxLength={100} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input type="email" maxLength={100} required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu {modalMode === 'edit' && <span className="text-slate-400 text-xs font-normal">(Bỏ trống nếu không đổi)</span>}</label>
                      <input type="password" required={modalMode === 'add'} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò</label>
                      <select value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800">
                          <option value="1">Admin</option>
                          <option value="2">Người thuê</option>
                          <option value="3">Chủ nhà</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                    <input type="checkbox" id="isActive" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded text-slate-800 w-4 h-4" />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">Đang hoạt động</label>
                  </div>
                  
                  <div className="pt-4 flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Hủy</button>
                    <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center min-w-[100px]">
                      {loading ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Delete Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-1">3TVLAND thông báo</h3>
              <p className="text-slate-600 text-sm">Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="p-4 bg-slate-50 flex justify-center gap-3 border-t border-slate-100">
              <button onClick={cancelDelete} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-white border border-slate-300 rounded-lg transition-colors">Hủy bỏ</button>
              <button onClick={executeDelete} className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm">Đồng ý Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
