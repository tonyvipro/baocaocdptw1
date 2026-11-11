<!DOCTYPE html>
<html lang="vi">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Báo Cáo Thống Kê - 3TV Land</title>
    <style>
        @page {
            margin: 20mm 15mm 20mm 15mm;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            color: #1e293b;
            line-height: 1.5;
            background: #ffffff;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .company-name {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            text-transform: uppercase;
        }
        .company-sub {
            font-size: 10px;
            color: #64748b;
        }
        .report-title-container {
            text-align: center;
            margin: 14px 0 16px 0;
        }
        .report-title {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            margin: 0;
        }
        .report-meta {
            font-size: 11px;
            color: #475569;
            margin-top: 4px;
        }
        .kpi-table {
            width: 100%;
            margin-bottom: 20px;
            border-spacing: 10px;
            border-collapse: separate;
        }
        .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px;
            text-align: center;
            width: 33.33%;
        }
        .kpi-label {
            font-size: 9px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .kpi-value {
            font-size: 14px;
            font-weight: bold;
            color: #0f172a;
        }
        .kpi-sub {
            font-size: 9px;
            color: #059669;
            margin-top: 2px;
        }
        .kpi-sub-negative {
            color: #dc2626;
        }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #1e293b;
            text-transform: uppercase;
            margin-bottom: 8px;
            border-left: 3px solid #2563eb;
            padding-left: 8px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .data-table th {
            background: #f1f5f9;
            color: #334155;
            font-weight: bold;
            text-align: left;
            padding: 7px 10px;
            font-size: 10px;
            border: 1px solid #cbd5e1;
        }
        .data-table td {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
            font-size: 10px;
        }
        .data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .trend-up { color: #059669; font-weight: bold; }
        .trend-down { color: #dc2626; font-weight: bold; }
        .trend-neutral { color: #64748b; }
        .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            font-size: 9px;
            color: #94a3b8;
            margin-top: 25px;
        }
        .footer-table {
            width: 100%;
        }
        .empty-notice {
            background: #f8fafc;
            border: 1px dashed #cbd5e1;
            padding: 10px;
            text-align: center;
            color: #64748b;
            font-size: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td style="width: 65%;">
                <div class="company-name">SÀN GIAO DỊCH BẤT ĐỘNG SẢN 3TV LAND</div>
                <div class="company-sub">Hệ thống Quản lý Bất động sản và Báo cáo trực tuyến</div>
            </td>
            <td style="width: 35%; text-align: right;">
                <div style="font-size: 9px; color: #64748b;">Thời điểm xuất:</div>
                <div style="font-size: 10px; font-weight: bold; color: #1e293b;">{{ $meta['generated_at'] ?? now()->format('d/m/Y H:i:s') }}</div>
            </td>
        </tr>
    </table>

    <div class="report-title-container">
        <h1 class="report-title">
            BÁO CÁO THỐNG KÊ {{ $meta['report_type'] === 'finance' ? 'TÀI CHÍNH' : ($meta['report_type'] === 'operation' ? 'VẬN HÀNH' : ($meta['report_type'] === 'tenant' ? 'KHÁCH THUÊ' : 'TỔNG QUAN')) }}
        </h1>
        <div class="report-meta">
            Khoảng thời gian: <strong>{{ $meta['period_label'] ?? ($meta['start_date_formatted'] . ' - ' . $meta['end_date_formatted']) }}</strong>
        </div>
    </div>

    <!-- 3 Thẻ KPI tổng hợp -->
    <table class="kpi-table">
        <tr>
            <td class="kpi-card">
                <div class="kpi-label">Tổng Doanh Thu Thực Thu</div>
                <div class="kpi-value">{{ number_format($kpis['total_revenue'] ?? 0, 0, ',', '.') }} VNĐ</div>
                <div class="kpi-sub {{ ($kpis['revenue_change'] ?? 0) < 0 ? 'kpi-sub-negative' : '' }}">
                    {{ ($kpis['revenue_change'] ?? 0) >= 0 ? '+' : '' }}{{ $kpis['revenue_change'] ?? 0 }}% so với kỳ trước
                </div>
            </td>
            <td class="kpi-card">
                <div class="kpi-label">Tỷ Lệ Lấp Đầy</div>
                <div class="kpi-value">{{ $kpis['occupancy_rate'] ?? 0 }}%</div>
                <div class="kpi-sub {{ ($kpis['occupancy_change'] ?? 0) < 0 ? 'kpi-sub-negative' : '' }}">
                    {{ $kpis['rented_properties'] ?? 0 }}/{{ $kpis['total_properties'] ?? 0 }} BĐS đang thuê
                </div>
            </td>
            <td class="kpi-card">
                <div class="kpi-label">Yêu Cầu Bảo Trì</div>
                <div class="kpi-value">{{ $kpis['maintenance_requests'] ?? 0 }}</div>
                <div class="kpi-sub {{ ($kpis['maintenance_change'] ?? 0) > 0 ? 'kpi-sub-negative' : '' }}">
                    {{ ($kpis['maintenance_change'] ?? 0) >= 0 ? '+' : '' }}{{ $kpis['maintenance_change'] ?? 0 }}% tiếp nhận
                </div>
            </td>
        </tr>
    </table>

    @if(($kpis['total_revenue'] ?? 0) == 0 && ($kpis['maintenance_requests'] ?? 0) == 0 && ($kpis['rented_properties'] ?? 0) == 0)
        <div class="empty-notice">
            Kỳ báo cáo không phát sinh giao dịch mới. Toàn bộ số liệu vận hành và doanh thu trong khoảng thời gian này ghi nhận giá trị 0.
        </div>
    @endif

    <!-- Bảng chỉ số hoạt động chi tiết -->
    <div class="section-title">Bảng Chỉ Số Hoạt Động Chi Tiết</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 45%;">Chỉ số hoạt động</th>
                <th style="width: 25%; text-align: center;">Giá trị thực tế</th>
                <th style="width: 15%; text-align: center;">Thay đổi (%)</th>
                <th style="width: 15%; text-align: center;">Xu hướng</th>
            </tr>
        </thead>
        <tbody>
            @forelse($table_data as $row)
                <tr>
                    <td><strong>{{ $row['metric'] }}</strong></td>
                    <td class="text-center font-bold">{{ $row['value'] }}</td>
                    <td class="text-center {{ ($row['change'] ?? 0) > 0 ? 'trend-up' : (($row['change'] ?? 0) < 0 ? 'trend-down' : 'trend-neutral') }}">
                        {{ ($row['change'] ?? 0) > 0 ? '+' : '' }}{{ $row['change'] ?? 0 }}%
                    </td>
                    <td class="text-center">
                        @if(($row['trend'] ?? '') === 'up')
                            <span class="trend-up">Tăng</span>
                        @elseif(($row['trend'] ?? '') === 'down')
                            <span class="trend-down">Giảm</span>
                        @else
                            <span class="trend-neutral">Ổn định</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" class="text-center" style="color: #94a3b8; padding: 15px;">
                        Không có dữ liệu phát sinh trong khoảng thời gian này (Số liệu ghi nhận 0).
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        <table class="footer-table">
            <tr>
                <td>Hệ thống quản lý bất động sản trực tuyến 3TV Land</td>
                <td style="text-align: right;">Mã báo cáo: BC-{{ date('Y') }}-{{ strtoupper($meta['report_type'] ?? 'OVERVIEW') }}</td>
            </tr>
        </table>
    </div>
</body>
</html>

