import React, { useState, useEffect } from 'react';
import {
  Building2, Percent, DollarSign, TrendingUp, TrendingDown, Clock,
  Wrench, RefreshCw, FileText, CheckCircle2, AlertCircle,
  ArrowUpRight, ArrowDownRight, Calendar, User, Eye, Activity, ShieldCheck
} from 'lucide-react';

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    cards: {
      rented: { rented_count: 0, total_count: 0, vacant_count: 0, display: '0 / Tổng số 0 căn' },
      occupancy: { rate: 0, display: '0%', types_distribution: [] },
      revenue: { amount: 0, display: '0 VNĐ', month_label: '' },
      growth: { rate: 0, is_positive: true, display: '0%', sparkline_labels: [], sparkline_data: [] },
      expiring_contracts: { count: 0, display: '0', threshold_days: 30 },
      maintenance: { in_progress: 0, total: 0, display: '0' },
    },
    recent_activities: [],
    meta: { updated_at: '', current_date: '' },
  });

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch('/api/dashboard/overview', { headers });
      if (!res.ok) {
        res = await fetch('http://localhost:8080/api/dashboard/overview', { headers });
      }

      if (!res.ok) throw new Error('Không thể tải dữ liệu Dashboard');
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setData(json.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu Dashboard:', error);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Tự động cập nhật mỗi 30 giây để theo dõi thời gian thực (Real-time tracking)
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper vẽ Mini SVG Sparkline cho xu hướng doanh thu
  const renderSparkline = (sparkData = []) => {
    if (!sparkData || sparkData.length === 0) return null;
    const max = Math.max(...sparkData, 1);
    const min = Math.min(...sparkData, 0);
    const range = max - min || 1;
    const width = 120;
    const height = 36;
    const step = width / (sparkData.length - 1 || 1);

    const points = sparkData.map((val, idx) => {
      const x = idx * step;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    }).join(' ');

    const isPositive = data.cards?.growth?.is_positive;
    const strokeColor = isPositive ? '#10b981' : '#ef4444';
    const fillColor = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Điểm nút cuối cùng */}
        {sparkData.length > 0 && (
          <circle
            cx={(sparkData.length - 1) * step}
            cy={height - ((sparkData[sparkData.length - 1] - min) / range) * (height - 8) - 4}
            r="3.5"
            fill={strokeColor}
          />
        )}
      </svg>
    );
  };

  // Helper vẽ Mini Bar visual cho Tỷ lệ lấp đầy
  const renderMiniBars = (rate = 0) => {
    const barsCount = 7;
    const filledBars = Math.round((rate / 100) * barsCount);
    return (
      <div className="flex items-end gap-1 h-8">
        {Array.from({ length: barsCount }).map((_, i) => {
          const isFilled = i < filledBars;
          const barHeight = 40 + (i * 10); // Chiều cao tăng dần
          return (
            <div
              key={i}
              style={{ height: `${barHeight}%` }}
              className={`w-2 rounded-t transition-all duration-500 ${
                isFilled
                  ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                  : 'bg-slate-700/40'
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Tiêu đề trang Dashboard & Thanh trạng thái Real-time */}
      <div className="giang-page-heading flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Tổng quan hoạt động
            </span>
            <span className="text-xs text-slate-500">• Cập nhật lúc {data.meta?.updated_at || 'Đang tải...'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 uppercase tracking-wide mt-1">
            Tổng quan hệ thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Theo dõi thời gian thực các chỉ số vận hành, tài chính và hoạt động bất động sản
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Tải lại số liệu mới nhất từ Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-700 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* NHÓM THẺ CHỈ SỐ TỔNG QUAN (6 Cards chuẩn Hình 48) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Thẻ 1: Căn hộ đang thuê */}
        <div className="relative overflow-hidden bg-white backdrop-blur-xl border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-cyan-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Căn hộ đang thuê
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-700 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {data.cards?.rented?.display || '0 / Tổng số 0 căn'}
            </h3>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 pt-2.5">
            <span>Còn trống / Sẵn sàng:</span>
            <span className="font-bold text-amber-700">{data.cards?.rented?.vacant_count || 0} căn</span>
          </div>
          {/* Progress bar tỷ lệ lấp đầy */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(data.cards?.occupancy?.rate || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Thẻ 2: Tỷ lệ lấp đầy (Kèm biểu đồ cột mini) */}
        <div className="relative overflow-hidden bg-white backdrop-blur-xl border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-cyan-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tỷ lệ lấp đầy
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-700 group-hover:scale-110 transition-transform">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {data.cards?.occupancy?.display || '0%'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Phòng có hợp đồng hiệu lực</p>
            </div>
            {/* Biểu đồ cột thu nhỏ trực quan */}
            <div className="pr-1">
              {renderMiniBars(data.cards?.occupancy?.rate || 0)}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 pt-2.5">
            <span>Mục tiêu vận hành:</span>
            <span className="font-bold text-emerald-700">≥ 85%</span>
          </div>
        </div>

        {/* Thẻ 3: Tổng thu tháng này */}
        <div className="relative overflow-hidden bg-white backdrop-blur-xl border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng thu tháng này
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight text-emerald-700">
              {data.cards?.revenue?.display || '0 VNĐ'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Kỳ: <strong className="text-slate-600">{data.cards?.revenue?.month_label || 'Tháng này'}</strong>
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 pt-2.5">
            <span>Hóa đơn đã thu tiền:</span>
            <span className="font-bold text-slate-900">Status = 1 (Đã TT)</span>
          </div>
        </div>

        {/* Thẻ 4: Doanh thu so với tháng trước (Kèm Sparkline Chart) */}
        <div className="relative overflow-hidden bg-white backdrop-blur-xl border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-white/20 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Doanh thu so với tháng trước
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              data.cards?.growth?.is_positive
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {data.cards?.growth?.is_positive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  data.cards?.growth?.is_positive ? 'text-emerald-700' : 'text-red-400'
                }`}>
                  {data.cards?.growth?.display || '0%'}
                </h3>
                {data.cards?.growth?.is_positive ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-700" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-red-400" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Xu hướng 6 tháng gần nhất</p>
            </div>
            {/* Sparkline mini line chart */}
            <div className="pr-1">
              {renderSparkline(data.cards?.growth?.sparkline_data)}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 pt-2.5">
            <span>So sánh chu kỳ:</span>
            <span className="font-bold text-slate-600">Tháng N vs Tháng N-1</span>
          </div>
        </div>

        {/* Thẻ 5: Hợp đồng sắp hết hạn */}
        <div className="relative overflow-hidden bg-white backdrop-blur-xl border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-amber-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hợp đồng sắp hết hạn
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl sm:text-4xl font-black text-amber-700 tracking-tight">
              {data.cards?.expiring_contracts?.display || '0'}
            </h3>
            <span className="text-xs font-semibold text-slate-500">hợp đồng cần chú ý</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 pt-2.5">
            <span>Thời hạn theo dõi:</span>
            <span className="font-bold text-amber-700">Trong 30 ngày tới</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700/80 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Cần liên hệ gia hạn hoặc tái ký hợp đồng</span>
          </div>
        </div>

        {/* Thẻ 6: Yêu cầu bảo trì đang xử lý */}
        <div className="relative overflow-hidden bg-white backdrop-blur-xl border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-orange-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Yêu cầu bảo trì đang xử lý
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-700 group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl sm:text-4xl font-black text-orange-700 tracking-tight">
              {data.cards?.maintenance?.display || '0'}
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              / Tổng số {data.cards?.maintenance?.total || 0} công việc
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 pt-2.5">
            <span>Trạng thái kỹ thuật:</span>
            <span className="font-bold text-orange-700">Đang thực hiện (In Progress)</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-orange-700/80 bg-orange-500/10 p-1.5 rounded-lg border border-orange-500/20">
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span>Cần giám sát tiến độ khắc phục sự cố</span>
          </div>
        </div>

      </div>

      {/* BẢNG HOẠT ĐỘNG GẦN ĐÂY (Recent Activities) */}
      <div className="bg-white backdrop-blur-xl border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-700">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide">
                Hoạt động gần đây (Recent Activities)
              </h2>
              <p className="text-xs text-slate-500">Nhật ký sự kiện hệ thống ghi nhận theo thời gian thực</p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
            10 sự kiện mới nhất
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-white/[0.03] text-slate-500 font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-5 w-44">Thời gian</th>
                <th className="py-3.5 px-5 w-40">Phân loại</th>
                <th className="py-3.5 px-5">Nội dung sự kiện chi tiết</th>
                <th className="py-3.5 px-5 text-right w-48">Thông tin liên quan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {data.recent_activities && data.recent_activities.length > 0 ? (
                data.recent_activities.map((act, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    {/* Cột 1: Thời gian */}
                    <td className="py-4 px-5 whitespace-nowrap text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{act.time_formatted}</span>
                      </div>
                    </td>

                    {/* Cột 2: Phân loại */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      {act.type === 'CONTRACT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/10 text-blue-700 border border-blue-500/20">
                          <FileText className="w-3 h-3" />
                          {act.badge}
                        </span>
                      )}
                      {act.type === 'PAYMENT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          <DollarSign className="w-3 h-3" />
                          {act.badge}
                        </span>
                      )}
                      {act.type === 'MAINTENANCE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                          <Wrench className="w-3 h-3" />
                          {act.badge}
                        </span>
                      )}
                      {act.type === 'APPOINTMENT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/10 text-purple-700 border border-purple-500/20">
                          <Calendar className="w-3 h-3" />
                          {act.badge}
                        </span>
                      )}
                    </td>

                    {/* Cột 3: Nội dung sự kiện */}
                    <td className="py-4 px-5">
                      <p className="font-semibold text-slate-900 text-sm line-clamp-1">
                        {act.content}
                      </p>
                    </td>

                    {/* Cột 4: Chi tiết */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <span className={`text-xs font-bold ${
                        act.type === 'PAYMENT' || act.type === 'CONTRACT'
                          ? 'text-emerald-700'
                          : 'text-slate-500'
                      }`}>
                        {act.detail}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-500">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-700" />
                        Đang truy vấn dữ liệu thời gian thực từ Database...
                      </span>
                    ) : (
                      'Chưa có hoạt động nào được ghi nhận gần đây.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer bảng */}
        <div className="p-4 border-t border-slate-200 bg-white/[0.01] flex flex-wrap items-center justify-between text-xs text-slate-500">
          <span>Hệ thống quản lý bất động sản trực tuyến 3TV Land</span>
          <span>Dữ liệu tự động cập nhật mỗi 30 giây</span>
        </div>
      </div>
    </div>
  );
}
