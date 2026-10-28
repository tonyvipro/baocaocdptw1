<?php

namespace App\Console\Commands;

use App\Models\Contract;
use App\Models\Property;
use App\Services\PropertyAvailabilityService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncPropertyAvailabilityCommand extends Command
{
    protected $signature = 'properties:sync-availability';

    protected $description = 'Rà soát và đồng bộ tính khả dụng hiển thị BĐS theo trạng thái hợp đồng (idempotent)';

    public function handle(PropertyAvailabilityService $availabilityService): int
    {
        $today = Carbon::today('Asia/Ho_Chi_Minh');
        $this->info("Bắt đầu rà soát tính khả dụng BĐS ngày {$today->toDateString()}...");

        $fixedClosedCount = 0;
        $fixedReopenedCount = 0;

        // 1. Rà soát các BĐS đang hiển thị (status = 1) mà có hợp đồng thỏa điều kiện thuê/mua thành công -> chuyển status = 2
        $activeContracts = Contract::where('status', 1)->get();
        foreach ($activeContracts as $contract) {
            $property = $contract->property;
            if ($property && (int) $property->status === 1) {
                if ($availabilityService->isContractQualifiedAsSuccessful($contract)) {
                    $availabilityService->syncForContract($contract);
                    $fixedClosedCount++;
                    $this->info(" - BĐS #{$property->id} ({$property->title}) đã ẩn do hợp đồng {$contract->contract_code} có hiệu lực.");
                }
            }
        }

        // 2. Rà soát các BĐS đang đóng (status = 2) mà không còn hợp đồng thuê hiệu lực nào -> mở lại
        $closedProperties = Property::where('status', 2)
            ->where('closed_reason', 'rented')
            ->whereNotNull('closed_contract_id')
            ->get();

        foreach ($closedProperties as $property) {
            $closedContract = Contract::find($property->closed_contract_id);
            if ($closedContract && in_array((int) $closedContract->status, [2, 3], true)) {
                $availabilityService->syncForContract($closedContract);
                $fixedReopenedCount++;
                $this->info(" - BĐS #{$property->id} ({$property->title}) đã hiển thị lại do hợp đồng {$closedContract->contract_code} kết thúc.");
            }
        }

        $this->info("Hoàn tất rà soát BĐS: Đã ẩn {$fixedClosedCount} BĐS, đã mở lại {$fixedReopenedCount} BĐS.");
        return self::SUCCESS;
    }
}
