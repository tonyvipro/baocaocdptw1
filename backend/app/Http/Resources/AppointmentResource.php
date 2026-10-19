<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'appointment_time' => $this->appointment_time,
            'status' => $this->status,
            'note' => $this->note,
            
            // Nested resources for related data
            'customer' => $this->whenLoaded('customer', function () {
                return [
                    'id' => $this->customer->id,
                    'name' => $this->customer->name,
                    'phone' => $this->customer->phone,
                ];
            }),
            
            'broker' => $this->whenLoaded('broker', function () {
                return [
                    'id' => $this->broker->id,
                    'name' => $this->broker->name,
                    'phone' => $this->broker->phone,
                ];
            }),
            
            'property' => $this->whenLoaded('property', function () {
                return [
                    'id' => $this->property->id,
                    'title' => $this->property->title,
                    'address' => $this->property->district, // Giả sử dùng district làm address ngắn gọn
                ];
            }),
            
            // Thông tin flatten dành cho ReactJS bảng (chống vỡ layout nếu thiếu relation)
            'customer_name' => $this->customer->name ?? 'Khách hàng',
            'customer_phone' => $this->customer->phone ?? 'N/A',
            'broker_name' => $this->broker->name ?? 'Môi giới',
            'property_title' => $this->property->title ?? 'Bất động sản',
            'property_address' => $this->property->district ?? 'N/A',
        ];
    }
}
