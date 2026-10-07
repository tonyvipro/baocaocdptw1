import React from 'react';
import { Bed, Bath, Maximize2, MapPin, Heart, SlidersHorizontal, Check, Camera, ShieldCheck, User } from 'lucide-react';

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

  // Dạng hiển thị Danh Sách (List View)
  if (viewMode === 'list') {
    return (
      <div className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all p-3.5 sm:p-4 flex flex-col md:flex-row gap-4">
        {/* Thumbnail Image */}
        <div className="relative md:w-64 h-48 md:h-44 rounded-lg overflow-hidden shrink-0 bg-slate-100 cursor-pointer" onClick={() => onSelect(property)}>
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-full object-cover img-zoom"
            loading="lazy"
          />
          
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-xs ${
              isRent ? 'bg-blue-600' : 'bg-red-600'
            }`}>
              {isRent ? 'CHO THUÊ' : 'BÁN'}
            </span>
          </div>

          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded">
            <Camera className="w-3 h-3" />
            <span>5 ảnh</span>
          </div>
        </div>

        {/* Content Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {property.project || property.developer}
              </span>
              <span className="text-[11px] font-mono text-slate-400">Mã: #{property.code}</span>
            </div>

            <h3 
              onClick={() => onSelect(property)}
              className="text-base font-bold text-slate-900 hover:text-red-600 cursor-pointer transition-colors line-clamp-2 leading-snug mb-1.5"
            >
              {property.title}
            </h3>

            <p className="flex items-center gap-1 text-xs text-slate-500 mb-2.5 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{property.street}, {property.district}, {property.city}</span>
            </p>

            {/* Quick Specs */}
            <div className="flex items-center gap-3 text-xs text-slate-600 font-medium py-1.5 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                <strong>{property.area}</strong> m²
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-slate-400" />
                <strong>{property.bedrooms}</strong> PN
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-slate-400" />
                <strong>{property.bathrooms}</strong> WC
              </span>
              {property.direction && (
                <>
                  <span>•</span>
                  <span>Hướng: {property.direction}</span>
                </>
              )}
            </div>
          </div>

          {/* Bottom Bar: Price & CTA */}
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-red-600">
                  {isRent ? property.price_rent_text : property.price_sale_text}
                </span>
                {property.unit_price && (
                  <span className="text-xs text-slate-500 font-medium">{property.unit_price}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleCompare(property); }}
                className={`p-2 rounded-lg border text-xs font-semibold transition-colors ${
                  isCompared ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-300'
                }`}
                title="So sánh"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(property); }}
                className={`p-2 rounded-lg border text-xs font-semibold transition-colors ${
                  isFavorite ? 'bg-red-50 text-red-600 border-red-300' : 'bg-white text-slate-500 hover:text-red-600 hover:bg-red-50/50 border-slate-300'
                }`}
                title="Yêu thích"
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-600 text-red-600' : ''}`} />
              </button>

              <button
                onClick={() => onSelect(property)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
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
    <div className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      
      {/* Property Thumbnail Image */}
      <div className="relative h-48 overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onSelect(property)}>
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover img-zoom"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold text-white shadow-xs tracking-wide ${
            isRent ? 'bg-blue-600' : 'bg-red-600'
          }`}>
            {isRent ? 'CHO THUÊ' : 'BÁN SỔ HỒNG'}
          </span>
          {property.badge && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-slate-800/90 backdrop-blur-xs">
              {property.badge}
            </span>
          )}
        </div>

        {/* Action icons on image */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCompare(property); }}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-xs ${
              isCompared ? 'bg-blue-600 text-white' : 'bg-white/90 text-slate-700 hover:bg-white'
            }`}
            title="Thêm vào so sánh"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(property); }}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-xs ${
              isFavorite ? 'bg-red-600 text-white' : 'bg-white/90 text-slate-700 hover:text-red-600 hover:bg-white'
            }`}
            title="Lưu tin đăng"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white text-white' : ''}`} />
          </button>
        </div>

        {/* Image count & developer tag */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
            {property.developer || 'Chủ đầu tư uy tín'}
          </span>
        </div>

        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-xs">
          <Camera className="w-3 h-3" />
          <span>5 ảnh</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Project & Code */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold text-slate-700 truncate max-w-[180px]">{property.project}</span>
            <span className="font-mono text-[11px] text-slate-400">#{property.code}</span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onSelect(property)}
            className="text-sm font-bold text-slate-900 hover:text-red-600 cursor-pointer transition-colors line-clamp-2 leading-snug mb-2"
          >
            {property.title}
          </h3>

          {/* Location */}
          <p className="flex items-center gap-1 text-xs text-slate-500 mb-3 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{property.street}, {property.district}, {property.city}</span>
          </p>

          {/* Specification Grid */}
          <div className="grid grid-cols-3 gap-1 py-2 border-y border-slate-100 text-slate-700 text-xs text-center font-medium">
            <div>
              <span className="text-slate-400 text-[10px] block">Diện tích</span>
              <strong className="text-slate-800">{property.area} m²</strong>
            </div>
            <div className="border-x border-slate-100">
              <span className="text-slate-400 text-[10px] block">Phòng ngủ</span>
              <strong className="text-slate-800">{property.bedrooms} PN</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Vệ sinh</span>
              <strong className="text-slate-800">{property.bathrooms} WC</strong>
            </div>
          </div>
        </div>

        {/* Footer: Price & Agent Call */}
        <div className="pt-3 mt-1 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase">{isRent ? 'Giá thuê niêm yết' : 'Mức giá bán'}</p>
            <p className="text-base font-black text-red-600">
              {isRent ? property.price_rent_text : property.price_sale_text}
            </p>
          </div>

          <button
            onClick={() => onSelect(property)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-600 hover:text-white text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Chi tiết
          </button>
        </div>

      </div>

    </div>
  );
}
