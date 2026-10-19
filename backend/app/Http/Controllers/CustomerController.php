<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\User;
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
        abort_unless(in_array((int) $user->role_id, [1, 2], true), 403, 'Chỉ Admin và Môi giới được quản lý khách hàng.');
        return $user;
    }

    private function visible(User $user)
    {
        return Customer::query()->when((int) $user->role_id !== 1, fn ($query) => $query->where('assigned_to', $user->id));
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
            'can_assign' => (int) $user->role_id === 1,
            'assignees' => User::where('is_active', true)->whereIn('role_id', [1, 2])
                ->when((int) $user->role_id !== 1, fn ($query) => $query->whereKey($user->id))
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
                    'overdue' => $q->where('scheduled_at', '<', now()),
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
            'activities' => $customer->activities()->orderBy('status', 'desc')->orderBy('scheduled_at')->orderBy('id')->paginate(8, ['*'], 'activity_page'),
        ]);
    }

    private function customerData(Request $request, User $user): array
    {
        $data = $request->validate([
            'name' => 'required|string|max:250', 'company' => 'nullable|string|max:250', 'source' => 'nullable|string|max:250',
            'email' => 'nullable|email|max:250', 'phone' => ['nullable', 'string', 'regex:/^[0-9]{10,11}$/D'],
            'customer_group' => ['required', Rule::in(array_keys(Customer::GROUPS))],
            'status' => ['required', Rule::in(array_keys(Customer::STATUSES))], 'notes' => 'nullable|string|max:250',
            'is_tracked' => 'sometimes|boolean',
            'assigned_to' => ['nullable', 'integer', Rule::exists('users', 'id')->where(fn ($q) => $q->whereIn('role_id', [1, 2])->where('is_active', true)->whereNull('deleted_at'))],
        ], [
            'name.required' => 'Vui lòng nhập tên khách hàng.', '*.max' => 'Nội dung không được vượt quá :max ký tự.',
            'email.email' => 'Email không đúng định dạng.', 'phone.regex' => 'Số điện thoại chỉ gồm 10–11 chữ số.',
            'assigned_to.exists' => 'Người phụ trách phải là Admin hoặc Môi giới đang hoạt động.',
        ]);
        if ((int) $user->role_id !== 1) {
            abort_if(isset($data['assigned_to']) && (int) $data['assigned_to'] !== (int) $user->id, 403, 'Bạn không có quyền giao khách hàng cho người khác.');
            $data['assigned_to'] = $user->id;
        }
        return $data;
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
        abort_if((int) $data['version'] !== (int) $customer->version, 409, 'Khách hàng vừa được cập nhật. Vui lòng tải lại trước khi sửa hoặc xóa.');
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
            return response()->json(['message' => 'Đã xóa khách hàng khỏi danh sách theo dõi.']);
        });
    }

    public function removeTracking(Request $request, int $id)
    {
        $user = $this->manager($request);
        return DB::transaction(function () use ($request, $user, $id) {
            $customer = $this->visible($user)->lockForUpdate()->findOrFail($id);
            $this->checkVersion($request, $customer);
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
            $activity = $customer->activities()->create($data + ['created_by' => $user->id]);
            $customer->increment('version');
            return response()->json(['data' => $activity->refresh(), 'message' => 'Đã lên lịch chăm sóc.'], 201);
        });
    }

    private function activityData(Request $request): array
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(array_keys(Customer::TYPES))], 'title' => 'required|string|max:250',
            'scheduled_at' => 'required|date|after:now',
        ], ['scheduled_at.after' => 'Lịch chăm sóc phải ở tương lai.', 'title.required' => 'Vui lòng nhập kế hoạch chăm sóc.', 'title.max' => 'Nội dung không được vượt quá 250 ký tự.']);
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
            $activity->update($this->activityData($request));
            $customer->increment('version');
            return response()->json(['data' => $activity, 'message' => 'Đã cập nhật lịch chăm sóc.']);
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
            return response()->json(['data' => $activity, 'message' => 'Đã hủy lịch chăm sóc.']);
        });
    }

    public function completeActivity(Request $request, int $id, int $activityId)
    {
        $user = $this->manager($request);
        return DB::transaction(function () use ($user, $id, $activityId) {
            $customer = $this->visible($user)->lockForUpdate()->findOrFail($id);
            $activity = $customer->activities()->lockForUpdate()->findOrFail($activityId);
            abort_if($activity->status === 'cancelled', 422, 'Lịch chăm sóc này đã được hủy.');
            if ($activity->status === 'pending') {
                $activity->update(['status' => 'completed', 'completed_at' => now()]);
                $customer->interactions()->create(['type' => $activity->type, 'summary' => $activity->title, 'occurred_at' => now(), 'actor_id' => $user->id]);
                $customer->increment('version');
            }
            return response()->json(['data' => $activity, 'message' => 'Đã hoàn thành và lưu vào lịch sử tương tác.']);
        });
    }
}
