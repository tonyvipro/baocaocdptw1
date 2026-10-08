<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ContractController extends Controller
{
    /**
     * Lấy danh sách hợp đồng
     */
    public function index(\Illuminate\Http\Request $request)
    {
        $user = auth('sanctum')->user();
        $query = \App\Models\Contract::query();

        // Admin (Role 1) thấy tất cả. Broker (Role 2) chỉ thấy hợp đồng mình phụ trách.
        if ($user->role_id === 2) {
            $query->where('broker_id', $user->id);
        } elseif ($user->role_id === 5) {
            $query->where('customer_id', $user->id);
        }

        // Filter trạng thái nếu có
        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        // Tìm kiếm theo mã hợp đồng hoặc tên hợp đồng
        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('contract_code', 'like', "%{$search}%")
                  ->orWhere('contract_name', 'like', "%{$search}%");
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
     * Tạo hợp đồng mới
     *
     * @param \App\Http\Requests\StoreContractRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(\App\Http\Requests\StoreContractRequest $request)
    {
        $user = auth('sanctum')->user();

        // 1. Phân quyền: Khách hàng (Role 5) không được phép tạo hợp đồng
        // Giả sử Role: 1 (Admin), 2 (Broker), 3 (Owner), 5 (Customer)
        if (!in_array($user->role_id, [1, 2])) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền thực hiện chức năng này.'
            ], 403);
        }

        $validatedData = $request->validated();
        $propertyId = $validatedData['property_id'];

        // 2. LOGIC CHỐNG CHỒNG CHÉO: Kiểm tra qua Model Contract
        if (\App\Models\Contract::checkActiveContractForProperty($propertyId)) {
            return response()->json([
                'success' => false,
                'message' => 'Bất động sản này đang thuộc một hợp đồng khác còn hiệu lực.'
            ], 422);
        }

        // 3. Thực thi lưu trữ dữ liệu
        // Nếu không truyền status, mặc định là 0 (Chờ ký)
        if (!isset($validatedData['status'])) {
            $validatedData['status'] = 0; 
        }

        $contract = \App\Models\Contract::createNewContract($validatedData);

        // 4. Nếu status là 1 (Đang có hiệu lực), cập nhật trạng thái Property (Mở rộng)
        if ($contract->status == 1) {
            $property = \App\Models\Property::find($propertyId);
            if ($property) {
                $property->markAsSoldOrRented();
            }
        }

        // 5. Gửi Notification cho Customer
        $customer = \App\Models\User::find($contract->customer_id);
        if ($customer) {
            $customer->notify(new \App\Notifications\NewContractNotification($contract));
        }

        return response()->json([
            'success' => true,
            'message' => 'Tạo hợp đồng thuê/mua bán thành công!',
            'data' => $contract
        ], 201);
    }
}
