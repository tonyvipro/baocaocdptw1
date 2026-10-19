<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Contract;
use App\Models\Property;
use App\Models\User;
use App\Http\Requests\StoreContractRequest;

class ContractController extends Controller
{
    /**
     * Lấy danh sách hợp đồng (Spec Hình 39 & 40)
     */
    public function index(Request $request)
    {
        $user = auth('sanctum')->user() ?? auth()->user() ?? User::where('role_id', 1)->first();
        $query = Contract::query()->with([
            'property:id,title,address,price',
            'broker:id,name,phone,email',
            'customer:id,name,phone,email',
        ]);

        // Phân quyền dữ liệu: Admin (Role 1) thấy toàn bộ, Broker (Role 2) thấy HĐ do mình lập
        if ($user && $user->role_id === 2) {
            $query->where('broker_id', $user->id);
        } elseif ($user && $user->role_id === 5) {
            $query->where('customer_id', $user->id);
        }

        // Lọc theo trạng thái hợp đồng (0: Nháp/Chờ ký, 1: Hiệu lực, 2: Hết hạn, 3: Đã hủy)
        if ($request->has('status') && $request->status !== '' && $request->status !== null) {
            $query->where('status', intval($request->status));
        }

        // Lọc theo hình thức ký (ONLINE hoặc DIRECT_MEETING)
        if ($request->filled('signing_method')) {
            $query->where('signing_method', $request->signing_method);
        }

        // Lọc theo hợp đồng giá trị lớn
        if ($request->has('is_high_value') && $request->is_high_value !== '') {
            $query->where('is_high_value', filter_var($request->is_high_value, FILTER_VALIDATE_BOOLEAN));
        }

        // Tìm kiếm theo mã hợp đồng, tên hợp đồng hoặc tên khách hàng
        if ($request->has('search') && $request->search !== '') {
            $search = trim($request->search);
            $query->where(function($q) use ($search) {
                $q->where('contract_code', 'like', "%{$search}%")
                  ->orWhere('contract_name', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($sub) use ($search) {
                      $sub->where('name', 'like', "%{$search}%")
                          ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        $contracts = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $contracts->items(),
            'meta' => [
                'current_page' => $contracts->currentPage(),
                'last_page' => $contracts->lastPage(),
                'total' => $contracts->total(),
            ]
        ]);
    }

    /**
     * Xem chi tiết 1 hợp đồng
     */
    public function show($id)
    {
        $contract = Contract::with([
            'property',
            'broker',
            'customer'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $contract
        ]);
    }

    /**
     * Tạo hợp đồng mới (Spec Hình 38)
     * Kèm Logic bảo vệ đặc biệt đối với BĐS giá trị lớn (High-Value Transaction)
     */
    public function store(StoreContractRequest $request)
    {
        $user = auth('sanctum')->user() ?? User::where('role_id', 1)->first();

        // 1. Phân quyền: Chỉ Quản trị viên (Role 1) và Môi giới (Role 2) được lập HĐ
        if ($user && !in_array($user->role_id, [1, 2])) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền thực hiện chức năng này.'
            ], 403);
        }

        $validatedData = $request->validated();
        $propertyId = $validatedData['property_id'];

        // 2. Logic kiểm tra trùng lặp BĐS còn hiệu lực
        if (Contract::checkActiveContractForProperty($propertyId)) {
            return response()->json([
                'success' => false,
                'message' => 'Bất động sản này đang thuộc một hợp đồng khác còn hiệu lực.'
            ], 422);
        }

        // 3. Logic nghiệp vụ BĐS GIÁ TRỊ LỚN (>= 5 Tỷ hoặc cọc >= 500 Triệu)
        $price = floatval($validatedData['rental_price'] ?? 0);
        $deposit = floatval($validatedData['deposit_amount'] ?? 0);
        $isHighValue = Contract::isHighValue($price, $deposit);

        $validatedData['is_high_value'] = $isHighValue;

        if ($isHighValue) {
            // Đối với BĐS giá trị lớn, bắt buộc phương thức ký là DIRECT_MEETING (Gặp mặt trực tiếp & công chứng)
            $validatedData['signing_method'] = 'DIRECT_MEETING';

            $location = $validatedData['meeting_location'] ?? 'Văn phòng Công chứng theo thỏa thuận';
            $notary = $validatedData['notary_office'] ?? 'Văn phòng công chứng có thẩm quyền';

            // Tự động bổ sung điều khoản cam kết gặp mặt & công chứng theo luật
            $highValueClause = "\n\n[ĐIỀU KHOẢN GIAO DỊCH GIÁ TRỊ CAO (≥ 5 TỶ VNĐ)]:\n"
                . "- Do giá trị giao dịch lớn, hai bên bắt buộc gặp mặt trực tiếp tại: {$location} "
                . (isset($validatedData['meeting_time']) ? "(Thời gian: {$validatedData['meeting_time']}) " : "")
                . "để đối chiếu bản gốc Giấy chứng nhận quyền sở hữu BĐS (Sổ đỏ/Sổ hồng) và CCCD gắn chip.\n"
                . "- Hợp đồng phải được công chứng, chứng thực tại {$notary} trước khi bàn giao tài sản và giải ngân tiền cọc/tiền mua bán.";

            if (!str_contains($validatedData['terms'] ?? '', 'ĐIỀU KHOẢN GIAO DỊCH GIÁ TRỊ CAO')) {
                $validatedData['terms'] = trim(($validatedData['terms'] ?? '') . $highValueClause);
            }
        }

        // 4. Mặc định trạng thái ban đầu là 0 (Chờ ký/Nháp) nếu chưa truyền
        if (!isset($validatedData['status'])) {
            $validatedData['status'] = 0; 
        }

        $contract = Contract::createNewContract($validatedData);

        // 5. Nếu kích hoạt hiệu lực ngay (status = 1), cập nhật Property sang Đã bán/thuê (status = 2)
        if ($contract->status == 1) {
            $property = Property::find($propertyId);
            if ($property) {
                $property->markAsSoldOrRented();
            }
        }

        // 6. Gửi thông báo đến khách hàng
        try {
            $customer = User::find($contract->customer_id);
            if ($customer && class_exists('\App\Notifications\NewContractNotification')) {
                $customer->notify(new \App\Notifications\NewContractNotification($contract));
            }
        } catch (\Throwable $e) {
            // Không ngắt luồng tạo HĐ nếu gửi notification gặp sự cố queue
        }

        return response()->json([
            'success' => true,
            'message' => $isHighValue 
                ? 'Tạo hợp đồng thành công! Đã thiết lập chế độ [Gặp mặt ký trực tiếp & Công chứng] cho BĐS giá trị lớn.' 
                : 'Tạo hợp đồng thuê/mua bán thành công!',
            'data' => $contract->load(['property', 'broker', 'customer'])
        ], 201);
    }

    /**
     * Cập nhật thông tin hợp đồng (Nút Sửa - Spec Hình 39 & 40)
     */
    public function update(Request $request, $id)
    {
        $contract = Contract::findOrFail($id);

        $validated = $request->validate([
            'contract_name' => 'sometimes|required|string|max:255',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after:start_date',
            'deposit_amount' => 'nullable|numeric|min:0',
            'rental_price' => 'nullable|numeric|min:0',
            'signing_method' => 'nullable|string|in:ONLINE,DIRECT_MEETING',
            'meeting_location' => 'nullable|string|max:255',
            'meeting_time' => 'nullable|date',
            'notary_office' => 'nullable|string|max:255',
            'party_a_info' => 'nullable|string',
            'party_b_info' => 'nullable|string',
            'tax_code' => 'nullable|string|max:50',
            'terms' => 'nullable|string',
        ]);

        // Cập nhật phát hiện giá trị lớn
        $price = floatval($request->input('rental_price', $contract->rental_price));
        $deposit = floatval($request->input('deposit_amount', $contract->deposit_amount));
        $isHighValue = Contract::isHighValue($price, $deposit);
        $validated['is_high_value'] = $isHighValue;

        if ($isHighValue) {
            $validated['signing_method'] = 'DIRECT_MEETING';
        }

        $contract->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông tin hợp đồng thành công!',
            'data' => $contract->fresh(['property', 'broker', 'customer'])
        ]);
    }

    /**
     * Quản lý trạng thái hợp đồng (Spec Hình 40 - Đổi trạng thái HĐ)
     * Trạng thái: 0 = Nháp/Chờ ký, 1 = Đang hiệu lực, 2 = Hết hạn/Thanh lý, 3 = Đã hủy
     */
    public function updateStatus(Request $request, $id)
    {
        $contract = Contract::findOrFail($id);

        $request->validate([
            'status' => 'required|integer|in:0,1,2,3',
        ]);

        $newStatus = intval($request->status);
        $oldStatus = $contract->status;

        // 1. Nếu chuyển sang 1 (Đang hiệu lực): Kiểm tra BĐS có bị kẹt HĐ khác không
        if ($newStatus === 1 && $oldStatus !== 1) {
            if (Contract::checkActiveContractForProperty($contract->property_id, $contract->id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bất động sản này đang có một hợp đồng khác đang còn hiệu lực!'
                ], 422);
            }

            // Đồng bộ BĐS sang trạng thái Đã bán / Đã thuê (status = 2)
            $property = Property::find($contract->property_id);
            if ($property) {
                $property->status = 2;
                $property->save();
            }
        } 
        // 2. Nếu chuyển từ 1 sang 2 (Thanh lý/Hết hạn) hoặc 3 (Đã hủy):
        elseif ($oldStatus === 1 && ($newStatus === 2 || $newStatus === 3)) {
            // Nếu không còn hợp đồng hiệu lực nào khác cho BĐS này, mở lại trạng thái Đang hiển thị (1)
            if (!Contract::checkActiveContractForProperty($contract->property_id, $contract->id)) {
                $property = Property::find($contract->property_id);
                if ($property && $property->status == 2) {
                    $property->status = 1; // Active lại
                    $property->save();
                }
            }
        }

        $contract->status = $newStatus;
        $contract->save();

        $statusTitles = [
            0 => 'Nháp / Chờ ký',
            1 => 'Đang có hiệu lực',
            2 => 'Đã thanh lý / Hết hạn',
            3 => 'Đã hủy',
        ];

        return response()->json([
            'success' => true,
            'message' => "Chuyển trạng thái hợp đồng sang '{$statusTitles[$newStatus]}' thành công!",
            'data' => $contract->fresh(['property', 'broker', 'customer'])
        ]);
    }

    /**
     * Xóa hợp đồng (Soft Delete - Spec Hình 39 Cột Hành Động)
     * Ràng buộc nghiệp vụ: Bảo vệ dữ liệu kế toán, pháp lý và kiểm toán
     */
    public function destroy($id)
    {
        $user = auth('sanctum')->user() ?? auth()->user() ?? User::where('role_id', 1)->first();

        // 1. Phân quyền: Chỉ Quản trị viên (Admin - Role 1) mới có quyền xóa hợp đồng
        if ($user && $user->role_id !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ Quản trị viên (Admin) mới có quyền xóa hợp đồng khỏi hệ thống.'
            ], 403);
        }

        $contract = Contract::findOrFail($id);

        // 2. RÀNG BUỘC PHÁP LÝ: Cấm xóa hợp đồng đang còn hiệu lực
        if ($contract->status === 1) {
            return response()->json([
                'success' => false,
                'message' => 'Hợp đồng đang có hiệu lực pháp lý (Active), không thể xóa! Vui lòng chuyển trạng thái sang [Đã hủy] hoặc [Đã thanh lý] trước khi thực hiện xóa.'
            ], 422);
        }

        // 3. RÀNG BUỘC KIỂM TOÁN TÀI CHÍNH: Cấm xóa hợp đồng đã phát sinh Hóa đơn (Invoices)
        $hasInvoices = \Illuminate\Support\Facades\DB::table('invoices')
            ->where('contract_id', $contract->id)
            ->exists();

        if ($hasInvoices) {
            return response()->json([
                'success' => false,
                'message' => 'Hợp đồng này đã phát sinh hóa đơn và lịch sử giao dịch tài chính. Để tuân thủ quy định kiểm toán kế toán, bạn không được phép xóa hợp đồng này.'
            ], 422);
        }

        // 4. Thực hiện XÓA MỀM (Soft Delete) để lưu vết lịch sử trong Database
        $contract->delete();

        return response()->json([
            'success' => true,
            'message' => "Đã xóa hợp đồng {$contract->contract_code} vào lưu trữ tạm (Soft Delete) thành công!"
        ]);
    }
}
