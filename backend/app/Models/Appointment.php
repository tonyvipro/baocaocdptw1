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

    /**
     * Tìm lịch hẹn theo ID
     */
    public static function findById($id)
    {
        return self::find($id);
    }

    /**
     * Lấy đối tượng khách hàng của lịch hẹn
     */
    public function getCustomer()
    {
        return \App\Models\User::find($this->customer_id);
    }

    /**
     * Kiểm tra trạng thái có hợp lệ để xác nhận không
     * Trả về true nếu hợp lệ, mảng lỗi nếu không
     */
    public function checkStatusForConfirmation()
    {
        if ($this->status == 2 || $this->status == 3) {
            return ['message' => 'Lịch hẹn này đã bị hủy hoặc đã hoàn thành trước đó.'];
        }

        if ($this->status == 1) {
            return ['message' => 'Lịch hẹn này đã được xác nhận.'];
        }

        return true;
    }

    /**
     * Đánh dấu lịch hẹn là đã xác nhận
     */
    public function markAsConfirmed()
    {
        $this->status = 1;
        $this->save();
    }

    /**
     * Lấy đối tượng môi giới của lịch hẹn
     */
    public function getBroker()
    {
        return \App\Models\User::find($this->broker_id);
    }

    /**
     * Kiểm tra trạng thái và thời gian có hợp lệ để hủy không
     */
    public function checkStatusForCancellation()
    {
        if ($this->status == 2 || $this->status == 3) {
            return ['status' => 422, 'message' => 'Lịch hẹn này đã bị hủy hoặc đã hoàn thành trước đó.'];
        }

        if (now()->greaterThan(\Carbon\Carbon::parse($this->appointment_time))) {
            return ['status' => 400, 'message' => 'Không thể hủy lịch hẹn đã diễn ra trong quá khứ.'];
        }

        return true;
    }

    /**
     * Thực hiện hủy lịch hẹn
     */
    public function cancelAppointment($reason)
    {
        $this->status = 3; // 3 là Đã hủy
        $this->note = $this->note ? $this->note . ' | Lý do hủy: ' . $reason : 'Lý do hủy: ' . $reason;
        $this->save();
    }
}
