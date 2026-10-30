<?php

return [
    // Số ngày báo trước khi hợp đồng hết hạn để chuyển sang trạng thái 'Cần hoàn trả' (refund_due)
    'refund_due_notice_days' => (int) env('DEPOSIT_REFUND_DUE_NOTICE_DAYS', 0),

    // Cho phép Admin hoàn trả tiền cọc sớm trước khi hợp đồng kết thúc (bắt buộc nhập lý do)
    'allow_early_refund' => (bool) env('DEPOSIT_ALLOW_EARLY_REFUND', true),

    // Chỉ Admin được phép hoàn trả / khấu trừ tiền cọc (Môi giới chỉ được xem và thu cọc)
    'broker_can_refund' => (bool) env('DEPOSIT_BROKER_CAN_REFUND', false),

    // Tự động sinh file PDF "Phiếu thu cọc" / "Phiếu hoàn cọc" đính kèm vào chứng từ hợp đồng
    'auto_generate_receipt_pdf' => (bool) env('DEPOSIT_AUTO_GENERATE_RECEIPT_PDF', true),
];

