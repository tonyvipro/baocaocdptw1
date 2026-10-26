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
use App\Enums\InvoiceType;
use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Enums\TransactionStatus;
use App\Enums\TransactionSource;
use App\Services\InvoiceService;
use Carbon\Carbon;

class RentDemoSeeder extends Seeder
{
    /**
     * Run the database seeds for Rent Management Demo.
     * Chạy: php artisan db:seed --class=RentDemoSeeder
     */
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command->error('KHÔNG ĐƯỢC PHÉP chạy RentDemoSeeder trên môi trường Production!');
            return;
        }

        $invoiceService = app(InvoiceService::class);
        $today = Carbon::today();
        $startOfMonth = $today->copy()->startOfMonth()->toDateString();
        $endOfMonth = $today->copy()->endOfMonth()->toDateString();
        $curYearMonth = $today->format('Ym');
        $monthLabel = $today->format('m/Y');

        $this->command->info("Đang tạo dữ liệu mẫu Quản lý tiền thuê cho kỳ: {$monthLabel}...");

        // 1. Môi giới phụ trách
        $broker = User::where('role_id', 2)->first() ?? User::firstOrCreate([
            'email' => 'broker.sample@bds.vn',
        ], [
            'name' => 'Trần Môi Giới',
            'role_id' => 2,
            'phone' => '0987654321',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);

        // 2. Định nghĩa 10 căn hộ mẫu độc lập
        $sampleUnits = [
            // 1. PAID (Thanh toán đủ 1 lần)
            [
                'code' => 'LM81-402',
                'title' => 'P.402 Tòa Landmark 81',
                'address' => 'Tòa Landmark 81, Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, P.22, Bình Thạnh',
                'customer_name' => 'Nguyễn Văn Hùng',
                'customer_email' => 'hung.nguyen.demo@gmail.com',
                'customer_phone' => '0901111222',
                'amount' => 25000000,
                'due_date' => $today->copy()->subDays(2)->toDateString(),
                'type_scenario' => 'paid',
                'payments' => [
                    ['amount' => 25000000, 'method' => PaymentMethod::BANK_TRANSFER, 'days_ago' => 3, 'note' => '[Dữ liệu mẫu] Chuyển khoản Vietcombank đủ tiền thuê tháng']
                ]
            ],
            // 2. PAID (Thanh toán đủ 2 lần)
            [
                'code' => 'VHCP-1205',
                'title' => 'P.1205 Vinhomes Central Park',
                'address' => 'Tòa Park 5, Vinhomes Central Park, Bình Thạnh, TP.HCM',
                'customer_name' => 'Lê Thị Thu',
                'customer_email' => 'thu.le.demo@gmail.com',
                'customer_phone' => '0902222333',
                'amount' => 18000000,
                'due_date' => $today->copy()->subDays(4)->toDateString(),
                'type_scenario' => 'paid',
                'payments' => [
                    ['amount' => 10000000, 'method' => PaymentMethod::BANK_TRANSFER, 'days_ago' => 5, 'note' => '[Dữ liệu mẫu] Chuyển khoản đợt 1'],
                    ['amount' => 8000000, 'method' => PaymentMethod::CASH, 'days_ago' => 4, 'note' => '[Dữ liệu mẫu] Tiền mặt đợt 2 thanh toán đủ']
                ]
            ],
            // 3. OVERDUE (Quá hạn, chưa trả đồng nào)
            [
                'code' => 'MTD-A108',
                'title' => 'Căn A1-08 Masteri Thảo Điền',
                'address' => 'Tháp T1, Masteri Thảo Điền, 159 Xa lộ Hà Nội, Thảo Điền, TP. Thủ Đức',
                'customer_name' => 'Phạm Quốc Dũng',
                'customer_email' => 'dung.pham.demo@gmail.com',
                'customer_phone' => '0903333444',
                'amount' => 16000000,
                'due_date' => $today->copy()->subDays(8)->toDateString(),
                'type_scenario' => 'overdue',
                'payments' => []
            ],
            // 4. OVERDUE (Quá hạn, đã trả 1 phần)
            [
                'code' => 'SRC-704',
                'title' => 'P.704 Sunrise City Quận 7',
                'address' => 'Tháp V3, Sunrise City, 23 Nguyễn Hữu Thọ, Tân Hưng, Quận 7',
                'customer_name' => 'Đỗ Minh Tuấn',
                'customer_email' => 'tuan.do.demo@gmail.com',
                'customer_phone' => '0904444555',
                'amount' => 20000000,
                'due_date' => $today->copy()->subDays(6)->toDateString(),
                'type_scenario' => 'overdue_partial',
                'payments' => [
                    ['amount' => 5000000, 'method' => PaymentMethod::BANK_TRANSFER, 'days_ago' => 7, 'note' => '[Dữ liệu mẫu] Chuyển tạm 5 triệu']
                ]
            ],
            // 5. PARTIAL (Trả 1 phần, chưa quá hạn)
            [
                'code' => 'MAP-1802',
                'title' => 'P.1802 Masteri An Phú',
                'address' => '179 Xa lộ Hà Nội, An Phú, TP. Thủ Đức, TP.HCM',
                'customer_name' => 'Hoàng Gia Bảo',
                'customer_email' => 'bao.hoang.demo@gmail.com',
                'customer_phone' => '0905555666',
                'amount' => 14000000,
                'due_date' => $today->copy()->addDays(7)->toDateString(),
                'type_scenario' => 'partial',
                'payments' => [
                    ['amount' => 6000000, 'method' => PaymentMethod::BANK_TRANSFER, 'days_ago' => 1, 'note' => '[Dữ liệu mẫu] Đã thanh toán tạm 6 triệu, hẹn ngày 25 trả nốt']
                ]
            ],
            // 6. PARTIAL (Trả 1 phần, chưa quá hạn)
            [
                'code' => 'BTP-303',
                'title' => 'P.303 Botanica Premier',
                'address' => '108 Hồng Hà, Phường 2, Tân Bình, TP.HCM',
                'customer_name' => 'Võ Thùy Linh',
                'customer_email' => 'linh.vo.demo@gmail.com',
                'customer_phone' => '0906666777',
                'amount' => 12500000,
                'due_date' => $today->copy()->addDays(5)->toDateString(),
                'type_scenario' => 'partial',
                'payments' => [
                    ['amount' => 5000000, 'method' => PaymentMethod::CASH, 'days_ago' => 2, 'note' => '[Dữ liệu mẫu] Nộp tiền mặt tại văn phòng 5 triệu']
                ]
            ],
            // 7. UNPAID (Chưa đến hạn, nợ 100%)
            [
                'code' => 'TSA-901',
                'title' => 'P.901 The Sun Avenue',
                'address' => '28 Mai Chí Thọ, An Phú, TP. Thủ Đức, TP.HCM',
                'customer_name' => 'Bùi Anh Quân',
                'customer_email' => 'quan.bui.demo@gmail.com',
                'customer_phone' => '0907777888',
                'amount' => 13000000,
                'due_date' => $today->copy()->addDays(6)->toDateString(),
                'type_scenario' => 'unpaid',
                'payments' => []
            ],
            // 8. UNPAID (Chưa đến hạn, nợ 100%)
            [
                'code' => 'FEV-1508',
                'title' => 'P.1508 Feliz En Vista',
                'address' => '01 Phan Văn Đáng, Thạnh Mỹ Lợi, TP. Thủ Đức, TP.HCM',
                'customer_name' => 'Trần Mai Phương',
                'customer_email' => 'phuong.tran.demo@gmail.com',
                'customer_phone' => '0908888999',
                'amount' => 22000000,
                'due_date' => $today->copy()->addDays(10)->toDateString(),
                'type_scenario' => 'unpaid',
                'payments' => []
            ],
            // 9. UNPAID (Chưa đến hạn, nợ 100%)
            [
                'code' => 'GV-502',
                'title' => 'P.502 The Gold View',
                'address' => '346 Bến Vân Đồn, Phường 1, Quận 4, TP.HCM',
                'customer_name' => 'Ngô Trí Đức',
                'customer_email' => 'duc.ngo.demo@gmail.com',
                'customer_phone' => '0909999000',
                'amount' => 11000000,
                'due_date' => $today->copy()->addDays(12)->toDateString(),
                'type_scenario' => 'unpaid',
                'payments' => []
            ],
            // 10. PAID (Thanh toán chuyển khoản đủ)
            [
                'code' => 'GWT-1102',
                'title' => 'P.1102 Gateway Thảo Điền',
                'address' => '02 Lê Thước, Thảo Điền, TP. Thủ Đức, TP.HCM',
                'customer_name' => 'Đặng Khánh Ly',
                'customer_email' => 'ly.dang.demo@gmail.com',
                'customer_phone' => '0910000111',
                'amount' => 30000000,
                'due_date' => $today->copy()->subDays(1)->toDateString(),
                'type_scenario' => 'paid',
                'payments' => [
                    ['amount' => 30000000, 'method' => PaymentMethod::BANK_TRANSFER, 'days_ago' => 2, 'note' => '[Dữ liệu mẫu] Chuyển khoản đủ tiền thuê']
                ]
            ],
        ];

        $tableData = [];

        Invoice::withoutEvents(function () use ($sampleUnits, $broker, $today, $startOfMonth, $endOfMonth, $curYearMonth, $monthLabel, $invoiceService, &$tableData) {
            DB::transaction(function () use ($sampleUnits, $broker, $today, $startOfMonth, $endOfMonth, $curYearMonth, $monthLabel, $invoiceService, &$tableData) {
                foreach ($sampleUnits as $unit) {
                    // 1. Tạo hoặc cập nhật khách hàng
                    $customer = User::firstOrCreate([
                        'email' => $unit['customer_email'],
                    ], [
                        'name' => $unit['customer_name'],
                        'role_id' => 5, // Customer
                        'phone' => $unit['customer_phone'],
                        'password' => bcrypt('password123'),
                        'is_active' => true,
                    ]);

                    // 2. Tạo hoặc cập nhật căn hộ BĐS
                    $property = Property::firstOrCreate([
                        'code' => $unit['code'],
                    ], [
                        'title' => $unit['title'],
                        'address' => $unit['address'],
                        'price' => $unit['amount'],
                        'price_rent' => $unit['amount'],
                        'deposit' => $unit['amount'] * 2,
                        'area' => 75.0,
                        'status' => 1,
                        'purpose' => 'rent',
                    ]);

                    // 3. Tạo hợp đồng mẫu
                    $contractCode = "SEED-RENT-{$unit['code']}";
                    $contract = Contract::firstOrCreate([
                        'contract_code' => $contractCode,
                    ], [
                        'contract_name' => "Hợp đồng thuê căn hộ {$unit['title']}",
                        'property_id' => $property->id,
                        'customer_id' => $customer->id,
                        'broker_id' => $broker->id,
                        'start_date' => $today->copy()->subMonths(3)->toDateString(),
                        'end_date' => $today->copy()->addMonths(9)->toDateString(),
                        'rental_price' => $unit['amount'],
                        'deposit_amount' => $unit['amount'] * 2,
                        'currency' => 'VND',
                        'billing_cycle' => 1,
                        'next_billing_date' => $today->copy()->addMonth()->startOfMonth()->toDateString(),
                        'status' => 1,
                    ]);

                    // 4. Tạo hoặc cập nhật hóa đơn tiền thuê trong tháng hiện tại
                    $invoiceNo = "SEED-INV-{$curYearMonth}-{$unit['code']}";
                    $invoice = Invoice::firstOrCreate([
                        'invoice_no' => $invoiceNo,
                    ], [
                        'contract_id' => $contract->id,
                        'created_by' => $broker->id,
                        'updated_by' => $broker->id,
                        'type' => InvoiceType::RENT,
                        'title' => "Tiền thuê nhà tháng {$monthLabel} - {$unit['title']}",
                        'amount' => $unit['amount'],
                        'paid_amount' => 0,
                        'issue_date' => $startOfMonth,
                        'due_date' => $unit['due_date'],
                        'billing_period_start' => $startOfMonth,
                        'billing_period_end' => $endOfMonth,
                        'status' => InvoiceStatus::UNPAID,
                        'version' => 1,
                    ]);

                    // Item chi tiết hóa đơn
                    InvoiceItem::firstOrCreate([
                        'invoice_id' => $invoice->id,
                        'item_name' => "Tiền thuê nhà kỳ {$monthLabel}",
                    ], [
                        'quantity' => 1,
                        'unit_price' => $unit['amount'],
                        'total_price' => $unit['amount'],
                        'description' => "Tiền thuê nhà kỳ {$monthLabel} - {$unit['title']}",
                        'sort_order' => 1,
                    ]);

                    // 5. Tạo các giao dịch thanh toán mẫu
                    foreach ($unit['payments'] as $idx => $pm) {
                        $txSeq = str_pad($idx + 1, 2, '0', STR_PAD_LEFT);
                        $txCode = "SEED-TXN-{$curYearMonth}-{$unit['code']}-{$txSeq}";
                        $paidAt = $today->copy()->subDays($pm['days_ago'])->toDateTimeString();

                        Transaction::firstOrCreate([
                            'transaction_code' => $txCode,
                        ], [
                            'invoice_id' => $invoice->id,
                            'amount' => $pm['amount'],
                            'payment_method' => $pm['method'],
                            'source' => TransactionSource::MANUAL,
                            'status' => TransactionStatus::SUCCESS,
                            'paid_at' => $paidAt,
                            'note' => $pm['note'],
                            'recorded_by' => $broker->id,
                            'client_token' => md5("seed-token-{$txCode}"),
                        ]);
                    }

                    // Đồng bộ trạng thái hóa đơn dựa trên các giao dịch thực tế
                    $invoiceService->syncPaymentStatus($invoice);
                    $invoice->refresh();

                    // Xác định display_status
                    $dispStatus = 'unpaid';
                    $isOverdue = Carbon::parse($invoice->due_date)->isPast() && !Carbon::parse($invoice->due_date)->isToday();
                    if ($invoice->paid_amount >= $invoice->amount) {
                        $dispStatus = 'Đã thanh toán (paid)';
                    } elseif ($invoice->paid_amount > 0 && $isOverdue) {
                        $dispStatus = 'Quá hạn (overdue - 1 phần)';
                    } elseif ($invoice->paid_amount > 0) {
                        $dispStatus = 'Trả 1 phần (partial)';
                    } elseif ($isOverdue) {
                        $dispStatus = 'Quá hạn (overdue - chưa trả)';
                    } else {
                        $dispStatus = 'Chưa đến hạn (unpaid)';
                    }

                    $remaining = max(0, $invoice->amount - $invoice->paid_amount);

                    $tableData[] = [
                        $contract->contract_code,
                        $unit['title'],
                        $customer->name,
                        $monthLabel,
                        number_format($invoice->amount) . ' đ',
                        number_format($invoice->paid_amount) . ' đ',
                        number_format($remaining) . ' đ',
                        $dispStatus,
                    ];
                }
            });
        });

        $this->command->newLine();
        $this->command->info("=== KẾT QUẢ TẠO DỮ LIỆU MẪU QUẢN LÝ TIỀN THUÊ ({$monthLabel}) ===");
        $this->command->table(
            ['Mã HĐ', 'Căn hộ', 'Người thuê', 'Kỳ hạn', 'Tổng tiền', 'Đã thu', 'Còn lại', 'Trạng thái'],
            $tableData
        );
        $this->command->info("Đã seed thành công 10 căn hộ mẫu với đầy đủ 4 nhóm trạng thái!");
    }
}
