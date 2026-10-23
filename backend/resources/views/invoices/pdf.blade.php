<!DOCTYPE html>
<html lang="vi">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Hóa đơn {{ $invoice->invoice_no }}</title>
    <style>
        @page {
            margin: 25mm 20mm 25mm 20mm;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1e293b;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
        }
        .company-name {
            font-size: 16pt;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .company-info {
            font-size: 9pt;
            color: #64748b;
            margin-top: 4px;
        }
        .invoice-title-block {
            text-align: right;
            vertical-align: top;
        }
        .invoice-title {
            font-size: 18pt;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
        }
        .invoice-no {
            font-size: 11pt;
            font-weight: bold;
            color: #2563eb;
            margin-top: 4px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 6px;
        }
        .status-0 { background-color: #fef3c7; color: #92400e; } /* Chưa TT: Vàng */
        .status-1 { background-color: #dcfce7; color: #166534; } /* Đã TT: Xanh */
        .status-2 { background-color: #fee2e2; color: #991b1b; } /* Quá hạn: Đỏ */
        .status-3 { background-color: #f1f5f9; color: #475569; } /* Đã hủy: Xám */

        .info-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            background-color: #f8fafc;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        .info-grid td {
            padding: 12px 16px;
            vertical-align: top;
            width: 50%;
        }
        .info-heading {
            font-size: 10pt;
            font-weight: bold;
            color: #334155;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        .info-row {
            margin-bottom: 4px;
            font-size: 10pt;
        }
        .info-label {
            color: #64748b;
            font-size: 9.5pt;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .items-table th {
            background-color: #1e3a8a;
            color: #ffffff;
            font-size: 9.5pt;
            font-weight: bold;
            text-transform: uppercase;
            padding: 10px 12px;
            text-align: left;
            border: 1px solid #1e3a8a;
        }
        .items-table td {
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            font-size: 10pt;
        }
        .items-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }

        .summary-wrapper {
            width: 100%;
            margin-top: 10px;
            margin-bottom: 25px;
        }
        .summary-table {
            width: 48%;
            float: right;
            border-collapse: collapse;
        }
        .summary-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10.5pt;
        }
        .summary-label {
            color: #475569;
            font-weight: 500;
        }
        .summary-total {
            font-size: 12pt;
            font-weight: bold;
            color: #0f172a;
            border-top: 2px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1;
        }
        .summary-remaining {
            font-size: 12pt;
            font-weight: bold;
            color: #dc2626;
            background-color: #fef2f2;
        }
        .summary-paid {
            font-weight: bold;
            color: #16a34a;
        }

        .payment-info {
            width: 48%;
            float: left;
            background-color: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 6px;
            padding: 12px;
            font-size: 9pt;
            color: #334155;
        }
        .payment-info strong {
            color: #1e3a8a;
        }

        .clear {
            clear: both;
        }

        .note-block {
            margin-top: 20px;
            padding: 10px 14px;
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            font-size: 9pt;
            color: #78350f;
            border-radius: 0 4px 4px 0;
        }

        .footer {
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
            text-align: center;
            font-size: 8.5pt;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <table class="header-table">
        <tr>
            <td style="width: 55%; vertical-align: top;">
                <div class="company-name">HỆ THỐNG BẤT ĐỘNG SẢN 3TVLAND</div>
                <div class="company-info">Dự án Quản lý, kinh doanh và cho thuê BĐS trực tuyến</div>
                <div class="company-info">Hotline: 1900 8888 | Email: billing@3tvland.vn</div>
            </td>
            <td class="invoice-title-block">
                <div class="invoice-title">HÓA ĐƠN THANH TOÁN</div>
                <div class="invoice-no">{{ $invoice->invoice_no }}</div>
                <div class="status-badge status-{{ $invoice->status }}">
                    {{ $invoice->status_label }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Khối Thông tin khách hàng & căn hộ (Theo Hình 46) -->
    <table class="info-grid">
        <tr>
            <td>
                <div class="info-heading">Thông tin người thuê</div>
                <div class="info-row">
                    <span class="info-label">Họ và tên:</span>
                    <strong>{{ $invoice->contract?->customer?->name ?? 'N/A' }}</strong>
                </div>
                <div class="info-row">
                    <span class="info-label">Số điện thoại:</span>
                    {{ $invoice->contract?->customer?->phone ?? 'Chưa cập nhật' }}
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    {{ $invoice->contract?->customer?->email ?? 'Chưa cập nhật' }}
                </div>
                <div class="info-row">
                    <span class="info-label">Mã hợp đồng:</span>
                    <strong>{{ $invoice->contract?->contract_code ?? 'N/A' }}</strong>
                </div>
            </td>
            <td>
                <div class="info-heading">Thông tin căn hộ / BĐS</div>
                <div class="info-row">
                    <span class="info-label">Mã căn hộ:</span>
                    <strong>{{ $invoice->contract?->property?->code ?? ('P' . $invoice->contract?->property_id) }}</strong>
                </div>
                <div class="info-row">
                    <span class="info-label">Tên căn hộ:</span>
                    {{ $invoice->contract?->property?->title ?? 'Căn hộ cho thuê' }}
                </div>
                <div class="info-row">
                    <span class="info-label">Địa chỉ chi tiết:</span>
                    {{ $invoice->contract?->property?->address ?? 'Đang cập nhật' }}
                </div>
                <div class="info-row">
                    <span class="info-label">Ngày lập:</span>
                    {{ $invoice->issue_date ? $invoice->issue_date->format('d/m/Y') : date('d/m/Y') }}
                    &nbsp;|&nbsp;
                    <span class="info-label">Hạn thanh toán:</span>
                    <strong style="color: #dc2626;">{{ $invoice->due_date ? $invoice->due_date->format('d/m/Y') : 'N/A' }}</strong>
                </div>
            </td>
        </tr>
    </table>

    <!-- Bảng hạng mục (Hình 46) -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;" class="text-center">STT</th>
                <th style="width: 35%;">Hạng mục</th>
                <th style="width: 35%;">Mô tả khối lượng / đơn giá</th>
                <th style="width: 25%;" class="text-right">Thành tiền (VNĐ)</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($invoice->items as $index => $item)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td><strong>{{ $item->item_name }}</strong></td>
                    <td style="color: #475569;">
                        @if ($item->description)
                            {{ $item->description }}
                        @else
                            {{ number_format($item->quantity, 0, ',', '.') }} x {{ number_format($item->unit_price, 0, ',', '.') }} đ
                        @endif
                    </td>
                    <td class="text-right">
                        <strong>{{ number_format($item->total_price, 0, ',', '.') }} đ</strong>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" class="text-center" style="color: #94a3b8;">Không có hạng mục chi tiết</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Bảng tổng kết thanh toán (Hình 46) -->
    <div class="summary-wrapper">
        <div class="payment-info">
            <strong>Thông tin chuyển khoản thanh toán:</strong><br/>
            Ngân hàng: <strong>Vietcombank (VCB)</strong><br/>
            Số tài khoản: <strong>9999 8888 6666</strong><br/>
            Chủ tài khoản: <strong>CONG TY BĐS 3TVLAND</strong><br/>
            Nội dung CK: <strong>{{ $invoice->invoice_no }}</strong>
        </div>

        <table class="summary-table">
            <tr>
                <td class="summary-label">Tổng cộng:</td>
                <td class="text-right summary-total">{{ number_format($invoice->amount, 0, ',', '.') }} đ</td>
            </tr>
            <tr>
                <td class="summary-label">Đã thanh toán:</td>
                <td class="text-right summary-paid">{{ number_format($invoice->paid_amount, 0, ',', '.') }} đ</td>
            </tr>
            <tr>
                <td class="summary-label">Còn nợ:</td>
                <td class="text-right summary-remaining">{{ number_format($invoice->remaining, 0, ',', '.') }} đ</td>
            </tr>
        </table>
        <div class="clear"></div>
    </div>

    <!-- Ghi chú nếu có -->
    @if (!empty($invoice->note))
        <div class="note-block">
            <strong>Ghi chú:</strong> {{ $invoice->note }}
        </div>
    @endif

    @if ($invoice->status === 3 && !empty($invoice->cancel_reason))
        <div class="note-block" style="background-color: #fee2e2; border-left-color: #ef4444; color: #991b1b;">
            <strong>Lý do hủy hóa đơn:</strong> {{ $invoice->cancel_reason }}
        </div>
    @endif

    <!-- Footer -->
    <div class="footer">
        Hóa đơn điện tử được tạo tự động bởi Hệ thống Quản lý Bất động sản 3TVLAND.<br/>
        Trân trọng cảm ơn Quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi!
    </div>
</body>
</html>
