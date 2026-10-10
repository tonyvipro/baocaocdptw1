import React from 'react';
import { Building2, Mail, Phone, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-12 pb-8 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
          
          {/* Company Brand & Address */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">3TV <span className="text-red-500">LAND</span></span>
            </div>

            <p className="text-slate-400 leading-relaxed max-w-sm">
              Cổng thông tin & sàn giao dịch bất động sản hàng đầu. Cung cấp dữ liệu căn hộ, nhà phố, biệt thự chuẩn xác từ các chủ đầu tư uy tín nhất Việt Nam.
            </p>

            <div className="space-y-1.5 pt-1 text-slate-300">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <span>Trụ sở: Tòa nhà Landmark 81, Vinhomes Central Park, Bình Thạnh, TP.HCM</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-500 shrink-0" />
                <span>Tổng đài CSKH: 1900 6868 (8:00 - 21:00 hàng ngày)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-500 shrink-0" />
                <span>Email: hotro@3tvland.com.vn</span>
              </p>
            </div>
          </div>

          {/* Column 2: Key Projects */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Dự Án Tiêu Biểu</h4>
            <ul className="space-y-2">
              <li><a href="#vinhomes-central-park" className="hover:text-white transition-colors">Vinhomes Central Park</a></li>
              <li><a href="#vinhomes-grand-park" className="hover:text-white transition-colors">Vinhomes Grand Park</a></li>
              <li><a href="#masteri-centre-point" className="hover:text-white transition-colors">Masteri Centre Point</a></li>
              <li><a href="#the-sun-avenue" className="hover:text-white transition-colors">The Sun Avenue</a></li>
              <li><a href="#safira-khang-dien" className="hover:text-white transition-colors">Safira Khang Điền</a></li>
            </ul>
          </div>

          {/* Column 3: Real Estate Types */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Loại Bất Động Sản</h4>
            <ul className="space-y-2">
              <li><a href="#can-ho-cao-cap" className="hover:text-white transition-colors">Căn hộ chung cư cao cấp</a></li>
              <li><a href="#nha-pho-shophouse" className="hover:text-white transition-colors">Nhà phố & Shophouse</a></li>
              <li><a href="#penthouse-duplex" className="hover:text-white transition-colors">Penthouse & Sky Villa</a></li>
              <li><a href="#biet-thu-nghi-duong" className="hover:text-white transition-colors">Biệt thự song lập / đơn lập</a></li>
              <li><a href="#can-ho-studio" className="hover:text-white transition-colors">Căn hộ Studio & 1 Phòng ngủ</a></li>
            </ul>
          </div>

          {/* Column 4: Policy & Guidelines */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quy Định & Pháp Lý</h4>
            <ul className="space-y-2">
              <li><a href="#quy-che-hoat-dong" className="hover:text-white transition-colors">Quy chế hoạt động sàn</a></li>
              <li><a href="#chinh-sach-bao-mat" className="hover:text-white transition-colors">Chính sách bảo mật thông tin</a></li>
              <li><a href="#giai-quyet-khieu-nai" className="hover:text-white transition-colors">Cơ chế giải quyết khiếu nại</a></li>
              <li><a href="#huong-dan-dang-tin" className="hover:text-white transition-colors">Hướng dẫn đăng tin & ký gửi</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Student Project Disclaimer */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© 2026 3TV LAND - Hệ Thống Quản Lý Bất Động Sản Trực Tuyến.</p>
          <p>Đồ án môn học: Chuyên đề Phát triển Web 1 (CDPTW1) • Nhóm F</p>
        </div>

      </div>
    </footer>
  );
}
