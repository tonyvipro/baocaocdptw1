import React, { useState } from 'react';
import { X, Bed, Bath, Maximize2, MapPin, ShieldCheck, Calendar, Phone, CheckCircle2, DollarSign, Layers, Share2, Heart, Sparkles, Building2 } from 'lucide-react';

export default function PropertyModal({ property, onClose, isFavorite, onToggleFavorite, onOpenContact }) {
  const [copied, setCopied] = useState(false);
  if (!property) return null;

  const isRent = property.purpose === 'rent';

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-xl text-xs font-bold text-white ${isRent ? 'bg-emerald-600' : 'bg-blue-600'}`}>
              {isRent ? 'CHO THUÊ' : 'BÁN / CHUYỂN NHƯỢNG'}
            </span>
            <span className="text-xs font-mono text-slate-500 font-semibold">Mã: #{property.code}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              title="Sao chép link chia sẻ"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleFavorite(property)}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
              title="Yêu thích"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          
          {/* Main Hero Image & Basic Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Image Preview */}
            <div className="lg:col-span-7 relative h-72 lg:h-96 rounded-2xl overflow-hidden shadow-inner bg-slate-100">
              <img
                src={property.image}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 flex gap-2">
                <span className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-bold">
                  {property.developer}
                </span>
                <span className="px-3 py-1 rounded-lg bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold">
                  {property.project}
                </span>
              </div>
            </div>

            {/* Quick Pricing & Specs */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 leading-snug mb-3">
                  {property.title}
                </h2>
                
                <p className="flex items-start gap-1.5 text-xs text-slate-500 mb-4">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{property.street}, {property.district}, {property.city}</span>
                </p>

                {/* Price Block */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 mb-4">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {isRent ? 'Mức Giá Thuê' : 'Mức Giá Bán Niêm Yết'}
                  </p>
                  <p className="text-3xl font-black text-emerald-700 mt-1">
                    {isRent ? property.price_rent_text : property.price_sale_text}
                  </p>
                  {property.unit_price && (
                    <p className="text-xs text-emerald-900/70 mt-0.5 font-medium">Đơn giá: {property.unit_price}</p>
                  )}
                  {property.deposit_text && (
                    <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-emerald-200/60 font-semibold">
                      Tiền cọc: <span className="text-slate-900 font-bold">{property.deposit_text}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Owner / Contact fast block */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Chuyên Viên Tư Vấn Trực Tiếp</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{property.owner_name || 'Nguyễn Hoàng Nam'}</p>
                    <p className="text-xs text-slate-500">Chuyên viên BĐS cao cấp 3TV</p>
                  </div>
                  <a
                    href={`tel:${property.owner_phone || '0912888777'}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{property.owner_phone || '0912.888.777'}</span>
                  </a>
                </div>
              </div>

            </div>

          </div>

          {/* Key Specifications Grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" /> Thông Số Kỹ Thuật & Chi Tiết
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5 text-emerald-600" /> Diện tích</span>
                <p className="text-base font-black text-slate-800 mt-1">{property.area} m²</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1"><Bed className="w-3.5 h-3.5 text-emerald-600" /> Phòng ngủ</span>
                <p className="text-base font-black text-slate-800 mt-1">{property.bedrooms} Phòng</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1"><Bath className="w-3.5 h-3.5 text-emerald-600" /> Phòng tắm / WC</span>
                <p className="text-base font-black text-slate-800 mt-1">{property.bathrooms} Phòng</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Tình trạng pháp lý</span>
                <p className="text-xs font-bold text-slate-800 mt-1 truncate" title={property.legal}>{property.legal || 'Đầy đủ sổ hồng'}</p>
              </div>
            </div>
          </div>

          {/* Detailed Specifications List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div className="space-y-2.5">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Chủ đầu tư:</span>
                <span className="text-slate-900 font-bold">{property.developer}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Dự án:</span>
                <span className="text-slate-900 font-bold">{property.project}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Loại hình BĐS:</span>
                <span className="text-slate-900 font-bold">{property.type || 'Căn hộ cao cấp'}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Phí quản lý:</span>
                <span className="text-slate-900 font-bold">{property.management_fee || 'Theo quy định CĐT'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Thời gian bàn giao:</span>
                <span className="text-slate-900 font-bold">{property.available_date || 'Dọn vào ở ngay'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Thời hạn hợp đồng:</span>
                <span className="text-slate-900 font-bold">{property.rent_period_min || 'Linh hoạt'}</span>
              </div>
            </div>
          </div>

          {/* Furniture & Description */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> Tình Trạng Nội Thất & Trang Bị
            </h3>
            <p className="text-sm text-slate-700 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/80 leading-relaxed font-medium">
              {property.furniture || 'Đầy đủ trang thiết bị nội thất cao cấp chuẩn quốc tế, máy lạnh Inverter, thiết bị vệ sinh cao cấp.'}
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {copied && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg">
              ✓ Đã sao chép liên kết vào bộ nhớ tạm!
            </span>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all"
            >
              Đóng lại
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenContact(property);
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
            >
              Đặt Lịch Xem Nhà Ngay
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
