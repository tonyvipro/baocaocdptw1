<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Transaction;
use App\Models\Contract;
use App\Models\Property;
use App\Models\User;
use App\Enums\InvoiceStatus;
use App\Enums\InvoiceType;
use App\Enums\PaymentMethod;
use App\Services\InvoiceService;
use Carbon\Carbon;

class InvoiceSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Chặn chạy trên môi trường production (Spec 4.5.a)
        if (app()->environment('production')) {
            $this->command->error('KHÔNG ĐƯỢC PHÉP chạy InvoiceSeeder trên môi trường Production!');
            return;
        }

        $invoiceService = app(InvoiceService::class);

        // Bọc trong withoutEvents để không gửi mail/notification
        Invoice::withoutEvents(function () use ($invoiceService) {
            DB::transaction(function () use ($invoiceService) {
                $today = Carbon::today();

                // 2. Chuẩn bị dữ liệu nền (Hợp đồng mẫu Hình 46: Khách hàng "Nguyễn Văn A", Căn hộ "A101")
                $customerA = User::firstOrCreate([
                    'email' => 'nguyenvana@gmail.com',
                ], [
                    'name' => 'Nguyễn Văn A',
                    'role_id' => 5, // Customer
                    'phone' => '0912345678',
                    'password' => bcrypt('password123'),
                    'is_active' => true,
                ]);

                $broker = User::where('role_id', 2)->first() ?? User::firstOrCreate([
                    'email' => 'broker.sample@bds.vn',
                ], [
                    'name' => 'Trần Môi Giới',
                    'role_id' => 2,
                    'phone' => '0987654321',
                    'password' => bcrypt('password123'),
                    'is_active' => true,
                ]);

                $propertyA101 = Property::firstOrCreate([
                    'code' => 'A101',
                ], [
                    'title' => 'Căn hộ chung cư cao cấp A101',
                    'image' => RepairDemoPropertyImagesSeeder::imageFor('A101'),
                    'address' => 'Phòng A101, Tầng 10, Tòa Landmark Plus, 208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP. Hồ Chí Minh',
                    'price' => 15000000,
                    'price_rent' => 15000000,
                    'deposit' => 30000000,
                    'area' => 75.5,
                    'status' => 1,
                    'purpose' => 'rent',
                ]);

                $contractDemo = Contract::firstOrCreate([
                    'contract_code' => 'SEED-HD-A101',
                ], [
                    'contract_name' => 'Hợp đồng thuê căn hộ A101 Landmark Plus',
                    'property_id' => $propertyA101->id,
                    'customer_id' => $customerA->id,
                    'broker_id' => $broker->id,
                    'start_date' => $today->copy()->subMonths(6)->toDateString(),
                    'end_date' => $today->copy()->addMonths(6)->toDateString(),
                    'rental_price' => 15000000,
                    'deposit_amount' => 30000000,
                    'currency' => 'VND',
                    'billing_cycle' => 1,
                    'next_billing_date' => $today->copy()->addMonth()->startOfMonth()->toDateString(),
                    'status' => 1, // Đang hiệu lực
                ]);

                // Lấy thêm các hợp đồng status = 1 khác trong DB để seed
                $activeContracts = Contract::where('status', 1)->where('id', '!=', $contractDemo->id)->take(4)->get();
                $seedContracts = collect([$contractDemo])->merge($activeContracts);

                // 3. SEED HÓA ĐƠN TRÌNH DIỄN HÌNH 46
                $curYearMonth = $today->format('Ym');
                $demoInvoiceNo = "QLTT-INV-{$curYearMonth}-A101-01";

                $demoInvoice = Invoice::firstOrCreate([
                    'invoice_no' => $demoInvoiceNo,
                ], [
                    'contract_id' => $contractDemo->id,
                    'issue_date' => $today->copy()->subDays(5)->toDateString(),
                    'due_date' => $today->copy()->addDays(5)->toDateString(),
                    'billing_period_start' => $today->copy()->startOfMonth()->toDateString(),
                    'billing_period_end' => $today->copy()->endOfMonth()->toDateString(),
                    'title' => 'Hóa đơn tổng hợp dịch vụ & tiền thuê tháng ' . $today->format('m/Y'),
                    'type' => InvoiceType::RENT,
                    'amount' => 16700000.00,
                    'paid_amount' => 16700000.00,
                    'paid_at' => $today->copy()->subDays(3)->setTime(14, 30),
                    'status' => InvoiceStatus::PAID,
                    'note' => '[Dữ liệu mẫu] Hóa đơn trình diễn chuẩn Hình 46',
                    'created_by' => $broker->id,
                ]);

                // 5 hạng mục đúng chuẩn Hình 46: Tổng 16.700.000 VNĐ
                $demoItems = [
                    [
                        'item_name' => 'Tiền thuê nhà',
                        'quantity' => 1.0,
                        'unit_price' => 15000000.00,
                        'total_price' => 15000000.00,
                        'description' => 'Kỳ thanh toán 01/' . $today->format('m') . ' đến ' . $today->copy()->endOfMonth()->format('d/m/Y'),
                        'sort_order' => 1,
                    ],
                    [
                        'item_name' => 'Phí dịch vụ',
                        'quantity' => 1.0,
                        'unit_price' => 800000.00,
                        'total_price' => 800000.00,
                        'description' => 'Phí quản lý vận hành tòa nhà tháng ' . $today->format('m/Y'),
                        'sort_order' => 2,
                    ],
                    [
                        'item_name' => 'Điện sinh hoạt',
                        'quantity' => 120.0,
                        'unit_price' => 3500.00,
                        'total_price' => 420000.00,
                        'description' => '120 kWh x 3.500đ/kWh',
                        'sort_order' => 3,
                    ],
                    [
                        'item_name' => 'Nước sinh hoạt',
                        'quantity' => 10.0,
                        'unit_price' => 150000.00 / 10,
                        'total_price' => 150000.00,
                        'description' => '10 m3 x 15.000đ/m3',
                        'sort_order' => 4,
                    ],
                    [
                        'item_name' => 'Internet cáp quang',
                        'quantity' => 1.0,
                        'unit_price' => 330000.00,
                        'total_price' => 330000.00,
                        'description' => 'Gói cước băng thông rộng 150Mbps',
                        'sort_order' => 5,
                    ],
                ];

                if (InvoiceItem::where('invoice_id', $demoInvoice->id)->count() === 0) {
                    foreach ($demoItems as $item) {
                        $demoInvoice->items()->create($item);
                    }
                }

                if (Schema::hasTable('transactions') && Transaction::where('invoice_id', $demoInvoice->id)->count() === 0) {
                    Transaction::create([
                        'invoice_id' => $demoInvoice->id,
                        'amount' => 16700000.00,
                        'payment_method' => PaymentMethod::BANK_TRANSFER,
                        'paid_at' => $today->copy()->subDays(3)->setTime(14, 30),
                    ]);
                }

                // 4. SEED 25+ HÓA ĐƠN KHÁC PHỦ ĐỦ 10 TÌNH HUỐNG
                $scenarioCounter = 2;
                foreach ($seedContracts as $contract) {
                    $propCode = 'PROP';
                    if ($contract->property && !empty($contract->property->code)) {
                        $propCode = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $contract->property->code));
                    }

                    // Tình huống 1: Tiền cọc (Deposit) đã thanh toán
                    $depPaidNo = "QLTT-INV-" . $today->copy()->subMonths(3)->format('Ym') . "-{$propCode}-DEP1";
                    $depPaid = Invoice::firstOrCreate([
                        'invoice_no' => $depPaidNo,
                    ], [
                        'contract_id' => $contract->id,
                        'issue_date' => $today->copy()->subMonths(3)->toDateString(),
                        'due_date' => $today->copy()->subMonths(3)->addDays(3)->toDateString(),
                        'title' => 'Tiền đặt cọc hợp đồng thuê ' . $contract->contract_code,
                        'type' => InvoiceType::DEPOSIT,
                        'amount' => 30000000.00,
                        'paid_amount' => 30000000.00,
                        'paid_at' => $today->copy()->subMonths(3)->addDays(1)->setTime(10, 0),
                        'status' => InvoiceStatus::PAID,
                        'note' => '[Dữ liệu mẫu] Tiền cọc đã thanh toán đủ',
                        'created_by' => $broker->id,
                    ]);
                    if ($depPaid->items()->count() === 0) {
                        $depPaid->items()->create([
                            'item_name' => 'Tiền đặt cọc giữ chỗ & bảo đảm hợp đồng',
                            'quantity' => 1,
                            'unit_price' => 30000000.00,
                            'total_price' => 30000000.00,
                            'description' => '2 tháng tiền nhà',
                        ]);
                    }
                    if (Schema::hasTable('transactions') && $depPaid->transactions()->count() === 0) {
                        $depPaid->transactions()->create([
                            'amount' => 30000000.00,
                            'payment_method' => PaymentMethod::BANK_TRANSFER,
                            'paid_at' => $today->copy()->subMonths(3)->addDays(1)->setTime(10, 0),
                        ]);
                    }

                    // Tình huống 2: Tiền cọc chưa thanh toán (cho chức năng Tiền cọc dùng sau)
                    $depUnpaidNo = "QLTT-INV-" . $today->copy()->format('Ym') . "-{$propCode}-DEP2";
                    $depUnpaid = Invoice::firstOrCreate([
                        'invoice_no' => $depUnpaidNo,
                    ], [
                        'contract_id' => $contract->id,
                        'issue_date' => $today->toDateString(),
                        'due_date' => $today->copy()->addDays(5)->toDateString(),
                        'title' => 'Thu bổ sung tiền cọc bảo đảm tài sản',
                        'type' => InvoiceType::DEPOSIT,
                        'amount' => 10000000.00,
                        'paid_amount' => 0.00,
                        'status' => InvoiceStatus::UNPAID,
                        'note' => '[Dữ liệu mẫu] Tiền cọc chưa thanh toán',
                        'created_by' => $broker->id,
                    ]);
                    if ($depUnpaid->items()->count() === 0) {
                        $depUnpaid->items()->create([
                            'item_name' => 'Tiền cọc bổ sung bảo đảm trang thiết bị',
                            'quantity' => 1,
                            'unit_price' => 10000000.00,
                            'total_price' => 10000000.00,
                            'description' => 'Cọc thiết bị điện tử mới',
                        ]);
                    }

                    // Tình huống 3: Rent các kỳ trước đã thanh toán đủ (Kỳ -2 tháng và -1 tháng)
                    for ($m = 2; $m >= 1; $m--) {
                        $pDate = $today->copy()->subMonths($m)->startOfMonth();
                        $ym = $pDate->format('Ym');
                        $rNo = "QLTT-INV-{$ym}-{$propCode}-" . str_pad($scenarioCounter++, 2, '0', STR_PAD_LEFT);

                        $rInv = Invoice::firstOrCreate([
                            'invoice_no' => $rNo,
                        ], [
                            'contract_id' => $contract->id,
                            'issue_date' => $pDate->toDateString(),
                            'due_date' => $pDate->copy()->addDays(7)->toDateString(),
                            'billing_period_start' => $pDate->toDateString(),
                            'billing_period_end' => $pDate->copy()->endOfMonth()->toDateString(),
                            'title' => 'Tiền thuê tháng ' . $pDate->format('m/Y') . ' - ' . $contract->contract_code,
                            'type' => InvoiceType::RENT,
                            'amount' => (float)$contract->rental_price ?: 15000000.00,
                            'paid_amount' => (float)$contract->rental_price ?: 15000000.00,
                            'paid_at' => $pDate->copy()->addDays(3)->setTime(9, 15),
                            'status' => InvoiceStatus::PAID,
                            'note' => '[Dữ liệu mẫu] Đã thanh toán đúng hạn',
                            'created_by' => $broker->id,
                        ]);

                        if ($rInv->items()->count() === 0) {
                            $rInv->items()->create([
                                'item_name' => 'Tiền thuê nhà tháng ' . $pDate->format('m/Y'),
                                'quantity' => 1,
                                'unit_price' => $rInv->amount,
                                'total_price' => $rInv->amount,
                                'description' => '1 tháng thuê',
                            ]);
                        }

                        if (Schema::hasTable('transactions') && $rInv->transactions()->count() === 0) {
                            $methods = [PaymentMethod::BANK_TRANSFER, PaymentMethod::CASH, PaymentMethod::MOMO, PaymentMethod::VNPAY];
                            $rInv->transactions()->create([
                                'amount' => $rInv->amount,
                                'payment_method' => $methods[$m % count($methods)],
                                'paid_at' => $pDate->copy()->addDays(3)->setTime(9, 15),
                            ]);
                        }
                    }

                    // Tình huống 4: Chưa thanh toán, chưa đến hạn (status 0, còn 10-20 ngày)
                    $unpaidFarNo = "QLTT-INV-{$curYearMonth}-{$propCode}-UF" . $contract->id;
                    $unpaidFar = Invoice::firstOrCreate([
                        'invoice_no' => $unpaidFarNo,
                    ], [
                        'contract_id' => $contract->id,
                        'issue_date' => $today->toDateString(),
                        'due_date' => $today->copy()->addDays(15)->toDateString(),
                        'title' => 'Phí dịch vụ & tiện ích tháng ' . $today->format('m/Y'),
                        'type' => InvoiceType::SERVICE,
                        'amount' => 1200000.00,
                        'paid_amount' => 0.00,
                        'status' => InvoiceStatus::UNPAID,
                        'note' => '[Dữ liệu mẫu] Chưa đến hạn thanh toán (còn 15 ngày)',
                        'created_by' => $broker->id,
                    ]);
                    if ($unpaidFar->items()->count() === 0) {
                        $unpaidFar->items()->create([
                            'item_name' => 'Phí bảo trì & vệ sinh chung',
                            'quantity' => 1,
                            'unit_price' => 1200000.00,
                            'total_price' => 1200000.00,
                            'description' => 'Định kỳ tháng',
                        ]);
                    }

                    // Tình huống 5: Chưa thanh toán, sắp đến hạn (status 0, còn 2 ngày)
                    $unpaidNearNo = "QLTT-INV-{$curYearMonth}-{$propCode}-UN" . $contract->id;
                    $unpaidNear = Invoice::firstOrCreate([
                        'invoice_no' => $unpaidNearNo,
                    ], [
                        'contract_id' => $contract->id,
                        'issue_date' => $today->copy()->subDays(5)->toDateString(),
                        'due_date' => $today->copy()->addDays(2)->toDateString(),
                        'title' => 'Tiền điện & nước tháng ' . $today->format('m/Y'),
                        'type' => InvoiceType::SERVICE,
                        'amount' => 850000.00,
                        'paid_amount' => 0.00,
                        'status' => InvoiceStatus::UNPAID,
                        'note' => '[Dữ liệu mẫu] Sắp đến hạn thanh toán (còn 2 ngày)',
                        'created_by' => $broker->id,
                    ]);
                    if ($unpaidNear->items()->count() === 0) {
                        $unpaidNear->items()->create([
                            'item_name' => 'Tiền điện sinh hoạt',
                            'quantity' => 150,
                            'unit_price' => 3500.00,
                            'total_price' => 525000.00,
                            'description' => '150 kWh',
                        ]);
                        $unpaidNear->items()->create([
                            'item_name' => 'Tiền nước sinh hoạt',
                            'quantity' => 20,
                            'unit_price' => 16250.00,
                            'total_price' => 325000.00,
                            'description' => '20 m3',
                        ]);
                    }

                    // Tình huống 6: Quá hạn, chưa trả gì (status 2, đã qua 10 ngày)
                    $overdueNo = "QLTT-INV-" . $today->copy()->subMonth()->format('Ym') . "-{$propCode}-OD" . $contract->id;
                    $overdue = Invoice::firstOrCreate([
                        'invoice_no' => $overdueNo,
                    ], [
                        'contract_id' => $contract->id,
                        'issue_date' => $today->copy()->subDays(25)->toDateString(),
                        'due_date' => $today->copy()->subDays(10)->toDateString(),
                        'title' => 'Khoản thu phụ phí tháng trước (Quá hạn)',
                        'type' => InvoiceType::OTHER,
                        'amount' => 500000.00,
                        'paid_amount' => 0.00,
                        'status' => InvoiceStatus::OVERDUE,
                        'note' => '[Dữ liệu mẫu] Quá hạn thanh toán 10 ngày',
                        'created_by' => $broker->id,
                    ]);
                    if ($overdue->items()->count() === 0) {
                        $overdue->items()->create([
                            'item_name' => 'Phí thay khóa cửa thông minh theo yêu cầu',
                            'quantity' => 1,
                            'unit_price' => 500000.00,
                            'total_price' => 500000.00,
                            'description' => 'Khóa vân tay mã số',
                        ]);
                    }

                    // Tình huống 7: Trả một phần (Partial paid):
                    // 7a. Còn trong hạn (status 0)
                    $partial1No = "QLTT-INV-{$curYearMonth}-{$propCode}-P1" . $contract->id;
                    $partial1 = Invoice::firstOrCreate([
                        'invoice_no' => $partial1No,
                    ], [
                        'contract_id' => $contract->id,
                        'issue_date' => $today->copy()->subDays(3)->toDateString(),
                        'due_date' => $today->copy()->addDays(7)->toDateString(),
                        'title' => 'Tiền thuê & dịch vụ tổng hợp kỳ hiện tại',
                        'type' => InvoiceType::RENT,
                        'amount' => 15000000.00,
                        'paid_amount' => 5000000.00,
                        'status' => InvoiceStatus::UNPAID,
                        'note' => '[Dữ liệu mẫu] Khách đã trả trước 5.000.000đ, còn nợ 10.000.000đ',
                        'created_by' => $broker->id,
                    ]);
                    if ($partial1->items()->count() === 0) {
                        $partial1->items()->create([
                            'item_name' => 'Tiền thuê căn hộ',
                            'quantity' => 1,
                            'unit_price' => 15000000.00,
                            'total_price' => 15000000.00,
                        ]);
                    }
                    if (Schema::hasTable('transactions') && $partial1->transactions()->count() === 0) {
                        $partial1->transactions()->create([
                            'amount' => 5000000.00,
                            'payment_method' => PaymentMethod::ZALOPAY,
                            'paid_at' => $today->copy()->subDays(1)->setTime(16, 20),
                        ]);
                    }

                    // 7b. Đã quá hạn (status 2, trả 1 phần nhưng quá hạn phần còn lại)
                    $partial2No = "QLTT-INV-" . $today->copy()->subMonth()->format('Ym') . "-{$propCode}-P2" . $contract->id;
                    $partial2 = Invoice::firstOrCreate([
                        'invoice_no' => $partial2No,
                    ], [
                        'contract_id' => $contract->id,
                        'issue_date' => $today->copy()->subDays(20)->toDateString(),
                        'due_date' => $today->copy()->subDays(5)->toDateString(),
                        'title' => 'Tiền thuê kỳ trước nợ đọng',
                        'type' => InvoiceType::RENT,
                        'amount' => 12000000.00,
                        'paid_amount' => 4000000.00,
                        'status' => InvoiceStatus::OVERDUE,
                        'note' => '[Dữ liệu mẫu] Trả 4.000.000đ, quá hạn thanh toán phần còn lại 5 ngày',
                        'created_by' => $broker->id,
                    ]);
                    if ($partial2->items()->count() === 0) {
                        $partial2->items()->create([
                            'item_name' => 'Tiền thuê phòng',
                            'quantity' => 1,
                            'unit_price' => 12000000.00,
                            'total_price' => 12000000.00,
                        ]);
                    }
                    if (Schema::hasTable('transactions') && $partial2->transactions()->count() === 0) {
                        $partial2->transactions()->create([
                            'amount' => 4000000.00,
                            'payment_method' => PaymentMethod::CASH,
                            'paid_at' => $today->copy()->subDays(10)->setTime(11, 0),
                        ]);
                    }

                    // Tình huống 8: Đã hủy (status 3, có cancel_reason, không có transaction)
                    $cancelNo = "QLTT-INV-{$curYearMonth}-{$propCode}-CAN" . $contract->id;
                    $canInv = Invoice::firstOrCreate([
                        'invoice_no' => $cancelNo,
                    ], [
                        'contract_id' => $contract->id,
                        'issue_date' => $today->copy()->subDays(10)->toDateString(),
                        'due_date' => $today->copy()->subDays(2)->toDateString(),
                        'title' => 'Hóa đơn lập nhầm thông tin dịch vụ',
                        'type' => InvoiceType::SERVICE,
                        'amount' => 2000000.00,
                        'paid_amount' => 0.00,
                        'status' => InvoiceStatus::CANCELLED,
                        'cancel_reason' => 'Nhân viên nhập sai chỉ số công tơ điện nước, lập lại hóa đơn mới theo yêu cầu khách.',
                        'note' => '[Dữ liệu mẫu] Hóa đơn đã bị hủy',
                        'created_by' => $broker->id,
                    ]);
                    if ($canInv->items()->count() === 0) {
                        $canInv->items()->create([
                            'item_name' => 'Phí dịch vụ đặc biệt (nhập nhầm)',
                            'quantity' => 1,
                            'unit_price' => 2000000.00,
                            'total_price' => 2000000.00,
                        ]);
                    }
                }

                // 5. Đồng bộ trạng thái thanh toán bằng syncPaymentStatus
                $allInvoices = Invoice::where('note', 'like', '[Dữ liệu mẫu]%')->get();
                foreach ($allInvoices as $inv) {
                    if ($inv->status !== InvoiceStatus::CANCELLED) {
                        $invoiceService->syncPaymentStatus($inv);
                    }
                }

                // 6. Cập nhật contracts.next_billing_date để cron generate-rent không tạo trùng
                foreach ($seedContracts as $c) {
                    $latestRent = Invoice::where('contract_id', $c->id)
                        ->where('type', InvoiceType::RENT)
                        ->whereNotNull('billing_period_start')
                        ->orderBy('billing_period_start', 'desc')
                        ->first();

                    if ($latestRent && $latestRent->billing_period_start) {
                        $nextDate = Carbon::parse($latestRent->billing_period_start)->addMonthsNoOverflow((int)$c->billing_cycle ?: 1);
                        $c->next_billing_date = $nextDate->toDateString();
                        $c->save();
                    }
                }

                // 7. In bảng tóm tắt Console (Spec 4.5.e)
                $status0 = Invoice::where('status', 0)->count();
                $status1 = Invoice::where('status', 1)->count();
                $status2 = Invoice::where('status', 2)->count();
                $status3 = Invoice::where('status', 3)->count();
                $totalInv = Invoice::count();
                $totalTx = Schema::hasTable('transactions') ? Transaction::count() : 0;
                $sumPaid = Invoice::sum('paid_amount');
                $sumTotal = Invoice::sum('amount');
                $sumRemaining = max(0, $sumTotal - $sumPaid);

                if ($this->command) {
                    $this->command->info('========================================================');
                    $this->command->info('        KẾT QUẢ SEED DỮ LIỆU HÓA ĐƠN MẪU (INVOICE)     ');
                    $this->command->info('========================================================');
                    $this->command->table(
                        ['Chỉ số', 'Số lượng / Giá trị'],
                        [
                            ['Tổng số hóa đơn', $totalInv],
                            ['Chưa thanh toán (Status 0)', $status0],
                            ['Đã thanh toán (Status 1)', $status1],
                            ['Quá hạn (Status 2)', $status2],
                            ['Đã hủy (Status 3)', $status3],
                            ['Tổng số giao dịch (Transactions)', $totalTx],
                            ['Tổng tiền hóa đơn', number_format($sumTotal, 0, ',', '.') . ' VNĐ'],
                            ['Tổng tiền đã thu', number_format($sumPaid, 0, ',', '.') . ' VNĐ'],
                            ['Tổng nợ còn lại', number_format($sumRemaining, 0, ',', '.') . ' VNĐ'],
                        ]
                    );
                    $this->command->info('=> Hóa đơn trình diễn Hình 46: ' . $demoInvoiceNo . ' (Tổng 16.700.000 VNĐ)');
                    $this->command->info('========================================================');
                }
            });
        });
    }
}
