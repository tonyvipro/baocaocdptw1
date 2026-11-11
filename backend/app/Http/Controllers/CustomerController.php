<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Broker;
use App\Models\Customer;
use App\Models\CustomerInteraction;
use App\Models\User;
use App\Services\CustomerDuplicateService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    private function manager(Request $request): User
    {
        $user = $request->bearerToken() ? auth('sanctum')->user() : $request->user();
        abort_unless($user && $user->is_active, 401, 'Vui lòng đăng nhập lại.');
        abort_unless($user->hasPermission('customers.manage'), 403, 'Chỉ Admin và Môi giới được quản lý khách hàng.');
        return $user;
    }

    private function visible(User $user)
    {
        return Customer::query()->when(!$user->hasPermission('customers.view_all'), fn ($query) => $query->where('assigned_to', $user->id));
    }

    private function relations(): array
    {
        return ['assignedTo', 'lastInteraction', 'nextActivity'];
    }

    private function today(): array
    {
        $today = now('Asia/Ho_Chi_Minh');
        return [$today->copy()->startOfDay()->utc(), $today->copy()->endOfDay()->utc()];
    }

    public function options(Request $request)
    {
        $user = $this->manager($request);
        return response()->json([
            'statuses' => Customer::STATUSES, 'groups' => Customer::GROUPS, 'types' => Customer::TYPES,
            'can_assign' => $user->hasPermission('customers.assign'),
            'assignees' => User::where('is_active', true)->whereIn('role_id', app(\App\Services\Permissions::class)->rolesFor('customers.manage'))
                ->when(!$user->hasPermission('customers.assign'), fn ($query) => $query->whereKey($user->id))
                ->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function index(Request $request)
    {
        $user = $this->manager($request);
        $filters = $request->validate([
            'search' => 'nullable|string|max:250', 'status' => ['nullable', Rule::in(array_keys(Customer::STATUSES))],
            'group' => ['nullable', Rule::in(array_keys(Customer::GROUPS))], 'assigned_to' => 'nullable|integer|min:1',
            'care' => 'nullable|in:overdue,today,upcoming,unscheduled', 'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
            'view' => 'nullable|in:management,tracking',
        ]);
        $base = $this->visible($user);
        if (($filters['view'] ?? '') === 'tracking') $base->where('is_tracked', true);
        [$start, $end] = $this->today();
        $pending = fn ($query) => $query->where('status', 'pending');
        $query = (clone $base)->with($this->relations());
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                foreach (['name', 'company', 'email', 'phone', 'source'] as $field) $q->orWhere($field, 'like', '%'.$search.'%');
                if (preg_match('/^KH0*([1-9][0-9]*)$/i', $search, $matches)) $q->orWhere('id', (int) $matches[1]);
            });
        }
        foreach (['status', 'assigned_to'] as $field) if (!empty($filters[$field])) $query->where($field, $filters[$field]);
        if (!empty($filters['group'])) $query->where('customer_group', $filters['group']);
        if (!empty($filters['care'])) {
            if ($filters['care'] === 'unscheduled') $query->whereDoesntHave('activities', $pending);
            else $query->whereHas('activities', function ($q) use ($filters, $pending, $start, $end) {
                $pending($q);
                match ($filters['care']) {
                    'overdue' => $q->where('scheduled_at', '<', now('UTC')),
                    'today' => $q->whereBetween('scheduled_at', [$start, $end]),
                    'upcoming' => $q->where('scheduled_at', '>', $end),
                };
            });
        }
        $rows = $query->orderByDesc('updated_at')->orderByDesc('id')->paginate($filters['per_page'] ?? 10);
        return response()->json(['data' => $rows->items(), 'meta' => [
            'total' => $rows->total(), 'from' => $rows->firstItem(), 'to' => $rows->lastItem(),
            'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(), 'per_page' => $rows->perPage(),
        ]]);
    }

    public function show(Request $request, int $id)
    {
        $customer = $this->visible($this->manager($request))->with($this->relations())->withCount('interactions')->findOrFail($id);
        $request->validate(['history_page' => 'nullable|integer|min:1', 'activity_page' => 'nullable|integer|min:1']);
        return response()->json([
            'data' => $customer,
            'interactions' => $customer->interactions()->with('actor')->orderByDesc('occurred_at')->orderByDesc('id')->paginate(8, ['*'], 'history_page'),
            'activities' => $customer->activities()->with(['assignedTo', 'createdBy'])->orderBy('status', 'desc')->orderBy('scheduled_at')->orderBy('id')->paginate(8, ['*'], 'activity_page'),
        ]);
    }

    private function customerData(Request $request, User $user): array
    {
        // Chuẩn hóa SĐT (bỏ khoảng trắng, +84 -> 0) và email lower-case trước khi validate
        if ($request->has('phone') && $request->input('phone') !== null) {
            $normalizedPhone = CustomerDuplicateService::normalizePhone($request->input('phone'));
            $request->merge(['phone' => $normalizedPhone]);
        }
        if ($request->has('email') && $request->input('email') !== null) {
            $normalizedEmail = CustomerDuplicateService::normalizeEmail($request->input('email'));
            $request->merge(['email' => $normalizedEmail]);
        }

        // KHÔNG đặt unique index và không validate chặn trùng email/SĐT
        $data = $request->validate([
            'name' => 'required|string|max:250', 'company' => 'nullable|string|max:250', 'source' => 'nullable|string|max:250',
            'email' => 'nullable|email|max:250', 'phone' => ['nullable', 'string', 'regex:/^[0-9]{10,11}$/D'],
            'customer_group' => ['required', Rule::in(array_keys(Customer::GROUPS))],
            'status' => ['required', Rule::in(array_keys(Customer::STATUSES))], 'notes' => 'nullable|string|max:250',
            'is_tracked' => 'sometimes|boolean',
            'assigned_to' => ['nullable', 'integer', Rule::exists('users', 'id')->where(fn ($q) => $q->whereIn('role_id', app(\App\Services\Permissions::class)->rolesFor('customers.manage'))->where('is_active', true)->whereNull('deleted_at'))],
        ], [
            'name.required' => 'Vui lòng nhập tên khách hàng.', '*.max' => 'Nội dung không được vượt quá :max ký tự.',
            'email.email' => 'Email không đúng định dạng.', 'phone.regex' => 'Số điện thoại chỉ gồm 10–11 chữ số.',
            'assigned_to.exists' => 'Người phụ trách phải là Admin hoặc Môi giới đang hoạt động.',
        ]);
        if (!$user->hasPermission('customers.assign')) {
            abort_if(isset($data['assigned_to']) && (int) $data['assigned_to'] !== (int) $user->id, 403, 'Bạn không có quyền giao khách hàng cho người khác.');
            $data['assigned_to'] = $user->id;
        }
        return $data;
    }

    /**
     * API kiểm tra hồ sơ nghi trùng (POST /api/customers/check-duplicates)
     */
    public function checkDuplicates(Request $request, CustomerDuplicateService $duplicateService)
    {
        $this->manager($request);
        $validated = $request->validate([
            'name' => 'nullable|string|max:250',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|string|max:250',
            'id' => 'nullable|integer',
        ]);

        $result = $duplicateService->checkDuplicates($validated, $validated['id'] ?? null);

        return response()->json($result);
    }

    /**
     * API gộp hồ sơ khách hàng trong DB::transaction (POST /api/customers/merge)
     */
    public function merge(Request $request, CustomerDuplicateService $duplicateService)
    {
        $user = $this->manager($request);
        $validated = $request->validate([
            'primary_id' => 'required|integer',
            'secondary_id' => 'required|integer|different:primary_id',
            'reason' => 'nullable|string|max:250',
        ], [
            'primary_id.required' => 'Vui lòng chọn hồ sơ khách hàng chính.',
            'secondary_id.required' => 'Vui lòng chọn hồ sơ khách hàng phụ cần gộp.',
            'secondary_id.different' => 'Hồ sơ phụ không được trùng với hồ sơ chính.',
        ]);

        $result = $duplicateService->merge(
            (int) $validated['primary_id'],
            (int) $validated['secondary_id'],
            $validated['reason'] ?? null,
            $user
        );

        return response()->json($result);
    }

    public function store(Request $request)
    {
        $user = $this->manager($request);
        $data = $this->customerData($request, $user);
        $data['assigned_to'] ??= $user->id;
        $data['created_by'] = $user->id;
        $customer = Customer::create($data);
        return response()->json(['data' => $customer->load($this->relations()), 'message' => 'Đã thêm khách hàng.'], 201);
    }

    private function checkVersion(Request $request, Customer $customer): void
    {
        $data = $request->validate(['version' => 'required|integer|min:1']);
        if ((int) $data['version'] !== (int) $customer->version) {
            throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->json([
                'code' => 'STALE_VERSION', 'message' => 'Khách hàng vừa được cập nhật. Vui lòng tải lại trước khi sửa hoặc xóa.',
            ], 409));
        }
    }

    public function update(Request $request, int $id)
    {
        $user = $this->manager($request);
        return DB::transaction(function () use ($request, $user, $id) {
            $customer = $this->visible($user)->lockForUpdate()->findOrFail($id);
            $this->checkVersion($request, $customer);
            $customer->fill($this->customerData($request, $user));
            $customer->version++;
            $customer->save();
            return response()->json(['data' => $customer->load($this->relations()), 'message' => 'Đã cập nhật khách hàng.']);
        });
    }

    public function destroy(Request $request, int $id)
    {
        $user = $this->manager($request);
        return DB::transaction(function () use ($request, $user, $id) {
            $customer = $this->visible($user)->lockForUpdate()->findOrFail($id);
            $this->checkVersion($request, $customer);
            $customer->delete();
            return response()->json(['message' => 'Đã xóa hồ sơ khách hàng.']);
        });
    }

    public function removeTracking(Request $request, int $id)
    {
        $user = $this->manager($request);
        return DB::transaction(function () use ($request, $user, $id) {
            $customer = $this->visible($user)->lockForUpdate()->findOrFail($id);
            $this->checkVersion($request, $customer);
            // Gỡ theo dõi chỉ cập nhật cờ is_tracked, tuyệt đối không xóa hồ sơ
            $customer->is_tracked = false;
            $customer->version++;
            $customer->save();
            return response()->json(['message' => 'Đã gỡ khách hàng khỏi danh sách theo dõi. Hồ sơ khách hàng được giữ nguyên.']);
        });
    }

    public function addInteraction(Request $request, int $id)
    {
        $user = $this->manager($request);
        return DB::transaction(function () use ($request, $user, $id) {
            $customer = $this->visible($user)->lockForUpdate()->findOrFail($id);
            $data = $request->validate([
                'type' => ['required', Rule::in(array_keys(Customer::TYPES))], 'summary' => 'required|string|max:250',
                'occurred_at' => 'required|date|before_or_equal:now',
            ], ['occurred_at.before_or_equal' => 'Thời điểm tương tác không được ở tương lai.', 'summary.required' => 'Vui lòng nhập nội dung tương tác.', 'summary.max' => 'Nội dung không được vượt quá 250 ký tự.']);
            $data['occurred_at'] = Carbon::parse($data['occurred_at'])->utc();
            $interaction = $customer->interactions()->create($data + ['actor_id' => $user->id]);
            $customer->increment('version');
            return response()->json(['data' => $interaction->load('actor'), 'message' => 'Đã lưu tương tác.'], 201);
        });
    }

    public function addActivity(Request $request, int $id)
    {
        $user = $this->manager($request);
        return DB::transaction(function () use ($request, $user, $id) {
            $customer = $this->visible($user)->lockForUpdate()->findOrFail($id);
            $data = $this->activityData($request);
            $assignedTo = $data['assigned_to'] ?? $customer->assigned_to ?? $user->id;
            $activity = $customer->activities()->create(array_merge($data, [
                'created_by' => $user->id,
                'assigned_to' => $assignedTo,
                'status' => 'pending',
            ]));
            $customer->increment('version');
            return response()->json([
                'data' => $activity->refresh()->load(['assignedTo', 'createdBy']),
                'message' => 'Đã lên lịch chăm sóc.'
            ], 201);
        });
    }

    private function activityData(Request $request): array
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(array_keys(Customer::TYPES))],
            'title' => 'required|string|max:250',
            'scheduled_at' => 'required|date|after:now',
            'assigned_to' => ['nullable', 'integer', Rule::exists('users', 'id')->where(fn ($q) => $q->where('is_active', true)->whereNull('deleted_at'))],
        ], [
            'scheduled_at.after' => 'Lịch chăm sóc phải ở tương lai.',
            'title.required' => 'Vui lòng nhập kế hoạch chăm sóc.',
            'title.max' => 'Nội dung không được vượt quá 250 ký tự.',
            'assigned_to.exists' => 'Người phụ trách không hợp lệ hoặc đã ngừng hoạt động.',
        ]);
        $data['scheduled_at'] = Carbon::parse($data['scheduled_at'])->utc();
        return $data;
    }

    public function updateActivity(Request $request, int $id, int $activityId)
    {
        $user = $this->manager($request);
        return DB::transaction(function () use ($request, $user, $id, $activityId) {
            $customer = $this->visible($user)->lockForUpdate()->findOrFail($id);
            $activity = $customer->activities()->lockForUpdate()->findOrFail($activityId);
            abort_unless($activity->status === 'pending', 422, 'Chỉ được sửa lịch chăm sóc đang chờ.');
            $this->checkVersion($request, $customer);
            $data = $this->activityData($request);
            $activity->update($data);
            $customer->increment('version');
            return response()->json([
                'data' => $activity->refresh()->load(['assignedTo', 'createdBy']),
                'message' => 'Đã cập nhật lịch chăm sóc.'
            ]);
        });
    }

    public function cancelActivity(Request $request, int $id, int $activityId)
    {
        $user = $this->manager($request);
        return DB::transaction(function () use ($request, $user, $id, $activityId) {
            $customer = $this->visible($user)->lockForUpdate()->findOrFail($id);
            $activity = $customer->activities()->lockForUpdate()->findOrFail($activityId);
            abort_unless($activity->status === 'pending', 422, 'Chỉ được hủy lịch chăm sóc đang chờ.');
            $this->checkVersion($request, $customer);
            $activity->update(['status' => 'cancelled']);
            $customer->increment('version');
            return response()->json([
                'data' => $activity->fresh(['assignedTo', 'createdBy']),
                'message' => 'Đã hủy lịch chăm sóc.'
            ]);
        });
    }

    public function completeActivity(Request $request, int $id, int $activityId)
    {
        $user = $this->manager($request);
        return DB::transaction(function () use ($request, $user, $id, $activityId) {
            $customer = $this->visible($user)->lockForUpdate()->findOrFail($id);
            $activity = $customer->activities()->lockForUpdate()->findOrFail($activityId);
            abort_if($activity->status === 'cancelled', 422, 'Lịch chăm sóc này đã được hủy.');

            $validated = $request->validate([
                'result' => 'nullable|string|max:250',
                'notes' => 'nullable|string|max:250',
            ], [
                'result.max' => 'Kết quả không được vượt quá 250 ký tự.',
                'notes.max' => 'Ghi chú không được vượt quá 250 ký tự.',
            ]);

            if ($activity->status === 'pending') {
                $this->checkVersion($request, $customer);
                $resultText = $validated['result'] ?? $validated['notes'] ?? null;
                $completedAt = now();

                $activity->update([
                    'status' => 'completed',
                    'completed_at' => $completedAt,
                    'result' => $resultText,
                ]);

                // Tự động tạo bản ghi tương tác gắn khách hàng trong cùng transaction
                $summary = $activity->title;
                if (!empty($resultText)) {
                    $summary .= ' - Kết quả: ' . $resultText;
                }
                if (mb_strlen($summary) > 250) {
                    $summary = mb_substr($summary, 0, 247) . '...';
                }

                $customer->interactions()->create([
                    'type' => $activity->type,
                    'summary' => $summary,
                    'occurred_at' => $completedAt,
                    'actor_id' => $activity->assigned_to ?: $user->id,
                ]);
                $customer->increment('version');
            }

            return response()->json([
                'data' => $activity->refresh()->load(['assignedTo', 'createdBy']),
                'message' => 'Đã hoàn thành và lưu vào lịch sử tương tác.'
            ]);
        });
    }

    /**
     * Điều chuyển người phụ trách chính của khách hàng
     */
    public function transferPrimaryBroker(Request $request, int $id)
    {
        $user = $this->manager($request);
        abort_unless($user->hasPermission('customers.assign'), 403, 'Bạn không có quyền điều chuyển người phụ trách khách hàng.');

        $validated = $request->validate([
            'target_broker_id' => ['required', 'integer', Rule::exists('brokers', 'id')->whereNull('deleted_at')],
            'reason' => ['nullable', 'string', 'max:250'],
        ], [
            'target_broker_id.required' => 'Vui lòng chọn môi giới nhận điều chuyển.',
            'target_broker_id.exists' => 'Môi giới nhận điều chuyển không tồn tại trong hệ thống.',
            'reason.max' => 'Lý do điều chuyển không được vượt quá 250 ký tự.',
        ]);

        $targetBroker = Broker::whereNull('deleted_at')->findOrFail($validated['target_broker_id']);

        // 1. Chặn môi giới có trạng thái tạm ngưng
        if ($targetBroker->status === 'inactive' || $targetBroker->status === 'suspended') {
            return response()->json([
                'status' => 'error',
                'message' => "Môi giới '{$targetBroker->name}' đang ở trạng thái tạm ngưng, không thể nhận điều chuyển.",
                'errors' => [
                    'target_broker_id' => ["Môi giới '{$targetBroker->name}' đang ở trạng thái tạm ngưng."],
                ],
            ], 422);
        }

        // 2. Chặn môi giới chưa liên kết tài khoản
        if (!$targetBroker->user_id) {
            return response()->json([
                'status' => 'error',
                'message' => "Môi giới '{$targetBroker->name}' chưa liên kết tài khoản người dùng, không thể nhận điều chuyển.",
                'errors' => [
                    'target_broker_id' => ["Môi giới '{$targetBroker->name}' chưa liên kết tài khoản người dùng."],
                ],
            ], 422);
        }

        // 3. Chặn tài khoản người dùng của môi giới bị khóa
        $linkedUser = $targetBroker->user;
        if (!$linkedUser || !$linkedUser->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => "Tài khoản người dùng của môi giới '{$targetBroker->name}' đang bị khóa hoặc không hoạt động.",
                'errors' => [
                    'target_broker_id' => ["Tài khoản người dùng của môi giới '{$targetBroker->name}' đang bị khóa."],
                ],
            ], 422);
        }

        return DB::transaction(function () use ($request, $user, $id, $targetBroker, $validated) {
            $customer = Customer::lockForUpdate()->findOrFail($id);

            // 4. Không chuyển cho chính broker phụ trách hiện tại
            if ((int) $customer->primary_broker_id === (int) $targetBroker->id) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Môi giới '{$targetBroker->name}' hiện đã là người phụ trách chính của khách hàng này.",
                    'errors' => [
                        'target_broker_id' => ['Môi giới được chọn hiện đã là người phụ trách chính.'],
                    ],
                ], 422);
            }

            $oldBroker = $customer->primaryBroker;
            $oldBrokerName = $oldBroker ? $oldBroker->name : ($customer->assignedTo?->name ?? 'Chưa phân công');
            $reason = $validated['reason'] ?? '';

            $oldData = [
                'primary_broker_id' => $customer->primary_broker_id,
                'assigned_to' => $customer->assigned_to,
                'broker_name' => $oldBrokerName,
            ];

            $customer->primary_broker_id = $targetBroker->id;
            $customer->assigned_to = $targetBroker->user_id;
            $customer->increment('version');
            $customer->save();

            // Ghi nhật ký ActivityLog sau khi thao tác thành công
            $snapshot = ActivityLog::extractActorSnapshot($user);
            ActivityLog::create(array_merge([
                'user_id' => $user->id,
                'table_name' => 'customers',
                'record_id' => $customer->id,
                'action' => 'CUSTOMER_BROKER_TRANSFERRED',
                'old_data' => $oldData,
                'new_data' => [
                    'primary_broker_id' => $targetBroker->id,
                    'assigned_to' => $targetBroker->user_id,
                    'broker_name' => $targetBroker->name,
                    'reason' => $reason,
                ],
                'subject_snapshot' => [
                    'id' => $customer->id,
                    'code' => $customer->code,
                    'name' => $customer->name,
                ],
                'ip_address' => $request->ip(),
            ], $snapshot));

            // Ghi nhật ký tương tác chăm sóc khách hàng
            CustomerInteraction::create([
                'customer_id' => $customer->id,
                'actor_id' => $user->id,
                'type' => 'note',
                'summary' => "Điều chuyển người phụ trách chính từ {$oldBrokerName} sang {$targetBroker->name}" . ($reason ? ". Lý do: {$reason}" : ""),
                'occurred_at' => now(),
            ]);

            $customer->load(['primaryBroker', 'assignedTo']);

            return response()->json([
                'status' => 'success',
                'message' => "Điều chuyển người phụ trách chính cho khách hàng '{$customer->name}' sang môi giới '{$targetBroker->name}' thành công!",
                'data' => $customer,
            ]);
        });
    }
}
