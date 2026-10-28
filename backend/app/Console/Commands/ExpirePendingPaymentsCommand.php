<?php

namespace App\Console\Commands;

use App\Enums\TransactionStatus;
use App\Models\Transaction;
use App\Services\PaymentService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ExpirePendingPaymentsCommand extends Command
{
    protected $signature = 'payments:expire-pending';

    protected $description = 'Kiểm tra và chuyển các giao dịch QR quá hạn sang Hết hạn (hỏi lại cổng trước khi đóng)';

    public function handle(PaymentService $paymentService): int
    {
        $now = Carbon::now('Asia/Ho_Chi_Minh');
        $this->info("Bắt đầu rà soát các giao dịch QR quá hạn lúc {$now->toDateTimeString()}...");

        $pendingTransactions = Transaction::where('status', TransactionStatus::PENDING)
            ->where('source', 'gateway')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $now)
            ->get();

        $expiredCount = 0;
        $savedByGatewayCount = 0;

        foreach ($pendingTransactions as $tx) {
            try {
                // Hỏi lại cổng xem khách đã thanh toán vào phút chót chưa
                $updatedTx = $paymentService->checkAndSyncStatus($tx);

                if ((int) $updatedTx->status === TransactionStatus::SUCCESS) {
                    $savedByGatewayCount++;
                    $this->info(" - Giao dịch {$tx->transaction_code} đã được cổng xác nhận thành công vào phút chót.");
                } elseif ((int) $updatedTx->status === TransactionStatus::EXPIRED) {
                    $expiredCount++;
                    $this->line(" - Giao dịch {$tx->transaction_code} đã chuyển sang Hết hạn.");
                } else {
                    // Cập nhật dứt điểm sang Hết hạn
                    $tx->update([
                        'status' => TransactionStatus::EXPIRED,
                        'failure_reason' => 'Giao dịch hết hạn thanh toán (TTL expired).',
                    ]);
                    $expiredCount++;
                    $this->line(" - Giao dịch {$tx->transaction_code} đã chuyển sang Hết hạn.");
                }
            } catch (\Throwable $e) {
                Log::error("Lỗi khi hết hạn giao dịch {$tx->transaction_code}: " . $e->getMessage());
            }
        }

        $this->info("Hoàn tất rà soát: {$expiredCount} giao dịch hết hạn, {$savedByGatewayCount} giao dịch thanh toán thành công muộn.");
        return self::SUCCESS;
    }
}
