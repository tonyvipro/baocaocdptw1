import React, { useState } from 'react';
import { 
  X, Bed, Bath, Maximize2, MapPin, ShieldCheck, Phone, CheckCircle, 
  Share2, Heart, Building2, Calendar, FileText, ChevronRight, UserCheck,
  CheckCheck, SlidersHorizontal, Map, Sparkles, Compass, Check
} from 'lucide-react';

export default function PropertyModal({ 
  property, 
  onClose, 
  isFavorite, 
  onToggleFavorite, 
  onOpenContact,
  isCompared,
  onToggleCompare
}) {
  const [copied, setCopied] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showMapTab, setShowMapTab] = useState(false);

  if (!property) return null;

  const isRent = property.purpose === 'rent';

  // Demo gallery image list
  const galleryImages = [
    property.image,
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80'
  ];

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/?property=${property.code || property.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const amenities = [
    'Hồ bơi vô cực tràn bờ', 'Phòng Gym & Yoga cao cấp',
    'Công viên cây xanh 5ha', 'Khu vui chơi trẻ em an toàn',
    'Hầm đỗ xe thông minh', 'Hệ thống an ninh 24/7 & Camera',
    'TTTM & Siêu thị mini', 'Trường mầm non quốc tế'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-hidden truncate">
            <span>Trang chủ</span>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{isRent ? 'Nhà đất cho thuê' : 'Nhà đất bán'}</span>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-800 truncate">{property.project}</span>
            <span className="text-slate-400 font-mono text-[11px] bg-slate-200/80 px-1.5 py-0.5 rounded">#{property.code}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors text-xs font-semibold cursor-pointer relative"
              title="Chia sẻ liên kết"
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Đã sao chép!' : 'Chia sẻ'}</span>
            </button>

            {onToggleCompare && (
              <button
                onClick={() => onToggleCompare(property)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  isCompared ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
                title="So sánh với BĐS khác"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isCompared ? 'Đang so sánh' : 'So sánh'}</span>
              </button>
            )}

            <button
              onClick={() => onToggleFavorite(property)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isFavorite ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-600 hover:text-red-600 hover:bg-red-50/50 border-slate-200'
              }`}
              title="Lưu tin đăng"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-600 text-red-600' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors ml-1 cursor-pointer"
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
            <div className="lg:col-span-7 flex flex-col gap-2.5">
              <div className="relative h-64 sm:h-80 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                <img
                  src={galleryImages[activeImageIndex] || property.image}
                  alt={property.title}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-black text-white shadow-md ${
                    isRent ? 'bg-blue-600' : 'bg-red-600'
                  }`}>
                    {isRent ? 'CHO THUÊ' : 'BÁN SỔ HỒNG'}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold text-white bg-slate-900/80 backdrop-blur-md">
                    {property.badge || 'VIP'}
                  </span>
                </div>

                <div className="absolute bottom-3 right-3 bg-slate-950/75 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md font-medium">
                  {activeImageIndex + 1} / {galleryImages.length} ảnh
                </div>
              </div>

              {/* Thumbnails strip */}
              <div className="grid grid-cols-5 gap-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx ? 'border-red-600 shadow-md scale-102' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Price & Action Box */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50 rounded-xl p-5 border border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thông tin niêm yết</span>
                <h2 className="text-lg font-bold text-slate-900 leading-snug mt-1 mb-2">
                  {property.title}
                </h2>
                
                <p className="flex items-start gap-1.5 text-xs text-slate-600 mb-4">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{property.street}, {property.district}, {property.city}</span>
                </p>

                {/* Price Display */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isRent ? 'Giá thuê niêm yết' : 'Tổng giá trị chuyển nhượng'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-red-600 tracking-tight">
                      {isRent ? property.price_rent_text : property.price_sale_text}
                    </span>
                    {property.unit_price && (
                      <span className="text-xs font-semibold text-slate-500">({property.unit_price})</span>
                    )}
                  </div>
                </div>

                {/* Quick specs grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">Diện tích</span>
                    <strong className="text-slate-800 text-sm">{property.area} m²</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">Phòng ngủ</span>
                    <strong className="text-slate-800 text-sm">{property.bedrooms} PN</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">Vệ sinh</span>
                    <strong className="text-slate-800 text-sm">{property.bathrooms} WC</strong>
                  </div>
                </div>
              </div>

              {/* Agent Contact Card */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Chuyên viên tư vấn phụ trách</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {property.owner_name ? property.owner_name.charAt(0) : 'N'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{property.owner_name || 'Nguyễn Hoàng Nam'}</p>
                      <p className="text-[10px] text-slate-500">Chuyên viên 3TV Land</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${property.owner_phone || '0912888777'}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{property.owner_phone || '0912.888.777'}</span>
                  </a>
                </div>
              </div>

            </div>

          </div>

          {/* Key Specs Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-600" />
              <span>Đặc Điểm & Thông Số Kỹ Thuật</span>
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 text-[11px] block">Diện tích sử dụng</span>
                <strong className="text-sm text-slate-900 mt-0.5 block">{property.area} m²</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 text-[11px] block">Số phòng ngủ</span>
                <strong className="text-sm text-slate-900 mt-0.5 block">{property.bedrooms} Phòng</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 text-[11px] block">Số phòng tắm</span>
                <strong className="text-sm text-slate-900 mt-0.5 block">{property.bathrooms} WC</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 text-[11px] block">Tình trạng pháp lý</span>
                <strong className="text-xs text-slate-900 mt-0.5 block truncate" title={property.legal}>{property.legal || 'Sổ hồng lâu dài'}</strong>
              </div>
            </div>
          </div>

          {/* Specifications Details Table */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
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
                <span className="text-slate-500">Hướng ban công / cửa:</span>
                <strong className="text-slate-900">{property.direction || 'Đông Nam'}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500">Thời gian bàn giao:</span>
                <strong className="text-slate-900">{property.available_date || 'Dọn vào ở ngay'}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500">Phí dịch vụ / Quản lý:</span>
                <strong className="text-slate-900">{property.management_fee || 'Theo ban quản lý'}</strong>
              </div>
            </div>
          </div>

          {/* Amenities & Utilities */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-200">
              Tiện Ích Nội Khu & Dịch Vụ
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {amenities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/60 text-xs text-emerald-900">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description & Furniture */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
              Thông Tin Mô Tả Chi Tiết
            </h3>
            <div className="text-xs text-slate-700 leading-relaxed space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
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

          {/* Map & Location preview */}
          <div>
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Map className="w-4 h-4 text-blue-600" />
                <span>Vị Trí Bản Đồ Bất Động Sản</span>
              </h3>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.street}, ${property.district}, ${property.city}`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Mở Google Maps</span>
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>
            
            <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
              <iframe
                title="Bản đồ vị trí"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(`${property.district}, ${property.city}, Vietnam`)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                allowFullScreen
                loading="lazy"
              />
              <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 shadow-sm flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span>{property.street}, {property.district}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {copied && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1 animate-pulse">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã sao chép link liên kết tin đăng!</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Đóng lại
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenContact(property);
              }}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm hover:shadow cursor-pointer"
            >
              Đặt Lịch Xem Bất Động Sản
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
