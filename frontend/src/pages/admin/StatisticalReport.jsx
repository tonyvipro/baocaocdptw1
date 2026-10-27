import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, ArrowRight, Download, BarChart2, 
  Calendar, Filter, RefreshCw, FileText, CheckCircle2, AlertCircle, 
  Clock, TrendingUp, Layers, PieChart, Table as TableIcon, Eye
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Đăng ký các module ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function StatisticalReport() {
  const currentDate = new Date().toLocaleDateString('vi-VN');
  const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  // Khôi phục trạng thái bộ lọc đã lưu khi người dùng nhấn F5 hoặc tải lại trang
  const savedFilter = (() => {
    try {
      return JSON.parse(localStorage.getItem('3tv_report_filter') || 'null');
    } catch {
      return null;
    }
  })();

  // 1. STATE BỘ LỌC
  const [reportType, setReportType] = useState(() => savedFilter?.reportType || 'overview');
  const [reportPeriod, setReportPeriod] = useState(() => savedFilter?.reportPeriod || 'this_month');
  
  // Date State dạng YYYY-MM-DD
  const [startDate, setStartDate] = useState(() => savedFilter?.startDate || getInitialDateRange('this_month').start);
  const [endDate, setEndDate] = useState(() => savedFilter?.endDate || getInitialDateRange('this_month').end);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);

  // 2. STATE HIỂN THỊ & DỮ LIỆU
  const [loading, setLoading] = useState(true);
  const [showChart, setShowChart] = useState(() => savedFilter?.showChart || false);
  const [chartSubtype, setChartSubtype] = useState(() => savedFilter?.chartSubtype || 'bar');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);

  // Tự động lưu bộ lọc vào localStorage để duy trì trạng thái khi F5
  useEffect(() => {
    try {
      localStorage.setItem('3tv_report_filter', JSON.stringify({
        reportType,
        reportPeriod,
        startDate,
        endDate,
        showChart,
        chartSubtype
      }));
    } catch (e) {}
  }, [reportType, reportPeriod, startDate, endDate, showChart, chartSubtype]);

  const [reportData, setReportData] = useState({
    status: 'success',
    meta: {
      report_type: 'overview',
      report_period: 'this_month',
      start_date_formatted: '',
      end_date_formatted: '',
      period_label: '',
      generated_at: ''
    },
    kpis: {
      total_revenue: 0,
      revenue_change: 0,
      occupancy_rate: 0,
      occupancy_change: 0,
      maintenance_requests: 0,
      maintenance_change: 0,
      total_properties: 0,
      rented_properties: 0,
      vacant_properties: 0,
    },
    table_data: [],
    charts: {
      timeline: { labels: [], revenue: [], contracts: [] },
      maintenance_status: { labels: [], data: [] },
      property_types: { labels: [], data: [] },
    }
  });

  // Helper tính khoảng ngày theo kỳ
  function getInitialDateRange(period) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (period === 'today') {
      const todayStr = toYMD(now);
      return { start: todayStr, end: todayStr };
    }
    if (period === 'this_week') {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start: toYMD(monday), end: toYMD(sunday) };
    }
    if (period === 'this_quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
      const lastDay = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      return { start: toYMD(firstDay), end: toYMD(lastDay) };
    }
    if (period === 'this_year') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      return { start: toYMD(firstDay), end: toYMD(lastDay) };
    }
    // Mặc định: Tháng này
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: toYMD(firstDay), end: toYMD(lastDay) };
  }

  // Format YYYY-MM-DD -> DD/MM/YYYY
  const formatDisplayDate = (ymdStr) => {
    if (!ymdStr) return '';
    const parts = ymdStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return ymdStr;
  };

  // 3. XỬ LÝ SỰ KIỆN ĐỔI KỲ BÁO CÁO
  const handlePeriodChange = (newPeriod) => {
    setReportPeriod(newPeriod);
    if (newPeriod === 'custom') {
      setShowCustomDateModal(true);
    } else {
      setShowCustomDateModal(false);
      const { start, end } = getInitialDateRange(newPeriod);
      setStartDate(start);
      setEndDate(end);
      setTempStartDate(start);
      setTempEndDate(end);
    }
  };

  // Áp dụng ngày tùy chọn
  const applyCustomDates = () => {
    if (tempStartDate && tempEndDate) {
      if (new Date(tempStartDate) > new Date(tempEndDate)) {
        alert("Ngày bắt đầu không được lớn hơn ngày kết thúc!");
        return;
      }
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
      setShowCustomDateModal(false);
    }
  };

  // 4. TRUY VẤN DỮ LIỆU TỪ BACKEND DATABASE
  useEffect(() => {
    fetchStatistics();
  }, [reportType, reportPeriod, startDate, endDate]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        report_type: reportType,
        report_period: reportPeriod,
        start_date: startDate,
        end_date: endDate,
      });

      const token = localStorage.getItem('3tv_token') || '';
      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch(`/api/reports/statistics?${params.toString()}`, { headers });
      if (!res.ok) {
        res = await fetch(`http://localhost:8080/api/reports/statistics?${params.toString()}`, { headers });
      }

      if (!res.ok) throw new Error('Không thể tải dữ liệu báo cáo');
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error("Lỗi truy vấn dữ liệu báo cáo:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value || 0) + ' VNĐ';
  };

  // 5. CHỨC NĂNG XUẤT BÁO CÁO (PDF)
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      // Ẩn các nút thao tác tạm thời khi chụp
      const actionButtons = reportRef.current.querySelector('.action-buttons-group');
      if (actionButtons) actionButtons.style.display = 'none';

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      if (actionButtons) actionButtons.style.display = 'flex';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      // Nếu dài hơn 1 trang A4
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      const reportTypeLabels = {
        overview: 'Tong_Quan',
        finance: 'Tai_Chinh',
        operation: 'Van_Hanh',
        tenant: 'Khach_Thue'
      };
      const fileName = `Bao_Cao_${reportTypeLabels[reportType] || 'Thong_Ke'}_${startDate}_${endDate}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Lỗi xuất PDF:", error);
      // Dự phòng bằng hộp thoại In ấn chuẩn của trình duyệt
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  // Cấu hình Biểu đồ Bar Doanh thu
  const barChartData = {
    labels: reportData.charts?.timeline?.labels || [],
    datasets: [
      {
        label: 'Doanh thu thực tế (VNĐ)',
        data: reportData.charts?.timeline?.revenue || [],
        backgroundColor: 'rgba(30, 58, 138, 0.85)',
        hoverBackgroundColor: 'rgba(37, 99, 235, 1)',
        borderRadius: 6,
      }
    ]
  };

  // Cấu hình Biểu đồ Đường Hợp đồng
  const lineChartData = {
    labels: reportData.charts?.timeline?.labels || [],
    datasets: [
      {
        fill: true,
        label: 'Số hợp đồng mới',
        data: reportData.charts?.timeline?.contracts || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.35,
        pointBackgroundColor: '#10b981',
        pointRadius: 4,
      }
    ]
  };

  // Cấu hình Biểu đồ Tròn Trạng thái Bảo trì
  const doughnutChartData = {
    labels: reportData.charts?.maintenance_status?.labels || ['Chờ xử lý', 'Đang xử lý', 'Hoàn thành'],
    datasets: [
      {
        data: reportData.charts?.maintenance_status?.data || [0, 0, 0],
        backgroundColor: [
          '#f59e0b', // Vàng chờ xử lý
          '#3b82f6', // Xanh dương đang xử lý
          '#10b981', // Xanh lá hoàn thành
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      }
    ]
  };

  return (
    <div className="space-y-4">
      {/* Container chính bao bọc toàn bộ báo cáo để chụp xuất PDF */}
      <div 
        ref={reportRef} 
        className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden flex flex-col font-sans printable-report"
      >
        {/* Header Báo Cáo */}
        <div className="giang-page-heading flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                Sàn Giao Dịch BĐS 3TV Land
              </span>
              <span className="text-xs text-slate-400 font-medium">Báo cáo thời gian thực</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide mt-1.5 flex items-center gap-2">
              BÁO CÁO THỐNG KÊ {reportType === 'finance' ? 'TÀI CHÍNH' : reportType === 'operation' ? 'VẬN HÀNH' : reportType === 'tenant' ? 'KHÁCH THUÊ' : 'TỔNG QUAN'}
            </h2>
          </div>

          <div className="text-right text-xs text-slate-500">
            <p>Thời điểm xuất: <span className="font-semibold text-slate-700">{reportData.meta?.generated_at || `${currentDate} ${currentTime}`}</span></p>
            <p className="mt-0.5">Dữ liệu: <span className="text-emerald-700 font-medium">Cập nhật từ hệ thống</span></p>
          </div>
        </div>

        {/* Thanh công cụ / Filter Bar (Đáp ứng đầy đủ Yêu cầu 2) */}
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 filter-bar-wrapper">
          <div className="flex flex-wrap items-center gap-3">
            {/* 1. Dropdown Loại báo cáo */}
            <div className="flex items-center gap-2">
              <label htmlFor="report-type-select" className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                Loại báo cáo:
              </label>
              <select 
                id="report-type-select"
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-slate-800 cursor-pointer"
              >
                <option value="overview">Tổng quan</option>
                <option value="finance">Tài chính</option>
                <option value="operation">Vận hành</option>
                <option value="tenant">Khách thuê</option>
              </select>
            </div>
            
            {/* 2. Dropdown Kỳ báo cáo */}
            <div className="flex items-center gap-2">
              <label htmlFor="report-period-select" className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                Kỳ báo cáo:
              </label>
              <select 
                id="report-period-select"
                value={reportPeriod} 
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-slate-800 cursor-pointer"
              >
                <option value="this_month">Tháng này</option>
                <option value="today">Hôm nay</option>
                <option value="this_week">Tuần này</option>
                <option value="this_quarter">Quý này</option>
                <option value="this_year">Năm nay</option>
                <option value="custom">Tùy chọn</option>
              </select>
            </div>

            {/* 3. Khoảng thời gian hiển thị chuẩn DD/MM/YYYY - DD/MM/YYYY */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCustomDateModal(!showCustomDateModal)}
                title="Click để thay đổi khoảng thời gian"
                className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-sm text-slate-800 font-medium shadow-sm transition-all"
              >
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}</span>
                {reportPeriod === 'custom' && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">Tùy chọn</span>
                )}
              </button>

              {/* Popover chọn ngày tùy chọn (Date Range Picker) */}
              {showCustomDateModal && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-300 rounded-xl shadow-xl p-4 w-72 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold uppercase text-slate-700">Chọn khoảng ngày</span>
                    <button 
                      onClick={() => setShowCustomDateModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Đóng
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Từ ngày (DD/MM/YYYY):</label>
                    <input 
                      type="date" 
                      value={tempStartDate} 
                      onChange={(e) => setTempStartDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Đến ngày (DD/MM/YYYY):</label>
                    <input 
                      type="date" 
                      value={tempEndDate} 
                      onChange={(e) => setTempEndDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setReportPeriod('this_month');
                        const r = getInitialDateRange('this_month');
                        setStartDate(r.start);
                        setEndDate(r.end);
                        setShowCustomDateModal(false);
                      }}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                    >
                      Đặt lại
                    </button>
                    <button 
                      onClick={applyCustomDates}
                      className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              )}
            </div>

            {loading && (
              <span className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang cập nhật...
              </span>
            )}
          </div>

          {/* Nhóm Nút XUẤT BÁO CÁO (PDF) và TẠO BIỂU ĐỒ (Yêu cầu 3 & 4) */}
          <div className="flex items-center gap-2 ml-auto action-buttons-group">
            {/* Nút Xuất Báo Cáo PDF */}
            <button 
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Download className="w-4 h-4 text-emerald-400" />}
              <span>{isExporting ? 'Đang tạo PDF...' : 'XUẤT BÁO CÁO (PDF)'}</span>
            </button>

            {/* Nút Tạo Biểu Đồ */}
            <button 
              type="button"
              onClick={() => setShowChart(!showChart)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                showChart 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-300' 
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {showChart ? <TableIcon className="w-4 h-4 text-amber-300" /> : <BarChart2 className="w-4 h-4 text-blue-400" />}
              <span>{showChart ? 'XEM DẠNG BẢNG' : 'TẠO BIỂU ĐỒ'}</span>
            </button>
          </div>
        </div>

        {/* CÁC THẺ KPI TRUY VẤN TỪ DATABASE THỰC (Yêu cầu 1) */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Doanh thu thực tế */}
          <div className="border border-slate-200 rounded-xl p-4 shadow-sm bg-gradient-to-br from-white to-slate-50 relative hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng Doanh thu</p>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">Invoices Status=1</span>
            </div>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(reportData.kpis?.total_revenue)}
              </h3>
              <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                (reportData.kpis?.revenue_change || 0) >= 0 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-red-50 text-red-600'
              }`}>
                {(reportData.kpis?.revenue_change || 0) >= 0 ? '+' : ''}
                {reportData.kpis?.revenue_change || 0}%
                {(reportData.kpis?.revenue_change || 0) >= 0 
                  ? <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" /> 
                  : <ArrowDownRight className="w-3.5 h-3.5 ml-0.5" />
                }
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">So với chu kỳ liền kề trước đó</p>
          </div>
          
          {/* Card 2: Tỷ lệ lấp đầy */}
          <div className="border border-slate-200 rounded-xl p-4 shadow-sm bg-gradient-to-br from-white to-slate-50 relative hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tỷ lệ Lấp đầy</p>
              <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">
                {reportData.kpis?.rented_properties || 0}/{reportData.kpis?.total_properties || 0} BĐS
              </span>
            </div>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {reportData.kpis?.occupancy_rate || 0}%
              </h3>
              <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                (reportData.kpis?.occupancy_change || 0) >= 0 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-red-50 text-red-600'
              }`}>
                {(reportData.kpis?.occupancy_change || 0) >= 0 ? '+' : ''}
                {reportData.kpis?.occupancy_change || 0}%
                {(reportData.kpis?.occupancy_change || 0) >= 0 
                  ? <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" /> 
                  : <ArrowDownRight className="w-3.5 h-3.5 ml-0.5" />
                }
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Số phòng có hợp đồng thuê hiệu lực</p>
          </div>

          {/* Card 3: Yêu cầu bảo trì */}
          <div className="border border-slate-200 rounded-xl p-4 shadow-sm bg-gradient-to-br from-white to-slate-50 relative hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Yêu cầu Bảo trì</p>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">Vận hành</span>
            </div>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {reportData.kpis?.maintenance_requests || 0}
              </h3>
              <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                (reportData.kpis?.maintenance_change || 0) <= 0 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-red-50 text-red-600'
              }`}>
                {(reportData.kpis?.maintenance_change || 0) > 0 ? '+' : ''}
                {reportData.kpis?.maintenance_change || 0}%
                {(reportData.kpis?.maintenance_change || 0) <= 0 
                  ? <ArrowDownRight className="w-3.5 h-3.5 ml-0.5" /> 
                  : <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                }
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Tiếp nhận trong khoảng thời gian này</p>
          </div>
        </div>

        {/* KHU VỰC BIỂU ĐỒ TRỰC QUAN (KHI NHẤN NÚT TẠO BIỂU ĐỒ - Yêu cầu 4) */}
        {showChart && (
          <div className="px-5 pb-5">
            <div className="border border-blue-200 bg-blue-50/20 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-slate-800 text-sm uppercase">
                    BIỂU ĐỒ PHÂN TÍCH TRỰC QUAN TỪ DATABASE
                  </h4>
                </div>

                {/* Chuyển đổi loại biểu đồ */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setChartSubtype('bar')}
                    className={`px-3 py-1 rounded-md transition-colors ${chartSubtype === 'bar' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Biểu đồ Doanh thu (Cột)
                  </button>
                  <button
                    onClick={() => setChartSubtype('line')}
                    className={`px-3 py-1 rounded-md transition-colors ${chartSubtype === 'line' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Xu hướng Hợp đồng (Đường)
                  </button>
                  <button
                    onClick={() => setChartSubtype('doughnut')}
                    className={`px-3 py-1 rounded-md transition-colors ${chartSubtype === 'doughnut' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Cơ cấu Bảo trì (Tròn)
                  </button>
                </div>
              </div>

              {/* Render Chart tương ứng */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 min-h-[300px] flex items-center justify-center">
                {chartSubtype === 'bar' && (
                  <div className="w-full h-72">
                    <Bar 
                      data={barChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'top' },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return `Doanh thu: ${new Intl.NumberFormat('vi-VN').format(context.raw)} VNĐ`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            ticks: {
                              callback: function(value) {
                                return (value / 1000000) + ' Tr';
                              }
                            }
                          }
                        }
                      }} 
                    />
                  </div>
                )}

                {chartSubtype === 'line' && (
                  <div className="w-full h-72">
                    <Line 
                      data={lineChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'top' },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 }
                          }
                        }
                      }} 
                    />
                  </div>
                )}

                {chartSubtype === 'doughnut' && (
                  <div className="w-full h-72 flex items-center justify-center">
                    <div className="w-64 h-64">
                      <Doughnut 
                        data={doughnutChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom' }
                          }
                        }} 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BẢNG CHỈ SỐ HOẠT ĐỘNG (Activity Table) - TRUY VẤN THẬT TỪ DATABASE */}
        <div className="px-5 pb-5">
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-300 p-3.5 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm uppercase flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                Bảng Chỉ số Hoạt động ({reportType === 'finance' ? 'Tài chính' : reportType === 'operation' ? 'Vận hành' : reportType === 'tenant' ? 'Khách thuê' : 'Tổng quan'})
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                Khoảng thời gian: <strong className="text-slate-700">{formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-700 font-bold">
                    <th className="p-3.5 border-r border-slate-200">Chỉ số Hoạt động</th>
                    <th className="p-3.5 text-center border-r border-slate-200">Giá trị thực tế</th>
                    <th className="p-3.5 text-center border-r border-slate-200">Thay đổi % (Kỳ trước)</th>
                    <th className="p-3.5 text-center">Xu hướng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {reportData.table_data && reportData.table_data.length > 0 ? (
                    reportData.table_data.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 border-r border-slate-200 font-medium text-slate-800">
                          {row.metric}
                        </td>
                        <td className="p-3.5 text-center border-r border-slate-200 font-bold text-slate-900">
                          {row.value}
                        </td>
                        <td className={`p-3.5 text-center border-r border-slate-200 font-semibold ${
                          row.change > 0 
                            ? 'text-emerald-600' 
                            : row.change < 0 
                            ? 'text-red-600' 
                            : 'text-slate-500'
                        }`}>
                          {row.change > 0 ? `+${row.change}%` : `${row.change}%`}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center">
                            {row.trend === 'up' && (
                              <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> Tăng
                              </span>
                            )}
                            {row.trend === 'down' && (
                              <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> Giảm
                              </span>
                            )}
                            {row.trend === 'neutral' && (
                              <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                <ArrowRight className="w-3.5 h-3.5 mr-0.5" /> Ổn định
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-400">
                        {loading ? 'Đang truy vấn dữ liệu từ Database...' : 'Không có dữ liệu trong khoảng thời gian này'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Báo Cáo */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <p>
            Tổng số liệu được kết xuất từ Cơ sở dữ liệu: <strong className="text-slate-700">{reportData.meta?.generated_at || `${currentDate} ${currentTime}`}</strong>
          </p>
          <p className="italic">
            Hệ thống quản lý bất động sản trực tuyến 3TV Land • Mã báo cáo: BC-{new Date().getFullYear()}-{reportType.toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}
