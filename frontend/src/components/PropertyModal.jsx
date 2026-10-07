import React, { useState } from 'react';
import { 
  X, Bed, Bath, Maximize2, MapPin, ShieldCheck, Phone, CheckCircle, 
  Share2, Heart, Building2, Calendar, FileText, ChevronRight, UserCheck
} from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden my-6 border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-hidden truncate">
            <span>Trang chủ</span>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{isRent ? 'Nhà đất cho thuê' : 'Nhà đất bán'}</span>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-800 truncate">{property.project}</span>
            <span className="text-slate-400 font-mono text-[11px]">#{property.code}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              title="Chia sẻ liên kết"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleFavorite(property)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Lưu tin đăng"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-600 text-red-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
          
          {/* Top Gallery & Quick Pricing Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Main Photo Gallery */}
            <div className="lg:col-span-7 relative h-64 sm:h-80 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={property.image}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-bold text-white shadow-xs ${
                  isRent ? 'bg-blue-600' : 'bg-red-600'
                }`}>
                  {isRent ? 'CHO THUÊ' : 'BÁN / CHUYỂN NHƯỢNG'}
                </span>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded backdrop-blur-xs font-medium">
                {property.developer} • {property.project}
              </div>
            </div>

            {/* Quick Details & Price Block */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug mb-2">
                  {property.title}
                </h1>
                
                <p className="flex items-start gap-1 text-xs text-slate-600 mb-4">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{property.street}, {property.district}, {property.city}</span>
                </p>

                {/* Price Box */}
                <div className="p-3.5 rounded-lg bg-red-50/70 border border-red-100 mb-3">
                  <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider block">
                    {isRent ? 'Mức giá thuê niêm yết' : 'Mức giá bán niêm yết'}
                  </span>
                  <p className="text-2xl font-black text-red-600 mt-0.5">
                    {isRent ? property.price_rent_text : property.price_sale_text}
                  </p>
                  {property.unit_price && (
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">Đơn giá: {property.unit_price}</p>
                  )}
                  {property.deposit_text && (
                    <p className="text-xs text-slate-700 mt-2 pt-2 border-t border-red-200/50">
                      Tiền đặt cọc: <strong className="text-slate-900">{property.deposit_text}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Agent Contact Box */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">Môi giới phụ trách tin đăng</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>{property.owner_name || 'Nguyễn Hoàng Nam'}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">Chuyên viên tư vấn dự án</p>
                  </div>
                  <a
                    href={`tel:${property.owner_phone || '0912888777'}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{property.owner_phone || '0912.888.777'}</span>
                  </a>
                </div>
              </div>

            </div>

          </div>

          {/* Key Specs Table (Real Estate Standards) */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
              Đặc Điểm Bất Động Sản
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 text-[11px] block">Diện tích sử dụng</span>
                <strong className="text-sm text-slate-900 mt-0.5 block">{property.area} m²</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 text-[11px] block">Số phòng ngủ</span>
                <strong className="text-sm text-slate-900 mt-0.5 block">{property.bedrooms} Phòng</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 text-[11px] block">Số phòng tắm</span>
                <strong className="text-sm text-slate-900 mt-0.5 block">{property.bathrooms} WC</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 text-[11px] block">Tình trạng pháp lý</span>
                <strong className="text-xs text-slate-900 mt-0.5 block truncate" title={property.legal}>{property.legal || 'Sổ hồng lâu dài'}</strong>
              </div>
            </div>
          </div>

          {/* Specifications Details Table */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500">Chủ đầu tư:</span>
                <strong className="text-slate-900">{property.developer}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500">Dự án:</span>
                <strong className="text-slate-900">{property.project}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500">Loại hình:</span>
                <strong className="text-slate-900">{property.type || 'Căn hộ chung cư'}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500">Thời gian bàn giao:</span>
                <strong className="text-slate-900">{property.available_date || 'Dọn vào ở ngay'}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500">Phí dịch vụ / Quản lý:</span>
                <strong className="text-slate-900">{property.management_fee || 'Theo quy định ban quản lý'}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500">Thời hạn hợp đồng:</span>
                <strong className="text-slate-900">{property.rent_period_min || 'Tối thiểu 1 năm'}</strong>
              </div>
            </div>
          </div>

          {/* Description & Furniture */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
              Thông Tin Mô Tả Chi Tiết
            </h3>
            <div className="text-xs text-slate-700 leading-relaxed space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p>
                {property.furniture ? (
                  <><strong>Tình trạng nội thất: </strong>{property.furniture}</>
                ) : (
                  'Đầy đủ nội thất cao cấp: Tủ bếp, bếp từ, máy hút mùi, điều hòa Daikin, sàn gỗ công nghiệp, thiết bị vệ sinh Toto cao cấp.'
                )}
              </p>
              <p>
                Căn hộ sở hữu tầm nhìn thoáng đãng, đón ánh sáng tự nhiên và gió trời trong lành. Tiện ích nội khu đẳng cấp: Hồ bơi tràn bờ, phòng gym tiêu chuẩn, công viên cây xanh, trường học quốc tế, bệnh viện và trung tâm thương mại ngay dưới chân tòa nhà.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer Bar */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {copied && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded">
                ✓ Đã sao chép liên kết vào bộ nhớ tạm!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Đóng lại
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenContact(property);
              }}
              className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Đặt Lịch Xem Bất Động Sản
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
