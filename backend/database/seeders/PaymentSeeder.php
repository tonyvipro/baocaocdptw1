<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Transaction;
use App\Models\Contract;
use App\Models\Property;
use App\Models\User;
use App\Enums\InvoiceStatus;
use App\Enums\InvoiceType;
use App\Enums\PaymentMethod;
use App\Enums\TransactionStatus;
use App\Services\PaymentService;
use App\Services\InvoiceService;
use App\Services\PropertyAvailabilityService;
use Carbon\Carbon;
use Illuminate\Support\Str;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Chặn chạy trên môi trường production
        if (app()->environment('production')) {
            $this->command->error('KHÔNG ĐƯỢC PHÉP chạy PaymentSeeder trên môi trường Production!');
            return;
        }

        $paymentService = app(PaymentService::class);
        $invoiceService = app(InvoiceService::class);
        $availabilityService = app(PropertyAvailabilityService::class);

        Invoice::withoutEvents(function () use ($paymentService, $invoiceService, $availabilityService) {
            DB::transaction(function () use ($paymentService, $invoiceService, $availabilityService) {
                $today = Carbon::today();
                $curYearMonth = $today->format('Ym');

                // 2. Tạo hoặc lấy User (Gán cho khách hàng Nguyễn Văn A đang đăng nhập trên trình duyệt)
                $customer = User::where('email', 'nguyenvana@gmail.com')->first()
                    ?? User::firstOrCreate([
                        'email' => 'nguyenvana@gmail.com',
                    ], [
                        'name' => 'Nguyễn Văn A',
                        'role_id' => 5, // Customer
                        'phone' => '0912345678',
                        'password' => bcrypt('password123'),
                        'is_active' => true,
                    ]);

                $broker = User::where('role_id', 2)->first() ?? User::firstOrCreate([
                    'email' => 'broker.payment.seed@bds.vn',
                ], [
                    'name' => 'Lê Quản Lý Hợp Đồng',
                    'role_id' => 2,
                    'phone' => '0988777666',
                    'password' => bcrypt('password123'),
                    'is_active' => true,
                ]);

                $admin = User::where('role_id', 1)->first() ?? User::first();

                // 3. SEED CÁC BẤT ĐỘNG SẢN MẪU THEO MỤC 9
                // (a) BĐS đang cho thuê (status 2, closed_reason = rented)
                $propRented = Property::firstOrCreate([
                    'code' => 'SEED-RENTED-01',
                ], [
                    'title' => '[Dữ liệu mẫu] Căn hộ chung cư cao cấp đang cho thuê',
                    'image' => 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
                    'address' => 'Tòa Orchid 1, Khu đô thị Vinhomes Grand Park, TP. Thủ Đức',
                    'price' => 10000,
                    'price_rent' => 10000,
                    'deposit' => 10000,
                    'area' => 68.0,
                    'status' => 1, // Ban đầu là 1, sau khi kích hoạt HĐ sẽ chuyển 2
                    'purpose' => 'rent',
                    'bedrooms' => 2,
                    'bathrooms' => 2,
                ]);

                // (b) BĐS vừa hết hạn thuê (đã hiển thị lại status 1)
                $propReturned = Property::firstOrCreate([
                    'code' => 'SEED-RETURNED-02',
                ], [
                    'title' => '[Dữ liệu mẫu] Biệt thự liền kề vừa kết thúc hợp đồng thuê (Sẵn sàng hiển thị)',
                    'image' => 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
                    'address' => 'Số 15 Phố Hoa Lan, KĐT Vinhomes Riverside, Long Biên, Hà Nội',
                    'price' => 10000,
                    'price_rent' => 10000,
                    'deposit' => 10000,
                    'area' => 180.0,
                    'status' => 1,
                    'purpose' => 'rent',
                    'closed_reason' => null,
                    'closed_at' => null,
                    'closed_contract_id' => null,
                    'bedrooms' => 4,
                    'bathrooms' => 4,
                ]);

                // (c) BĐS đã bán (status 2 vĩnh viễn, closed_reason = sold)
                $propSold = Property::firstOrCreate([
                    'code' => 'SEED-SOLD-03',
                ], [
                    'title' => '[Dữ liệu mẫu] Căn hộ Penhouse Sky Villa đã chuyển nhượng thành công',
                    'image' => 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&auto=format&fit=crop&q=80',
                    'address' => 'Tầng 45, Tháp The Sun, 88 Bến Vân Đồn, Quận 4, TP. Hồ Chí Minh',
                    'price' => 10000,
                    'price_sale' => 10000,
                    'deposit' => 10000,
                    'area' => 250.0,
                    'status' => 2,
                    'purpose' => 'sale',
                    'closed_reason' => 'sold',
                    'closed_at' => $today->copy()->subDays(15),
                    'bedrooms' => 3,
                    'bathrooms' => 4,
                ]);

                // (d) BĐS đang hiển thị (status 1)
                $propAvailable = Property::firstOrCreate([
                    'code' => 'SEED-AVAILABLE-04',
                ], [
                    'title' => '[Dữ liệu mẫu] Căn hộ Studio hiện đại view công viên (Giá 10.000đ test QR)',
                    'image' => 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80',
                    'address' => 'Tòa S2.05 Vinhome Ocean Park, Gia Lâm, Hà Nội',
                    'price' => 10000,
                    'price_rent' => 10000,
                    'deposit' => 10000,
                    'area' => 42.0,
                    'status' => 1,
                    'purpose' => 'rent',
                    'bedrooms' => 1,
                    'bathrooms' => 1,
                ]);

                // (e) BĐS riêng cho Nguyễn Văn A với giá đúng 5.000đ (Test quét QR ngân hàng thật)
                $prop5k = Property::updateOrCreate([
                    'code' => 'A101',
                ], [
                    'title' => 'Căn hộ chung cư cao cấp A101 Landmark Plus (Giá thuê 5.000đ)',
                    'image' => 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80',
                    'address' => 'Phòng A101, Tầng 10, Tòa Landmark Plus, 208 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM',
                    'price' => 5000,
                    'price_rent' => 5000,
                    'deposit' => 5000,
                    'area' => 75.5,
                    'status' => 1,
                    'purpose' => 'rent',
                    'bedrooms' => 2,
                    'bathrooms' => 2,
                ]);

                // 4. HỢP ĐỒNG MẪU
                $contractRented = Contract::firstOrCreate([
                    'contract_code' => 'SEED-HD-RENTED-01',
                ], [
                    'contract_name' => 'Hợp đồng thuê căn hộ Orchid 1 - KH Nguyễn Thanh Toán',
                    'property_id' => $propRented->id,
                    'customer_id' => $customer->id,
                    'broker_id' => $broker->id,
                    'start_date' => $today->copy()->subMonths(2)->toDateString(),
                    'end_date' => $today->copy()->addMonths(10)->toDateString(),
                    'rental_price' => 10000,
                    'deposit_amount' => 10000,
                    'currency' => 'VND',
                    'billing_cycle' => 1,
                    'next_billing_date' => $today->copy()->addMonth()->startOfMonth()->toDateString(),
                    'status' => 1,
                ]);

                // Hợp đồng thuê BĐS A101 cho riêng Nguyễn Văn A với giá 5.000đ
                $contract5k = Contract::updateOrCreate([
                    'contract_code' => 'HD-NVA-5000',
                ], [
                    'contract_name' => 'Hợp đồng thuê căn hộ A101 Landmark Plus - KH Nguyễn Văn A',
                    'property_id' => $prop5k->id,
                    'customer_id' => $customer->id,
                    'broker_id' => $broker->id,
                    'start_date' => $today->copy()->startOfMonth()->toDateString(),
                    'end_date' => $today->copy()->addMonths(12)->toDateString(),
                    'rental_price' => 5000,
                    'deposit_amount' => 5000,
                    'currency' => 'VND',
                    'billing_cycle' => 1,
                    'next_billing_date' => $today->copy()->addMonth()->startOfMonth()->toDateString(),
                    'status' => 1,
                ]);

                // Hóa đơn riêng đúng 5.000đ cho Nguyễn Văn A:
                $inv5k = Invoice::updateOrCreate([
                    'invoice_no' => "INV-NVA-5K-{$curYearMonth}",
                ], [
                    'contract_id' => $contract5k->id,
                    'title' => 'Hóa đơn tiền thuê căn hộ A101 (Đúng 5.000đ test SePay QR)',
                    'type' => InvoiceType::RENT,
                    'amount' => 5000,
                    'due_date' => $today->copy()->endOfMonth()->toDateString(),
                    'issue_date' => $today->copy()->startOfMonth()->toDateString(),
                    'status' => InvoiceStatus::UNPAID,
                ]);
                InvoiceItem::where('invoice_id', $inv5k->id)->delete();
                InvoiceItem::create([
                    'invoice_id' => $inv5k->id,
                    'item_name' => 'Tiền thuê căn hộ A101 tháng ' . $today->format('m/Y'),
                    'description' => 'Tiền thuê căn hộ A101 Landmark Plus',
                    'quantity' => 1,
                    'unit_price' => 5000,
                    'total_price' => 5000,
                ]);
                $invoiceService->syncPaymentStatus($inv5k->fresh());

                // Kích hoạt đồng bộ trạng thái BĐS cho hợp đồng thuê
                $availabilityService->syncForContract($contractRented);

                // 5. CÔNG NỢ ĐỦ MỌI TRẠNG THÁI TRONG THÁNG HIỆN TẠI (Mục 9)

                // (1) Hóa đơn ĐÃ THANH TOÁN ĐỦ trong tháng (10.000 VND)
                $invPaid = Invoice::firstOrCreate([
                    'invoice_no' => "SEED-PAY-{$curYearMonth}-01",
                ], [
                    'contract_id' => $contractRented->id,
                    'title' => '[Dữ liệu mẫu] Tiền thuê căn hộ tháng hiện tại (Đã thu đủ)',
                    'type' => InvoiceType::RENT,
                    'amount' => 10000,
                    'due_date' => $today->copy()->endOfMonth()->toDateString(),
                    'issue_date' => $today->copy()->startOfMonth()->toDateString(),
                    'status' => InvoiceStatus::UNPAID,
                ]);
                if ($invPaid->items()->doesntExist()) {
                    InvoiceItem::create([
                        'invoice_id' => $invPaid->id,
                        'item_name' => 'Tiền thuê căn hộ Orchid 1',
                        'description' => 'Tiền thuê căn hộ Orchid 1 tháng ' . $today->format('m/Y'),
                        'quantity' => 1,
                        'unit_price' => 10000,
                        'total_price' => 10000,
                    ]);
                }
                if ($invPaid->transactions()->where('status', TransactionStatus::SUCCESS)->doesntExist()) {
                    $paymentService->recordPayment($invPaid, [
                        'amount' => 10000,
                        'payment_method' => PaymentMethod::BANK_TRANSFER,
                        'paid_at' => $today->copy()->subDays(3)->toDateTimeString(),
                        'reference_code' => 'VCB-MB-SEED01',
                        'note' => '[Dữ liệu mẫu] Khách chuyển khoản thanh toán đủ tiền thuê',
                        'client_token' => (string) Str::uuid(),
                    ], $admin->id);
                }

                // (2) Hóa đơn TRẢ MỘT PHẦN trong tháng (Tổng 10.000 VND, còn nợ 5.000 VND)
                $invPartial = Invoice::firstOrCreate([
                    'invoice_no' => "SEED-PAY-{$curYearMonth}-02",
                ], [
                    'contract_id' => $contractRented->id,
                    'title' => '[Dữ liệu mẫu] Tiền điện nước và phí quản lý (Trả một phần, còn nợ 5.000đ)',
                    'type' => InvoiceType::SERVICE,
                    'amount' => 10000,
                    'due_date' => $today->copy()->addDays(5)->toDateString(),
                    'issue_date' => $today->copy()->startOfMonth()->toDateString(),
                    'status' => InvoiceStatus::UNPAID,
                ]);
                if ($invPartial->items()->doesntExist()) {
                    InvoiceItem::create([
                        'invoice_id' => $invPartial->id,
                        'item_name' => 'Tiền điện & nước sinh hoạt',
                        'description' => 'Tiền điện & nước sinh hoạt kỳ này',
                        'quantity' => 1,
                        'unit_price' => 10000,
                        'total_price' => 10000,
                    ]);
                }
                if ($invPartial->transactions()->where('status', TransactionStatus::SUCCESS)->doesntExist()) {
                    $paymentService->recordPayment($invPartial, [
                        'amount' => 5000,
                        'payment_method' => PaymentMethod::CASH,
                        'paid_at' => $today->copy()->subDays(1)->toDateTimeString(),
                        'reference_code' => 'TIENMAT-002',
                        'note' => '[Dữ liệu mẫu] Thu trước 5.000đ tiền mặt',
                        'client_token' => (string) Str::uuid(),
                    ], $admin->id);
                }

                // (3) Hóa đơn QUÁ HẠN (8.000 VND, due_date < hôm nay, chưa trả)
                $invOverdue = Invoice::firstOrCreate([
                    'invoice_no' => "SEED-PAY-{$curYearMonth}-03",
                ], [
                    'contract_id' => $contractRented->id,
                    'title' => '[Dữ liệu mẫu] Phí giữ xe và dịch vụ bổ sung (Quá hạn 8.000đ)',
                    'type' => InvoiceType::SERVICE,
                    'amount' => 8000,
                    'due_date' => $today->copy()->subDays(4)->toDateString(),
                    'issue_date' => $today->copy()->subDays(15)->toDateString(),
                    'status' => InvoiceStatus::OVERDUE,
                ]);
                if ($invOverdue->items()->doesntExist()) {
                    InvoiceItem::create([
                        'invoice_id' => $invOverdue->id,
                        'item_name' => 'Phí giữ xe ô tô & xe máy',
                        'description' => 'Phí đỗ 01 xe ô tô và 02 xe máy quá hạn',
                        'quantity' => 1,
                        'unit_price' => 8000,
                        'total_price' => 8000,
                    ]);
                }

                // (4) Hóa đơn CHƯA ĐẾN HẠN (5.000 VND, due_date > hôm nay, chưa thanh toán)
                $invUpcoming = Invoice::firstOrCreate([
                    'invoice_no' => "SEED-PAY-{$curYearMonth}-04",
                ], [
                    'contract_id' => $contractRented->id,
                    'title' => '[Dữ liệu mẫu] Phí vệ sinh và bảo trì định kỳ (Chưa đến hạn 5.000đ)',
                    'type' => InvoiceType::OTHER,
                    'amount' => 5000,
                    'due_date' => $today->copy()->addDays(12)->toDateString(),
                    'issue_date' => $today->copy()->toDateString(),
                    'status' => InvoiceStatus::UNPAID,
                ]);
                if ($invUpcoming->items()->doesntExist()) {
                    InvoiceItem::create([
                        'invoice_id' => $invUpcoming->id,
                        'item_name' => 'Bảo trì máy lạnh định kỳ',
                        'description' => 'Bảo trì máy lạnh và vệ sinh căn hộ',
                        'quantity' => 1,
                        'unit_price' => 5000,
                        'total_price' => 5000,
                    ]);
                }

                // (5) Hóa đơn TIỀN CỌC QUÁ HẠN (10.000 VND)
                $invDeposit = Invoice::firstOrCreate([
                    'invoice_no' => "SEED-PAY-{$curYearMonth}-05",
                ], [
                    'contract_id' => $contractRented->id,
                    'title' => '[Dữ liệu mẫu] Tiền đặt cọc hợp đồng bảo chứng (Quá hạn 10.000đ)',
                    'type' => InvoiceType::DEPOSIT,
                    'amount' => 10000,
                    'due_date' => $today->copy()->subDays(2)->toDateString(),
                    'issue_date' => $today->copy()->subDays(10)->toDateString(),
                    'status' => InvoiceStatus::OVERDUE,
                ]);
                if ($invDeposit->items()->doesntExist()) {
                    InvoiceItem::create([
                        'invoice_id' => $invDeposit->id,
                        'item_name' => 'Tiền đặt cọc bảo chứng bổ sung',
                        'description' => 'Khoản đặt cọc giữ chỗ căn hộ bổ sung',
                        'quantity' => 1,
                        'unit_price' => 10000,
                        'total_price' => 10000,
                    ]);
                }

                // (6) Hóa đơn CÓ GIAO DỊCH QR ĐANG CHỜ (6.000 VND)
                $invPendingQr = Invoice::firstOrCreate([
                    'invoice_no' => "SEED-PAY-{$curYearMonth}-06",
                ], [
                    'contract_id' => $contractRented->id,
                    'title' => '[Dữ liệu mẫu] Tiền dịch vụ internet & truyền hình cáp (Đang có QR chờ 6.000đ)',
                    'type' => InvoiceType::SERVICE,
                    'amount' => 6000,
                    'due_date' => $today->copy()->addDays(7)->toDateString(),
                    'issue_date' => $today->copy()->toDateString(),
                    'status' => InvoiceStatus::UNPAID,
                ]);
                if ($invPendingQr->items()->doesntExist()) {
                    InvoiceItem::create([
                        'invoice_id' => $invPendingQr->id,
                        'item_name' => 'Cáp quang Internet 500Mbps',
                        'description' => 'Gói internet cáp quang tốc độ cao 500Mbps',
                        'quantity' => 1,
                        'unit_price' => 6000,
                        'total_price' => 6000,
                    ]);
                }
                if ($invPendingQr->transactions()->where('status', TransactionStatus::PENDING)->doesntExist()) {
                    $paymentService->createQrPayment($invPendingQr, [
                        'gateway' => 'sepay',
                        'amount' => 6000,
                        'client_token' => (string) Str::uuid(),
                    ], $customer);
                }

                // (7) Hóa đơn có giao dịch QR HẾT HẠN (3.000 VND)
                $invExpired = Invoice::firstOrCreate([
                    'invoice_no' => "SEED-PAY-{$curYearMonth}-07",
                ], [
                    'contract_id' => $contractRented->id,
                    'title' => '[Dữ liệu mẫu] Tiền rác sinh hoạt & bảo an (Giao dịch QR đã hết hạn 3.000đ)',
                    'type' => InvoiceType::OTHER,
                    'amount' => 3000,
                    'due_date' => $today->copy()->addDays(3)->toDateString(),
                    'issue_date' => $today->copy()->toDateString(),
                    'status' => InvoiceStatus::UNPAID,
                ]);
                if ($invExpired->items()->doesntExist()) {
                    InvoiceItem::create([
                        'invoice_id' => $invExpired->id,
                        'item_name' => 'Phí vệ sinh & rác sinh hoạt',
                        'description' => 'Phí vệ sinh môi trường tháng này',
                        'quantity' => 1,
                        'unit_price' => 3000,
                        'total_price' => 3000,
                    ]);
                }
                if ($invExpired->transactions()->where('status', TransactionStatus::EXPIRED)->doesntExist()) {
                    Transaction::create([
                        'invoice_id' => $invExpired->id,
                        'transaction_code' => 'TXN-EXPIRED-SAMPLE',
                        'amount' => 3000,
                        'payment_method' => PaymentMethod::MOMO,
                        'gateway' => 'momo',
                        'gateway_order_id' => 'MOMO-EXP-001',
                        'status' => TransactionStatus::EXPIRED,
                        'source' => 'gateway',
                        'expires_at' => $today->copy()->subMinutes(30),
                        'note' => '[Dữ liệu mẫu] Giao dịch mã QR MoMo quá hạn 15 phút',
                        'recorded_by' => $customer->id,
                        'client_token' => (string) Str::uuid(),
                    ]);
                }

                // (8) Hóa đơn có giao dịch CẦN ĐỐI SOÁT (7.000 VND)
                $invReconcile = Invoice::firstOrCreate([
                    'invoice_no' => "SEED-PAY-{$curYearMonth}-08",
                ], [
                    'contract_id' => $contractRented->id,
                    'title' => '[Dữ liệu mẫu] Giao dịch thanh toán sai lệch số tiền (Cần đối soát 7.000đ)',
                    'type' => InvoiceType::OTHER,
                    'amount' => 7000,
                    'due_date' => $today->copy()->addDays(10)->toDateString(),
                    'issue_date' => $today->copy()->toDateString(),
                    'status' => InvoiceStatus::UNPAID,
                ]);
                if ($invReconcile->items()->doesntExist()) {
                    InvoiceItem::create([
                        'invoice_id' => $invReconcile->id,
                        'item_name' => 'Khoản thanh toán sai lệch cần đối soát',
                        'description' => 'Khoản thanh toán cổng báo sai lệch cần kế toán kiểm tra',
                        'quantity' => 1,
                        'unit_price' => 7000,
                        'total_price' => 7000,
                    ]);
                }
                if ($invReconcile->transactions()->where('status', TransactionStatus::RECONCILE)->doesntExist()) {
                    Transaction::create([
                        'invoice_id' => $invReconcile->id,
                        'transaction_code' => 'TXN-RECONCILE-SAMPLE',
                        'amount' => 7000,
                        'payment_method' => PaymentMethod::SEPAY,
                        'gateway' => 'sepay',
                        'gateway_order_id' => 'SEPAY-REC-001',
                        'gateway_txn_id' => 'SP-TXN-DISCREPANCY',
                        'status' => TransactionStatus::RECONCILE,
                        'source' => 'gateway',
                        'failure_reason' => 'Số tiền webhook báo (5.000 VND) không khớp số tiền giao dịch yêu cầu (7.000 VND)',
                        'note' => '[Dữ liệu mẫu] Giao dịch nghi vấn sai lệch số tiền từ cổng',
                        'recorded_by' => $customer->id,
                        'client_token' => (string) Str::uuid(),
                    ]);
                }

                // 6. ĐỒNG BỘ TRẠNG THÁI TẤT CẢ HÓA ĐƠN
                foreach ([$invPaid, $invPartial, $invOverdue, $invUpcoming, $invDeposit, $invPendingQr, $invExpired, $invReconcile] as $inv) {
                    $invoiceService->syncPaymentStatus($inv->fresh());
                }
            });
        });

        $this->command->info('Đã seed dữ liệu mẫu cho Chức năng Thanh toán và Vòng đời BĐS thành công!');
    }
}
