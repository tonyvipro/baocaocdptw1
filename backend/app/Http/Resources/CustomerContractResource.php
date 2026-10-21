<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $today = Carbon::today();
        $endDate = $this->end_date ? Carbon::parse($this->end_date)->startOfDay() : null;
        $daysLeft = $endDate ? (int)$today->diffInDays($endDate, false) : null;
        $isExpiringSoon = $daysLeft !== null && $daysLeft >= 0 && $daysLeft <= 30;

        // Trạng thái hiển thị cho khách
        $statusLabel = match ((int)$this->status) {
            1 => 'Đang có hiệu lực',
            2 => 'Đã thanh lý / Hết hạn',
            3 => 'Đã hủy',
            default => 'Đang xử lý',
        };

        return [
            'id' => $this->id,
            'contract_code' => $this->contract_code,
            'contract_name' => $this->contract_name,
            'property' => $this->property ? [
                'id' => $this->property->id,
                'title' => $this->property->title,
                'address' => $this->property->address,
                'type' => $this->property->type,
            ] : null,
            'party_a_info' => $this->party_a_info,
            'party_b_info' => $this->party_b_info,
            'start_date' => $this->start_date ? Carbon::parse($this->start_date)->format('Y-m-d') : null,
            'end_date' => $this->end_date ? Carbon::parse($this->end_date)->format('Y-m-d') : null,
            'deposit_amount' => (float)$this->deposit_amount,
            'rental_price' => (float)$this->rental_price,
            'currency' => $this->currency ?: 'VND',
            'billing_cycle' => $this->billing_cycle,
            'status' => (int)$this->status,
            'status_label' => $statusLabel,
            'days_left' => $daysLeft,
            'is_expiring_soon' => $isExpiringSoon,
            'documents_count' => $this->documents_count ?? $this->documents()->whereIn('document_type', [0, 1, 4])->count(),
            'broker' => $this->broker ? [
                'name' => $this->broker->name,
                'phone' => $this->broker->phone,
            ] : null,
            // Lịch sử gia hạn đã được phê duyệt
            'approved_extensions' => $this->whenLoaded('extensions', function () {
                return $this->extensions
                    ->where('status', 2) // Chỉ các lần đã duyệt
                    ->map(function ($ext) {
                        return [
                            'id' => $ext->id,
                            'duration_months' => $ext->duration_months,
                            'new_start_date' => $ext->new_start_date ? Carbon::parse($ext->new_start_date)->format('Y-m-d') : null,
                            'new_end_date' => $ext->new_end_date ? Carbon::parse($ext->new_end_date)->format('Y-m-d') : null,
                            'old_end_date' => $ext->old_end_date ? Carbon::parse($ext->old_end_date)->format('Y-m-d') : null,
                            'new_rental_price' => (float)($ext->new_rental_price ?: $ext->old_rental_price),
                            'old_rental_price' => (float)$ext->old_rental_price,
                            'approved_at' => $ext->approved_at ? Carbon::parse($ext->approved_at)->format('Y-m-d H:i:s') : null,
                        ];
                    })->values();
            }),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
