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
        if ($request->has('page')) {
            $page = $request->query('page');
            if (!is_numeric($page) || intval($page) <= 0 || (string) intval($page) !== (string) $page) {
                return response()->json([
                    'message' => __('spec_messages.row_10_invalid_url_param'),
                ], 404);
            }
        }

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
    public function show($id, Request $request): JsonResponse
    {
        if (!is_numeric($id) || intval($id) <= 0) {
            return response()->json([
                'message' => __('spec_messages.row_3_not_found'),
            ], 404);
        }

        $invoice = $this->invoiceService->getInvoiceDetail((int) $id);
        Gate::authorize('view', $invoice);

        return response()->json([
            'data' => new CustomerInvoiceResource($invoice),
        ]);
    }

    /**
     * Tải PDF hóa đơn của tôi (GET /api/my/invoices/{id}/pdf)
     */
    public function pdf($id, Request $request)
    {
        if (!is_numeric($id) || intval($id) <= 0) {
            return response()->json([
                'message' => __('spec_messages.row_3_not_found'),
            ], 404);
        }

        $invoice = $this->invoiceService->getInvoiceDetail((int) $id);
        Gate::authorize('downloadPdf', $invoice);

        return app(InvoicePdfService::class)->generatePdfResponse($invoice, true);
    }
}
