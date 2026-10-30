<?php

namespace Database\Seeders;

use App\Enums\PaymentMethod;
use App\Enums\TransactionSource;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\Contract;
use App\Models\ContractDeposit;
use App\Models\Property;
use App\Models\Transaction;
use App\Models\User;
use App\Services\DepositService;
use App\Services\InvoiceService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class DepositSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->error('KHÔNG ĐƯỢC PHÉP chạy DepositSeeder trên môi trường Production!');
            return;
        }

        // 1. Backfill toàn bộ các hợp đồng hiện có trong DB có deposit_amount > 0
        Artisan::call('deposits:backfill');

        $depositService = app(DepositService::class);
        $invoiceService = app(InvoiceService::class);
        $today = Carbon::today('Asia/Ho_Chi_Minh');

        $admin = User::where('role_id', 1)->first() ?? User::first();
        $broker = User::where('role_id', 2)->first() ?? $admin;

        // 2. Tạo 7 tình huống mẫu phủ đủ mọi trạng thái của Quản lý tiền cọc (Hình 44)
        $scenarios = [
            // (1) Chưa thu (unpaid)
            [
                'code' => 'DEP-UNPAID-101',
                'title' => 'P.101 Tòa Aqua 1 Vinhomes Golden River',
                'address' => 'Số 2 Tôn Đức Thắng, Phường Bến Nghé, Quận 1, TP.HCM',
                'customer_name' => 'Trần Minh Quân',
                'customer_email' => 'quan.tran.deposit@gmail.com',
                'customer_phone' => '0911222333',
                'rental_price' => 18000000,
                'deposit_amount' => 36000000,
                'start_date' => $today->copy()->subDays(2)->toDateString(),
                'end_date' => $today->copy()->addMonths(12)->toDateString(),
                'contract_status' => 1,
                'movements' => [],
                'notes' => '[Dữ liệu mẫu] Khoản cọc mới tạo hợp đồng, chờ khách chuyển khoản cọc.',
            ],
            // (2) Thu một phần (partial_collected)
            [
                'code' => 'DEP-PARTCOL-202',
                'title' => 'P.202 Tháp T2 Estella Heights',
                'address' => '88 Song Hành, Phường An Phú, TP. Thủ Đức, TP.HCM',
                'customer_name' => 'Lê Hoàng Yến',
                'customer_email' => 'yen.le.deposit@gmail.com',
                'customer_phone' => '0912333444',
                'rental_price' => 20000000,
                'deposit_amount' => 40000000,
                'start_date' => $today->copy()->subDays(10)->toDateString(),
                'end_date' => $today->copy()->addMonths(11)->toDateString(),
                'contract_status' => 1,
                'movements' => [
                    [
                        'type' => TransactionType::PAYMENT,
                        'amount' => 20000000,
                        'method' => PaymentMethod::BANK_TRANSFER,
                        'days_ago' => 9,
                        'ref' => 'DEP-SEED-PC01',
                        'note' => 'Khách đặt cọc trước đợt 1 (50%), hẹn ngày nhận bàn giao đóng đủ 20tr còn lại.',
                    ],
                ],
                'notes' => '[Dữ liệu mẫu] Đã thu 20.000.000 VNĐ / 40.000.000 VNĐ (Thu một phần).',
            ],
            // (3) Đang giữ (holding) - Đã thu đủ, HĐ đang hiệu lực
            [
                'code' => 'DEP-HOLD-305',
                'title' => 'P.305 Tòa Linden Empire City Thủ Thiêm',
                'address' => 'Khu đô thị mới Thủ Thiêm, TP. Thủ Đức, TP.HCM',
                'customer_name' => 'Nguyễn Bảo Châu',
                'customer_email' => 'chau.nguyen.deposit@gmail.com',
                'customer_phone' => '0913444555',
                'rental_price' => 25000000,
                'deposit_amount' => 50000000,
                'start_date' => $today->copy()->subMonths(4)->toDateString(),
                'end_date' => $today->copy()->addMonths(8)->toDateString(),
                'contract_status' => 1,
                'movements' => [
                    [
                        'type' => TransactionType::PAYMENT,
                        'amount' => 50000000,
                        'method' => PaymentMethod::BANK_TRANSFER,
                        'days_ago' => 120,
                        'ref' => 'DEP-SEED-HD01',
                        'note' => 'Chuyển khoản đủ 2 tháng tiền cọc khi ký hợp đồng.',
                    ],
                ],
                'notes' => '[Dữ liệu mẫu] Đang giữ đủ 50.000.000 VNĐ trong thời hạn thuê.',
            ],
            // (4) Cần hoàn trả (refund_due) - HĐ đã hết hạn / thanh lý, chưa hoàn trả
            [
                'code' => 'DEP-DUE-408',
                'title' => 'P.408 Tòa Jasmine 2 Hà Đô Centrosa',
                'address' => '200 Đường 3 Tháng 2, Phường 12, Quận 10, TP.HCM',
                'customer_name' => 'Phạm Đình Khôi',
                'customer_email' => 'khoi.pham.deposit@gmail.com',
                'customer_phone' => '0914555666',
                'rental_price' => 16000000,
                'deposit_amount' => 32000000,
                'start_date' => $today->copy()->subMonths(12)->toDateString(),
                'end_date' => $today->copy()->subDays(3)->toDateString(),
                'contract_status' => 2, // Hết hạn - Thanh lý
                'movements' => [
                    [
                        'type' => TransactionType::PAYMENT,
                        'amount' => 32000000,
                        'method' => PaymentMethod::BANK_TRANSFER,
                        'days_ago' => 365,
                        'ref' => 'DEP-SEED-DUE01',
                        'note' => 'Thu đủ tiền cọc đầu kỳ.',
                    ],
                ],
                'notes' => '[Dữ liệu mẫu] Hợp đồng đã kết thúc, cần kiểm tra biên bản bàn giao để hoàn trả 32.000.000 VNĐ.',
            ],
            // (5) Hoàn một phần (partial_refunded) - Đã hoàn 1 phần & khấu trừ 1 phần, còn giữ lại chờ đối soát
            [
                'code' => 'DEP-PARTREF-510',
                'title' => 'P.510 Tòa T5 Masteri Thảo Điền',
                'address' => '159 Xa lộ Hà Nội, Phường Thảo Điền, TP. Thủ Đức, TP.HCM',
                'customer_name' => 'Vũ Thanh Hằng',
                'customer_email' => 'hang.vu.deposit@gmail.com',
                'customer_phone' => '0915666777',
                'rental_price' => 15000000,
                'deposit_amount' => 30000000,
                'start_date' => $today->copy()->subMonths(12)->toDateString(),
                'end_date' => $today->copy()->subDays(5)->toDateString(),
                'contract_status' => 2,
                'movements' => [
                    [
                        'type' => TransactionType::PAYMENT,
                        'amount' => 30000000,
                        'method' => PaymentMethod::BANK_TRANSFER,
                        'days_ago' => 360,
                        'ref' => 'DEP-SEED-PR01',
                        'note' => 'Thu đủ tiền cọc 30 triệu.',
                    ],
                    [
                        'type' => TransactionType::DEPOSIT_DEDUCTION,
                        'amount' => 3000000,
                        'method' => PaymentMethod::BANK_TRANSFER,
                        'days_ago' => 2,
                        'ref' => null,
                        'reason' => 'Khấu trừ chi phí vệ sinh công nghiệp và sửa điều hòa phòng ngủ.',
                        'note' => 'Biên bản bàn giao ngày ' . $today->copy()->subDays(2)->format('d/m/Y'),
                    ],
                    [
                        'type' => TransactionType::DEPOSIT_REFUND,
                        'amount' => 20000000,
                        'method' => PaymentMethod::BANK_TRANSFER,
                        'days_ago' => 2,
                        'ref' => 'DEP-SEED-PR02',
                        'note' => 'Hoàn trả đợt 1 số tiền 20.000.000 VNĐ, giữ lại 7.000.000 VNĐ chờ chốt hóa đơn điện nước kỳ cuối.',
                    ],
                ],
                'notes' => '[Dữ liệu mẫu] Đã hoàn 20tr, khấu trừ 3tr, đang giữ 7tr chờ chốt phí dịch vụ cuối kỳ.',
            ],
            // (6) Đã hoàn trả (refunded) - Hoàn trả 100%
            [
                'code' => 'DEP-REFUNDED-612',
                'title' => 'P.612 Saigon Pearl Ruby 1',
                'address' => '92 Nguyễn Hữu Cảnh, Phường 22, Quận Bình Thạnh, TP.HCM',
                'customer_name' => 'Đặng Quốc Khánh',
                'customer_email' => 'khanh.dang.deposit@gmail.com',
                'customer_phone' => '0916777888',
                'rental_price' => 14000000,
                'deposit_amount' => 28000000,
                'start_date' => $today->copy()->subMonths(14)->toDateString(),
                'end_date' => $today->copy()->subMonths(2)->toDateString(),
                'contract_status' => 2,
                'movements' => [
                    [
                        'type' => TransactionType::PAYMENT,
                        'amount' => 28000000,
                        'method' => PaymentMethod::BANK_TRANSFER,
                        'days_ago' => 420,
                        'ref' => 'DEP-SEED-RF01',
                        'note' => 'Thu đủ tiền cọc khi ký hợp đồng.',
                    ],
                    [
                        'type' => TransactionType::DEPOSIT_REFUND,
                        'amount' => 28000000,
                        'method' => PaymentMethod::BANK_TRANSFER,
                        'days_ago' => 55,
                        'ref' => 'DEP-SEED-RF02',
                        'note' => 'Hoàn trả 100% tiền cọc sau khi thanh lý hợp đồng, bàn giao căn hộ nguyên trạng tốt.',
                    ],
                ],
                'notes' => '[Dữ liệu mẫu] Đã hoàn trả đầy đủ 28.000.000 VNĐ cho khách thuê.',
            ],
            // (7) Đã khấu trừ toàn bộ (deducted)
            [
                'code' => 'DEP-DEDUCTED-701',
                'title' => 'P.701 Lexington Residence An Phú',
                'address' => '67 Mai Chí Thọ, Phường An Phú, TP. Thủ Đức, TP.HCM',
                'customer_name' => 'Hồ Minh Triết',
                'customer_email' => 'triet.ho.deposit@gmail.com',
                'customer_phone' => '0917888999',
                'rental_price' => 12000000,
                'deposit_amount' => 24000000,
                'start_date' => $today->copy()->subMonths(5)->toDateString(),
                'end_date' => $today->copy()->addMonths(7)->toDateString(),
                'contract_status' => 3, // Chấm dứt / Hủy trước hạn do vi phạm
                'movements' => [
                    [
                        'type' => TransactionType::PAYMENT,
                        'amount' => 24000000,
                        'method' => PaymentMethod::CASH,
                        'days_ago' => 150,
                        'ref' => 'DEP-SEED-DD01',
                        'note' => 'Thu tiền cọc tiền mặt.',
                    ],
                    [
                        'type' => TransactionType::DEPOSIT_DEDUCTION,
                        'amount' => 24000000,
                        'method' => PaymentMethod::CASH,
                        'days_ago' => 10,
                        'ref' => null,
                        'reason' => 'Khấu trừ 100% tiền cọc do bên thuê đơn phương chấm dứt hợp đồng trước hạn không báo trước theo Điều 8 Hợp đồng.',
                        'note' => 'Quyết toán chấm dứt hợp đồng trước hạn.',
                    ],
                ],
                'notes' => '[Dữ liệu mẫu] Đã khấu trừ toàn bộ 24.000.000 VNĐ theo điều khoản phạt hủy hợp đồng trước hạn.',
            ],
        ];

        DB::transaction(function () use ($scenarios, $broker, $admin, $today, $depositService, $invoiceService) {
            foreach ($scenarios as $sc) {
                $customer = User::firstOrCreate(
                    ['email' => $sc['customer_email']],
                    [
                        'name' => $sc['customer_name'],
                        'phone' => $sc['customer_phone'],
                        'role_id' => 5,
                        'password' => bcrypt('password123'),
                        'is_active' => true,
                    ]
                );

                $property = Property::firstOrCreate(
                    ['code' => $sc['code']],
                    [
                        'title' => $sc['title'],
                        'address' => $sc['address'],
                        'price' => $sc['rental_price'],
                        'price_rent' => $sc['rental_price'],
                        'deposit' => $sc['deposit_amount'],
                        'area' => 72.0,
                        'status' => $sc['contract_status'] === 1 ? 2 : 1,
                        'purpose' => 'rent',
                    ]
                );

                $contractCode = 'SEED-' . $sc['code'];
                $contract = Contract::updateOrCreate(
                    ['contract_code' => $contractCode],
                    [
                        'contract_name' => 'Hợp đồng thuê ' . $sc['title'],
                        'property_id' => $property->id,
                        'customer_id' => $customer->id,
                        'broker_id' => $broker->id,
                        'start_date' => $sc['start_date'],
                        'end_date' => $sc['end_date'],
                        'rental_price' => $sc['rental_price'],
                        'deposit_amount' => $sc['deposit_amount'],
                        'currency' => 'VND',
                        'billing_cycle' => 1,
                        'status' => $sc['contract_status'],
                    ]
                );

                $deposit = $depositService->ensureDepositForContract($contract, $broker->id);
                if (!$deposit) {
                    continue;
                }

                $deposit->notes = $sc['notes'];
                $deposit->refund_due_date = $sc['end_date'];
                $deposit->save();

                foreach ($sc['movements'] as $idx => $mv) {
                    $txCode = 'SEED-TX-' . $sc['code'] . '-0' . ($idx + 1);
                    $paidAt = $today->copy()->subDays($mv['days_ago'])->setTime(10, 15, 0);

                    Transaction::updateOrCreate(
                        ['transaction_code' => $txCode],
                        [
                            'invoice_id' => $deposit->invoice_id,
                            'type' => $mv['type'],
                            'amount' => $mv['amount'],
                            'source' => TransactionSource::MANUAL,
                            'status' => TransactionStatus::SUCCESS,
                            'payment_method' => $mv['method'],
                            'reference_code' => $mv['ref'] ?? null,
                            'paid_at' => $paidAt,
                            'note' => $mv['note'] ?? null,
                            'reason' => $mv['reason'] ?? null,
                            'recorded_by' => $admin->id,
                            'client_token' => substr(md5($txCode), 0, 36),
                        ]
                    );
                }

                if ($deposit->invoice) {
                    $invoiceService->syncPaymentStatus($deposit->invoice->fresh());
                }
            }
        });

        $this->command?->info('Đã seed thành công dữ liệu Quản lý tiền cọc (DepositSeeder) phủ đủ mọi trạng thái!');
    }
}

