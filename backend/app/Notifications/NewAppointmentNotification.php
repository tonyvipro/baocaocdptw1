<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use App\Models\Appointment;

class NewAppointmentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $appointment;

    /**
     * Khởi tạo notification với đối tượng Appointment
     */
    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
    }

    /**
     * Chọn kênh phân phối (channels)
     */
    public function via(object $notifiable): array
    {
        return ['database']; // Lưu vào bảng notifications của Laravel
    }

    /**
     * Dữ liệu trả về để lưu vào CSDL
     */
    public function toArray(object $notifiable): array
    {
        return [
            'appointment_id' => $this->appointment->id,
            'property_id' => $this->appointment->property_id,
            'customer_id' => $this->appointment->customer_id,
            'appointment_time' => $this->appointment->appointment_time,
            'message' => 'Bạn có một yêu cầu đặt lịch xem nhà mới cần xác nhận.',
        ];
    }
}
