<?php

namespace App\Contracts;

use App\Models\Transaction;
use Illuminate\Http\Request;

interface PaymentGatewayInterface
{
    /**
     * Tên định danh cổng thanh toán ('sepay', 'mock', 'momo', 'zalopay')
     */
    public function getName(): string;

    /**
     * Khởi tạo đơn thanh toán trên cổng, sinh dữ liệu QR hoặc URL thanh toán
     *
     * @param Transaction $transaction Giao dịch đang ở trạng thái PENDING
     * @return array [
     *   'gateway_order_id' => string,
     *   'qr_content' => string|null,
     *   'pay_url' => string|null,
     *   'expires_at' => string|DateTime,
     *   'extra' => array
     * ]
     */
    public function createOrder(Transaction $transaction): array;

    /**
     * Xác thực chữ ký và bóc tách dữ liệu từ Callback/IPN của cổng
     *
     * @param Request $request
     * @return array [
     *   'is_valid' => bool,
     *   'gateway_order_id' => string|null,
     *   'gateway_txn_id' => string|null,
     *   'amount' => float,
     *   'status' => int, // TransactionStatus constant
     *   'raw_payload' => array,
     *   'error' => string|null
     * ]
     */
    public function verifyCallback(Request $request): array;

    /**
     * Chủ động truy vấn trạng thái đơn từ cổng thanh toán
     *
     * @param Transaction $transaction
     * @return array [
     *   'is_success' => bool,
     *   'status' => int, // TransactionStatus constant
     *   'gateway_txn_id' => string|null,
     *   'amount' => float|null,
     *   'raw' => array
     * ]
     */
    public function queryStatus(Transaction $transaction): array;

    /**
     * Hủy đơn trên cổng thanh toán (nếu cổng có hỗ trợ API hủy)
     *
     * @param Transaction $transaction
     * @return bool
     */
    public function cancelOrder(Transaction $transaction): bool;
}
