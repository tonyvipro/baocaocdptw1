<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Services\InvoicePdfService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class InvoiceMailable extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invoice $invoice
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Thông báo hóa đơn thanh toán ' . $this->invoice->invoice_no . ' - 3TVLAND',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.invoice',
            with: [
                'invoice' => $this->invoice,
            ],
        );
    }

    public function attachments(): array
    {
        $pdfService = app(InvoicePdfService::class);
        $pdfContent = $pdfService->getPdfOutput($this->invoice);
        $fileName = ($this->invoice->invoice_no ?: 'invoice-' . $this->invoice->id) . '.pdf';

        return [
            Attachment::fromData(fn () => $pdfContent, $fileName)
                ->withMime('application/pdf'),
        ];
    }
}
