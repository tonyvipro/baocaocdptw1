<?php

namespace App\Http\Controllers;

use App\Models\Broker;
use App\Models\BrokerAssignment;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class BrokerController extends Controller
{
    // ==========================================
    // 1. QUẢN LÝ MÔI GIỚI (TAB 1 - CHUẨN HÌNH 29)
    // ==========================================

    /**
     * Danh sách môi giới (Search real-time, filter, pagination)
     */
    public function indexBrokers(Request $request)
    {
        $query = Broker::withCount('assignments');

        // Tìm kiếm (Giới hạn tối đa 250 ký tự)
        if ($search = $request->input('search')) {
            $search = mb_substr(trim($search), 0, 250);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Lọc theo Cấp bậc (level)
        if ($level = $request->input('level')) {
            if ($level !== 'all') {
                $query->where('level', $level);
            }
        }

        // Lọc theo Trạng thái (status)
        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        $perPage = min(max((int)$request->input('per_page', 8), 1), 100);
        $brokers = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Summary counts
        $summary = [
            'total' => Broker::count(),
            'active' => Broker::where('status', 'active')->count(),
            'busy' => Broker::where('status', 'busy')->count(),
            'inactive' => Broker::where('status', 'inactive')->count(),
            'total_deals' => (int) Broker::sum('deals_count'),
            'total_commission' => (float) Broker::sum('total_commission'),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $brokers->items(),
            'pagination' => [
                'total' => $brokers->total(),
                'per_page' => $brokers->perPage(),
                'current_page' => $brokers->currentPage(),
                'last_page' => $brokers->lastPage(),
                'from' => $brokers->firstItem() ?? 0,
                'to' => $brokers->lastItem() ?? 0,
            ],
            'summary' => $summary,
        ]);
    }

    /**
     * Thêm môi giới mới (Validation max 250 ký tự)
     */
    public function storeBroker(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:250',
            'code' => 'nullable|string|max:50|unique:brokers,code',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:250',
            'level' => 'required|string|max:100',
            'deals_count' => 'nullable|integer|min:0',
            'total_commission' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:active,inactive,busy',
            'notes' => 'nullable|string|max:250',
        ], [
            'name.required' => 'Vui lòng nhập tên môi giới.',
            'name.max' => 'Tên môi giới không được vượt quá 250 ký tự.',
            'code.unique' => 'Mã định danh môi giới đã tồn tại.',
            'email.email' => 'Email không đúng định dạng.',
            'email.max' => 'Email không được vượt quá 250 ký tự.',
            'notes.max' => 'Ghi chú không được vượt quá 250 ký tự.',
        ]);

        // Tự động sinh mã nếu không nhập
        if (empty($validated['code'])) {
            $latestId = (Broker::max('id') ?? 0) + 1;
            $validated['code'] = 'MG-' . str_pad($latestId, 3, '0', STR_PAD_LEFT);
        }

        $validated['deals_count'] = $validated['deals_count'] ?? 0;
        $validated['total_commission'] = $validated['total_commission'] ?? 0;

        $broker = Broker::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => "Thêm mới môi giới '{$broker->name}' thành công!",
            'data' => $broker,
        ], 201);
    }

    /**
     * Chi tiết môi giới
     */
    public function showBroker($id)
    {
        try {
            $broker = Broker::with(['assignments' => function ($q) {
                $q->orderBy('assigned_date', 'desc')->limit(10);
            }])->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $broker,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy hồ sơ môi giới này.',
            ], 404);
        }
    }

    /**
     * Cập nhật môi giới (Validation max 250 ký tự)
     */
    public function updateBroker(Request $request, $id)
    {
        try {
            $broker = Broker::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:250',
                'code' => 'required|string|max:50|unique:brokers,code,' . $id,
                'phone' => 'nullable|string|max:50',
                'email' => 'nullable|email|max:250',
                'level' => 'required|string|max:100',
                'deals_count' => 'nullable|integer|min:0',
                'total_commission' => 'nullable|numeric|min:0',
                'status' => 'required|string|in:active,inactive,busy',
                'notes' => 'nullable|string|max:250',
                'last_updated_at' => 'nullable|string',
            ], [
                'name.required' => 'Vui lòng nhập tên môi giới.',
                'name.max' => 'Tên môi giới không được vượt quá 250 ký tự.',
                'notes.max' => 'Ghi chú không được vượt quá 250 ký tự.',
            ]);

            // Optimistic concurrency control (Multi-tab sync)
            if ($request->filled('last_updated_at')) {
                $dbTime = strtotime($broker->updated_at);
                $reqTime = strtotime($request->input('last_updated_at'));
                if ($dbTime && $reqTime && abs($dbTime - $reqTime) > 1) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Dữ liệu môi giới này vừa được thay đổi ở tab khác. Vui lòng tải lại trang!',
                    ], 409);
                }
            }

            $broker->update($validated);

            return response()->json([
                'status' => 'success',
                'message' => "Cập nhật thông tin môi giới '{$broker->name}' thành công!",
                'data' => $broker,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Môi giới này không tồn tại hoặc đã bị xóa.',
            ], 404);
        }
    }

    /**
     * Xóa môi giới
     */
    public function destroyBroker($id)
    {
        try {
            $broker = Broker::findOrFail($id);
            $name = $broker->name;
            $broker->delete();

            return response()->json([
                'status' => 'success',
                'message' => "Đã xóa môi giới '{$name}' khỏi hệ thống thành công!",
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Môi giới này không tồn tại hoặc đã bị xóa trước đó.',
            ], 404);
        }
    }


    // ==========================================
    // 2. PHÂN CÔNG MÔI GIỚI (TAB 2 - CHUẨN HÌNH 30)
    // ==========================================

    /**
     * Danh sách phân công (Search real-time, filter, pagination)
     */
    public function indexAssignments(Request $request)
    {
        $query = BrokerAssignment::with('broker:id,code,name,phone,email,level');

        // Tìm kiếm (Giới hạn tối đa 250 ký tự)
        if ($search = $request->input('search')) {
            $search = mb_substr(trim($search), 0, 250);
            $query->where(function ($q) use ($search) {
                $q->where('request_code', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%")
                  ->orWhere('property_location', 'like', "%{$search}%")
                  ->orWhereHas('broker', function ($bq) use ($search) {
                      $bq->where('name', 'like', "%{$search}%")
                         ->orWhere('code', 'like', "%{$search}%");
                  });
            });
        }

        // Lọc theo Trạng thái phân công
        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // Lọc theo Môi giới phụ trách
        if ($brokerId = $request->input('broker_id')) {
            if ($brokerId !== 'all') {
                $query->where('broker_id', $brokerId);
            }
        }

        $perPage = min(max((int)$request->input('per_page', 8), 1), 100);
        $assignments = $query->orderBy('assigned_date', 'desc')
                             ->orderBy('created_at', 'desc')
                             ->paginate($perPage);

        // Summary counts
        $summary = [
            'total' => BrokerAssignment::count(),
            'pending' => BrokerAssignment::where('status', 'pending')->count(),
            'processing' => BrokerAssignment::where('status', 'processing')->count(),
            'completed' => BrokerAssignment::where('status', 'completed')->count(),
            'cancelled' => BrokerAssignment::where('status', 'cancelled')->count(),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $assignments->items(),
            'pagination' => [
                'total' => $assignments->total(),
                'per_page' => $assignments->perPage(),
                'current_page' => $assignments->currentPage(),
                'last_page' => $assignments->lastPage(),
                'from' => $assignments->firstItem() ?? 0,
                'to' => $assignments->lastItem() ?? 0,
            ],
            'summary' => $summary,
        ]);
    }

    /**
     * Tạo phân công mới (Validation max 250 ký tự)
     */
    public function storeAssignment(Request $request)
    {
        $validated = $request->validate([
            'request_code' => 'nullable|string|max:50',
            'customer_name' => 'required|string|max:250',
            'customer_phone' => 'nullable|string|max:50',
            'customer_email' => 'nullable|email|max:250',
            'property_location' => 'required|string|max:250',
            'broker_id' => 'required|exists:brokers,id',
            'assigned_date' => 'required|date',
            'status' => 'required|string|in:pending,processing,completed,cancelled',
            'notes' => 'nullable|string|max:250',
        ], [
            'customer_name.required' => 'Vui lòng nhập tên khách hàng.',
            'customer_name.max' => 'Tên khách hàng không được vượt quá 250 ký tự.',
            'property_location.required' => 'Vui lòng nhập địa điểm bất động sản.',
            'property_location.max' => 'Địa điểm BĐS không được vượt quá 250 ký tự.',
            'broker_id.required' => 'Vui lòng chọn môi giới phụ trách.',
            'broker_id.exists' => 'Môi giới được chọn không tồn tại.',
            'assigned_date.required' => 'Vui lòng chọn ngày yêu cầu/phân công.',
            'notes.max' => 'Ghi chú yêu cầu không được vượt quá 250 ký tự.',
        ]);

        // Tự động sinh ID Yêu cầu nếu không nhập
        if (empty($validated['request_code'])) {
            $year = date('Y');
            $latestId = (BrokerAssignment::max('id') ?? 0) + 1;
            $validated['request_code'] = "YC-{$year}-" . str_pad($latestId, 3, '0', STR_PAD_LEFT);
        }

        $assignment = BrokerAssignment::create($validated);
        $assignment->load('broker:id,code,name,phone,email,level');

        return response()->json([
            'status' => 'success',
            'message' => "Tạo phân công yêu cầu '{$assignment->request_code}' cho khách hàng '{$assignment->customer_name}' thành công!",
            'data' => $assignment,
        ], 201);
    }

    /**
     * Chi tiết phân công
     */
    public function showAssignment($id)
    {
        try {
            $assignment = BrokerAssignment::with('broker')->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $assignment,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy thông tin phân công này.',
            ], 404);
        }
    }

    /**
     * Cập nhật phân công (Validation max 250 ký tự)
     */
    public function updateAssignment(Request $request, $id)
    {
        try {
            $assignment = BrokerAssignment::findOrFail($id);

            $validated = $request->validate([
                'request_code' => 'required|string|max:50',
                'customer_name' => 'required|string|max:250',
                'customer_phone' => 'nullable|string|max:50',
                'customer_email' => 'nullable|email|max:250',
                'property_location' => 'required|string|max:250',
                'broker_id' => 'required|exists:brokers,id',
                'assigned_date' => 'required|date',
                'status' => 'required|string|in:pending,processing,completed,cancelled',
                'notes' => 'nullable|string|max:250',
                'last_updated_at' => 'nullable|string',
            ], [
                'customer_name.required' => 'Vui lòng nhập tên khách hàng.',
                'customer_name.max' => 'Tên khách hàng không được vượt quá 250 ký tự.',
                'property_location.required' => 'Vui lòng nhập địa điểm bất động sản.',
                'property_location.max' => 'Địa điểm BĐS không được vượt quá 250 ký tự.',
                'notes.max' => 'Ghi chú yêu cầu không được vượt quá 250 ký tự.',
            ]);

            // Optimistic concurrency control (Multi-tab sync)
            if ($request->filled('last_updated_at')) {
                $dbTime = strtotime($assignment->updated_at);
                $reqTime = strtotime($request->input('last_updated_at'));
                if ($dbTime && $reqTime && abs($dbTime - $reqTime) > 1) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Thông tin phân công này vừa được thay đổi ở tab khác. Vui lòng tải lại trang!',
                    ], 409);
                }
            }

            $assignment->update($validated);
            $assignment->load('broker:id,code,name,phone,email,level');

            return response()->json([
                'status' => 'success',
                'message' => "Cập nhật phân công '{$assignment->request_code}' thành công!",
                'data' => $assignment,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Phân công này không tồn tại hoặc đã bị xóa.',
            ], 404);
        }
    }

    /**
     * Hủy yêu cầu phân công
     */
    public function cancelAssignment(Request $request, $id)
    {
        try {
            $assignment = BrokerAssignment::findOrFail($id);
            $assignment->status = 'cancelled';
            if ($request->filled('notes')) {
                $assignment->notes = mb_substr(trim($request->input('notes')), 0, 250);
            }
            $assignment->save();
            $assignment->load('broker:id,code,name,phone,email,level');

            return response()->json([
                'status' => 'success',
                'message' => "Đã hủy bỏ phân công yêu cầu '{$assignment->request_code}' thành công!",
                'data' => $assignment,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Phân công này không tồn tại hoặc đã bị xóa.',
            ], 404);
        }
    }

    /**
     * Xóa phân công
     */
    public function destroyAssignment($id)
    {
        try {
            $assignment = BrokerAssignment::findOrFail($id);
            $code = $assignment->request_code;
            $assignment->delete();

            return response()->json([
                'status' => 'success',
                'message' => "Đã xóa phân công '{$code}' khỏi hệ thống thành công!",
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Phân công này không tồn tại hoặc đã bị xóa trước đó.',
            ], 404);
        }
    }
}
