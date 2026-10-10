import React, { useState } from 'react';
import { X, Plus, AlertTriangle, Building2, Save, CheckCircle2 } from 'lucide-react';

export default function PostPropertyModal({ isOpen, onClose, currentUser }) {
  const [formData, setFormData] = useState({
    title: '',
    purpose: 'sale',
    type: 'Căn hộ cao cấp',
    price: '',
    area: '',
    bedrooms: '2',
    bathrooms: '2',
    floors: '1',
    direction: 'Đông Nam',
    legal_status: 'Sổ hồng',
    build_year: '2024',
    address: '',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    street: '',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
    owner_name: currentUser?.name || 'Chủ nhà',
    owner_phone: currentUser?.phone || '0901234567',
    description: '',
    amenities: ['Hồ bơi', 'Phòng gym', 'Bảo vệ 24/7', 'Thang máy']
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const availableAmenities = [
    'Hồ bơi', 'Phòng gym', 'Bảo vệ 24/7', 'Thang máy', 
    'Công viên', 'Khu BBQ', 'Sân tennis', 'Chỗ đậu ô tô', 
    'Siêu thị mini', 'Khu vui chơi trẻ em'
  ];

  if (!isOpen) return null;

  const handleToggleAmenity = (item) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(item)
        ? prev.amenities.filter(a => a !== item)
        : [...prev.amenities, item]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề tin đăng.');
      return;
    }
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      setError('Vui lòng nhập giá trị tài sản hợp lệ.');
      return;
    }
    if (!formData.area || isNaN(formData.area) || Number(formData.area) <= 0) {
      setError('Vui lòng nhập diện tích hợp lệ.');
      return;
    }
    if (!formData.address.trim()) {
      setError('Vui lòng nhập địa chỉ chi tiết.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        area: Number(formData.area),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        floors: Number(formData.floors),
        build_year: Number(formData.build_year),
        status: isDraft ? 0 : 1 // Chờ duyệt hoặc Hiện luôn
      };

      const token = localStorage.getItem('3tv_token') || '';
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch('/api/properties', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        res = await fetch('http://localhost:8080/api/properties', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi tạo bất động sản.');

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200/60 overflow-hidden my-8 animate-fadeIn">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide">ĐĂNG TIN BẤT ĐỘNG SẢN</h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Tiếp cận hàng ngàn khách hàng tiềm năng</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-red-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 bg-slate-50/50">
          {success ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Đăng tin thành công!</h3>
              <p className="text-sm text-slate-500">Tin đăng của bạn đã được gửi lên hệ thống.</p>
            </div>
          ) : (
            <form className="space-y-6 text-xs" onSubmit={(e) => handleSubmit(e, false)}>
              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-700 font-semibold flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Hàng 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2 space-y-2">
                  <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Tiêu đề tin (*):</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ví dụ: Bán căn hộ 3PN Vinhomes view sông cực đẹp..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 font-medium transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Mục đích (*):</label>
                  <select
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 font-medium transition-all shadow-sm"
                  >
                    <option value="sale">Bán</option>
                    <option value="rent">Cho thuê</option>
                    <option value="project">Dự án mới</option>
                  </select>
                </div>
              </div>

              {/* Hàng 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Loại bất động sản (*):</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 font-medium transition-all shadow-sm"
                  >
                    <option value="Căn hộ cao cấp">Căn hộ cao cấp</option>
                    <option value="Nhà phố liền kề">Nhà phố liền kề</option>
                    <option value="Biệt thự đơn lập">Biệt thự đơn lập</option>
                    <option value="Shophouse thương mại">Shophouse thương mại</option>
                    <option value="Đất nền dự án">Đất nền dự án</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Giá tài sản (* VNĐ):</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="VD: 3500000000 (3.5 tỷ)"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 font-medium font-mono text-red-600 transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Diện tích (* m²):</label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="VD: 85"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 font-medium font-mono transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Hàng 4: Địa chỉ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Địa chỉ chi tiết (*):</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="VD: 208 Nguyễn Hữu Cảnh"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 font-medium transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Tỉnh / Thành phố:</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 font-medium transition-all shadow-sm"
                  >
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="TP. Hà Nội">TP. Hà Nội</option>
                    <option value="TP. Đà Nẵng">TP. Đà Nẵng</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Quận / Huyện:</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="VD: Quận Bình Thạnh"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 font-medium transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Hàng 5: Tiện ích */}
              <div className="space-y-3">
                <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Tiện ích nổi bật:</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {availableAmenities.map(am => (
                    <label 
                      key={am} 
                      className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer select-none transition-all shadow-sm ${
                        formData.amenities.includes(am)
                          ? 'border-red-500 bg-red-50 text-red-700 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(am)}
                        onChange={() => handleToggleAmenity(am)}
                        className="rounded text-red-600 focus:ring-0 cursor-pointer"
                      />
                      <span>{am}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Hàng 6: Ảnh & Thông tin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Link Hình Ảnh:</label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Số điện thoại liên hệ:</label>
                  <input
                    type="text"
                    name="owner_phone"
                    value={formData.owner_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 font-bold font-mono transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200/60 mt-8">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Lưu Nháp
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl border border-red-600 bg-red-600 text-white hover:bg-red-700 font-bold flex items-center gap-2 transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {loading ? 'Đang Xử Lý...' : 'Đăng Tin Ngay'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
