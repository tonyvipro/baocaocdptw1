<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Contract;
use App\Models\User;
use App\Enums\InvoiceStatus;
use App\Enums\InvoiceType;
use App\Enums\TransactionStatus;
use App\Exceptions\StaleVersionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Carbon\Carbon;

class InvoiceService
{
    /**
     * Sinh số hóa đơn theo quy tắc 3.2:
     * QLTT-INV-{YYYYMM}-{mã căn hộ}-{số thứ tự 2 chữ số}
     * Duy nhất toàn hệ thống, sinh trong transaction/lock.
     */
    public function generateInvoiceNo(Contract $contract, ?string $periodStart = null, ?string $issueDate = null): string
    {
        $dateForPeriod = $periodStart ? Carbon::parse($periodStart) : ($issueDate ? Carbon::parse($issueDate) : Carbon::today());
        $yearMonth = $dateForPeriod->format('Ym');

        // Lấy mã căn hộ từ properties (bỏ ký tự đặc biệt)
        $propertyCode = 'PROP';
        $property = $contract->property;
        if ($property && !empty($property->code)) {
            $cleaned = preg_replace('/[^A-Za-z0-9]/', '', $property->code);
            $propertyCode = !empty($cleaned) ? strtoupper($cleaned) : 'P' . $property->id;
        } elseif ($property) {
            $propertyCode = 'P' . $property->id;
        }

        // Đếm số thứ tự theo (hợp đồng, kỳ/tháng)
        $prefix = "QLTT-INV-{$yearMonth}-{$propertyCode}-";
        
        $count = Invoice::withTrashed()
            ->where('contract_id', $contract->id)
            ->where('invoice_no', 'like', $prefix . '%')
            ->lockForUpdate()
            ->count();

        $seq = $count + 1;
        $candidate = $prefix . str_pad($seq, 2, '0', STR_PAD_LEFT);

        // Đảm bảo tuyệt đối không trùng trên toàn bảng invoices
        while (Invoice::withTrashed()->where('invoice_no', $candidate)->exists()) {
            $seq++;
            $candidate = $prefix . str_pad($seq, 2, '0', STR_PAD_LEFT);
        }

        return $candidate;
    }

    /**
     * Lập hóa đơn thủ công (Mục 3.3)
     */
    public function createInvoice(array $data, ?User $creator = null): Invoice
    {
        // 1. Kiểm tra hợp đồng
        $contract = Contract::find($data['contract_id']);
        if (!$contract || (int) $contract->status !== 1) {
            throw ValidationException::withMessages([
                'contract_id' => ['Hợp đồng tương ứng không còn hiệu lực.'],
            ]);
        }

        // 2. Kiểm tra hạng mục và tự tính tổng tiền ở backend
        $itemsData = $data['items'] ?? [];
        if (empty($itemsData)) {
            throw ValidationException::withMessages([
                'items' => ['Hóa đơn phải có ít nhất 1 hạng mục.'],
            ]);
        }

        $calculatedAmount = 0.00;
        $sanitizedItems = [];

        foreach ($itemsData as $idx => $item) {
            $qty = isset($item['quantity']) ? (float) $item['quantity'] : 1.0;
            $unitPrice = isset($item['unit_price']) ? (float) $item['unit_price'] : 0.0;

            if ($qty <= 0) {
                throw ValidationException::withMessages([
                    "items.{$idx}.quantity" => ['Số lượng hạng mục phải lớn hơn 0.'],
                ]);
            }
            if ($unitPrice < 0) {
                throw ValidationException::withMessages([
                    "items.{$idx}.unit_price" => ['Đơn giá hạng mục không được âm.'],
                ]);
            }

            $totalPrice = round($qty * $unitPrice, 2);
            $calculatedAmount = round($calculatedAmount + $totalPrice, 2);

            $sanitizedItems[] = [
                'item_name' => trim($item['item_name']),
                'quantity' => $qty,
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
                'description' => $item['description'] ?? null,
                'sort_order' => $idx + 1,
            ];
        }

        if ($calculatedAmount <= 0) {
            throw ValidationException::withMessages([
                'amount' => ['Số tiền phải thu phải lớn hơn 0.'],
            ]);
        }

        $type = strtolower($data['type']);
        $periodStart = !empty($data['billing_period_start']) ? Carbon::parse($data['billing_period_start'])->toDateString() : null;
        $periodEnd = !empty($data['billing_period_end']) ? Carbon::parse($data['billing_period_end'])->toDateString() : null;
        $issueDate = !empty($data['issue_date']) ? Carbon::parse($data['issue_date'])->toDateString() : Carbon::today()->toDateString();
        $dueDate = Carbon::parse($data['due_date'])->toDateString();

        if (Carbon::parse($dueDate)->lt(Carbon::parse($issueDate))) {
            throw ValidationException::withMessages([
                'due_date' => ['Hạn thanh toán phải sau hoặc bằng ngày lập hóa đơn.'],
            ]);
        }

        // 3. Chống trùng hóa đơn type = rent cho cùng hợp đồng và cùng kỳ (billing_period_start)
        if ($type === InvoiceType::RENT && $periodStart) {
            $duplicateRent = Invoice::where('contract_id', $contract->id)
                ->where('type', InvoiceType::RENT)
                ->whereDate('billing_period_start', $periodStart)
                ->where('status', '!=', InvoiceStatus::CANCELLED)
                ->exists();

            if ($duplicateRent) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Hóa đơn tiền thuê cho kỳ này đã tồn tại trong hệ thống.',
                ], 409));
            }
        }

        // 4. Tạo hóa đơn trong DB Transaction
        try {
            return DB::transaction(function () use ($contract, $type, $data, $issueDate, $dueDate, $periodStart, $periodEnd, $calculatedAmount, $sanitizedItems, $creator) {
                $invoiceNo = $this->generateInvoiceNo($contract, $periodStart, $issueDate);

                $invoice = Invoice::create([
                    'invoice_no' => $invoiceNo,
                    'contract_id' => $contract->id,
                    'issue_date' => $issueDate,
                    'title' => trim($data['title']),
                    'type' => $type,
                    'amount' => $calculatedAmount,
                    'due_date' => $dueDate,
                    'billing_period_start' => $periodStart,
                    'billing_period_end' => $periodEnd,
                    'status' => InvoiceStatus::UNPAID,
                    'note' => $data['note'] ?? null,
                    'paid_amount' => 0.00,
                    'paid_at' => null,
                    'created_by' => $creator?->id,
                ]);

                foreach ($sanitizedItems as $item) {
                    $invoice->items()->create($item);
                }

                // Ghi log hoạt động
                $this->logActivity($creator?->id, 'CREATE_INVOICE', $invoice->id, null, [
                    'invoice_no' => $invoice->invoice_no,
                    'amount' => $invoice->amount,
                    'contract_id' => $contract->id,
                ]);

                return $invoice->load(['contract.property', 'contract.customer', 'items']);
            });
        } catch (\Illuminate\Database\UniqueConstraintViolationException $ue) {
            throw new HttpResponseException(response()->json([
                'message' => 'Hóa đơn tiền thuê cho kỳ này đã tồn tại trong hệ thống.',
            ], 409));
        }
    }

    /**
     * Chỉnh sửa hóa đơn (Mục 3.4 & 3.12: Khóa lạc quan + bi quan)
     */
    public function updateInvoice(Invoice $invoice, array $data, ?User $actor = null): Invoice
    {
        return DB::transaction(function () use ($invoice, $data, $actor) {
            $locked = Invoice::lockForUpdate()->find($invoice->id);
            if (!$locked) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Hóa đơn không tồn tại.',
                ], 404));
            }

            // Kiểm tra version (Khóa lạc quan - Mục 3.12)
            if (isset($data['version']) && (int) $locked->version !== (int) $data['version']) {
                throw new StaleVersionException(
                    'Dữ liệu đã được người khác thay đổi. Vui lòng tải lại để xem phiên bản mới nhất.',
                    new \App\Http\Resources\InvoiceResource($locked->fresh(['contract.property', 'contract.customer', 'items', 'transactions', 'updater']))
                );
            }

            if ($locked->status === InvoiceStatus::PAID) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Hóa đơn đã thanh toán không thể chỉnh sửa hoặc hủy.',
                ], 409));
            }

            if ($locked->status === InvoiceStatus::CANCELLED) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Hóa đơn đã bị hủy trước đó.',
                ], 409));
            }

            // Chỉ tính giao dịch thành công
            $hasTransactions = $locked->transactions()->where('status', TransactionStatus::SUCCESS)->exists() || (float)$locked->paid_amount > 0;

            // Nếu đã có giao dịch: chỉ cho phép sửa note, title; chặn sửa tiền/hạng mục/hạn
            if ($hasTransactions && !empty($data['items'])) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Hóa đơn đã phát sinh giao dịch thanh toán, không thể chỉnh sửa số tiền và hạng mục.',
                ], 409));
            }

            $oldData = [
                'title' => $locked->title,
                'amount' => $locked->amount,
                'due_date' => $locked->due_date?->format('Y-m-d'),
                'note' => $locked->note,
            ];

            if (isset($data['title'])) {
                $locked->title = trim($data['title']);
            }
            if (isset($data['note'])) {
                $locked->note = $data['note'];
            }
            if (isset($data['due_date'])) {
                $locked->due_date = Carbon::parse($data['due_date'])->toDateString();
            }
            if (isset($data['billing_period_start'])) {
                $locked->billing_period_start = Carbon::parse($data['billing_period_start'])->toDateString();
            }
            if (isset($data['billing_period_end'])) {
                $locked->billing_period_end = Carbon::parse($data['billing_period_end'])->toDateString();
            }

            // Nếu chưa có giao dịch và có gửi items thì cập nhật lại hạng mục & tính lại amount
            if (!$hasTransactions && !empty($data['items'])) {
                $calculatedAmount = 0.00;
                $sanitizedItems = [];

                foreach ($data['items'] as $idx => $item) {
                    $qty = isset($item['quantity']) ? (float) $item['quantity'] : 1.0;
                    $unitPrice = isset($item['unit_price']) ? (float) $item['unit_price'] : 0.0;

                    if ($qty <= 0) {
                        throw ValidationException::withMessages([
                            "items.{$idx}.quantity" => ['Số lượng hạng mục phải lớn hơn 0.'],
                        ]);
                    }
                    if ($unitPrice < 0) {
                        throw ValidationException::withMessages([
                            "items.{$idx}.unit_price" => ['Đơn giá hạng mục không được âm.'],
                        ]);
                    }

                    $totalPrice = round($qty * $unitPrice, 2);
                    $calculatedAmount = round($calculatedAmount + $totalPrice, 2);

                    $sanitizedItems[] = [
                        'item_name' => trim($item['item_name']),
                        'quantity' => $qty,
                        'unit_price' => $unitPrice,
                        'total_price' => $totalPrice,
                        'description' => $item['description'] ?? null,
                        'sort_order' => $idx + 1,
                    ];
                }

                if ($calculatedAmount <= 0) {
                    throw ValidationException::withMessages([
                        'amount' => ['Số tiền phải thu phải lớn hơn 0.'],
                    ]);
                }

                $locked->amount = $calculatedAmount;

                // Xóa items cũ và chèn items mới
                $locked->items()->delete();
                foreach ($sanitizedItems as $item) {
                    $locked->items()->create($item);
                }
            }

            // Tăng version và cập nhật updated_by (thao tác người dùng)
            $locked->version = ($locked->version ?? 1) + 1;
            $locked->updated_by = $actor?->id;
            $locked->save();

            // Đồng bộ lại trạng thái quá hạn nếu cần
            $this->syncPaymentStatus($locked);

            $this->logActivity($actor?->id, 'UPDATE_INVOICE', $locked->id, $oldData, [
                'title' => $locked->title,
                'amount' => $locked->amount,
                'due_date' => $locked->due_date?->format('Y-m-d'),
                'note' => $locked->note,
            ]);

            return $locked->load(['contract.property', 'contract.customer', 'items', 'updater']);
        }, 3);
    }

    /**
     * Hủy hóa đơn (Mục 3.4 & 3.12: Khóa lạc quan + bi quan)
     */
    public function cancelInvoice(Invoice $invoice, string $reason, ?int $version = null, ?User $actor = null): Invoice
    {
        return DB::transaction(function () use ($invoice, $reason, $version, $actor) {
            $locked = Invoice::lockForUpdate()->find($invoice->id);
            if (!$locked) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Hóa đơn không tồn tại.',
                ], 404));
            }

            // Kiểm tra version (Khóa lạc quan - Mục 3.12)
            if ($version !== null && (int) $locked->version !== (int) $version) {
                throw new StaleVersionException(
                    'Dữ liệu đã được người khác thay đổi. Vui lòng tải lại để xem phiên bản mới nhất.',
                    new \App\Http\Resources\InvoiceResource($locked->fresh(['contract.property', 'contract.customer', 'items', 'transactions', 'updater']))
                );
            }

            if ($locked->status === InvoiceStatus::PAID) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Hóa đơn đã thanh toán không thể chỉnh sửa hoặc hủy.',
                ], 409));
            }

            if ($locked->status === InvoiceStatus::CANCELLED) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Hóa đơn đã bị hủy trước đó.',
                ], 409));
            }

            $hasTransactions = $locked->transactions()->where('status', TransactionStatus::SUCCESS)->exists() || (float)$locked->paid_amount > 0;
            if ($hasTransactions) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Hóa đơn đã phát sinh giao dịch thanh toán, không thể hủy.',
                ], 409));
            }

            $oldStatus = $locked->status;

            $locked->status = InvoiceStatus::CANCELLED;
            $locked->cancel_reason = trim($reason);
            $locked->version = ($locked->version ?? 1) + 1;
            $locked->updated_by = $actor?->id;
            $locked->save();

            $this->logActivity($actor?->id, 'CANCEL_INVOICE', $locked->id, [
                'status' => $oldStatus,
            ], [
                'status' => InvoiceStatus::CANCELLED,
                'cancel_reason' => $locked->cancel_reason,
            ]);

            return $locked;
        }, 3);
    }

    /**
     * Đồng bộ trạng thái thanh toán và số tiền đã trả (Mục 3.5 & 4: Chỉ tính giao dịch thành công)
     * Hàm idempotent: chạy nhiều lần không làm thay đổi trạng thái nếu không có giao dịch mới.
     * Lưu ý: Tiến trình tự động không tăng version (Mục 3.12a).
     */
    public function syncPaymentStatus(Invoice $invoice): Invoice
    {
        // Không đụng đến hóa đơn đã hủy (status = 3 là trạng thái cuối)
        if ($invoice->status === InvoiceStatus::CANCELLED) {
            return $invoice;
        }

        // CHỈ cộng giao dịch thành công (status = 1)
        $paidAmount = (float) $invoice->transactions()
            ->where('status', TransactionStatus::SUCCESS)
            ->sum('amount');
        $invoice->paid_amount = round($paidAmount, 2);

        $amount = (float) $invoice->amount;

        if ($paidAmount >= $amount && $amount > 0) {
            $invoice->status = InvoiceStatus::PAID;
            if (!$invoice->paid_at) {
                $lastTxPaidAt = $invoice->transactions()
                    ->where('status', TransactionStatus::SUCCESS)
                    ->max('paid_at');
                $invoice->paid_at = $lastTxPaidAt ? Carbon::parse($lastTxPaidAt) : Carbon::now();
            }
        } else {
            $invoice->paid_at = null;
            $today = Carbon::today();
            if ($invoice->due_date && Carbon::parse($invoice->due_date)->lt($today)) {
                $invoice->status = InvoiceStatus::OVERDUE;
            } else {
                $invoice->status = InvoiceStatus::UNPAID;
            }
        }

        $invoice->save();

        return $invoice;
    }

    /**
     * Lấy danh sách hóa đơn quản lý (có phân trang, tìm kiếm, lọc)
     */
    public function getInvoicesList(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $query = Invoice::query()
            ->with([
                'contract.property',
                'contract.customer',
                'contract.broker',
                'items',
            ]);

        // Phân quyền theo vai trò
        if ($user && (int)$user->role_id === 2) {
            // Môi giới chỉ thấy hợp đồng mình phụ trách
            $query->whereHas('contract', function ($q) use ($user) {
                $q->where('broker_id', $user->id);
            });
        }

        // Lọc theo từ khóa tìm kiếm (số hóa đơn, mã hợp đồng, tên khách hàng, tiêu đề)
        if (!empty($filters['search'])) {
            $search = '%' . addcslashes(trim($filters['search']), '%_') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', $search)
                  ->orWhere('title', 'like', $search)
                  ->orWhereHas('contract', function ($cq) use ($search) {
                      $cq->where('contract_code', 'like', $search)
                         ->orWhereHas('customer', function ($uq) use ($search) {
                             $uq->where('name', 'like', $search);
                         });
                  });
            });
        }

        // Lọc theo trạng thái
        if (isset($filters['status']) && $filters['status'] !== '' && $filters['status'] !== null) {
            $query->where('status', (int) $filters['status']);
        }

        // Lọc theo loại khoản thu
        if (!empty($filters['type'])) {
            $query->where('type', strtolower($filters['type']));
        }

        // Lọc theo hợp đồng cụ thể
        if (!empty($filters['contract_id'])) {
            $query->where('contract_id', (int) $filters['contract_id']);
        }

        // Lọc theo khoảng ngày hạn thanh toán (due_date)
        if (!empty($filters['due_from'])) {
            $query->whereDate('due_date', '>=', Carbon::parse($filters['due_from'])->toDateString());
        }
        if (!empty($filters['due_to'])) {
            $query->whereDate('due_date', '<=', Carbon::parse($filters['due_to'])->toDateString());
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 15;

        return $query->orderBy('issue_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    /**
     * Lấy chi tiết hóa đơn (kèm relations, items, transactions)
     */
    public function getInvoiceDetail(int $id): Invoice
    {
        return Invoice::with([
            'contract.property',
            'contract.customer',
            'contract.broker',
            'items',
            'transactions',
            'creator',
        ])->findOrFail($id);
    }

    /**
     * Lấy danh sách hóa đơn của một hợp đồng
     */
    public function getContractInvoices(int $contractId, ?User $user = null): Collection
    {
        $contract = Contract::findOrFail($contractId);

        $query = Invoice::where('contract_id', $contract->id)
            ->with(['items', 'transactions']);

        if ($user && (int)$user->role_id === 5) {
            // Khách hàng không thấy hóa đơn hủy
            $query->where('status', '!=', InvoiceStatus::CANCELLED);
        }

        return $query->orderBy('issue_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();
    }

    /**
     * Lấy danh sách hóa đơn của khách hàng (Cổng khách hàng)
     */
    public function getCustomerInvoices(User $customer, array $filters = []): LengthAwarePaginator
    {
        $query = Invoice::query()
            ->with([
                'contract.property',
                'items',
                'transactions',
            ]);

        // Nếu là Admin (role_id = 1), cho phép xem danh sách hóa đơn hiệu lực ở giao diện khách hàng để kiểm tra
        if ((int) $customer->role_id === 1) {
            $query->whereHas('contract', function ($q) {
                $q->where('status', '!=', 0); // Không xem hóa đơn của hợp đồng nháp
            })
            ->where('status', '!=', InvoiceStatus::CANCELLED);
        } else {
            $query->whereHas('contract', function ($q) use ($customer) {
                $q->where('customer_id', $customer->id)
                  ->where('status', '!=', 0); // Không xem hóa đơn của hợp đồng nháp
            })
            ->where('status', '!=', InvoiceStatus::CANCELLED); // Khách không thấy hóa đơn hủy
        }

        if (isset($filters['status']) && $filters['status'] !== '' && $filters['status'] !== null) {
            $query->where('status', (int) $filters['status']);
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 10;

        return $query->orderBy('issue_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    /**
     * Ghi log hoạt động hệ thống
     */
    public function logActivity(?int $userId, string $action, int $recordId, ?array $oldData = null, ?array $newData = null): void
    {
        try {
            DB::table('activity_logs')->insert([
                'user_id' => $userId,
                'action' => $action,
                'table_name' => 'invoices',
                'record_id' => $recordId,
                'old_data' => $oldData ? json_encode($oldData, JSON_UNESCAPED_UNICODE) : null,
                'new_data' => $newData ? json_encode($newData, JSON_UNESCAPED_UNICODE) : null,
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        } catch (\Throwable $e) {
            // Log silently nếu bảng có lỗi
        }
    }
}
