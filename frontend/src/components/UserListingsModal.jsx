import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Edit, Trash2, Eye, Calendar, PlusCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function UserListingsModal({ isOpen, onClose, currentUser, onOpenPostProperty }) {
  const [myProperties, setMyProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyProperties = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/properties?user_id=${currentUser.id}&all=true`);
      if (!res.ok) throw new Error('Không thể tải danh sách tin đăng');
      const data = await res.json();
      setMyProperties(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyProperties();
    }
  }, [isOpen, currentUser]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin đăng này?')) return;
    try {
      const token = localStorage.getItem('3tv_token');
      const res = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMyProperties(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      alert('Lỗi khi xóa tin: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-50 rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200/60 overflow-hidden my-8 animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-wide">QUẢN LÝ TIN ĐĂNG</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Quản lý các bất động sản bạn đã đăng</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenPostProperty();
              }}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-red-600/30"
            >
              <PlusCircle className="w-4 h-4" /> Đăng Tin Mới
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-4 text-blue-500" />
              <p className="font-semibold text-sm">Đang tải danh sách tin đăng...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5" /> {error}
            </div>
          ) : myProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Bạn chưa có tin đăng nào</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-sm">Hãy đăng tin bất động sản đầu tiên của bạn để tiếp cận hàng ngàn khách hàng tiềm năng.</p>
              <button
                onClick={() => {
                  onClose();
                  onOpenPostProperty();
                }}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-600/30"
              >
                <PlusCircle className="w-5 h-5" /> Bắt đầu đăng tin
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black text-[10px] tracking-widest">
                      <th className="py-4 px-4 w-20">Ảnh</th>
                      <th className="py-4 px-4 min-w-[250px]">Thông tin Bất Động Sản</th>
                      <th className="py-4 px-4 min-w-[130px]">Loại & Diện tích</th>
                      <th className="py-4 px-4 min-w-[120px]">Mức Giá</th>
                      <th className="py-4 px-4 min-w-[100px]">Trạng Thái</th>
                      <th className="py-4 px-4 text-right min-w-[120px]">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myProperties.map(property => (
                      <tr key={property.id} className="hover:bg-blue-50/40 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-200 relative">
                            {property.images && property.images.length > 0 ? (
                              <img src={property.images[0].image_url} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-slate-300" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 text-[13px] line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {property.title}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                            <MapPin className="w-3 h-3 shrink-0 text-red-500" />
                            <span className="line-clamp-1 truncate text-[11px] font-medium">{property.address}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-700">{property.type}</div>
                          <div className="text-slate-500 mt-0.5 text-[11px]">{property.area} m²</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500 text-[13px]">
                            {property.price_formatted}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">
                            {property.purpose === 'rent' ? 'Cho thuê' : 'Bán'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {property.status === 1 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded border border-emerald-200/50 font-bold text-[10px] tracking-wide uppercase">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div> Hiển thị
                            </span>
                          ) : property.status === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded border border-amber-200/50 font-bold text-[10px] tracking-wide uppercase">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></div> Chờ duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 rounded border border-slate-200 font-bold text-[10px] tracking-wide uppercase">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></div> Đã ẩn
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="w-7 h-7 rounded bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 flex items-center justify-center transition-colors shadow-sm"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              className="w-7 h-7 rounded bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 flex items-center justify-center transition-colors shadow-sm"
                              title="Sửa tin"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(property.id)}
                              className="w-7 h-7 rounded bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 flex items-center justify-center transition-colors shadow-sm"
                              title="Xóa tin"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
