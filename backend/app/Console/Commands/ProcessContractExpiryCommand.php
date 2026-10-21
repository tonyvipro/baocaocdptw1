<?php

namespace App\Console\Commands;

use App\Models\Contract;
use App\Models\ContractExtension;
use App\Models\User;
use App\Notifications\ContractExtensionNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessContractExpiryCommand extends Command
{
    protected $signature = 'contracts:process-expiry';

    protected $description = 'Rà soát hợp đồng sắp hết hạn (30, 15, 7 ngày) gửi thông báo, và chuyển hợp đồng quá hạn sang trạng thái Hết hiệu lực';

    public function handle(): int
    {
        $today = Carbon::today();
        $this->info("Bắt đầu xử lý rà soát trạng thái và hạn hợp đồng ngày {$today->toDateString()}...");

        // 1. Nhắc nhở hợp đồng sắp hết hạn (30, 15, 7 ngày)
        $reminderDays = Contract::REMINDER_DAYS; // [30, 15, 7]
        foreach ($reminderDays as $days) {
            $targetDate = $today->copy()->addDays($days)->toDateString();

            $expiringContracts = Contract::whereIn('status', [1, 2])
                ->whereDate('end_date', $targetDate)
                ->get();

            foreach ($expiringContracts as $contract) {
                // Cập nhật trạng thái hợp đồng thành 2 (Sắp hết hạn) nếu đang là 1 (Hiệu lực)
                if ((int)$contract->status === 1) {
                    $contract->update(['status' => 2]);
                }

                // Gửi thông báo cho môi giới và admin
                $usersToNotify = collect();
                if ($contract->broker_id) {
                    $broker = User::find($contract->broker_id);
                    if ($broker) {
                        $usersToNotify->push($broker);
                    }
                }

                $admins = User::where('role_id', 1)->get();
                $usersToNotify = $usersToNotify->merge($admins)->unique('id');

                $title = "Hợp đồng {$contract->contract_code} sắp hết hạn trong {$days} ngày";
                $message = "Hợp đồng '{$contract->contract_name}' (Mã: {$contract->contract_code}) sẽ hết hạn vào ngày " . Carbon::parse($contract->end_date)->format('d/m/Y') . ". Vui lòng liên hệ các bên để chuẩn bị gia hạn.";

                foreach ($usersToNotify as $user) {
                    try {
                        $user->notify(new ContractExtensionNotification(
                            $title,
                            $message,
                            $contract->id,
                            null,
                            'contract_expiring_soon'
                        ));
                    } catch (\Throwable $e) {
                        Log::error("Lỗi gửi thông báo sắp hết hạn HĐ {$contract->id}: " . $e->getMessage());
                    }
                }

                $this->line(" - Đã gửi nhắc nhở {$days} ngày cho HĐ {$contract->contract_code}");
            }
        }

        // 2. Chuyển hợp đồng đã quá ngày hết hạn mà không có yêu cầu gia hạn đang duyệt
        $expiredContracts = Contract::whereIn('status', [1, 2])
            ->whereDate('end_date', '<', $today->toDateString())
            ->get();

        $expiredCount = 0;
        foreach ($expiredContracts as $contract) {
            // Kiểm tra xem có yêu cầu gia hạn đang chờ duyệt (status = 1) hay không
            $hasPendingExtension = ContractExtension::where('contract_id', $contract->id)
                ->where('status', ContractExtension::STATUS_PENDING)
                ->exists();

            if (!$hasPendingExtension) {
                $contract->update(['status' => 3]); // 3: Đã hết hạn / Đã thanh lý
                $expiredCount++;

                $this->warn(" - HĐ {$contract->contract_code} đã hết hiệu lực và chuyển sang trạng thái 3.");
            }
        }

        $this->info("Hoàn tất rà soát. Đã cập nhật {$expiredCount} hợp đồng sang Hết hiệu lực.");
        return self::SUCCESS;
    }
}
