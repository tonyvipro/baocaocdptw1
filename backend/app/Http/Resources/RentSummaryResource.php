<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RentSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $totalCollected = (float) ($this['total_collected'] ?? 0);
        $totalOutstanding = (float) ($this['total_outstanding'] ?? 0);

        return [
            'month' => $this['month'] ?? 'all',
            'total_collected' => $totalCollected,
            'total_collected_formatted' => number_format($totalCollected, 0, ',', '.') . ' VNĐ',
            'total_outstanding' => $totalOutstanding,
            'total_outstanding_formatted' => number_format($totalOutstanding, 0, ',', '.') . ' VNĐ',
            'paid_units' => (int) ($this['paid_units'] ?? 0),
            'overdue_units' => (int) ($this['overdue_units'] ?? 0),
            'upcoming_units' => (int) ($this['upcoming_units'] ?? 0),
            'partial_units' => (int) ($this['partial_units'] ?? 0),
        ];
    }
}
