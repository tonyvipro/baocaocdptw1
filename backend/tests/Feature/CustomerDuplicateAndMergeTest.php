<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\CustomerActivity;
use App\Models\CustomerDemand;
use App\Models\CustomerInteraction;
use App\Models\PropertyType;
use App\Models\Role as RoleModel;
use App\Models\User;
use App\Services\CustomerDuplicateService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CustomerDuplicateAndMergeTest extends TestCase
{
    use RefreshDatabase;

    private function ensureRole(Role $role): void
    {
        if (!RoleModel::find($role->value)) {
            RoleModel::forceCreate([
                'id' => $role->value,
                'name' => $role->databaseName(),
                'description' => $role->description(),
            ]);
        }
    }

    private function makeUser(Role $role, string $email = 'broker@test.vn'): User
    {
        $this->ensureRole($role);
        return User::create([
            'name' => 'User ' . $role->name,
            'email' => $email,
            'password' => bcrypt('password123'),
            'role_id' => $role->value,
            'is_active' => true,
        ]);
    }

    private function createCustomer(array $attributes = []): Customer
    {
        return Customer::create(array_merge([
            'name' => 'Nguyễn Văn An',
            'phone' => '0901234567',
            'email' => 'nguyenvanan@example.com',
            'company' => 'Công ty ABC',
            'customer_group' => 'potential',
            'status' => 'contacted',
            'notes' => 'Khách hàng ban đầu',
        ], $attributes));
    }

    /**
     * 1. Test chuẩn hóa SĐT (+84, 84, khoảng trắng) và email lowercase
     */
    public function test_phone_and_email_normalization(): void
    {
        $this->assertEquals('0901234567', CustomerDuplicateService::normalizePhone('+84 901 234 567'));
        $this->assertEquals('0901234567', CustomerDuplicateService::normalizePhone('84901234567'));
        $this->assertEquals('0901234567', CustomerDuplicateService::normalizePhone('(090) 123-4567'));
        $this->assertEquals('0901234567', CustomerDuplicateService::normalizePhone('  090 123 4567  '));
        $this->assertNull(CustomerDuplicateService::normalizePhone(''));
        $this->assertNull(CustomerDuplicateService::normalizePhone(null));

        $this->assertEquals('user@example.com', CustomerDuplicateService::normalizeEmail('  USER@EXAMPLE.COM  '));
        $this->assertNull(CustomerDuplicateService::normalizeEmail(''));
        $this->assertNull(CustomerDuplicateService::normalizeEmail(null));
    }

    /**
     * 2. Test hồ sơ khách hàng tách biệt khỏi bảng users và KHÔNG chặn trùng bằng unique
     */
    public function test_customers_table_is_separate_and_does_not_block_duplicate_creation(): void
    {
        $broker = $this->makeUser(Role::Broker, 'broker_sep@test.vn');

        // Tạo khách hàng thứ 1
        $res1 = $this->actingAs($broker, 'sanctum')->postJson('/api/customers', [
            'name' => 'Trần Thị Mai',
            'phone' => '+84 912 345 678', // Nhập có +84 và khoảng trắng
            'email' => 'MAI.TRAN@GMAIL.COM',
            'customer_group' => 'new',
            'status' => 'new',
        ]);
        $res1->assertCreated();
        $this->assertEquals('0912345678', $res1->json('data.phone')); // Đã được chuẩn hóa
        $this->assertEquals('mai.tran@gmail.com', $res1->json('data.email'));

        // Kiểm tra khách hàng được lưu ở bảng customers, KHÔNG bị chèn vào bảng users
        $this->assertDatabaseHas('customers', ['name' => 'Trần Thị Mai', 'phone' => '0912345678']);
        $this->assertDatabaseMissing('users', ['email' => 'mai.tran@gmail.com']);

        // Tạo khách hàng thứ 2 TRÙNG SĐT và EMAIL: Hệ thống VẪN CHO PHÉP (không validate chặn trùng)
        $res2 = $this->actingAs($broker, 'sanctum')->postJson('/api/customers', [
            'name' => 'Trần Thị Mai (Hồ sơ 2)',
            'phone' => '0912345678',
            'email' => 'mai.tran@gmail.com',
            'customer_group' => 'potential',
            'status' => 'contacted',
        ]);
        $res2->assertCreated(); // Thành công 201 Created, không bị 422 Unique validation
        $this->assertNotEquals($res1->json('data.id'), $res2->json('data.id'));
    }

    /**
     * 3. Test API kiểm tra trùng trả danh sách hồ sơ nghi trùng theo SĐT, Email và Tên gần giống
     */
    public function test_api_check_duplicates_detects_matching_phone_email_and_similar_name(): void
    {
        $broker = $this->makeUser(Role::Broker, 'broker_dup@test.vn');

        $existing = $this->createCustomer([
            'name' => 'Lê Hoàng Nam',
            'phone' => '0988776655',
            'email' => 'lehoangnam@vinahouse.vn',
        ]);

        // Kiểm tra với SĐT dạng +84 988 776 655 -> Phải phát hiện trùng
        $resPhone = $this->actingAs($broker, 'sanctum')->postJson('/api/customers/check-duplicates', [
            'phone' => '+84 988 776 655',
            'name' => 'Ai Đó Khác',
        ]);
        $resPhone->assertOk()
            ->assertJsonPath('has_duplicates', true)
            ->assertJsonPath('count', 1)
            ->assertJsonPath('duplicates.0.id', $existing->id);
        $this->assertContains('phone', $resPhone->json('duplicates.0.matched_reasons'));

        // Kiểm tra với Email dạng viết hoa -> Phải phát hiện trùng
        $resEmail = $this->actingAs($broker, 'sanctum')->postJson('/api/customers/check-duplicates', [
            'email' => 'LEHOANGNAM@VINAHOUSE.VN',
        ]);
        $resEmail->assertOk()
            ->assertJsonPath('has_duplicates', true)
            ->assertJsonPath('duplicates.0.id', $existing->id);
        $this->assertContains('email', $resEmail->json('duplicates.0.matched_reasons'));

        // Kiểm tra với Tên gần giống / không dấu "le hoang nam"
        $resName = $this->actingAs($broker, 'sanctum')->postJson('/api/customers/check-duplicates', [
            'name' => 'le hoang nam',
        ]);
        $resName->assertOk()
            ->assertJsonPath('has_duplicates', true)
            ->assertJsonPath('duplicates.0.id', $existing->id);

        // Khi đang sửa chính bản ghi đó ($excludeId) -> Bỏ qua bản ghi của chính nó
        $resExclude = $this->actingAs($broker, 'sanctum')->postJson('/api/customers/check-duplicates', [
            'id' => $existing->id,
            'phone' => '0988776655',
        ]);
        $resExclude->assertOk()
            ->assertJsonPath('has_duplicates', false)
            ->assertJsonPath('count', 0);
    }

    /**
     * 4. Test API gộp hồ sơ trong DB::transaction chuyển nhu cầu, lịch chăm sóc, tương tác và soft-delete hồ sơ phụ
     */
    public function test_api_merge_customers_transfers_related_records_and_soft_deletes_secondary(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_merge@test.vn');

        // Tạo loại BĐS
        $propType = PropertyType::create(['name' => 'Căn hộ chung cư', 'slug' => 'can-ho-chung-cu', 'status' => 1]);

        // Hồ sơ chính
        $primary = $this->createCustomer([
            'name' => 'Phạm Minh Tuấn (Chính)',
            'phone' => '0933111222',
            'email' => null, // Chưa có email
            'company' => null, // Chưa có công ty
            'notes' => 'Ghi chú hồ sơ chính.',
        ]);

        // Hồ sơ phụ
        $secondary = $this->createCustomer([
            'name' => 'Phạm Minh Tuấn (Phụ)',
            'phone' => '0933111222',
            'email' => 'tuan.pham@fpt.com', // Hồ sơ phụ có email
            'company' => 'FPT Software',
            'notes' => 'Ghi chú hồ sơ phụ.',
        ]);

        // Tạo 2 nhu cầu cho hồ sơ phụ
        $demand1 = CustomerDemand::create([
            'customer_id' => $secondary->id,
            'property_type_id' => $propType->id,
            'budget_min' => 2000000000,
            'budget_max' => 3000000000,
            'area' => 'Quận 2',
            'status' => 'processing',
        ]);
        $demand2 = CustomerDemand::create([
            'customer_id' => $secondary->id,
            'property_type_id' => $propType->id,
            'budget_min' => 3000000000,
            'budget_max' => 5000000000,
            'area' => 'Bình Thạnh',
            'status' => 'consulting',
        ]);

        // Tạo 1 lịch chăm sóc cho hồ sơ phụ
        $activity = CustomerActivity::create([
            'customer_id' => $secondary->id,
            'type' => 'call',
            'title' => 'Gọi điện tư vấn dự án Thủ Thiêm',
            'scheduled_at' => Carbon::now()->addDay(),
            'status' => 'pending',
        ]);

        // Tạo 1 tương tác cho hồ sơ phụ
        $interaction = CustomerInteraction::create([
            'customer_id' => $secondary->id,
            'actor_id' => $admin->id,
            'type' => 'call',
            'summary' => 'Đã gọi tư vấn lần 1',
            'occurred_at' => Carbon::now()->subDay(),
        ]);

        // Thực hiện gộp hồ sơ phụ vào hồ sơ chính qua API POST /api/customers/merge
        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/customers/merge', [
            'primary_id' => $primary->id,
            'secondary_id' => $secondary->id,
            'reason' => 'Trùng khách hàng Phạm Minh Tuấn cùng số điện thoại 0933111222',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('transferred.demands', 2)
            ->assertJsonPath('transferred.activities', 1)
            ->assertJsonPath('transferred.interactions', 1);

        // 1. Kiểm tra toàn bộ nhu cầu đã được chuyển sang hồ sơ chính
        $this->assertEquals($primary->id, $demand1->fresh()->customer_id);
        $this->assertEquals($primary->id, $demand2->fresh()->customer_id);

        // 2. Kiểm tra lịch chăm sóc và tương tác đã được chuyển sang hồ sơ chính
        $this->assertEquals($primary->id, $activity->fresh()->customer_id);
        $this->assertEquals($primary->id, $interaction->fresh()->customer_id);

        // 3. Kiểm tra thông tin hồ sơ chính được bổ sung và cập nhật ghi chú gộp
        $primary->refresh();
        $this->assertEquals('tuan.pham@fpt.com', $primary->email);
        $this->assertEquals('FPT Software', $primary->company);
        $this->assertStringContainsString('Đã gộp từ KH', $primary->notes);

        // 4. Kiểm tra hồ sơ phụ: ĐƯỢC SOFT DELETE (không bị xóa vĩnh viễn), có liên kết merged_into_id
        $this->assertSoftDeleted('customers', ['id' => $secondary->id]);
        $secondaryWithTrashed = Customer::withTrashed()->find($secondary->id);
        $this->assertNotNull($secondaryWithTrashed->deleted_at);
        $this->assertEquals($primary->id, $secondaryWithTrashed->merged_into_id);

        // 5. Kiểm tra có bản ghi lịch sử gộp trong customer_merge_histories
        $this->assertDatabaseHas('customer_merge_histories', [
            'primary_customer_id' => $primary->id,
            'secondary_customer_id' => $secondary->id,
            'performed_by' => $admin->id,
            'transferred_demands' => 2,
            'transferred_activities' => 1,
            'transferred_interactions' => 1,
        ]);

        // 6. Kiểm tra có ActivityLog hành động CUSTOMER_MERGE
        $log = ActivityLog::where('action', 'CUSTOMER_MERGE')
            ->where('record_id', $primary->id)
            ->first();
        $this->assertNotNull($log);
        $this->assertEquals($admin->id, $log->user_id);
    }

    /**
     * 5. Test các trường hợp chặn lỗi khi gộp hồ sơ
     */
    public function test_merge_validation_errors(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_err@test.vn');
        $cust = $this->createCustomer(['name' => 'Nguyễn Văn Đơn']);

        // Chặn gộp vào chính mình
        $resSelf = $this->actingAs($admin, 'sanctum')->postJson('/api/customers/merge', [
            'primary_id' => $cust->id,
            'secondary_id' => $cust->id,
        ]);
        $resSelf->assertStatus(422);

        // Chặn khi hồ sơ không tồn tại
        $resNotFound = $this->actingAs($admin, 'sanctum')->postJson('/api/customers/merge', [
            'primary_id' => $cust->id,
            'secondary_id' => 999999,
        ]);
        $resNotFound->assertStatus(404);
    }
}
