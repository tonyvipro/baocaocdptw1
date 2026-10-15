import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Eye, MapPin, Building2, Bed, Bath, Maximize2 } from 'lucide-react';

// Custom Marker Icon
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapView({ properties = [], onSelectProperty }) {
  // Default center coordinates (TP.HCM)
  const defaultCenter = [10.7769, 106.7009];

  // Map coordinates fallback if null
  const getCoordinates = (p, index) => {
    if (p.lat && p.lng && !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0 && p.lng !== 0) {
      return [p.lat, p.lng];
    }
    // Fallback coordinates dispersed around HCM City
    const offsets = [
      [10.7769, 106.7009], // Quận 1
      [10.7412, 106.7196], // Quận 7
      [10.7878, 106.7495], // TP Thủ Đức (Quận 2)
      [10.8505, 106.7719], // TP Thủ Đức (Quận 9)
      [10.8000, 106.6900], // Bình Thạnh
      [10.7600, 106.6600], // Quận 10
      [10.8200, 106.6800]  // Gò Vấp
    ];
    return offsets[index % offsets.length];
  };

  const validProperties = properties.map((p, idx) => ({
    ...p,
    mapCoords: getCoordinates(p, idx)
  }));

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl p-2 relative h-[680px]">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full rounded-xl z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validProperties.map((prop) => (
          <Marker
            key={prop.code || prop.id}
            position={prop.mapCoords}
            icon={customIcon}
          >
            <Popup className="custom-leaflet-popup">
              <div className="w-68 p-2.5 bg-white text-slate-800 rounded-lg">
                <div className="relative h-32 rounded-lg overflow-hidden mb-2 bg-slate-100 group">
                  <img
                    src={prop.image}
                    alt={prop.title}
                    className="w-full h-full object-cover"
                  />
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow ${
                    prop.purpose === 'rent' ? 'bg-blue-600' : 'bg-red-600'
                  }`}>
                    {prop.purpose === 'rent' ? 'Cho thuê' : 'Bán'}
                  </span>
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-medium backdrop-blur-xs">
                    {prop.project || prop.developer}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">{prop.title}</h4>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-1.5 truncate">
                  <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                  <span>{prop.street}, {prop.district}</span>
                </p>

                <div className="flex items-center gap-2 text-[11px] text-slate-600 py-1 border-t border-slate-100 mb-2 font-medium">
                  <span>{prop.area} m²</span>
                  <span>•</span>
                  <span>{prop.bedrooms} PN</span>
                  <span>•</span>
                  <span>{prop.bathrooms} WC</span>
                </div>
                
                <p className="text-sm font-black text-red-600 mb-2.5">
                  {prop.purpose === 'rent' ? prop.price_rent_text : prop.price_sale_text}
                </p>

                <button
                  onClick={() => onSelectProperty(prop)}
                  className="w-full py-1.5 bg-slate-900 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem Chi Tiết BĐS</span>
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute top-5 right-5 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-slate-200 text-xs flex items-center gap-2.5">
        <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
        <span className="font-bold text-slate-800">Hiển thị {validProperties.length} bất động sản trên bản đồ</span>
      </div>
    </div>
  );
}
