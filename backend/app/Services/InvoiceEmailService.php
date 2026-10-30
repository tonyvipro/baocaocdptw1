<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\User;
use App\Mail\InvoiceMailable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\Exceptions\HttpResponseException;
use Carbon\Carbon;

class InvoiceEmailService
{
    public function __construct(
        protected InvoiceService $invoiceService
    ) {}

    /**
     * Gửi email hóa đơn kèm PDF đính kèm (Spec 3.8)
     */
    public function sendInvoiceEmail(Invoice $invoice, ?string $overrideEmail = null, ?User $actor = null): array
    {
        $invoice->loadMissing(['contract.customer', 'contract.property', 'items']);

        // 1. Xác định địa chỉ email nhận
        $recipientEmail = trim($overrideEmail ?: ($invoice->contract?->customer?->email ?? ''));

        if (empty($recipientEmail) || !filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
            throw new HttpResponseException(response()->json([
                'message' => 'Không thể gửi email: Địa chỉ email khách hàng không tồn tại hoặc lỗi máy chủ SMTP.',
            ], 422));
        }

        // 2. Chống spam / bấm liên tục (Rate limit 1 phút)
        if ($invoice->email_sent_at) {
            $lastSent = Carbon::parse($invoice->email_sent_at);
            if ($lastSent->diffInSeconds(Carbon::now()) < 60) {
                $secondsWait = 60 - $lastSent->diffInSeconds(Carbon::now());
                throw new HttpResponseException(response()->json([
                    'message' => "Vui lòng đợi {$secondsWait} giây trước khi gửi lại email cho hóa đơn này.",
                ], 429));
            }
        }

        // 3. Tiến hành gửi Mail
        try {
            Mail::to($recipientEmail)->send(new InvoiceMailable($invoice));
        } catch (\Throwable $e) {
            throw new HttpResponseException(response()->json([
                'message' => 'Không thể gửi email: Địa chỉ email khách hàng không tồn tại hoặc lỗi máy chủ SMTP.',
                'error_detail' => config('app.debug') ? $e->getMessage() : null,
            ], 500));
        }

        // 4. Cập nhật email_sent_at và ghi log
        $now = Carbon::now();
        $invoice->email_sent_at = $now;
        $invoice->save();

        $this->invoiceService->logActivity($actor?->id, 'SEND_INVOICE_EMAIL', $invoice->id, null, [
            'invoice_no' => $invoice->invoice_no,
            'recipient_email' => $recipientEmail,
            'sent_at' => $now->toDateTimeString(),
        ]);

        return [
            'email' => $recipientEmail,
            'email_sent_at' => $now->format('Y-m-d H:i:s'),
        ];
    }
}
