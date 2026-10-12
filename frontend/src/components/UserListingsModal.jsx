import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Edit, Trash2, Eye, Calendar, PlusCircle, AlertTriangle, RefreshCw, CheckCircle2, Clock, XCircle, Info } from 'lucide-react';

export default function UserListingsModal({ isOpen, onClose, currentUser, onOpenPostProperty }) {
  const [myProperties, setMyProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('approved'); // Mặc định hiển thị tin đã được duyệt
  const [selectedDetail, setSelectedDetail] = useState(null);

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

  // Filter properties based on tab
  const approvedCount = myProperties.filter(p => p.status === 1).length;
  const pendingCount = myProperties.filter(p => p.status === 0).length;
  const hiddenCount = myProperties.filter(p => p.status === 4).length;

  const displayedProperties = myProperties.filter(p => {
    if (filterStatus === 'approved') return p.status === 1;
    if (filterStatus === 'pending') return p.status === 0;
    if (filterStatus === 'hidden') return p.status === 4;
    return true;
  });

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
                              <img src={property.images[0].image_url} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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
                          {property.status === 1 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-300 font-bold text-[10px] tracking-wide uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span> Hiển thị
                            </span>
                          ) : property.status === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-300 font-bold text-[10px] tracking-wide uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse"></span> Chờ Admin duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-300 font-bold text-[10px] tracking-wide uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span> Đã từ chối
                            </span>
                          )}
                        </td>

                        {/* Rejection Reason Column */}
                        <td className="py-3 px-4">
                          {property.status === 4 ? (
                            <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                              <span className="font-bold leading-relaxed">
                                {property.rejection_reason || 'Không đạt tiêu chuẩn kiểm duyệt của ban quản trị.'}
                              </span>
                            </div>
                          ) : property.status === 0 ? (
                            <span className="text-amber-600 font-medium text-[11px] italic flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Đang chờ duyệt
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã thông qua
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-fadeIn border border-slate-100">
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

              <div className="flex justify-end pt-2">
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

      </div>
    </div>
  );
}
