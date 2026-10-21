<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Contract;
use App\Models\ContractExtension;
use App\Models\ContractDocument;
use App\Models\Property;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ContractExtensionTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(int $roleId = 2): User
    {
        if (!Role::find($roleId)) {
            Role::forceCreate(['id' => $roleId, 'name' => 'Role ' . $roleId]);
        }

        return User::create([
            'name' => 'Người dùng test ' . uniqid(),
            'email' => uniqid() . '@example.com',
            'password' => 'secret123',
            'role_id' => $roleId,
            'is_active' => true,
        ]);
    }

    private function makeContract(User $broker, User $customer, array $attributes = []): Contract
    {
        $property = Property::create([
            'title' => 'Biệt thự kiểm thử gia hạn',
            'price' => 15000000,
            'area' => 85,
            'status' => 1,
        ]);

        return Contract::create(array_merge([
            'property_id' => $property->id,
            'broker_id' => $broker->id,
            'customer_id' => $customer->id,
            'contract_code' => 'HD-' . strtoupper(uniqid()),
            'contract_name' => 'Hợp đồng cho thuê căn hộ',
            'start_date' => Carbon::now()->subMonths(11)->format('Y-m-d'),
            'end_date' => Carbon::now()->addMonth()->format('Y-m-d'),
            'rental_price' => 15000000,
            'deposit_amount' => 30000000,
            'currency' => 'VND',
            'status' => 1, // Đang có hiệu lực
        ], $attributes));
    }

    /**
     * 1. Test kiểm tra điều kiện gia hạn (Eligibility)
     */
    public function test_eligibility_returns_correct_conditions(): void
    {
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        $response = $this->actingAs($broker)
            ->getJson("/api/contracts/{$contract->id}/extension-eligibility");

        $response->assertOk()
            ->assertJsonPath('data.eligible', true)
            ->assertJsonPath('data.contract.id', $contract->id)
            ->assertJsonPath('data.current_end_date', $contract->end_date->format('Y-m-d'));
    }

    /**
     * 2. Test không cho gia hạn hợp đồng Nháp (status = 0) hoặc Đã hủy (status = 3)
     */
    public function test_cannot_extend_draft_or_cancelled_contracts(): void
    {
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);

        // Hợp đồng nháp
        $draftContract = $this->makeContract($broker, $customer, ['status' => 0]);
        $this->actingAs($broker)
            ->getJson("/api/contracts/{$draftContract->id}/extension-eligibility")
            ->assertOk()
            ->assertJsonPath('data.eligible', false);

        // Hợp đồng đã hủy
        $cancelledContract = $this->makeContract($broker, $customer, ['status' => 3]);
        $this->actingAs($broker)
            ->getJson("/api/contracts/{$cancelledContract->id}/extension-eligibility")
            ->assertOk()
            ->assertJsonPath('data.eligible', false);
    }

    /**
     * 3. Test lưu bản nháp (status = 0) với validation nới lỏng
     */
    public function test_save_draft_extension_successfully(): void
    {
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        $payload = [
            'extension_type' => 1,
            'duration_months' => 6,
            'new_start_date' => Carbon::parse($contract->end_date)->addDay()->format('Y-m-d'),
            'new_rental_price' => 16500000,
            'reason' => 'Khách hàng có nhu cầu gia hạn thêm 6 tháng',
        ];

        $response = $this->actingAs($broker)
            ->postJson("/api/contracts/{$contract->id}/extensions", $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 0)
            ->assertJsonPath('data.status_label', 'Nháp')
            ->assertJsonPath('data.duration_months', 6)
            ->assertJsonPath('data.new_rental_price', 16500000);

        // Kiểm tra new_end_date = new_start_date + 6 tháng - 1 ngày
        $expectedEndDate = Carbon::parse($payload['new_start_date'])->addMonths(6)->subDay()->format('Y-m-d');
        $this->assertEquals($expectedEndDate, $response->json('data.new_end_date'));

        $this->assertDatabaseHas('contract_extensions', [
            'contract_id' => $contract->id,
            'status' => 0,
            'created_by' => $broker->id,
        ]);
    }

    /**
     * 4. Test sửa bản nháp
     */
    public function test_update_draft_extension_successfully(): void
    {
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        $extension = ContractExtension::create([
            'contract_id' => $contract->id,
            'extension_type' => 1,
            'duration_months' => 6,
            'new_start_date' => Carbon::parse($contract->end_date)->addDay()->format('Y-m-d'),
            'new_end_date' => Carbon::parse($contract->end_date)->addDay()->addMonths(6)->subDay()->format('Y-m-d'),
            'status' => 0,
            'created_by' => $broker->id,
        ]);

        $response = $this->actingAs($broker)
            ->putJson("/api/contract-extensions/{$extension->id}", [
                'duration_months' => 12,
                'new_rental_price' => 18000000,
                'reason' => 'Đổi thành 1 năm',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.duration_months', 12)
            ->assertJsonPath('data.new_rental_price', 18000000);

        $this->assertEquals(12, $extension->fresh()->duration_months);
    }

    /**
     * 5. Test gửi yêu cầu gia hạn (0 -> 1) bắt buộc phải có reason
     */
    public function test_submit_extension_requires_reason(): void
    {
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        $extension = ContractExtension::create([
            'contract_id' => $contract->id,
            'extension_type' => 1,
            'duration_months' => 6,
            'new_start_date' => Carbon::parse($contract->end_date)->addDay()->format('Y-m-d'),
            'new_end_date' => Carbon::parse($contract->end_date)->addDay()->addMonths(6)->subDay()->format('Y-m-d'),
            'status' => 0,
            'reason' => '',
            'created_by' => $broker->id,
        ]);

        // Gửi không có reason -> 422
        $this->actingAs($broker)
            ->postJson("/api/contract-extensions/{$extension->id}/submit", ['reason' => ''])
            ->assertStatus(422);

        // Gửi có reason hợp lệ -> 200, status thành 1 (Chờ duyệt)
        $this->actingAs($broker)
            ->postJson("/api/contract-extensions/{$extension->id}/submit", ['reason' => 'Lý do chính đáng'])
            ->assertOk()
            ->assertJsonPath('data.status', 1)
            ->assertJsonPath('data.status_label', 'Chờ duyệt');

        $this->assertEquals(1, $extension->fresh()->status);
    }

    /**
     * 6. Test phê duyệt yêu cầu gia hạn bởi Admin (status: 1 -> 2)
     * Cập nhật contracts: end_date = new_end_date, rental_price, status = 1, ghi log
     */
    public function test_approve_extension_updates_contract_correctly(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer, ['rental_price' => 15000000]);

        $newEndDate = Carbon::parse($contract->end_date)->addDay()->addMonths(6)->subDay()->format('Y-m-d');

        $extension = ContractExtension::create([
            'contract_id' => $contract->id,
            'extension_type' => 1,
            'duration_months' => 6,
            'new_start_date' => Carbon::parse($contract->end_date)->addDay()->format('Y-m-d'),
            'new_end_date' => $newEndDate,
            'new_rental_price' => 17000000,
            'reason' => 'Đồng thuận gia hạn',
            'status' => 1, // Chờ duyệt
            'created_by' => $broker->id,
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/contract-extensions/{$extension->id}/approve");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 2)
            ->assertJsonPath('data.status_label', 'Đã duyệt');

        // Kiểm tra hợp đồng gốc đã được cập nhật
        $contract->refresh();
        $this->assertEquals($newEndDate, $contract->end_date->format('Y-m-d'));
        $this->assertEquals(17000000, (float)$contract->rental_price);
        $this->assertEquals(1, $contract->status);

        // Kiểm tra bản ghi extension lưu old_end_date và old_rental_price
        $extension->refresh();
        $this->assertEquals(15000000, (float)$extension->old_rental_price);
        $this->assertEquals($admin->id, $extension->approved_by);
        $this->assertNotNull($extension->approved_at);

        // Kiểm tra activity log
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'APPROVE_CONTRACT_EXTENSION',
            'record_id' => $extension->id,
        ]);

        // Duyệt lần 2 bị 409
        $this->actingAs($admin)
            ->postJson("/api/contract-extensions/{$extension->id}/approve")
            ->assertStatus(409);
    }

    /**
     * 7. Test từ chối yêu cầu gia hạn (bắt buộc reject_reason)
     */
    public function test_reject_extension_requires_reason(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        $extension = ContractExtension::create([
            'contract_id' => $contract->id,
            'extension_type' => 1,
            'duration_months' => 6,
            'new_start_date' => Carbon::parse($contract->end_date)->addDay()->format('Y-m-d'),
            'new_end_date' => Carbon::parse($contract->end_date)->addDay()->addMonths(6)->subDay()->format('Y-m-d'),
            'status' => 1,
            'created_by' => $broker->id,
        ]);

        // Từ chối thiếu lý do -> 422
        $this->actingAs($admin)
            ->postJson("/api/contract-extensions/{$extension->id}/reject", [])
            ->assertStatus(422);

        // Từ chối có lý do -> 200, status thành 3
        $this->actingAs($admin)
            ->postJson("/api/contract-extensions/{$extension->id}/reject", [
                'reject_reason' => 'Chủ nhà dự định lấy lại nhà để ở',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 3)
            ->assertJsonPath('data.reject_reason', 'Chủ nhà dự định lấy lại nhà để ở');

        $this->assertEquals(3, $extension->fresh()->status);
    }

    /**
     * 8. Test bảo mật phân quyền: Môi giới khác không được sửa/gửi, Khách hàng không có quyền
     */
    public function test_authorization_prevents_unauthorized_users(): void
    {
        $broker1 = $this->makeUser(2);
        $broker2 = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker1, $customer);

        $extension = ContractExtension::create([
            'contract_id' => $contract->id,
            'extension_type' => 1,
            'duration_months' => 6,
            'new_start_date' => Carbon::parse($contract->end_date)->addDay()->format('Y-m-d'),
            'new_end_date' => Carbon::parse($contract->end_date)->addDay()->addMonths(6)->subDay()->format('Y-m-d'),
            'status' => 0,
            'created_by' => $broker1->id,
        ]);

        // Môi giới 2 cố sửa nháp của môi giới 1 -> 403
        $this->actingAs($broker2)
            ->putJson("/api/contract-extensions/{$extension->id}", ['duration_months' => 3])
            ->assertForbidden();

        // Khách hàng cố gọi API gia hạn -> 403
        $this->actingAs($customer)
            ->getJson("/api/contracts/{$contract->id}/extensions")
            ->assertForbidden();

        $this->actingAs($customer)
            ->postJson("/api/contracts/{$contract->id}/extensions", ['duration_months' => 6])
            ->assertForbidden();
    }

    /**
     * 9. Test upload tài liệu đính kèm phụ lục gia hạn
     */
    public function test_upload_extension_document_successfully(): void
    {
        Storage::fake('public');

        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        $extension = ContractExtension::create([
            'contract_id' => $contract->id,
            'extension_type' => 2,
            'duration_months' => 12,
            'new_start_date' => Carbon::parse($contract->end_date)->addDay()->format('Y-m-d'),
            'new_end_date' => Carbon::parse($contract->end_date)->addDay()->addMonths(12)->subDay()->format('Y-m-d'),
            'status' => 0,
            'created_by' => $broker->id,
        ]);

        $file = UploadedFile::fake()->create('phu_luc_hop_dong.pdf', 500, 'application/pdf');

        $response = $this->actingAs($broker)
            ->postJson("/api/contract-extensions/{$extension->id}/documents", [
                'files' => [$file],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('contract_documents', [
            'contract_id' => $contract->id,
            'extension_id' => $extension->id,
            'original_name' => 'phu_luc_hop_dong.pdf',
        ]);
    }
}
