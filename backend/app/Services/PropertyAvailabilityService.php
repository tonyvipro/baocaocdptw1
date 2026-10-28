<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\InvoiceType;
use App\Models\Appointment;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Property;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PropertyAvailabilityService
{
    /**
     * Đồng bộ tính khả dụng của BĐS theo hợp đồng (Idempotent)
     * Gọi khi:
     * (a) Giao dịch QR/thủ công thành công và hóa đơn được thanh toán đủ
     * (b) Hợp đồng kích hoạt hiệu lực (0 -> 1)
     * (c) Hợp đồng hết hạn hoặc hủy (1 -> 2 hoặc 3)
     * (d) Cron đối soát định kỳ
     */
    public function syncForContract(Contract $contract): bool
    {
        return DB::transaction(function () use ($contract) {
            $contract = Contract::lockForUpdate()->find($contract->id);
            if (!$contract || !$contract->property_id) {
                return false;
            }

            // Khóa dòng Property theo thứ tự khóa: users -> properties -> contracts -> invoices -> transactions
            $property = Property::lockForUpdate()->find($contract->property_id);
            if (!$property) {
                return false;
            }

            $isRental = ($property->purpose === 'rent');
            $isSale = ($property->purpose === 'sale');

            // 1. Kiểm tra nếu HỢP ĐỒNG ĐÃ KẾT THÚC / THANH LÝ / HỦY (status = 2 hoặc 3)
            if (in_array((int) $contract->status, [2, 3], true)) {
                return $this->handleContractClosed($property, $contract, $isRental, $isSale);
            }

            // 2. Kiểm tra nếu HỢP ĐỒNG ĐANG CÓ HIỆU LỰC (status = 1)
            if ((int) $contract->status === 1) {
                $isSuccessful = $this->isContractQualifiedAsSuccessful($contract);
                if ($isSuccessful) {
                    return $this->markPropertyAsClosed($property, $contract, $isRental ? 'rented' : 'sold');
                }
            }

            return false;
        });
    }

    /**
     * Kiểm tra điều kiện "Thuê/Mua thành công" (Mục 4.1)
     * Hợp đồng status 1 VÀ đã thanh toán đủ khoản bắt buộc đầu tiên:
     * - Thuê: hóa đơn cọc (nếu deposit_amount > 0), hoặc hóa đơn tiền thuê kỳ đầu
     * - Bán: khoản đặt cọc mua bán hoặc thanh toán đợt 1
     */
    public function isContractQualifiedAsSuccessful(Contract $contract): bool
    {
        if ((int) $contract->status !== 1) {
            return false;
        }

        $depositAmount = (float) ($contract->deposit_amount ?? 0);

        // 1. Nếu có cọc, kiểm tra hóa đơn cọc đã thanh toán đủ chưa
        if ($depositAmount > 0) {
            $depositPaid = Invoice::where('contract_id', $contract->id)
                ->where('type', InvoiceType::DEPOSIT)
                ->where('status', InvoiceStatus::PAID)
                ->exists();

            if ($depositPaid) {
                return true;
            }
        }

        // 2. Kiểm tra hóa đơn tiền thuê kỳ 1 (hoặc hóa đơn mua bán) đã trả đủ chưa
        $firstPeriodPaid = Invoice::where('contract_id', $contract->id)
            ->whereIn('type', [InvoiceType::RENT, InvoiceType::SALE])
            ->where('status', InvoiceStatus::PAID)
            ->exists();

        return $firstPeriodPaid;
    }

    /**
     * Đánh dấu BĐS đã giao dịch thành công (status = 2: Đã cho thuê hoặc Đã bán)
     */
    protected function markPropertyAsClosed(Property $property, Contract $contract, string $reason): bool
    {
        if ((int) $property->status === 2 && $property->closed_contract_id === $contract->id) {
            return false; // Idempotent: Đã ở trạng thái đóng cho hợp đồng này rồi
        }

        $now = Carbon::now();
        $property->status = 2; // 2: Đã bán / Đã cho thuê
        $property->closed_reason = $reason;
        $property->closed_at = $now;
        $property->closed_contract_id = $contract->id;
        $property->save();

        // Tự động gỡ khỏi Meilisearch nếu có cài đặt
        if (method_exists($property, 'searchable')) {
            $property->searchable();
        }

        // 1. Tự động hủy các lịch hẹn đang chờ xác nhận hoặc đã xác nhận trên BĐS này (Mục 4.2)
        $this->cancelConflictingAppointments($property, $reason);

        // 2. Gửi notification cho chủ tin / môi giới phụ trách
        $this->notifyPropertyClosed($property, $contract, $reason);

        // 3. Ghi activity log
        $this->logActivity('PROPERTY_CLOSED', $property->id, [
            'reason' => $reason,
            'contract_id' => $contract->id,
            'contract_code' => $contract->contract_code,
        ]);

        return true;
    }

    /**
     * Xử lý khi hợp đồng kết thúc/hủy: mở lại hiển thị BĐS cho thuê nếu thỏa điều kiện
     */
    protected function handleContractClosed(Property $property, Contract $contract, bool $isRental, bool $isSale): bool
    {
        // Trường hợp MUA BÁN: BĐS đã bán giữ status = 2 vĩnh viễn (Mục 4.4)
        if ($isSale) {
            // Chỉ mở lại khi hợp đồng mua bán bị hủy (status = 3) VÀ không còn giao dịch thành công nào
            if ((int) $contract->status === 3) {
                $hasSuccessfulTx = DB::table('transactions')
                    ->join('invoices', 'invoices.id', '=', 'transactions.invoice_id')
                    ->where('invoices.contract_id', $contract->id)
                    ->where('transactions.status', 1)
                    ->whereNull('transactions.deleted_at')
                    ->exists();

                if ($hasSuccessfulTx) {
                    // Còn tiền đã thu chưa hoàn: giữ nguyên status 2 và tạo cảnh báo admin
                    $this->notifyAdminPendingRefund($property, $contract);
                    return false;
                }
            } else {
                return false;
            }
        }

        // Trường hợp CHO THUÊ (Mục 4.3):
        // Kiểm tra xem BĐS còn hợp đồng hiệu lực nào khác không
        $hasOtherActiveContract = Contract::where('property_id', $property->id)
            ->where('id', '!=', $contract->id)
            ->where('status', 1)
            ->exists();

        if ($hasOtherActiveContract) {
            return false;
        }

        // Chỉ mở lại nếu closed_contract_id đúng là hợp đồng này
        if ($property->closed_contract_id !== $contract->id && (int) $property->status === 2) {
            return false;
        }

        // Xác định trạng thái hiển thị lại:
        // Nếu tin đăng đã quá hạn (expire_date < today) thì sang 3 (Hết hạn), ngược lại là 1 (Đang hiển thị)
        $isListingExpired = $property->expire_date && Carbon::parse($property->expire_date)->isPast();
        $newStatus = $isListingExpired ? 3 : 1;

        $property->status = $newStatus;
        $property->closed_reason = null;
        $property->closed_at = null;
        $property->closed_contract_id = null;
        $property->save();

        if (method_exists($property, 'searchable')) {
            $property->searchable();
        }

        $this->notifyPropertyReopened($property, $newStatus);
        $this->logActivity('PROPERTY_REOPENED', $property->id, [
            'new_status' => $newStatus,
            'contract_id' => $contract->id,
        ]);

        return true;
    }

    /**
     * Mở lại BĐS thủ công bởi Quản trị viên (Admin Reopen)
     */
    public function reopenByAdmin(Property $property, string $reason, User $admin): void
    {
        DB::transaction(function () use ($property, $reason, $admin) {
            $property = Property::lockForUpdate()->find($property->id);
            $oldStatus = $property->status;

            $isListingExpired = $property->expire_date && Carbon::parse($property->expire_date)->isPast();
            $newStatus = $isListingExpired ? 3 : 1;

            $property->status = $newStatus;
            $property->closed_reason = null;
            $property->closed_at = null;
            $property->closed_contract_id = null;
            $property->save();

            if (method_exists($property, 'searchable')) {
                $property->searchable();
            }

            $this->logActivity('ADMIN_REOPEN_PROPERTY', $property->id, [
                'reason' => $reason,
                'admin_id' => $admin->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ]);
        });
    }

    /**
     * Tự động hủy các lịch hẹn đang Chờ xác nhận hoặc Đã xác nhận của khách khác
     */
    protected function cancelConflictingAppointments(Property $property, string $reason): void
    {
        $appointments = Appointment::where('property_id', $property->id)
            ->whereIn('status', [0, 1]) // 0: Chờ xác nhận, 1: Đã xác nhận
            ->get();

        $reasonText = ($reason === 'sold')
            ? 'Bất động sản này đã được bán thành công.'
            : 'Bất động sản này đã được cho thuê thành công.';

        foreach ($appointments as $apt) {
            $apt->status = 2; // 2: Đã hủy
            $apt->save();

            // Gửi thông báo cho khách hàng
            if ($apt->customer_id) {
                $this->sendNotification(
                    $apt->customer_id,
                    'Lịch hẹn xem nhà đã được hủy tự động',
                    "Lịch hẹn xem BĐS '{$property->title}' của bạn đã được hủy do {$reasonText}",
                    ['appointment_id' => $apt->id, 'property_id' => $property->id]
                );
            }

            // Gửi thông báo cho môi giới
            if ($apt->broker_id) {
                $this->sendNotification(
                    $apt->broker_id,
                    'Lịch hẹn xem nhà đã được hủy tự động',
                    "Lịch hẹn xem BĐS '{$property->title}' với khách hàng đã được hủy do {$reasonText}",
                    ['appointment_id' => $apt->id, 'property_id' => $property->id]
                );
            }
        }
    }

    protected function notifyPropertyClosed(Property $property, Contract $contract, string $reason): void
    {
        $label = ($reason === 'sold') ? 'được bán' : 'được cho thuê';
        $title = "Bất động sản đã {$label} thành công";
        $message = "Bất động sản '{$property->title}' đã {$label} theo hợp đồng {$contract->contract_code} và được ẩn khỏi giao diện khách hàng.";

        if ($property->user_id) {
            $this->sendNotification($property->user_id, $title, $message, ['property_id' => $property->id]);
        }
        if ($contract->broker_id && $contract->broker_id !== $property->user_id) {
            $this->sendNotification($contract->broker_id, $title, $message, ['property_id' => $property->id]);
        }
    }

    protected function notifyPropertyReopened(Property $property, int $newStatus): void
    {
        $statusLabel = ($newStatus === 1) ? 'đang hiển thị công khai trở lại' : 'chuyển sang trạng thái hết hạn tin';
        $title = "Bất động sản đã kết thúc hợp đồng thuê";
        $message = "Bất động sản '{$property->title}' đã {$statusLabel}.";

        if ($property->user_id) {
            $this->sendNotification($property->user_id, $title, $message, ['property_id' => $property->id]);
        }
    }

    protected function notifyAdminPendingRefund(Property $property, Contract $contract): void
    {
        $admins = User::where('role_id', 1)->get();
        foreach ($admins as $admin) {
            $this->sendNotification(
                $admin->id,
                'Cảnh báo: Hợp đồng mua bán bị hủy còn tiền chưa hoàn',
                "Hợp đồng mua bán {$contract->contract_code} của BĐS '{$property->title}' đã bị hủy nhưng vẫn còn giao dịch đã thu tiền. BĐS vẫn được giữ ẩn để chờ xử lý hoàn tiền.",
                ['property_id' => $property->id, 'contract_id' => $contract->id]
            );
        }
    }

    protected function sendNotification(int $userId, string $title, string $message, array $extra = []): void
    {
        try {
            DB::table('notifications')->insert([
                'id' => (string) Str::uuid(),
                'notifiable_type' => User::class,
                'notifiable_id' => $userId,
                'type' => 'App\Notifications\PropertyAvailabilityNotification',
                'data' => json_encode(array_merge([
                    'title' => $title,
                    'message' => $message,
                ], $extra), JSON_UNESCAPED_UNICODE),
                'read_at' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning("Lỗi tạo notification: " . $e->getMessage());
        }
    }

    protected function logActivity(string $action, int $recordId, array $newData): void
    {
        try {
            DB::table('activity_logs')->insert([
                'user_id' => auth('sanctum')->id() ?? auth()->id(),
                'action' => $action,
                'table_name' => 'properties',
                'record_id' => $recordId,
                'old_data' => null,
                'new_data' => json_encode($newData, JSON_UNESCAPED_UNICODE),
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        } catch (\Throwable $e) {
            // Silently ignore activity log failure
        }
    }
}
