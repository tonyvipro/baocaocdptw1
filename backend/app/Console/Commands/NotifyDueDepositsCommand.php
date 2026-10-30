<?php

namespace App\Console\Commands;

use App\Enums\DepositDisplayStatus;
use App\Models\User;
use App\Notifications\DepositNotification;
use App\Queries\DepositQuery;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotifyDueDepositsCommand extends Command
{
    protected $signature = 'deposits:notify-due';

    protected $description = 'Gửi thông báo nhắc các khoản tiền cọc ở trạng thái Cần hoàn trả (refund_due) cho Admin và Môi giới phụ trách (idempotent theo ngày)';

    public function handle(DepositQuery $depositQuery): int
    {
        $todayStr = Carbon::today('Asia/Ho_Chi_Minh')->toDateString();
        $rows = $depositQuery->buildBaseQuery()
            ->with(['contract.property', 'contract.customer', 'contract.broker'])
            ->get();

        $admins = User::where('role_id', 1)->where('is_active', 1)->get();
        $threshold = DepositQuery::getRefundDueThresholdDate();
        $notifiedCount = 0;

        foreach ($rows as $deposit) {
            $metrics = DepositQuery::computeMetrics($deposit, $threshold);
            if ($metrics['display_status'] !== DepositDisplayStatus::REFUND_DUE) {
                continue;
            }

            $contract = $deposit->contract;
            if (!$contract) {
                continue;
            }

            $recipients = collect($admins);
            if ($contract->broker && (int) $contract->broker->is_active === 1) {
                $recipients->push($contract->broker);
            }
            $recipients = $recipients->unique('id');

            $heldFormatted = number_format($metrics['held_amount'], 0, ',', '.') . ' VNĐ';
            $title = "Nhắc hoàn trả tiền cọc hợp đồng {$contract->contract_code}";
            $message = "Khoản tiền cọc đang giữ {$heldFormatted} của hợp đồng '{$contract->contract_name}' đã đến hạn cần hoàn trả/quyết toán.";

            foreach ($recipients as $recipient) {
                // Chống gửi trùng trong cùng 1 ngày cho cùng 1 người nhận và 1 khoản cọc
                $alreadySent = DB::table('notifications')
                    ->where('notifiable_type', User::class)
                    ->where('notifiable_id', $recipient->id)
                    ->whereDate('created_at', $todayStr)
                    ->where('data', 'LIKE', '%"deposit_id":' . $deposit->id . '%')
                    ->where('data', 'LIKE', '%"type":"deposit_refund_due"%')
                    ->exists();

                if ($alreadySent) {
                    continue;
                }

                try {
                    $recipient->notify(new DepositNotification(
                        $deposit,
                        $title,
                        $message,
                        'deposit_refund_due',
                        [
                            'held_amount' => $metrics['held_amount'],
                            'notice_date' => $todayStr,
                        ]
                    ));
                    $notifiedCount++;
                } catch (\Throwable $e) {
                    Log::warning('Lỗi gửi thông báo nhắc hạn hoàn cọc: ' . $e->getMessage());
                }
            }
        }

        $this->info("Đã kiểm tra và gửi {$notifiedCount} thông báo nhắc hạn hoàn trả tiền cọc.");

        return self::SUCCESS;
    }
}

