import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Eye, MapPin } from 'lucide-react';

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

export default function MapView({ properties, onSelectProperty }) {
  // Default center coordinates (TP.HCM)
  const defaultCenter = [10.8231, 106.6297];

  const validProperties = properties.filter(
    (p) => p.lat && p.lng && !isNaN(p.lat) && !isNaN(p.lng)
  );

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-lg p-2 relative h-[650px]">
      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full rounded-2xl z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validProperties.map((prop) => (
          <Marker
            key={prop.code}
            position={[prop.lat, prop.lng]}
            icon={customIcon}
          >
            <Popup className="custom-leaflet-popup">
              <div className="w-64 p-3 bg-white text-slate-800">
                <div className="relative h-28 rounded-xl overflow-hidden mb-2">
                  <img
                    src={prop.image}
                    alt={prop.title}
                    className="w-full h-full object-cover"
                  />
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold text-white ${
                    prop.purpose === 'rent' ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}>
                    {prop.purpose === 'rent' ? 'Thuê' : 'Bán'}
                  </span>
                </div>

                <p className="text-xs font-bold text-emerald-700">{prop.project}</p>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">{prop.title}</h4>
                
                <p className="text-sm font-extrabold text-emerald-600 mb-2">
                  {prop.purpose === 'rent' ? prop.price_rent_text : prop.price_sale_text}
                </p>

                <button
                  onClick={() => onSelectProperty(prop)}
                  className="w-full py-1.5 bg-slate-900 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Xem Chi Tiết</span>
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute top-6 right-6 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-md border border-slate-200 text-xs flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-700">Đang hiển thị {validProperties.length} tọa độ</span>
        </div>
      </div>
    </div>
  );
}
