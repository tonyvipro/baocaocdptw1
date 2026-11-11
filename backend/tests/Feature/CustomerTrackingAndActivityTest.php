<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerActivity;
use App\Models\CustomerDemand;
use App\Models\CustomerInteraction;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class CustomerTrackingAndActivityTest extends TestCase
{
    use RefreshDatabase;

    private function manager(int $role = 1): User
    {
        if (!Role::find($role)) {
            Role::forceCreate(['id' => $role, 'name' => 'Role '.$role]);
        }
        return User::create([
            'name' => 'Nhân viên '.$role,
            'email' => uniqid('user_').'@example.com',
            'password' => 'test-password',
            'role_id' => $role,
            'is_active' => true,
        ]);
    }

    private function customerPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Trần Văn Bảo',
            'company' => 'Công ty BĐS Hoàng Gia',
            'source' => 'Giới thiệu',
            'email' => 'bao.tran@example.com',
            'phone' => '0912345678',
            'customer_group' => 'potential',
            'status' => 'contacted',
            'is_tracked' => true,
        ], $overrides);
    }

    /**
     * Gỡ theo dõi chỉ cập nhật cờ is_tracked = false, tuyệt đối không xóa hồ sơ,
     * nhu cầu và toàn bộ lịch sử chăm sóc/tương tác vẫn được giữ nguyên vẹn.
     */
    public function test_untracking_customer_only_updates_tracking_flag_and_preserves_customer_record(): void
    {
        $this->actingAs($admin = $this->manager(1));
        $broker = $this->manager(2);

        // Tạo khách hàng đang theo dõi
        $customerData = $this->postJson('/api/customers', $this->customerPayload(['assigned_to' => $broker->id]))
            ->assertCreated()
            ->json('data');
        $id = $customerData['id'];

        // Thêm nhu cầu BĐS cho khách hàng
        $category = Category::create(['name' => 'Biệt thự đơn lập', 'slug' => 'bt-don-lap']);
        $demand = CustomerDemand::create([
            'customer_id' => $id,
            'category_id' => $category->id,
            'notes' => 'Tìm mua biệt thự ven hồ',
            'budget_min' => 15000000000,
            'budget_max' => 25000000000,
            'currency' => 'VND',
            'bedrooms' => 4,
            'bathrooms' => 4,
            'area' => '250m2',
            'created_by' => $admin->id,
            'status' => 'pending',
            'version' => 1,
        ]);

        // Thêm lịch chăm sóc
        $activity = CustomerActivity::create([
            'customer_id' => $id,
            'created_by' => $admin->id,
            'assigned_to' => $broker->id,
            'type' => 'meeting',
            'title' => 'Gặp trao đổi dự án ven hồ',
            'scheduled_at' => Carbon::now()->addDays(3)->utc(),
            'status' => 'pending',
        ]);

        // Thêm bản ghi tương tác trước đó
        $interaction = CustomerInteraction::create([
            'customer_id' => $id,
            'actor_id' => $broker->id,
            'type' => 'call',
            'summary' => 'Gọi điện tìm hiểu ngân sách và vị trí ưu tiên',
            'occurred_at' => Carbon::now()->subDay()->utc(),
        ]);

        // Kiểm tra khách hàng đang xuất hiện trong cả tab quản lý và theo dõi
        $this->getJson('/api/customers?view=tracking')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/customers?view=management')->assertOk()->assertJsonPath('meta.total', 1);

        // Thực hiện gỡ theo dõi: DELETE /api/customers/{id}/tracking
        $currentCustomer = Customer::find($id);
        $res = $this->deleteJson("/api/customers/{$id}/tracking", ['version' => $currentCustomer->version]);
        $res->assertOk();
        $res->assertJsonFragment([
            'message' => 'Đã gỡ khách hàng khỏi danh sách theo dõi. Hồ sơ khách hàng được giữ nguyên.',
        ]);

        // Khẳng định KHÔNG bị soft delete
        $this->assertNotSoftDeleted('customers', ['id' => $id]);
        $freshCustomer = Customer::find($id);
        $this->assertNotNull($freshCustomer);
        $this->assertFalse((bool) $freshCustomer->is_tracked);

        // Khẳng định Nhu cầu BĐS vẫn còn nguyên vẹn
        $this->assertDatabaseHas('customer_demands', [
            'id' => $demand->id,
            'customer_id' => $id,
            'notes' => 'Tìm mua biệt thự ven hồ',
            'budget_min' => 15000000000,
            'budget_max' => 25000000000,
        ]);

        // Khẳng định Kế hoạch chăm sóc vẫn còn nguyên vẹn
        $this->assertDatabaseHas('customer_activities', [
            'id' => $activity->id,
            'customer_id' => $id,
            'title' => 'Gặp trao đổi dự án ven hồ',
            'assigned_to' => $broker->id,
        ]);

        // Khẳng định Lịch sử tương tác vẫn còn nguyên vẹn
        $this->assertDatabaseHas('customer_interactions', [
            'id' => $interaction->id,
            'customer_id' => $id,
            'summary' => 'Gọi điện tìm hiểu ngân sách và vị trí ưu tiên',
        ]);

        // Kiểm tra phạm vi hiển thị: Không còn ở tab tracking nhưng vẫn còn ở tab management
        $this->getJson('/api/customers?view=tracking')->assertOk()->assertJsonPath('meta.total', 0);
        $this->getJson('/api/customers?view=management')->assertOk()->assertJsonPath('meta.total', 1);

        // Xem chi tiết khách hàng vẫn tải đầy đủ thông tin, nhu cầu và hoạt động
        $detailRes = $this->getJson("/api/customers/{$id}")->assertOk();
        $detailRes->assertJsonPath('data.is_tracked', false);
        $detailRes->assertJsonPath('interactions.total', 1);
        $detailRes->assertJsonPath('activities.total', 1);
    }

    /**
     * Tạo lịch chăm sóc với đầy đủ ngày giờ, nội dung và người phụ trách.
     */
    public function test_create_scheduled_activity_with_datetime_title_and_assigned_to(): void
    {
        $this->actingAs($admin = $this->manager(1));
        $broker1 = $this->manager(2);
        $broker2 = $this->manager(2);

        $customer = Customer::create(array_merge($this->customerPayload(), [
            'created_by' => $admin->id,
            'assigned_to' => $broker1->id,
            'version' => 1,
        ]));

        $scheduledTime = Carbon::now()->addDays(2)->setTime(14, 30)->toIso8601String();

        // Tạo lịch chăm sóc gán cho broker2
        $response = $this->postJson("/api/customers/{$customer->id}/activities", [
            'type' => 'meeting',
            'title' => 'Dẫn khách đi xem thực tế căn hộ Vinhomes',
            'scheduled_at' => $scheduledTime,
            'assigned_to' => $broker2->id,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('message', 'Đã lên lịch chăm sóc.');
        $response->assertJsonPath('data.type', 'meeting');
        $response->assertJsonPath('data.title', 'Dẫn khách đi xem thực tế căn hộ Vinhomes');
        $response->assertJsonPath('data.status', 'pending');
        $response->assertJsonPath('data.assigned_to.id', $broker2->id);
        $response->assertJsonPath('data.assigned_to.name', $broker2->name);

        $this->assertDatabaseHas('customer_activities', [
            'customer_id' => $customer->id,
            'type' => 'meeting',
            'title' => 'Dẫn khách đi xem thực tế căn hộ Vinhomes',
            'assigned_to' => $broker2->id,
            'created_by' => $admin->id,
            'status' => 'pending',
        ]);

        // Nếu không gửi assigned_to thì fallback về người phụ trách khách hàng
        $responseFallback = $this->postJson("/api/customers/{$customer->id}/activities", [
            'type' => 'call',
            'title' => 'Gọi điện nhắc lịch hẹn',
            'scheduled_at' => Carbon::now()->addDays(1)->setTime(9, 0)->toIso8601String(),
        ]);
        $responseFallback->assertCreated();
        $responseFallback->assertJsonPath('data.assigned_to.id', $broker1->id);

        // Validation: ngày hẹn ở quá khứ bị từ chối
        $this->postJson("/api/customers/{$customer->id}/activities", [
            'type' => 'call',
            'title' => 'Lịch hẹn quá khứ',
            'scheduled_at' => Carbon::now()->subMinute()->toIso8601String(),
            'assigned_to' => $broker1->id,
        ])->assertUnprocessable()->assertJsonValidationErrors(['scheduled_at']);

        // Validation: người phụ trách không tồn tại bị từ chối
        $this->postJson("/api/customers/{$customer->id}/activities", [
            'type' => 'call',
            'title' => 'Lịch hẹn môi giới ảo',
            'scheduled_at' => Carbon::now()->addDay()->toIso8601String(),
            'assigned_to' => 999999,
        ])->assertUnprocessable()->assertJsonValidationErrors(['assigned_to']);
    }

    /**
     * Khi đánh dấu hoàn thành lịch: trong DB::transaction, tự tạo bản ghi tương tác
     * gắn khách hàng (ghi chú, kết quả, thời điểm hoàn thành).
     */
    public function test_completing_activity_in_transaction_automatically_creates_interaction(): void
    {
        $this->actingAs($admin = $this->manager(1));
        $broker = $this->manager(2);

        $customer = Customer::create(array_merge($this->customerPayload(), [
            'created_by' => $admin->id,
            'assigned_to' => $broker->id,
            'version' => 1,
        ]));

        $activity = CustomerActivity::create([
            'customer_id' => $customer->id,
            'created_by' => $admin->id,
            'assigned_to' => $broker->id,
            'type' => 'meeting',
            'title' => 'Gặp tư vấn phương án tài chính ngân hàng',
            'scheduled_at' => Carbon::now()->addDay()->utc(),
            'status' => 'pending',
        ]);

        $this->assertSame(0, $customer->interactions()->count());

        // Đánh dấu hoàn thành lịch kèm kết quả thực hiện
        $resultText = 'Khách đồng ý gói vay 70%, dự kiến ký HĐMB trong tuần tới';
        $completeRes = $this->patchJson("/api/customers/{$customer->id}/activities/{$activity->id}/complete", [
            'version' => $customer->version,
            'result' => $resultText,
        ]);

        $completeRes->assertOk();
        $completeRes->assertJsonPath('message', 'Đã hoàn thành và lưu vào lịch sử tương tác.');
        $completeRes->assertJsonPath('data.status', 'completed');
        $completeRes->assertJsonPath('data.result', $resultText);

        // Kiểm tra CustomerActivity được cập nhật
        $activity->refresh();
        $this->assertSame('completed', $activity->status);
        $this->assertSame($resultText, $activity->result);
        $this->assertNotNull($activity->completed_at);

        // Khẳng định CustomerInteraction được tự động tạo trong cùng transaction
        $this->assertSame(1, $customer->interactions()->count());
        $newInteraction = $customer->interactions()->first();
        $this->assertNotNull($newInteraction);
        $this->assertSame('meeting', $newInteraction->type);
        $this->assertSame($broker->id, $newInteraction->actor_id);
        $this->assertStringContainsString('Gặp tư vấn phương án tài chính ngân hàng', $newInteraction->summary);
        $this->assertStringContainsString($resultText, $newInteraction->summary);

        // Phiên bản của khách hàng được cập nhật
        $this->assertGreaterThan(1, $customer->fresh()->version);

        // Lịch đã hoàn thành không thể sửa đổi hoặc hủy
        $this->patchJson("/api/customers/{$customer->id}/activities/{$activity->id}", [
            'type' => 'call',
            'title' => 'Sửa tiêu đề sau khi đã hoàn thành',
            'scheduled_at' => Carbon::now()->addDays(5)->toIso8601String(),
            'version' => $customer->fresh()->version,
        ])->assertUnprocessable();

        $this->patchJson("/api/customers/{$customer->id}/activities/{$activity->id}/cancel", [
            'version' => $customer->fresh()->version,
        ])->assertUnprocessable();
    }

    /**
     * Sau khi gỡ theo dõi, khách hàng có thể được theo dõi lại và toàn bộ lịch sử giữ nguyên.
     */
    public function test_customer_can_be_re_tracked_without_data_loss(): void
    {
        $this->actingAs($admin = $this->manager(1));

        $customer = Customer::create(array_merge($this->customerPayload(), [
            'created_by' => $admin->id,
            'is_tracked' => false,
            'version' => 1,
        ]));

        CustomerActivity::create([
            'customer_id' => $customer->id,
            'created_by' => $admin->id,
            'assigned_to' => $admin->id,
            'type' => 'call',
            'title' => 'Hoạt động tồn tại sẵn',
            'scheduled_at' => Carbon::now()->addDays(2)->utc(),
            'status' => 'pending',
        ]);

        CustomerInteraction::create([
            'customer_id' => $customer->id,
            'actor_id' => $admin->id,
            'type' => 'note',
            'summary' => 'Ghi chú ban đầu',
            'occurred_at' => Carbon::now()->subHours(2)->utc(),
        ]);

        // Ban đầu chưa theo dõi
        $this->getJson('/api/customers?view=tracking')->assertOk()->assertJsonPath('meta.total', 0);

        // Bật lại theo dõi thông qua cập nhật
        $this->putJson("/api/customers/{$customer->id}", array_merge($this->customerPayload(), [
            'is_tracked' => true,
            'version' => 1,
        ]))->assertOk();

        // Bây giờ khách hàng xuất hiện trong view=tracking
        $this->getJson('/api/customers?view=tracking')->assertOk()->assertJsonPath('meta.total', 1);

        // Dữ liệu hoạt động và tương tác vẫn đầy đủ
        $res = $this->getJson("/api/customers/{$customer->id}")->assertOk();
        $res->assertJsonPath('data.is_tracked', true);
        $res->assertJsonPath('interactions.total', 1);
        $res->assertJsonPath('activities.total', 1);
    }
}
