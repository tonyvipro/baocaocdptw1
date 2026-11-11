<?php

namespace App\Http\Controllers;

use App\Http\Requests\TransferBrokerAssignmentRequest;
use App\Models\ActivityLog;
use App\Models\Broker;
use App\Models\BrokerAssignment;
use App\Models\Customer;
use App\Models\CustomerDemand;
use App\Models\CustomerInteraction;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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
        $query = Broker::with('user:id,name,email,role_id,is_active')->withCount('assignments');

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
     * Thêm môi giới mới (user_id nullable: hồ sơ có thể tồn tại trước tài khoản)
     */
    public function storeBroker(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
            'name' => 'required|string|max:250',
            'code' => 'nullable|string|max:50|unique:brokers,code',
            'phone' => ['nullable', 'string', 'regex:/^[0-9]{10,11}$/D'],
            'email' => 'nullable|email|max:250',
            'level' => 'required|string|max:100',
            'deals_count' => 'nullable|integer|min:0',
            'total_commission' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:active,inactive,busy',
            'notes' => 'nullable|string|max:250',
        ], [
            'user_id.exists' => 'Tài khoản người dùng liên kết không tồn tại hoặc đã bị xóa.',
            'name.required' => 'Vui lòng nhập tên môi giới.',
            'name.max' => 'Tên môi giới không được vượt quá 250 ký tự.',
            'code.unique' => 'Mã định danh môi giới đã tồn tại.',
            'email.email' => 'Email không đúng định dạng.',
            'email.max' => 'Email không được vượt quá 250 ký tự.',
            'notes.max' => 'Ghi chú không được vượt quá 250 ký tự.',
        ]);

        // Tự động liên kết tài khoản nếu email trùng khớp với user đang hoạt động
        if (empty($validated['user_id']) && !empty($validated['email'])) {
            $userByEmail = \App\Models\User::where('email', $validated['email'])
                ->where('is_active', true)
                ->whereNull('deleted_at')
                ->first();
            if ($userByEmail) {
                $validated['user_id'] = $userByEmail->id;
            }
        }

        // Tự động sinh mã nếu không nhập
        if (empty($validated['code'])) {
            $latestId = (Broker::max('id') ?? 0) + 1;
            $validated['code'] = 'MG-' . str_pad($latestId, 3, '0', STR_PAD_LEFT);
        }

        $validated['deals_count'] = $validated['deals_count'] ?? 0;
        $validated['total_commission'] = $validated['total_commission'] ?? 0;

        $broker = Broker::create($validated);
        $broker->load('user:id,name,email,role_id,is_active');

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
            $broker = Broker::with(['user:id,name,email,role_id,is_active', 'assignments' => function ($q) {
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
                'user_id' => ['nullable', 'integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
                'name' => 'required|string|max:250',
                'code' => 'required|string|max:50|unique:brokers,code,' . $id,
                'phone' => ['nullable', 'string', 'regex:/^[0-9]{10,11}$/D'],
                'email' => 'nullable|email|max:250',
                'level' => 'required|string|max:100',
                'deals_count' => 'nullable|integer|min:0',
                'total_commission' => 'nullable|numeric|min:0',
                'status' => 'required|string|in:active,inactive,busy',
                'notes' => 'nullable|string|max:250',
                'last_updated_at' => 'nullable|string',
            ], [
                'user_id.exists' => 'Tài khoản người dùng liên kết không tồn tại hoặc đã bị xóa.',
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
            $broker->load('user:id,name,email,role_id,is_active');

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
     * Kiểm tra công việc/khách hàng đang phụ trách của môi giới trước khi xóa
     */
    public function checkActiveWork($id)
    {
        try {
            $broker = Broker::findOrFail($id);

            $activeAssignments = $broker->assignments()->whereIn('status', ['pending', 'processing'])
                ->get(['id', 'request_code', 'customer_name', 'status', 'property_location']);
            $activeCustomers = $broker->user_id
                ? \App\Models\Customer::where('assigned_to', $broker->user_id)->whereNull('deleted_at')
                    ->get(['id', 'code', 'name', 'phone', 'customer_group', 'status'])
                : collect();

            $totalActive = $activeAssignments->count() + $activeCustomers->count();

            // Danh sách môi giới đủ điều kiện nhận bàn giao: active, có tài khoản user_id, khác môi giới này
            $eligibleBrokers = Broker::whereNull('deleted_at')
                ->where('id', '!=', $broker->id)
                ->where('status', '!=', 'inactive')
                ->whereNotNull('user_id')
                ->with('user:id,name,email')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'phone', 'email', 'level', 'status', 'user_id']);

            return response()->json([
                'status' => 'success',
                'broker' => [
                    'id' => $broker->id,
                    'code' => $broker->code,
                    'name' => $broker->name,
                    'user_id' => $broker->user_id,
                ],
                'has_active_work' => $totalActive > 0,
                'total_active' => $totalActive,
                'active_assignments_count' => $activeAssignments->count(),
                'active_customers_count' => $activeCustomers->count(),
                'active_assignments' => $activeAssignments,
                'active_customers' => $activeCustomers,
                'eligible_brokers' => $eligibleBrokers,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy hồ sơ môi giới này.',
            ], 404);
        }
    }

    /**
     * Liên kết tài khoản người dùng cho hồ sơ môi giới
     */
    public function linkUser(Request $request, $id)
    {
        try {
            $broker = Broker::findOrFail($id);
            $validated = $request->validate([
                'user_id' => ['required', 'integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
            ], [
                'user_id.required' => 'Vui lòng chọn tài khoản người dùng cần liên kết.',
                'user_id.exists' => 'Tài khoản người dùng không tồn tại hoặc đã bị xóa.',
            ]);

            $user = \App\Models\User::findOrFail($validated['user_id']);
            $broker->update(['user_id' => $user->id]);

            return response()->json([
                'status' => 'success',
                'message' => "Đã liên kết tài khoản '{$user->name}' ({$user->email}) cho môi giới '{$broker->name}' thành công!",
                'data' => $broker->fresh(['user:id,name,email,role_id,is_active']),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy hồ sơ môi giới này.',
            ], 404);
        }
    }

    /**
     * Hủy liên kết tài khoản người dùng của hồ sơ môi giới
     */
    public function unlinkUser($id)
    {
        try {
            $broker = Broker::findOrFail($id);
            abort_if($broker->assignments()->whereIn('status', ['pending', 'processing'])->exists(), 422,
                'Không thể hủy liên kết tài khoản khi môi giới đang có yêu cầu phân công chưa hoàn thành.');

            $broker->update(['user_id' => null]);

            return response()->json([
                'status' => 'success',
                'message' => "Đã hủy liên kết tài khoản của môi giới '{$broker->name}'.",
                'data' => $broker->fresh(),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy hồ sơ môi giới này.',
            ], 404);
        }
    }

    /**
     * Xóa môi giới (Dùng SoftDeletes; kiểm tra và yêu cầu bàn giao nếu còn việc/khách đang phụ trách)
     */
    public function destroyBroker(Request $request, $id)
    {
        try {
            $broker = Broker::findOrFail($id);
            $name = $broker->name;

            // Đếm số việc và khách đang phụ trách
            $activeAssignments = $broker->assignments()->whereIn('status', ['pending', 'processing'])->get();
            $activeCustomers = $broker->user_id
                ? \App\Models\Customer::where('assigned_to', $broker->user_id)->whereNull('deleted_at')->get()
                : collect();
            $totalActive = $activeAssignments->count() + $activeCustomers->count();

            if ($totalActive > 0) {
                $handoverId = $request->input('handover_broker_id');

                if (empty($handoverId)) {
                    return response()->json([
                        'status' => 'error',
                        'requires_handover' => true,
                        'total_active' => $totalActive,
                        'active_assignments_count' => $activeAssignments->count(),
                        'active_customers_count' => $activeCustomers->count(),
                        'message' => "Môi giới '{$name}' còn {$totalActive} việc/khách hàng đang phụ trách ({$activeAssignments->count()} yêu cầu phân công, {$activeCustomers->count()} khách hàng CRM). Vui lòng chọn môi giới nhận bàn giao trước khi xóa.",
                        'errors' => [
                            'handover_broker_id' => ["Môi giới còn {$totalActive} việc/khách hàng đang phụ trách. Vui lòng chọn môi giới nhận bàn giao."],
                        ],
                    ], 422);
                }

                if ((int) $handoverId === (int) $broker->id) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Không thể bàn giao công việc cho chính môi giới đang bị xóa.',
                        'errors' => [
                            'handover_broker_id' => ['Không thể bàn giao cho chính môi giới đang bị xóa.'],
                        ],
                    ], 422);
                }

                $handoverBroker = Broker::whereNull('deleted_at')->find($handoverId);
                if (!$handoverBroker || $handoverBroker->status === 'inactive') {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Môi giới nhận bàn giao không tồn tại hoặc đang ngưng hoạt động.',
                        'errors' => [
                            'handover_broker_id' => ['Môi giới nhận bàn giao không hợp lệ.'],
                        ],
                    ], 422);
                }

                // Môi giới nhận việc thì phải liên kết tài khoản!
                if (!$handoverBroker->user_id) {
                    return response()->json([
                        'status' => 'error',
                        'message' => "Môi giới nhận bàn giao '{$handoverBroker->name}' chưa liên kết tài khoản người dùng nên không thể nhận việc. Vui lòng liên kết tài khoản trước.",
                        'errors' => [
                            'handover_broker_id' => ['Môi giới nhận bàn giao chưa liên kết tài khoản người dùng.'],
                        ],
                    ], 422);
                }

                $handoverUser = $handoverBroker->user;
                if (!$handoverUser || !$handoverUser->is_active) {
                    return response()->json([
                        'status' => 'error',
                        'message' => "Tài khoản người dùng của môi giới nhận bàn giao '{$handoverBroker->name}' đang bị khóa hoặc không hoạt động.",
                        'errors' => [
                            'handover_broker_id' => ['Tài khoản người dùng của môi giới nhận bàn giao đang bị khóa.'],
                        ],
                    ], 422);
                }

                // Thực hiện bàn giao và soft delete trong DB::transaction
                DB::transaction(function () use ($broker, $handoverBroker, $activeAssignments, $activeCustomers) {
                    // 1. Chuyển các phân công đang pending/processing sang môi giới mới
                    foreach ($activeAssignments as $assignment) {
                        $noteAddition = "[Bàn giao từ MG {$broker->name} ({$broker->code})]";
                        $newNotes = $assignment->notes ? $assignment->notes . ' ' . $noteAddition : $noteAddition;
                        $assignment->update([
                            'broker_id' => $handoverBroker->id,
                            'notes' => mb_substr($newNotes, 0, 250),
                        ]);
                    }

                    // 2. Chuyển khách hàng CRM sang user_id của môi giới mới
                    if ($activeCustomers->isNotEmpty() && $handoverBroker->user_id) {
                        \App\Models\Customer::where('assigned_to', $broker->user_id)
                            ->whereNull('deleted_at')
                            ->update(['assigned_to' => $handoverBroker->user_id]);
                    }

                    // 3. Xóa mềm môi giới (Lịch sử phân công cũ completed/cancelled vẫn giữ nguyên broker_id cũ)
                    $broker->delete();
                });

                return response()->json([
                    'status' => 'success',
                    'message' => "Đã bàn giao {$totalActive} việc/khách hàng sang môi giới '{$handoverBroker->name}' và xóa môi giới '{$name}' khỏi hệ thống thành công!",
                ]);
            }

            // Không còn việc đang phụ trách: Soft-delete trực tiếp
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
        $query = BrokerAssignment::with([
            'broker:id,code,name,phone,email,level,user_id',
            'customer:id,name,phone,email,primary_broker_id',
            'requirement:id,customer_id,budget_min,budget_max,area,status',
        ]);

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

        // Lọc theo Khách hàng
        if ($customerId = $request->input('customer_id')) {
            if ($customerId !== 'all') {
                $query->where('customer_id', $customerId);
            }
        }

        // Lọc theo Nhu cầu khách hàng
        if ($requirementId = $request->input('requirement_id')) {
            if ($requirementId !== 'all') {
                $query->where('requirement_id', $requirementId);
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
     * Tạo phân công mới (Validation max 250 ký tự, liên kết CRM khách hàng & nhu cầu)
     */
    public function storeAssignment(Request $request)
    {
        $validated = $request->validate([
            'request_code' => 'nullable|string|max:50|unique:broker_assignments,request_code',
            'customer_id' => ['nullable', 'integer', Rule::exists('customers', 'id')->whereNull('deleted_at')],
            'requirement_id' => ['nullable', 'integer', Rule::exists('customer_demands', 'id')->whereNull('deleted_at')],
            'customer_name' => 'nullable|string|max:250',
            'customer_phone' => ['nullable', 'string', 'regex:/^[0-9]{10,11}$/D'],
            'customer_email' => 'nullable|email|max:250',
            'property_location' => 'nullable|string|max:250',
            'broker_id' => ['required', Rule::exists('brokers', 'id')->whereNull('deleted_at')->whereIn('status', ['active', 'busy'])],
            'assigned_date' => 'required|date',
            'status' => 'required|string|in:pending,processing,completed,cancelled',
            'notes' => 'nullable|string|max:250',
        ], [
            'customer_id.exists' => 'Khách hàng liên kết không tồn tại hoặc đã bị xóa.',
            'requirement_id.exists' => 'Nhu cầu khách hàng liên kết không tồn tại hoặc đã bị xóa.',
            'customer_name.max' => 'Tên khách hàng không được vượt quá 250 ký tự.',
            'property_location.max' => 'Địa điểm BĐS không được vượt quá 250 ký tự.',
            'broker_id.required' => 'Vui lòng chọn môi giới phụ trách.',
            'broker_id.exists' => 'Môi giới được chọn không tồn tại hoặc đã bị xóa.',
            'assigned_date.required' => 'Vui lòng chọn ngày yêu cầu/phân công.',
            'notes.max' => 'Ghi chú yêu cầu không được vượt quá 250 ký tự.',
        ]);

        // Môi giới cần nhận việc thì phải liên kết tài khoản
        $broker = Broker::findOrFail($validated['broker_id']);
        if (!$broker->user_id) {
            return response()->json([
                'status' => 'error',
                'message' => "Môi giới '{$broker->name}' ({$broker->code}) chưa liên kết tài khoản người dùng nên không thể nhận việc/phân công. Vui lòng liên kết tài khoản trước khi phân công.",
                'errors' => [
                    'broker_id' => ["Môi giới '{$broker->name}' chưa liên kết tài khoản người dùng."],
                ],
            ], 422);
        }

        $user = $broker->user;
        if (!$user || !$user->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => "Tài khoản người dùng liên kết với môi giới '{$broker->name}' đang bị khóa hoặc không hoạt động.",
                'errors' => [
                    'broker_id' => ["Tài khoản người dùng của môi giới này đang bị khóa."],
                ],
            ], 422);
        }

        // Tự động điền dữ liệu từ khách hàng nếu có customer_id
        if (!empty($validated['customer_id'])) {
            $customer = Customer::find($validated['customer_id']);
            if ($customer) {
                $validated['customer_name'] = !empty($validated['customer_name']) ? $validated['customer_name'] : $customer->name;
                $validated['customer_phone'] = !empty($validated['customer_phone']) ? $validated['customer_phone'] : $customer->phone;
                $validated['customer_email'] = !empty($validated['customer_email']) ? $validated['customer_email'] : $customer->email;
            }
        }

        // Tự động điền dữ liệu từ nhu cầu nếu có requirement_id
        if (!empty($validated['requirement_id'])) {
            $demand = CustomerDemand::find($validated['requirement_id']);
            if ($demand) {
                if (empty($validated['customer_id'])) {
                    $validated['customer_id'] = $demand->customer_id;
                    $demandCustomer = Customer::find($demand->customer_id);
                    if ($demandCustomer) {
                        $validated['customer_name'] = !empty($validated['customer_name']) ? $validated['customer_name'] : $demandCustomer->name;
                        $validated['customer_phone'] = !empty($validated['customer_phone']) ? $validated['customer_phone'] : $demandCustomer->phone;
                        $validated['customer_email'] = !empty($validated['customer_email']) ? $validated['customer_email'] : $demandCustomer->email;
                    }
                }
                if (empty($validated['property_location'])) {
                    $validated['property_location'] = "Nhu cầu {$demand->code} (" . ($demand->area ? "{$demand->area}m2" : 'Khu vực yêu cầu') . ")";
                }
            }
        }

        // Kiểm tra các trường bắt buộc sau khi điền tự động
        if (empty($validated['customer_name'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Vui lòng nhập tên khách hàng.',
                'errors' => ['customer_name' => ['Vui lòng nhập tên khách hàng.']],
            ], 422);
        }

        if (empty($validated['property_location'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Vui lòng nhập địa điểm bất động sản.',
                'errors' => ['property_location' => ['Vui lòng nhập địa điểm bất động sản.']],
            ], 422);
        }

        // Tự động sinh ID Yêu cầu nếu không nhập
        if (empty($validated['request_code'])) {
            $year = date('Y');
            $latestId = (BrokerAssignment::max('id') ?? 0) + 1;
            $validated['request_code'] = "YC-{$year}-" . str_pad($latestId, 3, '0', STR_PAD_LEFT);
        }

        $assignment = DB::transaction(function () use ($validated, $request, $broker) {
            $assignment = BrokerAssignment::create($validated);
            $currentUser = $request->user();

            // Ghi nhật ký ActivityLog sau khi phân công thành công
            $snapshot = ActivityLog::extractActorSnapshot($currentUser);
            ActivityLog::create(array_merge([
                'user_id' => $currentUser?->id,
                'table_name' => 'broker_assignments',
                'record_id' => $assignment->id,
                'action' => 'ASSIGNMENT_CREATED',
                'old_data' => null,
                'new_data' => [
                    'id' => $assignment->id,
                    'request_code' => $assignment->request_code,
                    'customer_id' => $assignment->customer_id,
                    'requirement_id' => $assignment->requirement_id,
                    'broker_id' => $broker->id,
                    'broker_name' => $broker->name,
                    'status' => $assignment->status,
                ],
                'subject_snapshot' => [
                    'id' => $assignment->id,
                    'request_code' => $assignment->request_code,
                    'customer_name' => $assignment->customer_name,
                ],
                'ip_address' => $request->ip(),
            ], $snapshot));

            // Ghi nhận tương tác chăm sóc khách hàng nếu có liên kết khách hàng
            if ($assignment->customer_id) {
                CustomerInteraction::create([
                    'customer_id' => $assignment->customer_id,
                    'actor_id' => $currentUser?->id,
                    'type' => 'note',
                    'summary' => "Tạo phân công yêu cầu '{$assignment->request_code}' cho môi giới {$broker->name}",
                    'occurred_at' => now(),
                ]);
            }

            return $assignment;
        });

        $assignment->load([
            'broker:id,code,name,phone,email,level,user_id',
            'customer:id,name,phone,email,primary_broker_id',
            'requirement:id,customer_id,budget_min,budget_max,area,status',
        ]);

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
            $assignment = BrokerAssignment::with([
                'broker:id,code,name,phone,email,level,user_id',
                'customer:id,name,phone,email,primary_broker_id',
                'requirement:id,customer_id,budget_min,budget_max,area,status',
            ])->findOrFail($id);

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
     * Điều chuyển phân công sang môi giới khác
     */
    public function transferAssignment(TransferBrokerAssignmentRequest $request, $id)
    {
        $assignment = BrokerAssignment::with(['broker', 'customer'])->findOrFail($id);

        if (in_array($assignment->status, ['completed', 'cancelled'])) {
            return response()->json([
                'status' => 'error',
                'message' => "Không thể điều chuyển phân công đã ở trạng thái '{$assignment->status}'.",
            ], 422);
        }

        $targetBroker = Broker::whereNull('deleted_at')->findOrFail($request->input('target_broker_id'));

        if ((int) $assignment->broker_id === (int) $targetBroker->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Môi giới nhận điều chuyển trùng với môi giới đang phụ trách hiện tại.',
                'errors' => [
                    'target_broker_id' => ['Môi giới nhận điều chuyển phải khác môi giới hiện tại.'],
                ],
            ], 422);
        }

        $oldBroker = $assignment->broker;
        $oldBrokerName = $oldBroker ? $oldBroker->name : 'Chưa phân công';
        $reason = $request->input('reason', '');
        $currentUser = $request->user();

        DB::transaction(function () use ($assignment, $targetBroker, $oldBroker, $oldBrokerName, $reason, $currentUser, $request) {
            $oldData = [
                'broker_id' => $assignment->broker_id,
                'broker_name' => $oldBrokerName,
                'notes' => $assignment->notes,
            ];

            $timestampStr = now()->format('d/m/Y H:i');
            $noteAppend = "[Điều chuyển từ {$oldBrokerName} sang {$targetBroker->name} lúc {$timestampStr}" . ($reason ? ": {$reason}]" : "]");
            $updatedNotes = $assignment->notes ? $assignment->notes . "\n" . $noteAppend : $noteAppend;
            $updatedNotes = mb_substr($updatedNotes, 0, 250);

            $assignment->broker_id = $targetBroker->id;
            $assignment->notes = $updatedNotes;
            $assignment->save();

            // Ghi ActivityLog sau khi điều chuyển thành công
            $snapshot = ActivityLog::extractActorSnapshot($currentUser);
            ActivityLog::create(array_merge([
                'user_id' => $currentUser?->id,
                'table_name' => 'broker_assignments',
                'record_id' => $assignment->id,
                'action' => 'ASSIGNMENT_TRANSFERRED',
                'old_data' => $oldData,
                'new_data' => [
                    'broker_id' => $targetBroker->id,
                    'broker_name' => $targetBroker->name,
                    'reason' => $reason,
                    'notes' => $assignment->notes,
                ],
                'subject_snapshot' => [
                    'id' => $assignment->id,
                    'request_code' => $assignment->request_code,
                    'customer_name' => $assignment->customer_name,
                ],
                'ip_address' => $request->ip(),
            ], $snapshot));

            // Ghi CustomerInteraction nếu phân công liên kết khách hàng
            if ($assignment->customer_id) {
                CustomerInteraction::create([
                    'customer_id' => $assignment->customer_id,
                    'actor_id' => $currentUser?->id,
                    'type' => 'note',
                    'summary' => "Điều chuyển phân công {$assignment->request_code} từ {$oldBrokerName} sang {$targetBroker->name}" . ($reason ? ". Lý do: {$reason}" : ""),
                    'occurred_at' => now(),
                ]);
            }
        });

        $assignment->load([
            'broker:id,code,name,phone,email,level,user_id',
            'customer:id,name,phone,email,primary_broker_id',
            'requirement:id,customer_id,budget_min,budget_max,area,status',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Điều chuyển phân công '{$assignment->request_code}' sang môi giới '{$targetBroker->name}' thành công!",
            'data' => $assignment,
        ]);
    }

    /**
     * Cập nhật phân công (Validation max 250 ký tự)
     */
    public function updateAssignment(Request $request, $id)
    {
        try {
            $assignment = BrokerAssignment::findOrFail($id);

            $validated = $request->validate([
                'request_code' => ['required', 'string', 'max:50', Rule::unique('broker_assignments', 'request_code')->ignore($id)],
                'customer_name' => 'required|string|max:250',
                'customer_phone' => ['nullable', 'string', 'regex:/^[0-9]{10,11}$/D'],
                'customer_email' => 'nullable|email|max:250',
                'property_location' => 'required|string|max:250',
                'broker_id' => ['required', Rule::exists('brokers', 'id')->whereNull('deleted_at')],
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

            // Môi giới cần nhận việc thì phải liên kết tài khoản
            $targetBroker = Broker::findOrFail($validated['broker_id']);
            if (!$targetBroker->user_id) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Môi giới '{$targetBroker->name}' ({$targetBroker->code}) chưa liên kết tài khoản người dùng nên không thể nhận việc/phân công. Vui lòng liên kết tài khoản trước khi phân công.",
                    'errors' => [
                        'broker_id' => ["Môi giới '{$targetBroker->name}' chưa liên kết tài khoản người dùng."],
                    ],
                ], 422);
            }

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
            abort_if($assignment->status === 'completed', 422, 'Không thể hủy phân công đã hoàn thành.');
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
