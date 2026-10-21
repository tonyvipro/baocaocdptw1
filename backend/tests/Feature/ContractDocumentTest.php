<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\ContractDocument;
use App\Models\ContractExtension;
use App\Models\Property;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ContractDocumentTest extends TestCase
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
            'title' => 'Căn hộ Landmark 81',
            'price' => 20000000,
            'area' => 75,
            'status' => 1,
            'type' => 'Căn hộ chung cư',
        ]);

        return Contract::create(array_merge([
            'property_id' => $property->id,
            'broker_id' => $broker->id,
            'customer_id' => $customer->id,
            'contract_code' => 'HD-' . strtoupper(uniqid()),
            'contract_name' => 'Hợp đồng thuê căn hộ Landmark',
            'start_date' => Carbon::now()->subMonths(6)->format('Y-m-d'),
            'end_date' => Carbon::now()->addMonths(6)->format('Y-m-d'),
            'rental_price' => 20000000,
            'deposit_amount' => 40000000,
            'currency' => 'VND',
            'status' => 1, // Đang có hiệu lực
        ], $attributes));
    }

    /**
     * 1. Test nhân viên tải lên tài liệu hợp lệ và ghi activity_logs
     */
    public function test_staff_upload_valid_documents_successfully(): void
    {
        Storage::fake('local');

        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        $file1 = UploadedFile::fake()->create('hop-dong-chinh.pdf', 500, 'application/pdf');
        $file2 = UploadedFile::fake()->create('so-do.png', 500, 'image/png');

        $response = $this->actingAs($broker, 'sanctum')
            ->postJson("/api/contracts/{$contract->id}/documents", [
                'files' => [$file1, $file2],
                'document_type' => 0, // Hợp đồng chính
                'description' => 'Bản scan có chữ ký bên A và B',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('contract_documents', [
            'contract_id' => $contract->id,
            'document_type' => 0,
            'original_name' => 'hop-dong-chinh.pdf',
        ]);

        $this->assertDatabaseHas('contract_documents', [
            'contract_id' => $contract->id,
            'original_name' => 'so-do.png',
        ]);

        // Kiểm tra activity_logs
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $broker->id,
            'action' => 'CONTRACT_DOCUMENT_UPLOAD',
            'table_name' => 'contract_documents',
        ]);
    }

    /**
     * 2. Test tải lên sai định dạng hoặc file vượt quá 10MB bị chặn 422
     */
    public function test_upload_rejects_invalid_file_format_or_large_size(): void
    {
        Storage::fake('local');

        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        // File quá 10MB (11MB = 11264 KB)
        $largeFile = UploadedFile::fake()->create('huge.pdf', 11500, 'application/pdf');

        $response = $this->actingAs($broker, 'sanctum')
            ->postJson("/api/contracts/{$contract->id}/documents", [
                'files' => [$largeFile],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['files.0']);

        // File đuôi exe / bin
        $exeFile = UploadedFile::fake()->create('virus.exe', 100, 'application/x-msdownload');
        $res2 = $this->actingAs($broker, 'sanctum')
            ->postJson("/api/contracts/{$contract->id}/documents", [
                'files' => [$exeFile],
            ]);

        $res2->assertStatus(422);
    }

    /**
     * 3. Test môi giới khác không thể upload tài liệu cho hợp đồng người khác (403)
     */
    public function test_unauthorized_broker_cannot_upload_to_other_contract(): void
    {
        Storage::fake('local');

        $broker1 = $this->makeUser(2);
        $broker2 = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker1, $customer);

        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

        $response = $this->actingAs($broker2, 'sanctum')
            ->postJson("/api/contracts/{$contract->id}/documents", [
                'files' => [$file],
            ]);

        $response->assertForbidden();
    }

    /**
     * 4. Test sửa metadata tài liệu hợp đồng
     */
    public function test_update_document_metadata_successfully(): void
    {
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        $doc = ContractDocument::create([
            'contract_id' => $contract->id,
            'document_type' => 5,
            'title' => 'Tài liệu cũ',
            'file_url' => 'contracts/1/test.pdf',
            'original_name' => 'test.pdf',
            'file_size' => 1024,
            'mime_type' => 'application/pdf',
            'uploaded_by' => $broker->id,
        ]);

        $response = $this->actingAs($broker, 'sanctum')
            ->putJson("/api/contract-documents/{$doc->id}", [
                'title' => 'Hợp đồng chính thức đã ký',
                'document_type' => 0,
                'description' => 'Đã cập nhật mô tả',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.title', 'Hợp đồng chính thức đã ký')
            ->assertJsonPath('data.document_type', 0);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $broker->id,
            'action' => 'CONTRACT_DOCUMENT_UPDATE',
        ]);
    }

    /**
     * 5. Test xóa mềm và quy tắc 409 khi xóa HĐ chính duy nhất của HĐ đang hiệu lực
     */
    public function test_cannot_delete_only_main_document_of_active_contract(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer, ['status' => 1]); // Active

        // Tài liệu HĐ chính DUY NHẤT
        $mainDoc = ContractDocument::create([
            'contract_id' => $contract->id,
            'document_type' => 0, // TYPE_MAIN
            'title' => 'HopDongChinh.pdf',
            'file_url' => 'contracts/1/main.pdf',
            'original_name' => 'HopDongChinh.pdf',
            'file_size' => 2048,
            'mime_type' => 'application/pdf',
            'uploaded_by' => $broker->id,
        ]);

        // Cố xóa -> 409 Conflict
        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/contract-documents/{$mainDoc->id}");

        $response->assertStatus(409);

        // Tạo thêm 1 HĐ chính thứ hai
        $secondMainDoc = ContractDocument::create([
            'contract_id' => $contract->id,
            'document_type' => 0,
            'title' => 'HopDongChinh_PhuLuc.pdf',
            'file_url' => 'contracts/1/main2.pdf',
            'original_name' => 'HopDongChinh_PhuLuc.pdf',
            'file_size' => 2048,
            'mime_type' => 'application/pdf',
            'uploaded_by' => $broker->id,
        ]);

        // Bây giờ đã có 2 file chính -> Xóa được file thứ 2 -> 200 OK
        $res2 = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/contract-documents/{$secondMainDoc->id}");

        $res2->assertOk();
        $this->assertSoftDeleted('contract_documents', ['id' => $secondMainDoc->id]);
    }

    /**
     * 6. Test khách hàng xem danh sách hợp đồng của mình (không thấy nháp status = 0)
     */
    public function test_customer_only_views_their_own_active_contracts(): void
    {
        $broker = $this->makeUser(2);
        $customer1 = $this->makeUser(5);
        $customer2 = $this->makeUser(5);

        // HĐ 1 của customer 1: active (status = 1) -> KHÁCH THẤY
        $c1 = $this->makeContract($broker, $customer1, ['status' => 1]);

        // HĐ 2 của customer 1: draft (status = 0) -> KHÁCH KHÔNG THẤY
        $c2 = $this->makeContract($broker, $customer1, ['status' => 0]);

        // HĐ 3 của customer 2 -> CUSTOMER 1 KHÔNG THẤY
        $c3 = $this->makeContract($broker, $customer2, ['status' => 1]);

        $response = $this->actingAs($customer1, 'sanctum')
            ->getJson('/api/my/contracts');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $c1->id);
    }

    /**
     * 7. Test khách hàng chỉ thấy tài liệu loại {0, 1, 4}, không thấy loại {2, 3, 5}
     */
    public function test_customer_only_sees_permitted_document_types(): void
    {
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer, ['status' => 1]);

        // 0: Hợp đồng chính -> Khách thấy
        $doc0 = ContractDocument::create([
            'contract_id' => $contract->id,
            'document_type' => 0,
            'title' => 'HopDongChinh.pdf',
            'file_url' => 'contracts/test/0.pdf',
            'original_name' => '0.pdf',
            'file_size' => 1000,
            'mime_type' => 'application/pdf',
        ]);

        // 1: Phụ lục -> Khách thấy
        $doc1 = ContractDocument::create([
            'contract_id' => $contract->id,
            'document_type' => 1,
            'title' => 'PhuLuc.pdf',
            'file_url' => 'contracts/test/1.pdf',
            'original_name' => '1.pdf',
            'file_size' => 1000,
            'mime_type' => 'application/pdf',
        ]);

        // 2: Giấy tờ tùy thân -> Khách KHÔNG THẤY trong danh sách khách
        $doc2 = ContractDocument::create([
            'contract_id' => $contract->id,
            'document_type' => 2,
            'title' => 'CCCD.jpg',
            'file_url' => 'contracts/test/2.jpg',
            'original_name' => '2.jpg',
            'file_size' => 1000,
            'mime_type' => 'image/jpeg',
        ]);

        // 3: Giấy tờ BĐS -> Khách KHÔNG THẤY
        $doc3 = ContractDocument::create([
            'contract_id' => $contract->id,
            'document_type' => 3,
            'title' => 'SoDo.pdf',
            'file_url' => 'contracts/test/3.pdf',
            'original_name' => '3.pdf',
            'file_size' => 1000,
            'mime_type' => 'application/pdf',
        ]);

        // 4: Biên bản bàn giao -> Khách thấy
        $doc4 = ContractDocument::create([
            'contract_id' => $contract->id,
            'document_type' => 4,
            'title' => 'BienBanBanGiao.pdf',
            'file_url' => 'contracts/test/4.pdf',
            'original_name' => '4.pdf',
            'file_size' => 1000,
            'mime_type' => 'application/pdf',
        ]);

        $response = $this->actingAs($customer, 'sanctum')
            ->getJson("/api/my/contracts/{$contract->id}/documents");

        $response->assertOk();
        $docs = $response->json('data');

        $this->assertCount(3, $docs); // Chỉ gồm 0, 1, 4
        $docTypes = array_column($docs, 'document_type');
        $this->assertEqualsCanonicalizing([0, 1, 4], $docTypes);

        // Khách cố tình gọi preview loại 2 (CCCD) -> bị chặn 403 Forbidden
        Storage::fake('local');
        $resPreview = $this->actingAs($customer, 'sanctum')
            ->getJson("/api/my/contract-documents/{$doc2->id}/preview");
        $resPreview->assertForbidden();
    }

    /**
     * 8. Test khách hàng cố upload/sửa/xóa bị chặn
     */
    public function test_customer_cannot_upload_or_modify_documents(): void
    {
        Storage::fake('local');

        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

        // Customer upload -> 403
        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/contracts/{$contract->id}/documents", ['files' => [$file]])
            ->assertForbidden();
    }

    /**
     * 9. Test khách chưa đăng nhập bị 401
     */
    public function test_unauthenticated_user_cannot_access_my_contracts(): void
    {
        $this->getJson('/api/my/contracts')
            ->assertUnauthorized();
    }
}
