<?php

namespace App\Console\Commands;

use App\Models\Contract;
use App\Services\DepositService;
use Illuminate\Console\Command;

class BackfillDepositsCommand extends Command
{
    protected $signature = 'deposits:backfill';

    protected $description = 'Tạo bản ghi contract_deposits và hóa đơn deposit còn thiếu cho các hợp đồng có deposit_amount > 0 (idempotent)';

    public function handle(DepositService $depositService): int
    {
        $contracts = Contract::with('property')
            ->where('deposit_amount', '>', 0)
            ->orderBy('id', 'asc')
            ->get();

        $createdOrSynced = 0;
        foreach ($contracts as $contract) {
            $deposit = $depositService->ensureDepositForContract($contract, $contract->broker_id);
            if ($deposit) {
                $createdOrSynced++;
            }
        }

        $this->info("Đã đồng bộ / backfill thành công {$createdOrSynced} tài khoản tiền cọc từ {$contracts->count()} hợp đồng có deposit_amount > 0.");

        return self::SUCCESS;
    }
}

