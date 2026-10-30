<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Enums\InvoiceStatus;
use App\Enums\InvoiceType;
use App\Services\InvoiceService;
use App\Notifications\InvoiceNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class GenerateRentInvoicesCommand extends Command
{
    protected $signature = 'invoices:generate-rent';

    protected $description = 'Tự động sinh hóa đơn tiền thuê định kỳ cho các hợp đồng còn hiệu lực (chạy 00:15 hàng ngày)';

    public function handle(InvoiceService $invoiceService): int
    {
        $this->info('--- BẮT ĐẦU CRON TỰ ĐỘNG SINH HÓA ĐƠN TIỀN THUÊ (invoices:generate-rent) ---');
        $today = Carbon::today();

        // 1. Lọc hợp đồng: status = 1, next_billing_date không null và <= today
        $contracts = Contract::where('status', 1)
            ->whereNotNull('next_billing_date')
            ->whereDate('next_billing_date', '<=', $today)
            ->with(['property', 'customer', 'broker'])
            ->get();

        $this->info("Tìm thấy {$contracts->count()} hợp đồng đến hạn hoặc quá hạn sinh hóa đơn.");

        $generatedCount = 0;
        $skippedCount = 0;
        $errorCount = 0;

        foreach ($contracts as $contract) {
            try {
                DB::transaction(function () use ($contract, $today, $invoiceService, &$generatedCount, &$skippedCount) {
                    // Lock bản ghi contract để tránh race condition khi chạy đồng thời
                    $lockedContract = Contract::where('id', $contract->id)->lockForUpdate()->first();
                    if (!$lockedContract || (int)$lockedContract->status !== 1) {
                        return;
                    }

                    $cycle = (int) ($lockedContract->billing_cycle ?: 1);

                    // Vòng lặp bù kỳ nếu bị trễ nhiều kỳ (chạy lần lượt từng kỳ)
                    while (
                        $lockedContract->next_billing_date &&
                        Carbon::parse($lockedContract->next_billing_date)->lte($today) &&
                        (!$lockedContract->end_date || Carbon::parse($lockedContract->next_billing_date)->lte($lockedContract->end_date))
                    ) {
                        $periodStart = Carbon::parse($lockedContract->next_billing_date)->toDateString();
                        $periodStartDate = Carbon::parse($periodStart);

                        // Kỳ kết thúc = start + billing_cycle tháng - 1 ngày
                        $periodEndDate = $periodStartDate->copy()->addMonthsNoOverflow($cycle)->subDay();

                        // Cắt tại end_date của hợp đồng
                        if ($lockedContract->end_date && $periodEndDate->gt($lockedContract->end_date)) {
                            $periodEndDate = Carbon::parse($lockedContract->end_date);
                        }
                        $periodEnd = $periodEndDate->toDateString();

                        // Kiểm tra nếu kỳ bắt đầu đã vượt quá ngày kết thúc hợp đồng -> không sinh tiếp
                        if ($lockedContract->end_date && $periodStartDate->gt($lockedContract->end_date)) {
                            $lockedContract->next_billing_date = null;
                            $lockedContract->save();
                            break;
                        }

                        // Chống trùng: kiểm tra hóa đơn type = rent chưa hủy cho hợp đồng và kỳ này
                        $exists = Invoice::where('contract_id', $lockedContract->id)
                            ->where('type', InvoiceType::RENT)
                            ->where('billing_period_start', $periodStart)
                            ->where('status', '!=', InvoiceStatus::CANCELLED)
                            ->exists();

                        if ($exists) {
                            $this->line("Bỏ qua hợp đồng {$lockedContract->contract_code} kỳ {$periodStart}: Hóa đơn đã tồn tại.");
                            $skippedCount++;
                        } else {
                            // Tạo hóa đơn
                            $monthlyPrice = (float) $lockedContract->rental_price;
                            $totalAmount = round($cycle * $monthlyPrice, 2);
                            $dueDate = $periodStartDate->copy()->addDays(5)->toDateString(); // Hằng số cấu hình: 5 ngày

                            $invoiceNo = $invoiceService->generateInvoiceNo($lockedContract, $periodStart);

                            $monthYearLabel = $periodStartDate->format('m/Y');
                            $invoiceTitle = "Tiền thuê tháng {$monthYearLabel} - {$lockedContract->contract_code}";

                            $invoice = Invoice::create([
                                'invoice_no' => $invoiceNo,
                                'contract_id' => $lockedContract->id,
                                'issue_date' => $today->toDateString(),
                                'title' => $invoiceTitle,
                                'type' => InvoiceType::RENT,
                                'amount' => $totalAmount,
                                'due_date' => $dueDate,
                                'billing_period_start' => $periodStart,
                                'billing_period_end' => $periodEnd,
                                'status' => InvoiceStatus::UNPAID,
                                'note' => '[Tự động] Hóa đơn tiền thuê định kỳ sinh bởi hệ thống',
                                'paid_amount' => 0.00,
                                'created_by' => null,
                            ]);

                            // Tạo 1 hạng mục tiền thuê
                            $invoice->items()->create([
                                'item_name' => 'Tiền thuê nhà',
                                'quantity' => $cycle,
                                'unit_price' => $monthlyPrice,
                                'total_price' => $totalAmount,
                                'description' => "Tiền thuê {$cycle} tháng (từ {$periodStartDate->format('d/m/Y')} đến {$periodEndDate->format('d/m/Y')})",
                                'sort_order' => 1,
                            ]);

                            $generatedCount++;
                            $this->info("Đã sinh hóa đơn: {$invoiceNo} cho hợp đồng {$lockedContract->contract_code} (Số tiền: " . number_format($totalAmount, 0, ',', '.') . " VNĐ)");

                            // Gửi Notification cho khách hàng và môi giới
                            try {
                                $notification = new InvoiceNotification(
                                    $invoice,
                                    "Hóa đơn tiền thuê mới: {$invoice->invoice_no}",
                                    "Hóa đơn tiền thuê kỳ {$monthYearLabel} cho căn hộ của bạn đã được khởi tạo. Hạn thanh toán: " . Carbon::parse($dueDate)->format('d/m/Y'),
                                    'invoice_generated'
                                );

                                if ($lockedContract->customer) {
                                    $lockedContract->customer->notify($notification);
                                }
                                if ($lockedContract->broker) {
                                    $lockedContract->broker->notify($notification);
                                }
                            } catch (\Throwable $ne) {
                                Log::warning("Lỗi gửi notification hóa đơn {$invoiceNo}: " . $ne->getMessage());
                            }
                        }

                        // Đẩy next_billing_date lên kỳ tiếp theo
                        $nextCycleStart = $periodStartDate->copy()->addMonthsNoOverflow($cycle);
                        if ($lockedContract->end_date && $nextCycleStart->gt($lockedContract->end_date)) {
                            $lockedContract->next_billing_date = null; // Vượt quá hạn hợp đồng thì dừng
                        } else {
                            $lockedContract->next_billing_date = $nextCycleStart->toDateString();
                        }

                        $lockedContract->save();
                    }
                });
            } catch (\Throwable $e) {
                $errorCount++;
                $this->error("Lỗi khi xử lý hợp đồng {$contract->contract_code}: " . $e->getMessage());
                Log::error("GenerateRentInvoicesCommand Error on contract {$contract->id}: " . $e->getMessage(), [
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        $this->info("--- KẾT THÚC: Đã sinh {$generatedCount} hóa đơn, bỏ qua {$skippedCount}, lỗi {$errorCount} ---");
        return Command::SUCCESS;
    }
}
