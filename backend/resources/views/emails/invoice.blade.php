<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <title>Thông báo hóa đơn thanh toán {{ $invoice->invoice_no }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #334155;
            background-color: #f1f5f9;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #1e3a8a;
            color: #ffffff;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            text-transform: uppercase;
        }
        .content {
            padding: 24px;
        }
        .invoice-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
        }
        .invoice-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #1e3a8a;
            border-top: 2px dashed #cbd5e1;
            padding-top: 10px;
            margin-top: 10px;
        }
        .remaining-amount {
            font-size: 16px;
            font-weight: bold;
            color: #dc2626;
        }
        .bank-info {
            background-color: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 12px 16px;
            margin-top: 20px;
            font-size: 13px;
        }
        .footer {
            background-color: #f8fafc;
            padding: 16px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>THÔNG BÁO HÓA ĐƠN THANH TOÁN</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Hệ thống Bất động sản 3TVLAND</p>
        </div>
        <div class="content">
            <p>Kính gửi Quý khách <strong>{{ $invoice->contract?->customer?->name ?? 'Quý khách' }}</strong>,</p>
            <p>Hệ thống trân trọng gửi tới Quý khách thông báo thanh toán cho hóa đơn: <strong>{{ $invoice->title }}</strong> thuộc hợp đồng thuê căn hộ <strong>{{ $invoice->contract?->property?->code ?? ('P' . $invoice->contract?->property_id) }}</strong>.</p>
            
            <div class="invoice-card">
                <div class="invoice-row">
                    <span>Số hóa đơn:</span>
                    <strong>{{ $invoice->invoice_no }}</strong>
                </div>
                <div class="invoice-row">
                    <span>Ngày lập:</span>
                    <span>{{ $invoice->issue_date ? $invoice->issue_date->format('d/m/Y') : date('d/m/Y') }}</span>
                </div>
                <div class="invoice-row">
                    <span>Hạn thanh toán:</span>
                    <strong style="color: #dc2626;">{{ $invoice->due_date ? $invoice->due_date->format('d/m/Y') : 'N/A' }}</strong>
                </div>
                <div class="invoice-row total-amount">
                    <span>Tổng số tiền:</span>
                    <span>{{ number_format($invoice->amount, 0, ',', '.') }} VNĐ</span>
                </div>
                <div class="invoice-row">
                    <span>Đã thanh toán:</span>
                    <span style="color: #16a34a; font-weight: bold;">{{ number_format($invoice->paid_amount, 0, ',', '.') }} VNĐ</span>
                </div>
                <div class="invoice-row remaining-amount">
                    <span>Số tiền còn nợ:</span>
                    <span>{{ number_format($invoice->remaining, 0, ',', '.') }} VNĐ</span>
                </div>
            </div>

            <p><em>* Chi tiết các hạng mục và bảng tính vui lòng xem trong file PDF đính kèm theo thư này.</em></p>

            <div class="bank-info">
                <strong>Thông tin chuyển khoản thanh toán:</strong><br/>
                - Ngân hàng: <strong>Vietcombank (VCB)</strong><br/>
                - Số tài khoản: <strong>9999 8888 6666</strong><br/>
                - Chủ tài khoản: <strong>CONG TY BĐS 3TVLAND</strong><br/>
                - Nội dung chuyển khoản: <strong>{{ $invoice->invoice_no }}</strong>
            </div>

            <p style="margin-top: 20px;">Nếu Quý khách đã thanh toán, xin vui lòng bỏ qua email thông báo này. Mọi thắc mắc xin liên hệ hotline: <strong>1900 8888</strong>.</p>
        </div>
        <div class="footer">
            Email này được gửi tự động từ Hệ thống Quản lý BĐS 3TVLAND.<br/>
            Địa chỉ: 208 Nguyễn Hữu Cảnh, P. 22, Bình Thạnh, TP. Hồ Chí Minh.
        </div>
    </div>
</body>
</html>
