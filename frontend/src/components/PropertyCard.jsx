import React, { useState } from 'react';
import { Bed, Bath, Maximize2, MapPin, Heart, SlidersHorizontal, Check, Camera, ShieldCheck, User, Share2, CheckCheck } from 'lucide-react';

export default function PropertyCard({
  property,
  onSelect,
  isFavorite,
  onToggleFavorite,
  isCompared,
  onToggleCompare,
  viewMode = 'grid'
}) {
  const isRent = property.purpose === 'rent';
  const [copied, setCopied] = useState(false);

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?property=${property.code || property.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Dạng hiển thị Danh Sách (List View)
  if (viewMode === 'list') {
    return (
      <div className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 p-4 flex flex-col md:flex-row gap-5 relative overflow-hidden">
        {/* Thumbnail Image */}
        <div className="relative md:w-72 h-52 md:h-48 rounded-xl overflow-hidden shrink-0 bg-slate-100 cursor-pointer" onClick={() => onSelect(property)}>
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold text-white shadow-md tracking-wider ${
              isRent ? 'bg-blue-600' : 'bg-red-600'
            }`}>
              {isRent ? 'CHO THUÊ' : 'BÁN SỔ HỒNG'}
            </span>
          </div>

          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-slate-900/75 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-md font-medium">
            <Camera className="w-3.5 h-3.5" />
            <span>5 ảnh</span>
          </div>
        </div>

        {/* Content Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {property.project || property.developer}
              </span>
              <span className="text-[11px] font-mono text-slate-400">Mã: #{property.code}</span>
            </div>

            <h3 
              onClick={() => onSelect(property)}
              className="text-base font-bold text-slate-900 group-hover:text-red-600 cursor-pointer transition-colors line-clamp-2 leading-snug mb-2"
            >
              {property.title}
            </h3>

            <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>{property.street}, {property.district}, {property.city}</span>
            </p>

            {/* Quick Specs */}
            <div className="flex items-center gap-3 text-xs text-slate-600 font-medium py-2 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-800">{property.area}</strong> m²
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-800">{property.bedrooms}</strong> PN
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-800">{property.bathrooms}</strong> WC
              </span>
              {property.direction && (
                <>
                  <span>•</span>
                  <span>Hướng: <strong className="text-slate-800">{property.direction}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Bottom Bar: Price & CTA */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-red-600 tracking-tight">
                  {isRent ? property.price_rent_text : property.price_sale_text}
                </span>
                {property.unit_price && (
                  <span className="text-xs text-slate-500 font-medium">{property.unit_price}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer"
                title="Chia sẻ link BĐS"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                {copied && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">
                    Đã chép link!
                  </span>
                )}
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onToggleCompare(property); }}
                className={`p-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  isCompared ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-300'
                }`}
                title="Thêm vào bảng so sánh"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(property); }}
                className={`p-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  isFavorite ? 'bg-red-50 text-red-600 border-red-300' : 'bg-white text-slate-500 hover:text-red-600 hover:bg-red-50/50 border-slate-300'
                }`}
                title="Lưu tin yêu thích"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-600 text-red-600' : ''}`} />
              </button>

              <button
                onClick={() => onSelect(property)}
                className="px-4 py-2 bg-slate-900 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dạng hiển thị Lưới (Grid View)
  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col justify-between relative">
      
      {/* Property Thumbnail Image */}
      <div className="relative h-52 overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onSelect(property)}>
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className={`px-2.5 py-1 rounded-md text-[11px] font-black text-white shadow-md tracking-wider ${
            isRent ? 'bg-blue-600' : 'bg-red-600'
          }`}>
            {isRent ? 'CHO THUÊ' : 'BÁN SỔ HỒNG'}
          </span>
          {property.badge && (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-md shadow-xs">
              {property.badge}
            </span>
          )}
        </div>

        {/* Action icons on image */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <button
            onClick={handleShare}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-md bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white hover:text-slate-900 relative cursor-pointer"
            title="Chia sẻ link"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied && (
              <span className="absolute -bottom-7 right-0 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap z-30">
                Đã chép link!
              </span>
            )}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleCompare(property); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-md backdrop-blur-md cursor-pointer ${
              isCompared ? 'bg-blue-600 text-white' : 'bg-white/90 text-slate-700 hover:bg-white hover:text-blue-600'
            }`}
            title="Thêm vào so sánh"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(property); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-md backdrop-blur-md cursor-pointer ${
              isFavorite ? 'bg-red-600 text-white' : 'bg-white/90 text-slate-700 hover:text-red-600 hover:bg-white'
            }`}
            title="Lưu tin yêu thích"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white text-white' : ''}`} />
          </button>
        </div>

        {/* Image count & developer tag */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-md bg-slate-950/70 text-white text-[10px] font-semibold backdrop-blur-md">
            {property.developer || 'Chủ đầu tư uy tín'}
          </span>
        </div>

        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-slate-950/70 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-md">
          <Camera className="w-3 h-3" />
          <span>5 ảnh</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Project & Code */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-bold text-slate-700 truncate max-w-[180px]">{property.project}</span>
            <span className="font-mono text-[11px] text-slate-400">#{property.code}</span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onSelect(property)}
            className="text-sm font-bold text-slate-900 group-hover:text-red-600 cursor-pointer transition-colors line-clamp-2 leading-snug mb-2"
          >
            {property.title}
          </h3>

          {/* Location */}
          <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-3.5 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>{property.street}, {property.district}, {property.city}</span>
          </p>

          {/* Specification Grid */}
          <div className="grid grid-cols-3 gap-1 py-2.5 border-y border-slate-100 text-slate-700 text-xs text-center font-medium bg-slate-50/50 rounded-lg">
            <div>
              <span className="text-slate-400 text-[10px] block">Diện tích</span>
              <strong className="text-slate-800">{property.area} m²</strong>
            </div>
            <div className="border-x border-slate-200">
              <span className="text-slate-400 text-[10px] block">Phòng ngủ</span>
              <strong className="text-slate-800">{property.bedrooms} PN</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Vệ sinh</span>
              <strong className="text-slate-800">{property.bathrooms} WC</strong>
            </div>
          </div>
        </div>

        {/* Footer: Price & View Details */}
        <div className="pt-3.5 mt-2 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRent ? 'Giá thuê niêm yết' : 'Mức giá bán'}</p>
            <p className="text-lg font-black text-red-600 tracking-tight">
              {isRent ? property.price_rent_text : property.price_sale_text}
            </p>
          </div>

          <button
            onClick={() => onSelect(property)}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer"
          >
            Chi tiết
          </button>
        </div>

      </div>

    </div>
  );
}
