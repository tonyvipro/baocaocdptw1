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
     * Quan hệ với Customer (User)
     */
    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id')->select(['id', 'name', 'phone']);
    }

    /**
     * Quan hệ với Broker (User)
     */
    public function broker()
    {
        return $this->belongsTo(User::class, 'broker_id')->select(['id', 'name', 'phone']);
    }

    /**
     * Quan hệ với Property
     */
    public function property()
    {
        return $this->belongsTo(Property::class, 'property_id')->select(['id', 'title', 'district', 'price_sale', 'price_rent', 'area']);
    }

    /**
     * Scope lọc danh sách lịch hẹn
     */
    public function scopeFilterAppointments($query, $user, $filters)
    {
        // Phân luồng dữ liệu (Authorization Scope)
        if ($user && $user->role_id === 2) {
            $query->where('broker_id', $user->id);
        } elseif ($user && ($user->role_id === 5 || $user->role_id === 3)) { // Customer or Owner
            $query->where('customer_id', $user->id);
        }

        // Filter: date (YYYY-MM-DD)
        if (!empty($filters['date'])) {
            $query->whereDate('appointment_time', $filters['date']);
        }

        // Filter: month & year (Cho giao diện Calendar)
        if (!empty($filters['month']) && !empty($filters['year'])) {
            $query->whereMonth('appointment_time', $filters['month'])
                  ->whereYear('appointment_time', $filters['year']);
        }

        // Filter: status
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        // Filter: search (Tên Khách hàng hoặc Môi giới)
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('customer', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                })->orWhereHas('broker', function ($q3) use ($search) {
                    $q3->where('name', 'like', "%{$search}%");
                });
            });
        }

        // Sắp xếp mặc định
        $query->orderBy('appointment_time', 'desc');

        return $query;
    }

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

    /**
     * Kiểm tra trạng thái có hợp lệ để thay đổi lịch không
     */
    public function checkStatusForReschedule()
    {
        if ($this->status == 2 || $this->status == 3) {
            return false;
        }
        return true;
    }

    /**
     * Kiểm tra chống trùng lịch khi dời ngày (cho riêng môi giới)
     */
    public function checkRescheduleDoubleBooking($newTime)
    {
        $newTimeObj = \Carbon\Carbon::parse($newTime);
        $timeWindowStart = $newTimeObj->copy()->subHour();
        $timeWindowEnd = $newTimeObj->copy()->addHour();

        $exists = self::where('broker_id', $this->broker_id)
            ->where('status', 1)
            ->where('id', '!=', $this->id)
            ->whereBetween('appointment_time', [$timeWindowStart, $timeWindowEnd])
            ->exists();

        return $exists;
    }

    /**
     * Thực thi dời lịch và cập nhật trạng thái
     */
    public function rescheduleAppointment($newTime, $changerRoleId)
    {
        $oldTime = $this->appointment_time;
        $this->appointment_time = $newTime;
        
        // Khách hàng dời -> chờ xác nhận. Môi giới/Admin dời -> đã xác nhận
        $this->status = ($changerRoleId == 5) ? 0 : 1; 
        
        $logText = 'Đã dời lịch từ ' . $oldTime . ' sang ' . $newTime;
        $this->note = $this->note ? $this->note . ' | ' . $logText : $logText;
        
        $this->save();
    }
}
