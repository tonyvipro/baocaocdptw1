import React from 'react';
import { Bed, Bath, Maximize2, MapPin, Heart, PlusCircle, Check, Phone, Eye } from 'lucide-react';

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

  if (viewMode === 'list') {
    return (
      <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 p-4 flex flex-col md:flex-row gap-5">
        {/* Image */}
        <div className="relative md:w-72 h-52 md:h-auto rounded-xl overflow-hidden shrink-0">
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-md ${
              isRent ? 'bg-emerald-600' : 'bg-blue-600'
            }`}>
              {isRent ? 'CHO THUÊ' : 'BÁN / CHUYỂN NHƯỢNG'}
            </span>
            {property.badge && (
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-white shadow-sm ${property.badge_class || 'bg-amber-600'}`}>
                {property.badge}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                {property.developer} • {property.project}
              </span>
              <span className="text-xs font-mono text-slate-400">#{property.code}</span>
            </div>

            <h3 
              onClick={() => onSelect(property)}
              className="text-lg font-bold text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors line-clamp-2 mb-2"
            >
              {property.title}
            </h3>

            <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{property.street}, {property.district}, {property.city}</span>
            </p>

            <div className="flex flex-wrap items-center gap-4 py-2 border-y border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                <Maximize2 className="w-4 h-4 text-emerald-600" />
                <span><strong>{property.area}</strong> m²</span>
              </div>
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4 text-emerald-600" />
                <span><strong>{property.bedrooms}</strong> PN</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4 text-emerald-600" />
                <span><strong>{property.bathrooms}</strong> WC</span>
              </div>
              <div className="text-slate-400">|</div>
              <div className="text-slate-600 font-medium truncate max-w-xs">{property.furniture}</div>
            </div>
          </div>

          {/* Bottom Price & Actions */}
          <div className="flex items-center justify-between pt-3 mt-2">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">{isRent ? 'Giá thuê niêm yết' : 'Giá bán thỏa thuận'}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-emerald-700">
                  {isRent ? property.price_rent_text : property.price_sale_text}
                </span>
                {property.unit_price && (
                  <span className="text-xs text-slate-400">({property.unit_price})</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleCompare(property)}
                className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                  isCompared 
                    ? 'bg-teal-600 text-white border-teal-600' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
                title="Thêm vào danh sách so sánh"
              >
                {isCompared ? <Check className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => onToggleFavorite(property)}
                className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                  isFavorite 
                    ? 'bg-rose-50 text-rose-600 border-rose-200' 
                    : 'bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200'
                }`}
                title="Lưu vào yêu thích"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>

              <button
                onClick={() => onSelect(property)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem chi tiết</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid Card View
  return (
    <div className="group bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-500/50 shadow-sm hover:shadow-2xl hover:shadow-emerald-950/10 transition-all duration-300 overflow-hidden flex flex-col justify-between">
      
      {/* Card Image */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5">
          <span className={`px-3 py-1 rounded-xl text-[11px] font-extrabold text-white shadow-md tracking-wider ${
            isRent ? 'bg-emerald-600' : 'bg-blue-600'
          }`}>
            {isRent ? 'CHO THUÊ' : 'BÁN SỔ HỒNG'}
          </span>
          {property.badge && (
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-white shadow-sm backdrop-blur-md ${property.badge_class || 'bg-slate-800'}`}>
              {property.badge}
            </span>
          )}
        </div>

        {/* Favorite & Compare floating buttons */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCompare(property); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md ${
              isCompared ? 'bg-teal-600 text-white' : 'bg-white/90 text-slate-700 hover:bg-white'
            }`}
            title="So sánh"
          >
            {isCompared ? <Check className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(property); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md ${
              isFavorite ? 'bg-rose-600 text-white' : 'bg-white/90 text-slate-700 hover:bg-white hover:text-rose-600'
            }`}
            title="Yêu thích"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white text-white' : ''}`} />
          </button>
        </div>

        {/* Developer pill at bottom of image */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold">
            {property.developer}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1.5">
            <span className="text-emerald-700 font-bold">{property.project}</span>
            <span className="font-mono">#{property.code}</span>
          </div>

          <h3 
            onClick={() => onSelect(property)}
            className="text-base font-bold text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors line-clamp-2 mb-2.5 leading-snug"
          >
            {property.title}
          </h3>

          <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>{property.street}, {property.district}, {property.city}</span>
          </p>

          {/* Features pills */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-slate-700 text-center">
            <div className="bg-slate-50 py-1.5 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase font-bold">
                <Maximize2 className="w-3 h-3 text-emerald-600" /> Diện tích
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">{property.area} m²</div>
            </div>
            <div className="bg-slate-50 py-1.5 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase font-bold">
                <Bed className="w-3 h-3 text-emerald-600" /> Phòng ngủ
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">{property.bedrooms} PN</div>
            </div>
            <div className="bg-slate-50 py-1.5 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase font-bold">
                <Bath className="w-3 h-3 text-emerald-600" /> Vệ sinh
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">{property.bathrooms} WC</div>
            </div>
          </div>
        </div>

        {/* Footer Price & Action */}
        <div className="pt-4 mt-2 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isRent ? 'Giá thuê' : 'Giá bán'}</p>
            <p className="text-lg font-black text-emerald-700">
              {isRent ? property.price_rent_text : property.price_sale_text}
            </p>
          </div>

          <button
            onClick={() => onSelect(property)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold transition-all hover:shadow-lg hover:shadow-emerald-900/20"
          >
            <span>Chi tiết</span>
          </button>
        </div>

      </div>

    </div>
  );
}
