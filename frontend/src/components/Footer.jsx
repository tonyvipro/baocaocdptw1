import React from 'react';
import { Building2, Mail, Phone, MapPin, Heart, ShieldCheck, Github, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Col 1 & 2: Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">3TV <span className="text-emerald-400">Land</span></span>
            </div>

            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Hệ thống tìm kiếm, so sánh và định vị bất động sản thông minh. Dự án ứng dụng công nghệ ReactJS kết nối Laravel API trong khuôn khổ học phần Báo Cáo Chuyên Đề Phát Triển Web 1.
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 font-semibold text-emerald-400">ReactJS Frontend</span>
              <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 font-semibold text-teal-400">Laravel 11 Backend</span>
              <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 font-semibold text-blue-400">MySQL Database</span>
            </div>
          </div>

          {/* Col 3: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Dự Án Trọng Điểm</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#vinhomes" className="hover:text-emerald-400 transition-colors">Vinhomes Grand Park</a></li>
              <li><a href="#landmark" className="hover:text-emerald-400 transition-colors">Vinhomes Central Park (Landmark 81)</a></li>
              <li><a href="#ocean" className="hover:text-emerald-400 transition-colors">Vinhomes Ocean Park 1</a></li>
              <li><a href="#sunavenue" className="hover:text-emerald-400 transition-colors">The Sun Avenue Novaland</a></li>
              <li><a href="#safira" className="hover:text-emerald-400 transition-colors">Safira Khang Điền</a></li>
            </ul>
          </div>

          {/* Col 4: Types */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Phân Loại</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#rent" className="hover:text-emerald-400 transition-colors">Căn hộ chung cư cao cấp</a></li>
              <li><a href="#sale" className="hover:text-emerald-400 transition-colors">Nhà phố / Liền kề shophouse</a></li>
              <li><a href="#villa" className="hover:text-emerald-400 transition-colors">Biệt thự biển nghỉ dưỡng</a></li>
              <li><a href="#land" className="hover:text-emerald-400 transition-colors">Đất nền sổ đỏ đón sân bay</a></li>
            </ul>
          </div>

          {/* Col 5: Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Thông Tin Liên Hệ</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Hotline: 0912.888.777</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>contact@3tvland.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>TP. Hồ Chí Minh & Hà Nội</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 3TV Real Estate Platform. Báo cáo Chuyên đề Phát triển Web 1.</p>
          <div className="flex items-center gap-1">
            <span>Thiết kế & Xây dựng với</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>bằng ReactJS & Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
