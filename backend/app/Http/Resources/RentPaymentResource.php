<?php

namespace App\Http\Resources;

use App\Queries\RentPaymentQuery;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RentPaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $contract = $this->contract;
        $property = $contract?->property;
        $customer = $contract?->customer;
        $broker = $contract?->broker;

        $displayStatus = $this->calculated_display_status ?? RentPaymentQuery::computeDisplayStatus($this->resource);

        $statusLabels = [
            'paid' => 'Đã thanh toán',
            'overdue' => 'Quá hạn',
            'partial' => 'Trả một phần',
            'unpaid' => 'Chưa đến hạn',
            'cancelled' => 'Đã hủy',
        ];

        // Format chu kỳ hiển thị theo Mục 3.2
        $periodDisplay = '';
        $billingCycle = $contract?->billing_cycle ?? 1;

        if ($billingCycle == 1) {
            $periodDate = $this->billing_period_start ? Carbon::parse($this->billing_period_start) : ($this->issue_date ? Carbon::parse($this->issue_date) : null);
            $periodDisplay = $periodDate ? 'Tháng ' . $periodDate->format('m/Y') : 'Tháng hiện tại';
        } else {
            $startStr = $this->billing_period_start ? Carbon::parse($this->billing_period_start)->format('d/m/Y') : '';
            $endStr = $this->billing_period_end ? Carbon::parse($this->billing_period_end)->format('d/m/Y') : '';
            $periodDisplay = ($startStr && $endStr) ? "{$startStr} - {$endStr}" : 'Theo kỳ';
        }

        $hasTransactions = $this->transactions->where('status', 1)->isNotEmpty() || ((float)$this->paid_amount > 0);
        $canEdit = !$hasTransactions && ((int) $this->status !== 3);

        return [
            'id' => $this->id,
            'invoice_no' => $this->invoice_no,
            'contract_id' => $this->contract_id,
            'contract' => $contract ? [
                'id' => $contract->id,
                'contract_code' => $contract->contract_code,
                'contract_name' => $contract->contract_name,
                'rental_price' => (float) $contract->rental_price,
                'billing_cycle' => (int) $contract->billing_cycle,
                'status' => (int) $contract->status,
                'broker_id' => $contract->broker_id,
                'broker_name' => $broker?->name,
            ] : null,
            'property' => $property ? [
                'id' => $property->id,
                'code' => $property->code ?? ('P' . $property->id),
                'title' => $property->title,
                'address' => $property->address,
            ] : null,
            'customer' => $customer ? [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
            ] : null,
            'billing_period_start' => $this->billing_period_start?->format('Y-m-d'),
            'billing_period_end' => $this->billing_period_end?->format('Y-m-d'),
            'period_display' => $periodDisplay,
            'due_date' => $this->due_date?->format('Y-m-d'),
            'due_date_formatted' => $this->due_date?->format('d/m/Y'),
            'amount' => (float) $this->amount,
            'paid_amount' => (float) $this->paid_amount,
            'remaining' => (float) $this->remaining,
            'display_status' => $displayStatus,
            'display_status_label' => $statusLabels[$displayStatus] ?? 'Chưa xác định',
            'raw_status' => (int) $this->status,
            'version' => (int) ($this->version ?? 1),
            'note' => $this->note,
            'cancel_reason' => $this->cancel_reason,
            'has_transactions' => $hasTransactions,
            'can_edit' => $canEdit,
            'edit_disabled_tooltip' => !$canEdit ? ($hasTransactions ? 'Hóa đơn đã phát sinh thanh toán, không thể chỉnh sửa' : 'Hóa đơn đã bị hủy') : null,
            'updated_by' => $this->updated_by,
            'updater_name' => $this->updater?->name,
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            'updated_at_formatted' => $this->updated_at?->format('d/m/Y H:i'),
            'transactions' => $this->whenLoaded('transactions', function () {
                return TransactionResource::collection($this->transactions);
            }),
        ];
    }
}
