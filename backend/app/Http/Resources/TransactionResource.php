<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transaction_code' => $this->transaction_code,
            'invoice_id' => $this->invoice_id,
            'amount' => (float) $this->amount,
            'amount_formatted' => number_format((float) $this->amount, 0, ',', '.') . ' VNĐ',
            'payment_method' => $this->payment_method,
            'payment_method_label' => $this->payment_method_label,
            'source' => $this->source,
            'source_label' => $this->source_label,
            'status' => (int) $this->status,
            'status_label' => $this->status_label,
            'reference_code' => $this->reference_code,
            'gateway' => $this->gateway,
            'gateway_order_id' => $this->gateway_order_id,
            'gateway_txn_id' => $this->gateway_txn_id,
            'expires_at' => $this->expires_at?->format('Y-m-d H:i:s'),
            'failure_reason' => $this->failure_reason,
            'qr_content' => $this->qr_content,
            'pay_url' => $this->pay_url,
            'note' => $this->note,
            'recorded_by' => $this->recorded_by,
            'recorder_name' => $this->recorder?->name ?? 'Cổng thanh toán / Khách hàng',
            'client_token' => $this->client_token,
            'paid_at' => $this->paid_at?->format('Y-m-d H:i:s'),
            'paid_at_formatted' => $this->paid_at?->format('d/m/Y H:i'),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
