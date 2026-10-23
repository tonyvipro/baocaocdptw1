<?php

namespace App\Services;

use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\Response;

class InvoicePdfService
{
    /**
     * Tạo đối tượng DomPDF cho hóa đơn
     */
    public function generatePdf(Invoice $invoice): \Barryvdh\DomPDF\PDF
    {
        $invoice->loadMissing([
            'contract.property',
            'contract.customer',
            'contract.broker',
            'items',
            'transactions',
        ]);

        $pdf = Pdf::loadView('invoices.pdf', [
            'invoice' => $invoice,
        ]);

        $pdf->setPaper('a4', 'portrait');
        $pdf->setOption([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'defaultFont' => 'DejaVu Sans',
        ]);

        return $pdf;
    }

    /**
     * Trả về HTTP Response hiển thị inline hoặc tải về file PDF
     */
    public function generatePdfResponse(Invoice $invoice, bool $download = false): Response
    {
        $pdf = $this->generatePdf($invoice);
        $fileName = ($invoice->invoice_no ?: 'invoice-' . $invoice->id) . '.pdf';

        if ($download) {
            return $pdf->download($fileName);
        }

        return $pdf->stream($fileName);
    }

    /**
     * Lấy chuỗi nhị phân raw của PDF (dùng để đính kèm email)
     */
    public function getPdfOutput(Invoice $invoice): string
    {
        return $this->generatePdf($invoice)->output();
    }
}
