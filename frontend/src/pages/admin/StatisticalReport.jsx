import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Download, BarChart2 } from 'lucide-react';

export default function StatisticalReport() {
  const currentDate = new Date().toLocaleDateString('vi-VN');
  const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  
  const [stats, setStats] = useState({
    total_revenue: 0,
    occupancy_rate: 0,
    maintenance_requests: 0,
    stats: {
      new_contracts: 0,
      new_tenants: 0,
      expiring_contracts: 0,
      processing_requests: 0,
      completed_requests: 0
    }
  });
  
  useEffect(() => {
    fetch('/api/reports/statistics')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Error fetching stats:", err));
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden flex flex-col font-sans">
      {/* Tiêu đề */}
      <div className="p-5 pb-3">
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">BÁO CÁO THỐNG KÊ</h2>
      </div>

      {/* Thanh công cụ / Filter */}
      <div className="px-5 py-3 flex flex-wrap items-center gap-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Loại báo cáo:</span>
          <select className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-slate-500 bg-white shadow-sm">
            <option>Tổng quan</option>
            <option>Tài chính</option>
            <option>Hoạt động</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          <span className="text-sm font-medium text-slate-600">Kỳ báo cáo:</span>
          <select className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-slate-500 bg-white shadow-sm">
            <option>Tháng này</option>
            <option>Tháng trước</option>
            <option>Quý này</option>
            <option>Năm nay</option>
          </select>
        </div>

        <div className="px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-600 font-medium whitespace-nowrap ml-2">
          01/11/2023 - 30/11/2023
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
            XUẤT BÁO CÁO (PDF)
          </button>
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
            TẠO BIỂU ĐỒ
          </button>
        </div>
      </div>

      {/* Các thẻ Tổng quan */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Doanh thu */}
        <div className="border border-slate-200 rounded-lg p-4 shadow-sm relative bg-white">
          <p className="text-sm font-medium text-slate-600 mb-1">Tổng Doanh thu</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(stats.total_revenue)}</h3>
            <span className="flex items-center text-xs font-semibold text-emerald-600">
              +5.2% <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>
        
        {/* Tỷ lệ lấp đầy */}
        <div className="border border-slate-200 rounded-lg p-4 shadow-sm relative bg-white">
          <p className="text-sm font-medium text-slate-600 mb-1">Tỷ lệ Lấp đầy</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-800">{stats.occupancy_rate}%</h3>
            <span className="flex items-center text-xs font-semibold text-emerald-600">
              +1.2% <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Yêu cầu bảo trì */}
        <div className="border border-slate-200 rounded-lg p-4 shadow-sm relative bg-white">
          <p className="text-sm font-medium text-slate-600 mb-1">Yêu cầu Bảo trì</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-800">{stats.maintenance_requests}</h3>
            <span className="flex items-center text-xs font-semibold text-red-600">
              +2.0% <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Bảng Chỉ số Hoạt động */}
      <div className="px-5 pb-5">
        <div className="border border-slate-300 rounded-lg overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-300 p-3">
            <h4 className="font-bold text-slate-800 text-sm">Tổng quan Chỉ số Hoạt động</h4>
          </div>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600 font-medium">
                <th className="p-3 border-r border-slate-200">Chỉ số</th>
                <th className="p-3 text-center border-r border-slate-200">Giá trị</th>
                <th className="p-3 text-center border-r border-slate-200">Thay đổi %</th>
                <th className="p-3 text-center">Xu hướng</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-3 border-r border-slate-200">Tổng Hợp đồng mới</td>
                <td className="p-3 text-center border-r border-slate-200">{stats.stats.new_contracts}</td>
                <td className="p-3 text-center border-r border-slate-200 text-emerald-600">+10.0%</td>
                <td className="p-3 text-center flex justify-center"><ArrowUpRight className="w-4 h-4 text-slate-500" /></td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-3 border-r border-slate-200">Tổng Người thuê mới</td>
                <td className="p-3 text-center border-r border-slate-200">{stats.stats.new_tenants}</td>
                <td className="p-3 text-center border-r border-slate-200 text-emerald-600">+10.5%</td>
                <td className="p-3 text-center flex justify-center"><ArrowUpRight className="w-4 h-4 text-slate-500" /></td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-3 border-r border-slate-200">Hợp đồng sắp hết hạn</td>
                <td className="p-3 text-center border-r border-slate-200">{stats.stats.expiring_contracts}</td>
                <td className="p-3 text-center border-r border-slate-200 text-slate-600">0.0%</td>
                <td className="p-3 text-center flex justify-center"><ArrowRight className="w-4 h-4 text-slate-500" /></td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-3 border-r border-slate-200">Yêu cầu đang xử lý</td>
                <td className="p-3 text-center border-r border-slate-200">{stats.stats.processing_requests}</td>
                <td className="p-3 text-center border-r border-slate-200 text-emerald-600">+50.0%</td>
                <td className="p-3 text-center flex justify-center"><ArrowUpRight className="w-4 h-4 text-slate-500" /></td>
              </tr>
              <tr>
                <td className="p-3 border-r border-slate-200">Yêu cầu đã hoàn thành</td>
                <td className="p-3 text-center border-r border-slate-200">{stats.stats.completed_requests}</td>
                <td className="p-3 text-center border-r border-slate-200 text-slate-600">0.0%</td>
                <td className="p-3 text-center flex justify-center"><ArrowRight className="w-4 h-4 text-slate-500" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-300 bg-white">
        <p className="text-xs text-slate-500">
          Tổng số liệu được cập nhật lúc: {currentDate} {currentTime}
        </p>
      </div>
    </div>
  );
}
