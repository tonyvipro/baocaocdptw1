<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class InvoiceNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Invoice $invoice,
        public string $title,
        public string $message,
        public string $type = 'invoice_generated'
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'invoice_id' => $this->invoice->id,
            'invoice_no' => $this->invoice->invoice_no,
            'contract_id' => $this->invoice->contract_id,
            'amount' => (float) $this->invoice->amount,
            'due_date' => $this->invoice->due_date?->format('Y-m-d'),
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
        ];
    }
}
