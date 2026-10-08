<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'broker_id',
        'property_id',
        'appointment_time',
        'status',
        'note',
    ];

    /**
     * Kiểm tra trùng lịch hẹn của môi giới
     * Trả về true nếu bị trùng (đã có lịch), false nếu trống
     */
    public static function checkDoubleBooking($brokerId, $appointmentTime, $customerId = null)
    {
        $time = Carbon::parse($appointmentTime);
        $startTime = $time->copy()->subHour();
        $endTime = $time->copy()->addHour();

        // 1. Kiểm tra lịch của môi giới (Không được trùng giờ với bất kỳ ai)
        $brokerBooked = self::where('broker_id', $brokerId)
            ->where('status', 1) // 1 = Đã xác nhận
            ->whereBetween('appointment_time', [$startTime, $endTime])
            ->exists();

        if ($brokerBooked) {
            return 'broker_booked';
        }

        // 2. [Lỗi Logic Mở Rộng]: Kiểm tra lịch của chính khách hàng (Khách hàng không thể đặt 2 lịch hẹn cùng lúc)
        if ($customerId) {
            $customerBooked = self::where('customer_id', $customerId)
                ->whereIn('status', [0, 1]) // Chờ xác nhận hoặc Đã xác nhận
                ->whereBetween('appointment_time', [$startTime, $endTime])
                ->exists();

            if ($customerBooked) {
                return 'customer_booked';
            }
        }

        return false;
    }
    
    /**
     * Lưu lịch hẹn mới
     */
    public static function createNewAppointment($data)
    {
        return self::create($data);
    }
}
