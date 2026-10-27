import PropertyImage from './properties/PropertyImage';
import React, { useState, useEffect } from 'react';
import { 
  X, Building2, MapPin, Edit, Trash2, Eye, Calendar, PlusCircle, 
  AlertTriangle, RefreshCw, CheckCircle2, Clock, XCircle, Info, CalendarPlus, Sparkles, SlidersHorizontal, Tag 
} from 'lucide-react';
import ExtendListingModal from './ExtendListingModal';
import ChangePropertyStatusModal from './ChangePropertyStatusModal';

export default function UserListingsModal({ isOpen, onClose, currentUser, onOpenPostProperty }) {
  const [myProperties, setMyProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('approved'); // Mặc định hiển thị tin đã được duyệt
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [extendingProperty, setExtendingProperty] = useState(null);
  const [statusManagingProperty, setStatusManagingProperty] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchMyProperties = async () => {
    let user = currentUser;
    if (!user) {
      try {
        const saved = localStorage.getItem('3tv_user');
        if (saved) user = JSON.parse(saved);
      } catch (e) {}
    }

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ all: 'true' });
      if (user.id) params.append('user_id', user.id);
      if (user.phone) params.append('user_phone', user.phone);
      if (user.name) params.append('user_name', user.name);

      const token = localStorage.getItem('3tv_token');
      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/properties?${params.toString()}`, { headers });
      if (!res.ok) throw new Error('Không thể tải danh sách tin đăng');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setMyProperties(list);
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

  const handleExtendSuccess = (updatedProperty, message) => {
    setMyProperties(prev => prev.map(p => p.id === updatedProperty.id ? { ...p, ...updatedProperty } : p));
    if (selectedDetail && selectedDetail.id === updatedProperty.id) {
      setSelectedDetail(prev => ({ ...prev, ...updatedProperty }));
    }
    setToastMessage(message || 'Gia hạn tin đăng thành công!');
    setTimeout(() => setToastMessage(null), 4500);
  };

  const getRemainingDays = (expireDate) => {
    if (!expireDate) return null;
    const diff = new Date(expireDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  // Filter properties based on tab (dùng Number() để tương thích kiểu dữ liệu)
  const approvedCount = myProperties.filter(p => Number(p.status) === 1).length;
  const soldCount = myProperties.filter(p => Number(p.status) === 2).length;
  const pendingCount = myProperties.filter(p => Number(p.status) === 0).length;
  const expiredCount = myProperties.filter(p => Number(p.status) === 3).length;
  const hiddenCount = myProperties.filter(p => Number(p.status) === 4).length;

  const displayedProperties = myProperties.filter(p => {
    if (filterStatus === 'approved') return Number(p.status) === 1;
    if (filterStatus === 'sold') return Number(p.status) === 2;
    if (filterStatus === 'pending') return Number(p.status) === 0;
    if (filterStatus === 'expired') return Number(p.status) === 3;
    if (filterStatus === 'hidden') return Number(p.status) === 4;
    return true;
  });

  return (
    <div className="app-dialog-layer fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="form-surface bg-slate-50 rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200/60 overflow-hidden my-8 animate-fadeIn flex flex-col max-h-[90vh]">
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
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="bg-white px-6 py-2.5 border-b border-slate-200 flex items-center justify-between gap-3 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('approved')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'approved'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã duyệt & Đang hiển thị ({approvedCount})
            </button>

            {soldCount > 0 && (
              <button
                onClick={() => setFilterStatus('sold')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'sold'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                Đã giao dịch ({soldCount})
              </button>
            )}

            <button
              onClick={() => setFilterStatus('pending')}
              className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Chờ Admin duyệt ({pendingCount})
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => setFilterStatus('expired')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'expired'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Hết hạn & Cần gia hạn ({expiredCount})
              {expiredCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-black animate-pulse">
                  Mới
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tất cả tin ({myProperties.length})
            </button>

            {hiddenCount > 0 && (
              <button
                onClick={() => setFilterStatus('hidden')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'hidden'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                Đã ẩn / Từ chối ({hiddenCount})
              </button>
            )}
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="mx-6 mt-3 p-3 bg-emerald-600 text-white text-xs font-bold rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-600/20 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Notice for Pending approval */}
        {filterStatus === 'pending' && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Lưu ý:</strong> Tin đăng mới gửi đang được Ban Quản Trị (Admin) thẩm định nội dung. Sau khi Admin phê duyệt, tin sẽ tự động hiển thị trong mục <strong>"Đã duyệt & Đang hiển thị"</strong> và trên trang chủ.
            </span>
          </div>
        )}

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
          ) : displayedProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {filterStatus === 'approved' 
                  ? 'Chưa có tin đăng nào được duyệt' 
                  : filterStatus === 'pending'
                  ? 'Không có tin đăng nào đang chờ duyệt'
                  : 'Bạn chưa có tin đăng nào'}
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-sm">
                {filterStatus === 'approved' && pendingCount > 0
                  ? `Bạn đang có ${pendingCount} tin đăng đang chờ Admin phê duyệt.`
                  : 'Hãy đăng tin bất động sản đầu tiên của bạn để tiếp cận hàng ngàn khách hàng tiềm năng.'}
              </p>
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
                      <th className="py-4 px-4 min-w-[220px]">Thông tin Bất Động Sản</th>
                      <th className="py-4 px-4 min-w-[120px]">Loại & Diện tích</th>
                      <th className="py-4 px-4 min-w-[110px]">Mức Giá</th>
                      <th className="py-4 px-4 min-w-[110px]">Trạng Thái</th>
                      <th className="py-4 px-4 min-w-[200px]">Lý Do Từ Chối</th>
                      <th className="py-4 px-4 text-right min-w-[110px]">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedProperties.map(property => (
                      <tr key={property.id} className="hover:bg-blue-50/40 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-200 relative">
                            {property.images && property.images.length > 0 ? (
                              <PropertyImage src={property.images[0].image_url} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-slate-300" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div 
                            onClick={() => setSelectedDetail(property)}
                            className="font-bold text-slate-800 text-[13px] line-clamp-1 hover:text-blue-600 cursor-pointer transition-colors"
                          >
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

                        {/* Status Column */}
                        <td className="py-3 px-4">
                          {(() => {
                            const daysLeft = getRemainingDays(property.expire_date);
                            const isStatusExpired = Number(property.status) === 3 || (daysLeft !== null && daysLeft <= 0 && Number(property.status) !== 0 && Number(property.status) !== 4);

                            if (Number(property.status) === 1 && !isStatusExpired) {
                              return (
                                <div>
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-300 font-bold text-[10px] tracking-wide uppercase">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span> Đang hiển thị
                                  </span>
                                  {property.expire_date && (
                                    <div className="mt-1 text-[10px] font-medium text-slate-500 flex items-center gap-1">
                                      {daysLeft <= 5 ? (
                                        <span className="text-amber-600 font-bold flex items-center gap-0.5">
                                          <Clock className="w-3 h-3" /> Còn {daysLeft} ngày
                                        </span>
                                      ) : (
                                        <span>Hạn: {formatDate(property.expire_date)}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            } else if (Number(property.status) === 2) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-300 font-bold text-[10px] tracking-wide uppercase">
                                  <Tag className="w-3 h-3 text-blue-600" /> Đã giao dịch
                                </span>
                              );
                            } else if (Number(property.status) === 0) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-300 font-bold text-[10px] tracking-wide uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse"></span> Chờ Admin duyệt
                                </span>
                              );
                            } else if (isStatusExpired) {
                              return (
                                <div>
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-300 font-bold text-[10px] tracking-wide uppercase">
                                    <Calendar className="w-3 h-3 text-purple-600" /> Hết hạn tin
                                  </span>
                                  <div className="mt-1">
                                    <button
                                      type="button"
                                      onClick={() => setExtendingProperty(property)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[10px] font-extrabold shadow-xs transition-all cursor-pointer"
                                    >
                                      <CalendarPlus className="w-3 h-3" /> Gia hạn ngay
                                    </button>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-300 font-bold text-[10px] tracking-wide uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span> Đã từ chối
                                </span>
                              );
                            }
                          })()}
                        </td>

                        {/* Rejection Reason or Note Column */}
                        <td className="py-3 px-4">
                          {Number(property.status) === 4 ? (
                            <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                              <span className="font-bold leading-relaxed">
                                {property.rejection_reason || 'Không đạt tiêu chuẩn kiểm duyệt của ban quản trị.'}
                              </span>
                            </div>
                          ) : Number(property.status) === 2 ? (
                            <div className="text-[11px] text-blue-800 bg-blue-50/70 p-2 rounded-lg border border-blue-200 font-medium">
                              Đã hoàn tất giao dịch. {property.rejection_reason && <span>(Ghi chú: {property.rejection_reason})</span>}
                            </div>
                          ) : Number(property.status) === 0 ? (
                            <span className="text-amber-600 font-medium text-[11px] italic flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Đang chờ duyệt
                            </span>
                          ) : Number(property.status) === 3 ? (
                            <div className="text-[11px] text-purple-800 bg-purple-50/70 p-2 rounded-lg border border-purple-200 font-medium">
                              Tin đã hết thời hạn hiển thị. Bấm <strong>Gia hạn ngay</strong> để tiếp tục hiển thị trên sàn.
                            </div>
                          ) : (
                            <span className="text-emerald-600 font-medium text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đang hoạt động bình thường
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                            {/* Nút Quản lý trạng thái */}
                            <button 
                              onClick={() => setStatusManagingProperty(property)}
                              className="w-7 h-7 rounded bg-blue-50 border border-blue-200 text-blue-600 hover:text-white hover:bg-blue-600 hover:border-blue-600 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                              title="Đổi trạng thái tin / Xem lịch sử"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                            {/* Nút Gia hạn tin */}
                            <button 
                              onClick={() => setExtendingProperty(property)}
                              className="w-7 h-7 rounded bg-purple-50 border border-purple-200 text-purple-600 hover:text-white hover:bg-purple-600 hover:border-purple-600 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                              title="Gia hạn thời gian hiển thị tin"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => setSelectedDetail(property)}
                              className="w-7 h-7 rounded bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              className="w-7 h-7 rounded bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                              title="Sửa tin"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(property.id)}
                              className="w-7 h-7 rounded bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
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

        {/* Detail Inspection Modal for User */}
        {selectedDetail && (
          <div className="app-dialog-layer fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="form-surface bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-fadeIn border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {selectedDetail.code || `#BDS-${selectedDetail.id}`}
                  </span>
                  <h3 className="font-black text-slate-800 text-sm truncate max-w-xs">{selectedDetail.title}</h3>
                </div>
                <button onClick={() => setSelectedDetail(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status and rejection reason banner */}
              {selectedDetail.status === 4 && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Lý do tin bị từ chối / đã ẩn:</span>
                  </div>
                  <p className="text-xs text-rose-800 font-medium pl-5 leading-relaxed">
                    {selectedDetail.rejection_reason || 'Không đạt tiêu chuẩn kiểm duyệt của ban quản trị.'}
                  </p>
                </div>
              )}

              {selectedDetail.status === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-800">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Tin đang chờ Ban Quản Trị (Admin) thẩm định nội dung trước khi duyệt hiển thị.</span>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Mức giá</span>
                  <strong className="text-red-600 font-black">{selectedDetail.price_formatted || `${selectedDetail.price} VNĐ`}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Diện tích</span>
                  <strong className="text-slate-800 font-bold">{selectedDetail.area} m²</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                  <span className="text-slate-400 block text-[10px]">Địa chỉ</span>
                  <span className="text-slate-700 font-medium">{selectedDetail.address}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const prop = selectedDetail;
                      setSelectedDetail(null);
                      setStatusManagingProperty(prop);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Đổi trạng thái
                  </button>
                  <button
                    onClick={() => {
                      const prop = selectedDetail;
                      setSelectedDetail(null);
                      setExtendingProperty(prop);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 cursor-pointer transition-all"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" /> Gia hạn tin
                  </button>
                </div>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Extend Listing Modal */}
        {extendingProperty && (
          <ExtendListingModal
            isOpen={Boolean(extendingProperty)}
            onClose={() => setExtendingProperty(null)}
            property={extendingProperty}
            onSuccess={handleExtendSuccess}
          />
        )}

        {/* Change Status Modal */}
        {statusManagingProperty && (
          <ChangePropertyStatusModal
            isOpen={Boolean(statusManagingProperty)}
            onClose={() => setStatusManagingProperty(null)}
            property={statusManagingProperty}
            currentUser={currentUser}
            onSuccess={(updatedProp, message) => {
              setMyProperties(prev => prev.map(p => p.id === updatedProp.id ? { ...p, ...updatedProp } : p));
              if (selectedDetail && selectedDetail.id === updatedProp.id) {
                setSelectedDetail(prev => ({ ...prev, ...updatedProp }));
              }
              setToastMessage(message || 'Cập nhật trạng thái thành công!');
              setTimeout(() => setToastMessage(null), 4500);
            }}
          />
        )}

      </div>
    </div>
  );
}
