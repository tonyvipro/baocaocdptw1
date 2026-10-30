<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>{{ $receiptTitle ?? 'Biên nhận tiền cọc' }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            color: #1f2937;
            line-height: 1.5;
            margin: 0;
            padding: 24px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            color: #1d4ed8;
            text-transform: uppercase;
        }
        .header p {
            margin: 4px 0 0;
            color: #4b5563;
            font-size: 11px;
        }
        .section {
            margin-bottom: 16px;
        }
        .section-title {
            font-weight: bold;
            font-size: 13px;
            color: #1e40af;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
            margin-bottom: 8px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        td, th {
            padding: 6px 8px;
            vertical-align: top;
        }
        .info-table td.label {
            width: 35%;
            color: #4b5563;
            font-weight: bold;
        }
        .summary-table th, .summary-table td {
            border: 1px solid #d1d5db;
            text-align: left;
        }
        .summary-table th {
            background-color: #f3f4f6;
            font-weight: bold;
        }
        .text-right {
            text-align: right !important;
        }
        .signature-box {
            margin-top: 32px;
            width: 100%;
        }
        .signature-box td {
            width: 50%;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $receiptTitle ?? 'BIÊN NHẬN GIAO DỊCH TIỀN CỌC' }}</h1>
        <p>Mã hợp đồng: <strong>{{ $contract->contract_code ?? '---' }}</strong> | Ngày lập: {{ now()->format('d/m/Y H:i') }}</p>
    </div>

    <div class="section">
        <div class="section-title">1. Thông tin Hợp đồng & Bất động sản</div>
        <table class="info-table">
            <tr>
                <td class="label">Hợp đồng:</td>
                <td>{{ $contract->contract_code ?? '' }} - {{ $contract->contract_name ?? '' }}</td>
            </tr>
            <tr>
                <td class="label">Căn hộ / BĐS:</td>
                <td>{{ $property->code ?? '' }} - {{ $property->title ?? '' }} ({{ $property->address ?? '' }})</td>
            </tr>
            <tr>
                <td class="label">Khách hàng (Bên thuê):</td>
                <td>{{ $customer->name ?? '' }} | SĐT: {{ $customer->phone ?? '---' }} | Email: {{ $customer->email ?? '---' }}</td>
            </tr>
            <tr>
                <td class="label">Thời hạn hợp đồng:</td>
                <td>
                    {{ $contract->start_date ? \Carbon\Carbon::parse($contract->start_date)->format('d/m/Y') : '---' }}
                    đến
                    {{ $contract->end_date ? \Carbon\Carbon::parse($contract->end_date)->format('d/m/Y') : '---' }}
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">2. Chi tiết giao dịch ghi nhận</div>
        <table class="summary-table">
            <thead>
                <tr>
                    <th>Mã giao dịch</th>
                    <th>Loại giao dịch</th>
                    <th>Phương thức</th>
                    <th>Thời gian</th>
                    <th class="text-right">Số tiền (VNĐ)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($transactions as $tx)
                <tr>
                    <td>{{ $tx->transaction_code }}</td>
                    <td>{{ $tx->type_label }}</td>
                    <td>{{ $tx->payment_method_label }}</td>
                    <td>{{ $tx->paid_at ? \Carbon\Carbon::parse($tx->paid_at)->format('d/m/Y H:i') : '---' }}</td>
                    <td class="text-right"><strong>{{ number_format((float)$tx->amount, 0, ',', '.') }}</strong></td>
                </tr>
                @if(!empty($tx->reason) || !empty($tx->note))
                <tr>
                    <td colspan="5">
                        @if(!empty($tx->reason)) <div><em>Lý do:</em> {{ $tx->reason }}</div> @endif
                        @if(!empty($tx->note)) <div><em>Ghi chú:</em> {{ $tx->note }}</div> @endif
                    </td>
                </tr>
                @endif
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">3. Tình trạng tài khoản tiền cọc sau giao dịch</div>
        <table class="info-table">
            <tr>
                <td class="label">Số tiền cọc cam kết:</td>
                <td><strong>{{ number_format((float)($metrics['required_amount'] ?? 0), 0, ',', '.') }} VNĐ</strong></td>
            </tr>
            <tr>
                <td class="label">Tổng đã thu:</td>
                <td>{{ number_format((float)($metrics['collected_amount'] ?? 0), 0, ',', '.') }} VNĐ</td>
            </tr>
            <tr>
                <td class="label">Tổng đã hoàn trả:</td>
                <td>{{ number_format((float)($metrics['refunded_amount'] ?? 0), 0, ',', '.') }} VNĐ</td>
            </tr>
            <tr>
                <td class="label">Tổng đã khấu trừ:</td>
                <td>{{ number_format((float)($metrics['deducted_amount'] ?? 0), 0, ',', '.') }} VNĐ</td>
            </tr>
            <tr>
                <td class="label">Số tiền cọc đang giữ (HELD):</td>
                <td><strong>{{ number_format((float)($metrics['held_amount'] ?? 0), 0, ',', '.') }} VNĐ</strong> ({{ $metrics['display_status_label'] ?? '' }})</td>
            </tr>
        </table>
    </div>

    <table class="signature-box">
        <tr>
            <td>
                <strong>ĐẠI DIỆN BÊN THUÊ</strong><br>
                <small>(Ký và ghi rõ họ tên)</small>
                <br><br><br><br>
                {{ $customer->name ?? '' }}
            </td>
            <td>
                <strong>NGƯỜI LẬP PHIẾU</strong><br>
                <small>(Ký và ghi rõ họ tên)</small>
                <br><br><br><br>
                {{ $actor->name ?? 'Quản trị hệ thống' }}
            </td>
        </tr>
    </table>
</body>
</html>

