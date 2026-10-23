<?php

namespace App\Http\Controllers;

use App\Http\Resources\CustomerInvoiceResource;
use App\Models\Invoice;
use App\Services\InvoiceService;
use App\Services\InvoicePdfService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class MyInvoiceController extends Controller
{
    public function __construct(
        protected InvoiceService $invoiceService
    ) {}

    /**
     * Danh sách hóa đơn của tôi (GET /api/my/invoices)
     */
    public function index(Request $request): JsonResponse
    {
        $invoices = $this->invoiceService->getCustomerInvoices($request->user(), $request->all());

        return response()->json([
            'data' => CustomerInvoiceResource::collection($invoices),
            'meta' => [
                'current_page' => $invoices->currentPage(),
                'last_page' => $invoices->lastPage(),
                'per_page' => $invoices->perPage(),
                'total' => $invoices->total(),
            ],
        ]);
    }

    /**
     * Chi tiết hóa đơn của tôi (GET /api/my/invoices/{id})
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $invoice = $this->invoiceService->getInvoiceDetail($id);
        Gate::authorize('view', $invoice);

        return response()->json([
            'data' => new CustomerInvoiceResource($invoice),
        ]);
    }

    /**
     * Tải PDF hóa đơn của tôi (GET /api/my/invoices/{id}/pdf)
     */
    public function pdf(int $id, Request $request)
    {
        $invoice = $this->invoiceService->getInvoiceDetail($id);
        Gate::authorize('downloadPdf', $invoice);

        return app(InvoicePdfService::class)->generatePdfResponse($invoice, true);
    }
}
