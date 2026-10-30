<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Invoice;
use App\Enums\InvoiceStatus;
use App\Notifications\InvoiceNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class MarkOverdueInvoicesCommand extends Command
{
    protected $signature = 'invoices:mark-overdue';

    protected $description = 'Cập nhật trạng thái Quá hạn (status = 2) cho các hóa đơn chưa thanh toán quá hạn (chạy 00:20 hàng ngày)';

    public function handle(): int
    {
        $this->info('--- BẮT ĐẦU CRON CẬP NHẬT HÓA ĐƠN QUÁ HẠN (invoices:mark-overdue) ---');
        $today = Carbon::today();

        // Lấy hóa đơn status = 0 (Chưa thanh toán), hạn thanh toán < hôm nay
        $invoices = Invoice::where('status', InvoiceStatus::UNPAID)
            ->whereDate('due_date', '<', $today)
            ->with(['contract.customer', 'contract.broker'])
            ->get();

        $this->info("Tìm thấy {$invoices->count()} hóa đơn chưa thanh toán đã quá hạn.");

        $markedCount = 0;

        foreach ($invoices as $invoice) {
            // Kiểm tra số tiền còn nợ
            if ($invoice->remaining > 0) {
                $invoice->status = InvoiceStatus::OVERDUE;
                $invoice->save();

                $markedCount++;
                $this->line("Hóa đơn {$invoice->invoice_no} đã chuyển sang QUÁ HẠN (Hạn: " . $invoice->due_date?->format('d/m/Y') . ", Còn nợ: " . number_format($invoice->remaining, 0, ',', '.') . " VNĐ)");

                // Gửi Notification nhắc nhở khách và môi giới
                try {
                    $contract = $invoice->contract;
                    $notification = new InvoiceNotification(
                        $invoice,
                        "Cảnh báo hóa đơn quá hạn: {$invoice->invoice_no}",
                        "Hóa đơn {$invoice->invoice_no} đã quá hạn thanh toán từ ngày " . $invoice->due_date?->format('d/m/Y') . ". Số tiền còn nợ: " . number_format($invoice->remaining, 0, ',', '.') . " VNĐ. Vui lòng thanh toán sớm.",
                        'invoice_overdue'
                    );

                    if ($contract?->customer) {
                        $contract->customer->notify($notification);
                    }
                    if ($contract?->broker) {
                        $contract->broker->notify($notification);
                    }
                } catch (\Throwable $ne) {
                    Log::warning("Lỗi gửi notification quá hạn hóa đơn {$invoice->invoice_no}: " . $ne->getMessage());
                }
            }
        }

        $this->info("--- KẾT THÚC: Đã cập nhật {$markedCount} hóa đơn sang trạng thái QUÁ HẠN ---");
        return Command::SUCCESS;
    }
}
