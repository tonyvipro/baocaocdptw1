<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAppointmentRequest;
use App\Models\Appointment;
use App\Models\User;
use App\Notifications\NewAppointmentNotification;
use Illuminate\Http\JsonResponse;

class AppointmentController extends Controller
{
    /**
     * Tạo lịch hẹn xem nhà mới (Create Appointment API)
     *
     * @param StoreAppointmentRequest $request
     * @return JsonResponse
     */
    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        // Dữ liệu đã được validate (bao gồm check login, rule thời gian, regex số điện thoại)
        $validatedData = $request->validated();
        
        $brokerId = $validatedData['broker_id'];
        $appointmentTime = $validatedData['appointment_time'];

        $customerId = auth('sanctum')->id();
        
        // 1. Kiểm tra chống trùng lịch (Double Booking) thông qua Model
        // (Tuân thủ yêu cầu: trong controller không được truy vấn trực tiếp xuống database)
        $doubleBookingStatus = Appointment::checkDoubleBooking($brokerId, $appointmentTime, $customerId);

        if ($doubleBookingStatus === 'broker_booked') {
            return response()->json([
                'message' => 'Khung giờ này đã có người đặt trước. Vui lòng chọn thời gian khác.',
                'errors' => [
                    'appointment_time' => ['Khung giờ này đã có người đặt trước. Vui lòng chọn thời gian khác.']
                ]
            ], 422);
        }

        if ($doubleBookingStatus === 'customer_booked') {
            return response()->json([
                'message' => 'Bạn đã có một lịch hẹn trong khung giờ này. Vui lòng không đặt trùng lịch.',
                'errors' => [
                    'appointment_time' => ['Bạn đã có một lịch hẹn trong khung giờ này. Vui lòng không đặt trùng lịch.']
                ]
            ], 422);
        }

        // 2. Thực thi lưu dữ liệu
        // Lấy ID khách hàng tự động từ Auth::user() qua Sanctum
        $validatedData['customer_id'] = $customerId;
        $validatedData['status'] = 0; // Trạng thái mặc định: Chờ xác nhận

        // Lưu thông qua hàm của Model
        $appointment = Appointment::createNewAppointment($validatedData);

        // 3. Gửi Notification cho môi giới (broker_id)
        $broker = User::find($brokerId);
        if ($broker) {
            $broker->notify(new NewAppointmentNotification($appointment));
        }

        // 4. Trả về response JSON thành công (status 201)
        return response()->json([
            'message' => 'Gửi yêu cầu đặt lịch xem nhà thành công! Môi giới sẽ sớm liên hệ xác nhận.',
            'data' => $appointment
        ], 201);
    }

    /**
     * Xác nhận lịch hẹn (Confirm Appointment API)
     *
     * @param int $id
     * @return JsonResponse
     */
    public function confirm($id): JsonResponse
    {
        $user = auth('sanctum')->user();
        
        // 1. Tìm lịch hẹn thông qua Model
        $appointment = Appointment::findById($id);

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Lịch hẹn không tồn tại hoặc đã bị xóa khỏi hệ thống. Vui lòng làm mới lại trang.'
            ], 404);
        }

        // 2. Logic phân quyền kép (Authorization)
        // Là Quản trị viên (Admin - role_id = 1) HOẶC là Môi giới phụ trách
        if ($user->role_id !== 1 && $user->id !== $appointment->broker_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // 3. Logic nghiệp vụ (Kiểm tra trạng thái)
        $statusCheck = $appointment->checkStatusForConfirmation();
        if ($statusCheck !== true) {
            return response()->json([
                'message' => $statusCheck['message']
            ], 422);
        }

        // 4. Thực thi cập nhật trạng thái
        $appointment->markAsConfirmed();

        // Gửi Notification cho Khách hàng
        $customer = clone $appointment->getCustomer();
        if ($customer) {
            $customer->notify(new \App\Notifications\AppointmentConfirmedNotification($appointment));
        }

        // Trả về phản hồi thành công
        return response()->json([
            'message' => 'Xác nhận lịch hẹn thành công!',
        ], 200);
    }
}
