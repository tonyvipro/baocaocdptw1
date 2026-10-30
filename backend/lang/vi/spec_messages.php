<?php

return [
    // 1. CÁC DÒNG NGUYÊN VĂN BẢNG LỖI CỦA SPEC
    'row_1_not_found' => 'Dữ liệu không tồn tại trong hệ thống.',
    'row_2_stale_version' => 'Dữ liệu đã được người khác thay đổi. Vui lòng tải lại để xem phiên bản mới nhất.',
    'row_3_invoice_not_found' => 'Hóa đơn không tồn tại.',
    'row_19_deposit_exceed' => 'Số tiền hoàn cọc vượt quá số tiền cọc đang giữ.',
    'row_20_amount_positive' => 'Số tiền phải thu phải lớn hơn 0.',
    'row_20_contract_invalid' => 'Hợp đồng tương ứng không còn hiệu lực.',

    // 2. CÁC THÔNG BÁO NGOÀI SPEC (PHỤC VỤ THANH TOÁN VÀ VÒNG ĐỜI BĐS)
    'qr_created' => 'Đã tạo mã thanh toán. Vui lòng quét mã trong :minutes phút.',
    'gateway_success' => 'Thanh toán thành công! Hóa đơn :invoice_no đã được cập nhật.',
    'gateway_failed' => 'Thanh toán không thành công. Vui lòng thử lại.',
    'gateway_expired' => 'Giao dịch thanh toán đã hết hạn. Vui lòng tạo mã mới.',
    'cancelled_success' => 'Đã hủy giao dịch thanh toán.',
    'has_pending_transaction' => 'Hóa đơn đang có một giao dịch chờ thanh toán. Vui lòng hoàn tất hoặc hủy giao dịch đó.',
    'out_of_gateway_limits' => 'Số tiền thanh toán qua :gateway phải từ :min đến :max. Vui lòng chọn hình thức thanh toán khác.',
    'gateway_connect_error' => 'Không thể kết nối cổng thanh toán :gateway. Vui lòng thử lại hoặc chọn phương thức khác.',
    'reconciliation_needed' => 'Giao dịch cần được đối soát thủ công.',
    'manual_recorded_success' => 'Ghi nhận thanh toán thành công!',
    'amount_exceeds_remaining' => 'Số tiền thanh toán vượt quá số tiền còn nợ (:amount).',
    'invoice_fully_paid' => 'Hóa đơn này đã được thanh toán đủ.',
    'invoice_cancelled' => 'Không thể ghi nhận thanh toán cho hóa đơn đã hủy.',
    'appointment_property_unavailable' => 'Bất động sản này đã được thuê hoặc bán, không thể đặt lịch xem.',
    'property_rented_banner' => 'Bất động sản này đã được cho thuê.',
    'property_sold_banner' => 'Bất động sản này đã được bán.',
    'manual_cancelled_success' => 'Đã hủy ghi nhận thanh toán thủ công.',
];
