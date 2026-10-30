<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Requests\UpdateInvoiceRequest;
use App\Http\Requests\CancelInvoiceRequest;
use App\Http\Requests\InvoiceFilterRequest;
use App\Http\Requests\SendInvoiceEmailRequest;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\InvoiceListResource;
use App\Models\Invoice;
use App\Models\Contract;
use App\Services\InvoiceService;
use App\Services\InvoicePdfService;
use App\Services\InvoiceEmailService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class InvoiceController extends Controller
{
    public function __construct(
        protected InvoiceService $invoiceService,
        protected ?InvoicePdfService $pdfService = null,
        protected ?InvoiceEmailService $emailService = null
    ) {}

    /**
     * Danh sách hóa đơn (GET /api/invoices)
     */
    public function index(InvoiceFilterRequest $request): JsonResponse
    {
        Gate::authorize('viewAny', Invoice::class);

        $invoices = $this->invoiceService->getInvoicesList($request->validated(), $request->user());

        return response()->json([
            'data' => InvoiceListResource::collection($invoices),
            'meta' => [
                'current_page' => $invoices->currentPage(),
                'last_page' => $invoices->lastPage(),
                'per_page' => $invoices->perPage(),
                'total' => $invoices->total(),
            ],
        ]);
    }

    /**
     * Lập hóa đơn thủ công (POST /api/invoices)
     */
    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        // Kiểm tra quyền theo Policy (truyền contract nếu có)
        $contract = Contract::find($request->validated()['contract_id']);
        Gate::authorize('create', [Invoice::class, $contract]);

        $invoice = $this->invoiceService->createInvoice($request->validated(), $request->user());

        return response()->json([
            'message' => 'Lập hóa đơn thanh toán thành công!',
            'data' => new InvoiceResource($invoice),
        ], 201);
    }

    /**
     * Chi tiết hóa đơn (GET /api/invoices/{id})
     */
    public function show(int $id): JsonResponse
    {
        $invoice = $this->invoiceService->getInvoiceDetail($id);
        Gate::authorize('view', $invoice);

        return response()->json([
            'data' => new InvoiceResource($invoice),
        ]);
    }

    /**
     * Chỉnh sửa hóa đơn (PUT /api/invoices/{id})
     */
    public function update(UpdateInvoiceRequest $request, int $id): JsonResponse
    {
        $invoice = $this->invoiceService->getInvoiceDetail($id);
        Gate::authorize('update', $invoice);

        $updated = $this->invoiceService->updateInvoice($invoice, $request->validated(), $request->user());

        return response()->json([
            'message' => 'Cập nhật hóa đơn thành công!',
            'data' => new InvoiceResource($updated),
        ]);
    }

    /**
     * Hủy hóa đơn (POST /api/invoices/{id}/cancel)
     */
    public function cancel(CancelInvoiceRequest $request, int $id): JsonResponse
    {
        $invoice = $this->invoiceService->getInvoiceDetail($id);
        Gate::authorize('cancel', $invoice);

        $validated = $request->validated();
        $cancelled = $this->invoiceService->cancelInvoice(
            $invoice,
            $validated['cancel_reason'],
            $validated['version'] ?? null,
            $request->user()
        );

        return response()->json([
            'message' => 'Hủy hóa đơn thành công!',
            'data' => new InvoiceResource($cancelled),
        ]);
    }

    /**
     * Xem hoặc tải PDF (GET /api/invoices/{id}/pdf)
     */
    public function pdf(Request $request, int $id)
    {
        $invoice = $this->invoiceService->getInvoiceDetail($id);
        Gate::authorize('downloadPdf', $invoice);

        $download = $request->boolean('download', false);
        return app(InvoicePdfService::class)->generatePdfResponse($invoice, $download);
    }

    /**
     * Gửi hóa đơn qua email (POST /api/invoices/{id}/send-email)
     */
    public function sendEmail(SendInvoiceEmailRequest $request, int $id): JsonResponse
    {
        $invoice = $this->invoiceService->getInvoiceDetail($id);
        Gate::authorize('sendEmail', $invoice);

        $targetEmail = $request->validated()['email'] ?? null;
        $result = app(InvoiceEmailService::class)->sendInvoiceEmail($invoice, $targetEmail, $request->user());

        return response()->json([
            'message' => 'Đã gửi hóa đơn thanh toán đến email của khách hàng!',
            'data' => [
                'email' => $result['email'],
                'email_sent_at' => $result['email_sent_at'],
            ],
        ]);
    }

    /**
     * Lấy danh sách hóa đơn theo hợp đồng (GET /api/contracts/{contract}/invoices)
     */
    public function contractInvoices(int $contractId, Request $request): JsonResponse
    {
        $invoices = $this->invoiceService->getContractInvoices($contractId, $request->user());

        return response()->json([
            'data' => InvoiceListResource::collection($invoices),
        ]);
    }
}
