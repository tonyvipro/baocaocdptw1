<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\ContractExtension;
use App\Models\ContractDocument;
use App\Models\ActivityLog;
use App\Models\User;
use App\Notifications\ContractExtensionNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ContractExtensionService
{
    /**
     * Kiểm tra điều kiện đủ để gia hạn hợp đồng (Spec mục 3.2)
     */
    public function checkEligibility(int $contractId): array
    {
        $contract = Contract::with(['customer', 'broker', 'property'])->findOrFail($contractId);

        $now = Carbon::now()->startOfDay();
        $endDate = Carbon::parse($contract->end_date)->startOfDay();
        $isEligible = true;
        $ineligibleReason = null;

        // 1. Kiểm tra trạng thái hợp đồng
        if ($contract->status === 0) {
            $isEligible = false;
            $ineligibleReason = 'Hợp đồng đang ở trạng thái Nháp / Chờ ký, chưa có hiệu lực pháp lý để gia hạn.';
        } elseif ($contract->status === 3) {
            $isEligible = false;
            $ineligibleReason = 'Hợp đồng đã bị hủy bỏ trước đó, không thể thực hiện gia hạn.';
        } elseif ($contract->status === 2) {
            // Hết hạn: chỉ được phép gia hạn nếu trong khoảng ân hạn 30 ngày
            $daysSinceExpiry = $endDate->diffInDays($now, false);
            if ($daysSinceExpiry > Contract::GRACE_PERIOD_DAYS) {
                $isEligible = false;
                $ineligibleReason = 'Hợp đồng đã hết hạn quá thời gian ân hạn ' . Contract::GRACE_PERIOD_DAYS . ' ngày. Vui lòng lập hợp đồng mới.';
            }
        } elseif ($contract->status !== 1) {
            $isEligible = false;
            $ineligibleReason = 'Trạng thái hợp đồng hiện tại không hợp lệ để gia hạn.';
        }

        // 2. Kiểm tra xem có yêu cầu gia hạn nào đang ở trạng thái Nháp (0) hoặc Chờ duyệt (1) không
        $existingActiveExtension = ContractExtension::where('contract_id', $contract->id)
            ->whereIn('status', [ContractExtension::STATUS_DRAFT, ContractExtension::STATUS_PENDING])
            ->first();

        // 3. Tính toán các mốc ngày bắt đầu hợp lệ (Spec mục 3.3)
        // new_start_date: tối thiểu = end_date + 1 ngày, tối đa = end_date + 30 ngày
        $minStartDate = $endDate->copy()->addDay()->format('Y-m-d');
        $maxStartDate = $endDate->copy()->addDays(Contract::GRACE_PERIOD_DAYS)->format('Y-m-d');

        $daysLeft = (int)$now->diffInDays($endDate, false);
        $inGracePeriod = ((int)$contract->status === 2 || $daysLeft < 0) && abs($daysLeft) <= Contract::GRACE_PERIOD_DAYS;

        return [
            'is_eligible' => $isEligible,
            'eligible' => $isEligible,
            'reason' => $ineligibleReason,
            'days_left' => $daysLeft,
            'in_grace_period' => $inGracePeriod,
            'contract' => [
                'id' => $contract->id,
                'contract_code' => $contract->contract_code,
                'contract_name' => $contract->contract_name,
                'status' => $contract->status,
                'start_date' => $contract->start_date ? Carbon::parse($contract->start_date)->format('Y-m-d') : null,
                'end_date' => $contract->end_date ? Carbon::parse($contract->end_date)->format('Y-m-d') : null,
                'current_end_date' => $contract->end_date ? Carbon::parse($contract->end_date)->format('Y-m-d') : null,
                'rental_price' => (float)$contract->rental_price,
                'current_rental_price' => (float)$contract->rental_price,
                'deposit_amount' => (float)($contract->deposit_amount ?? 0),
                'customer_name' => $contract->customer?->name ?? 'N/A',
                'customer_phone' => $contract->customer?->phone ?? 'N/A',
                'customer' => $contract->customer ? [
                    'id' => $contract->customer->id,
                    'name' => $contract->customer->name,
                    'phone' => $contract->customer->phone,
                    'email' => $contract->customer->email,
                ] : null,
                'party_b_info' => $contract->party_b_info ?? $contract->customer?->name,
                'broker_name' => $contract->broker?->name ?? 'N/A',
                'property_title' => $contract->property?->title ?? 'N/A',
            ],
            'min_start_date' => $minStartDate,
            'max_start_date' => $maxStartDate,
            'suggested_start_date' => $minStartDate,
            'current_end_date' => $contract->end_date ? Carbon::parse($contract->end_date)->format('Y-m-d') : null,
            'current_rental_price' => (float)$contract->rental_price,
            'has_active_request' => $existingActiveExtension !== null,
            'active_request_id' => $existingActiveExtension?->id,
            'active_request_status' => $existingActiveExtension?->status,
            'current_draft' => $existingActiveExtension,
        ];
    }

    /**
     * Lấy bản nháp gia hạn hiện có của hợp đồng (nếu có)
     */
    public function getDraft(int $contractId): ?ContractExtension
    {
        return ContractExtension::with(['documents', 'creator'])
            ->where('contract_id', $contractId)
            ->where('status', ContractExtension::STATUS_DRAFT)
            ->latest('id')
            ->first();
    }

    /**
     * Lấy lịch sử tất cả các lần gia hạn của 1 hợp đồng
     */
    public function getHistory(int $contractId, int $perPage = 15)
    {
        return ContractExtension::with(['documents', 'creator', 'approver'])
            ->where('contract_id', $contractId)
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    /**
     * Lấy danh sách yêu cầu gia hạn cho Admin quản lý
     */
    public function getAllExtensions(array $filters = [], int $perPage = 15)
    {
        $query = ContractExtension::with([
            'contract.customer',
            'contract.broker',
            'contract.property',
            'creator',
            'approver',
            'documents'
        ]);

        if (isset($filters['status']) && $filters['status'] !== '' && $filters['status'] !== null) {
            $query->where('status', (int)$filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->whereHas('contract', function ($q) use ($search) {
                $q->where('contract_code', 'like', "%{$search}%")
                  ->orWhere('contract_name', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Tính toán new_end_date theo công thức: new_start_date + duration_months - 1 ngày
     */
    public function calculateEndDate(string $newStartDate, int $durationMonths): string
    {
        return Carbon::parse($newStartDate)->addMonths($durationMonths)->subDay()->format('Y-m-d');
    }

    /**
     * Lưu bản nháp yêu cầu gia hạn mới (Spec mục 5.2, status = 0)
     */
    public function saveDraft(int $contractId, array $data, User $user): ContractExtension
    {
        $contract = Contract::findOrFail($contractId);

        // Kiểm tra điều kiện gia hạn
        $eligibility = $this->checkEligibility($contractId);
        if (!$eligibility['eligible']) {
            throw new HttpException(422, $eligibility['reason'] ?? 'Hợp đồng không đủ điều kiện gia hạn.');
        }

        // Kiểm tra xem đã có yêu cầu Chờ duyệt (1) nào chưa
        $pendingExtension = ContractExtension::where('contract_id', $contract->id)
            ->where('status', ContractExtension::STATUS_PENDING)
            ->first();

        if ($pendingExtension) {
            throw new HttpException(409, 'Hợp đồng này đang có một yêu cầu gia hạn đang chờ cấp trên phê duyệt (Mã yêu cầu #' . $pendingExtension->id . ').');
        }

        $durationMonths = (int)($data['duration_months'] ?? 12);
        $newStartDate = $data['new_start_date'] ?? $eligibility['suggested_start_date'];
        $newEndDate = $this->calculateEndDate($newStartDate, $durationMonths);

        // Tìm bản nháp cũ nếu có để cập nhật, tránh sinh nhiều bản nháp rác
        $extension = ContractExtension::where('contract_id', $contract->id)
            ->where('status', ContractExtension::STATUS_DRAFT)
            ->first();

        $payload = [
            'contract_id' => $contract->id,
            'extension_type' => (int)($data['extension_type'] ?? ContractExtension::TYPE_MANUAL),
            'duration_months' => $durationMonths,
            'new_start_date' => $newStartDate,
            'new_end_date' => $newEndDate,
            'old_end_date' => $contract->end_date->format('Y-m-d'),
            'old_rental_price' => $contract->rental_price,
            'new_rental_price' => isset($data['new_rental_price']) && $data['new_rental_price'] !== '' ? (float)$data['new_rental_price'] : null,
            'reason' => $data['reason'] ?? null,
            'note' => $data['note'] ?? null,
            'status' => ContractExtension::STATUS_DRAFT,
            'created_by' => $user->id,
        ];

        if ($extension) {
            $extension->update($payload);
        } else {
            $extension = ContractExtension::create($payload);
        }

        return $extension->fresh(['contract', 'documents', 'creator']);
    }

    /**
     * Cập nhật bản nháp gia hạn
     */
    public function updateDraft(ContractExtension $extension, array $data, User $user): ContractExtension
    {
        if ((int)$extension->status !== ContractExtension::STATUS_DRAFT) {
            throw new HttpException(409, 'Chỉ có thể chỉnh sửa nội dung khi yêu cầu đang ở trạng thái Nháp (Draft).');
        }

        $durationMonths = (int)($data['duration_months'] ?? $extension->duration_months);
        $newStartDate = $data['new_start_date'] ?? $extension->new_start_date->format('Y-m-d');
        $newEndDate = $this->calculateEndDate($newStartDate, $durationMonths);

        $payload = [
            'extension_type' => isset($data['extension_type']) ? (int)$data['extension_type'] : $extension->extension_type,
            'duration_months' => $durationMonths,
            'new_start_date' => $newStartDate,
            'new_end_date' => $newEndDate,
            'new_rental_price' => isset($data['new_rental_price']) && $data['new_rental_price'] !== '' ? (float)$data['new_rental_price'] : $extension->new_rental_price,
            'reason' => $data['reason'] ?? $extension->reason,
            'note' => $data['note'] ?? $extension->note,
        ];

        $extension->update($payload);

        return $extension->fresh(['contract', 'documents', 'creator']);
    }

    /**
     * Gửi yêu cầu gia hạn (chuyển trạng thái 0 -> 1)
     */
    public function submit(ContractExtension $extension, array $data, User $user): ContractExtension
    {
        if ((int)$extension->status !== ContractExtension::STATUS_DRAFT) {
            throw new HttpException(409, 'Chỉ có thể gửi yêu cầu khi trạng thái đang là Nháp.');
        }

        // Cập nhật thêm dữ liệu gửi nếu có
        $reason = $data['reason'] ?? $extension->reason;
        if (empty(trim($reason ?? ''))) {
            throw new HttpException(422, 'Vui lòng nhập lý do gia hạn trước khi gửi yêu cầu phê duyệt.');
        }

        // Loại 2 (Theo điều khoản mới) bắt buộc phải có ghi chú điều khoản hoặc tài liệu đính kèm
        $extensionType = isset($data['extension_type']) ? (int)$data['extension_type'] : (int)$extension->extension_type;
        $note = $data['note'] ?? $extension->note;
        $docCount = $extension->documents()->count();

        if ($extensionType === ContractExtension::TYPE_NEW_TERMS && empty(trim($note ?? '')) && $docCount === 0) {
            throw new HttpException(422, 'Đối với loại gia hạn "Theo điều khoản mới", bạn bắt buộc phải nhập ghi chú điều khoản thay đổi hoặc tải lên ít nhất 1 tài liệu phụ lục đính kèm.');
        }

        $extension->update([
            'reason' => $reason,
            'note' => $note,
            'extension_type' => $extensionType,
            'status' => ContractExtension::STATUS_PENDING,
        ]);

        // Ghi nhật ký hoạt động
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'SUBMIT_CONTRACT_EXTENSION',
            'table_name' => 'contract_extensions',
            'record_id' => $extension->id,
            'new_data' => [
                'contract_id' => $extension->contract_id,
                'extension_type' => $extension->extension_type,
                'duration_months' => $extension->duration_months,
                'new_end_date' => $extension->new_end_date->format('Y-m-d'),
                'new_rental_price' => $extension->new_rental_price,
            ],
            'ip_address' => request()->ip(),
        ]);

        // Tạo thông báo cho Quản trị viên
        $admins = User::where('role_id', 1)->get();
        foreach ($admins as $admin) {
            $admin->notify(new ContractExtensionNotification(
                $extension,
                'Yêu cầu gia hạn hợp đồng mới cần duyệt',
                'Môi giới ' . $user->name . ' vừa gửi yêu cầu gia hạn cho hợp đồng ' . ($extension->contract->contract_code ?? '') . '.',
                'extension_submitted'
            ));
        }

        return $extension->fresh(['contract', 'documents', 'creator']);
    }

    /**
     * Phê duyệt yêu cầu gia hạn (Transaction duy nhất + lockForUpdate, Spec mục 3.6)
     */
    public function approve(ContractExtension $extension, User $approver): ContractExtension
    {
        if ((int)$extension->status !== ContractExtension::STATUS_PENDING) {
            throw new HttpException(409, 'Yêu cầu này không ở trạng thái Chờ duyệt hoặc đã được xử lý trước đó.');
        }

        return DB::transaction(function () use ($extension, $approver) {
            // Khóa dòng hợp đồng để đảm bảo tính toàn vẹn dữ liệu
            $contract = Contract::where('id', $extension->contract_id)->lockForUpdate()->firstOrFail();

            // Kiểm tra lại điều kiện hợp đồng tại thời điểm duyệt
            if ($contract->trashed()) {
                throw new HttpException(422, 'Hợp đồng gốc đã bị xóa, không thể duyệt gia hạn.');
            }

            if (!in_array((int)$contract->status, [1, 2])) {
                throw new HttpException(422, 'Trạng thái hợp đồng hiện tại không cho phép phê duyệt gia hạn.');
            }

            $contractOldEndDate = $contract->end_date->format('Y-m-d');
            $contractOldRentalPrice = (float)$contract->rental_price;

            // 1. Cập nhật contracts
            $contract->end_date = $extension->new_end_date;
            if ($extension->new_rental_price !== null && (float)$extension->new_rental_price > 0) {
                $contract->rental_price = $extension->new_rental_price;
            }

            // Nếu hợp đồng đang hết hạn (2), đưa về Đang có hiệu lực (1)
            if ((int)$contract->status === 2) {
                $contract->status = 1;
            }

            // Tính lại next_billing_date nếu next_billing_date < ngày hiệu lực mới
            if ($contract->next_billing_date && Carbon::parse($contract->next_billing_date)->lt(Carbon::parse($extension->new_start_date))) {
                $contract->next_billing_date = $extension->new_start_date;
            }

            $contract->save();

            // 2. Cập nhật contract_extensions
            $extension->status = ContractExtension::STATUS_APPROVED;
            $extension->extension_date = Carbon::now()->format('Y-m-d');
            $extension->approved_by = $approver->id;
            $extension->approved_at = Carbon::now();
            $extension->old_end_date = $contractOldEndDate;
            $extension->old_rental_price = $contractOldRentalPrice;
            $extension->save();

            // 3. Ghi activity_logs
            ActivityLog::create([
                'user_id' => $approver->id,
                'action' => 'APPROVE_CONTRACT_EXTENSION',
                'table_name' => 'contract_extensions',
                'record_id' => $extension->id,
                'old_data' => [
                    'end_date' => $contractOldEndDate,
                    'rental_price' => $contractOldRentalPrice,
                ],
                'new_data' => [
                    'end_date' => $contract->end_date->format('Y-m-d'),
                    'rental_price' => (float)$contract->rental_price,
                    'approved_at' => $extension->approved_at->format('Y-m-d H:i:s'),
                ],
                'ip_address' => request()->ip(),
            ]);

            // 4. Gửi notification cho các bên liên quan
            $recipients = collect();

            if ($extension->creator) {
                $recipients->push($extension->creator);
            }
            if ($contract->broker && (int)$contract->broker_id !== (int)$extension->created_by) {
                $recipients->push($contract->broker);
            }
            if ($contract->customer) {
                $recipients->push($contract->customer);
            }

            foreach ($recipients->unique('id') as $person) {
                $person->notify(new ContractExtensionNotification(
                    $extension,
                    'Yêu cầu gia hạn hợp đồng đã được phê duyệt',
                    'Hợp đồng ' . $contract->contract_code . ' đã được gia hạn thành công đến ngày ' . $contract->end_date->format('d/m/Y') . '.',
                    'extension_approved'
                ));
            }

            return $extension->fresh(['contract', 'documents', 'creator', 'approver']);
        });
    }

    /**
     * Từ chối yêu cầu gia hạn (Spec mục 3.7)
     */
    public function reject(ContractExtension $extension, string $rejectReason, User $approver): ContractExtension
    {
        if ((int)$extension->status !== ContractExtension::STATUS_PENDING) {
            throw new HttpException(409, 'Yêu cầu này không ở trạng thái Chờ duyệt.');
        }

        $extension->update([
            'status' => ContractExtension::STATUS_REJECTED,
            'approved_by' => $approver->id,
            'approved_at' => Carbon::now(),
            'reject_reason' => $rejectReason,
        ]);

        ActivityLog::create([
            'user_id' => $approver->id,
            'action' => 'REJECT_CONTRACT_EXTENSION',
            'table_name' => 'contract_extensions',
            'record_id' => $extension->id,
            'new_data' => ['reject_reason' => $rejectReason],
            'ip_address' => request()->ip(),
        ]);

        if ($extension->creator) {
            $extension->creator->notify(new ContractExtensionNotification(
                $extension,
                'Yêu cầu gia hạn hợp đồng bị từ chối',
                'Yêu cầu gia hạn cho hợp đồng ' . ($extension->contract->contract_code ?? '') . ' đã bị từ chối với lý do: ' . $rejectReason,
                'extension_rejected'
            ));
        }

        return $extension->fresh(['contract', 'documents', 'creator', 'approver']);
    }

    /**
     * Hủy/rút lại yêu cầu gia hạn
     */
    public function cancel(ContractExtension $extension, User $user): ContractExtension
    {
        if (!in_array((int)$extension->status, [ContractExtension::STATUS_DRAFT, ContractExtension::STATUS_PENDING])) {
            throw new HttpException(409, 'Chỉ có thể hủy yêu cầu khi đang ở trạng thái Nháp hoặc Chờ duyệt.');
        }

        $extension->update([
            'status' => ContractExtension::STATUS_CANCELLED,
        ]);

        return $extension->fresh(['contract', 'documents', 'creator']);
    }

    /**
     * Xóa bản nháp gia hạn (chỉ khi status = 0)
     */
    public function deleteDraft(ContractExtension $extension, User $user): bool
    {
        if ((int)$extension->status !== ContractExtension::STATUS_DRAFT) {
            throw new HttpException(409, 'Chỉ có thể xóa yêu cầu khi đang ở trạng thái Nháp.');
        }

        return (bool)$extension->delete();
    }

    /**
     * Tải lên tài liệu đính kèm phụ lục (Spec mục 5.3)
     */
    public function uploadDocuments(ContractExtension $extension, array $files, User $user): array
    {
        if (!in_array((int)$extension->status, [ContractExtension::STATUS_DRAFT, ContractExtension::STATUS_PENDING])) {
            throw new HttpException(409, 'Chỉ được tải lên tài liệu phụ lục khi yêu cầu đang là Nháp hoặc Chờ duyệt.');
        }

        $savedDocs = [];
        foreach ($files as $file) {
            $originalName = $file->getClientOriginalName();
            $mimeType = $file->getClientMimeType();
            $fileSize = $file->getSize();

            // Lưu tệp ngẫu nhiên để chống path traversal
            $path = $file->store('contract_documents/' . $extension->contract_id, 'public');

            $doc = ContractDocument::create([
                'contract_id' => $extension->contract_id,
                'extension_id' => $extension->id,
                'file_url' => Storage::url($path),
                'original_name' => $originalName,
                'file_size' => $fileSize,
                'mime_type' => $mimeType,
            ]);

            $savedDocs[] = $doc;
        }

        return $savedDocs;
    }

    /**
     * Xóa tài liệu đính kèm
     */
    public function deleteDocument(ContractExtension $extension, int $documentId, User $user): bool
    {
        $document = ContractDocument::where('extension_id', $extension->id)->findOrFail($documentId);

        // Xóa file khỏi storage nếu tồn tại
        $relativePath = str_replace('/storage/', '', $document->file_url);
        if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }

        return (bool)$document->delete();
    }
}
