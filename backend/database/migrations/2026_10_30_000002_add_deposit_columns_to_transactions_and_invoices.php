<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Thêm cột type và reason vào bảng transactions
        Schema::table('transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('transactions', 'type')) {
                $table->string('type', 20)->default('payment')->after('invoice_id');
            }
            if (!Schema::hasColumn('transactions', 'reason')) {
                $table->string('reason', 500)->nullable()->after('note');
            }
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->index(['invoice_id', 'type', 'status'], 'transactions_invoice_type_status_idx');
        });

        // 2. Xử lý các hóa đơn deposit trùng trên cùng 1 hợp đồng (nếu dữ liệu seed cũ tạo > 1 hóa đơn deposit)
        // Giữ lại hóa đơn deposit đã thanh toán nhiều nhất hoặc tạo sớm nhất, hủy các hóa đơn deposit phụ chưa thanh toán
        $duplicateContractIds = DB::table('invoices')
            ->select('contract_id')
            ->where('type', 'deposit')
            ->where('status', '!=', 3)
            ->whereNull('deleted_at')
            ->groupBy('contract_id')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('contract_id');

        foreach ($duplicateContractIds as $contractId) {
            $depositInvoices = DB::table('invoices')
                ->where('contract_id', $contractId)
                ->where('type', 'deposit')
                ->where('status', '!=', 3)
                ->whereNull('deleted_at')
                ->orderByDesc('paid_amount')
                ->orderBy('id', 'asc')
                ->get();

            $keepFirst = true;
            foreach ($depositInvoices as $inv) {
                if ($keepFirst) {
                    $keepFirst = false;
                    continue;
                }
                DB::table('invoices')
                    ->where('id', $inv->id)
                    ->update([
                        'status' => 3,
                        'cancel_reason' => 'Tự động hủy hóa đơn cọc phụ để chuẩn hóa 1 tài khoản cọc duy nhất mỗi hợp đồng.',
                    ]);
            }
        }

        // 3. Thêm cột ảo deposit_contract_id + UNIQUE trên invoices để đảm bảo mỗi hợp đồng chỉ có tối đa 1 hóa đơn deposit hoạt động
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'deposit_contract_id')) {
                $table->unsignedBigInteger('deposit_contract_id')
                    ->nullable()
                    ->virtualAs("CASE WHEN type = 'deposit' AND status != 3 AND deleted_at IS NULL THEN contract_id ELSE NULL END")
                    ->after('contract_id');
            }
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->unique('deposit_contract_id', 'invoices_one_active_deposit_per_contract');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropUnique('invoices_one_active_deposit_per_contract');
            if (Schema::hasColumn('invoices', 'deposit_contract_id')) {
                $table->dropColumn('deposit_contract_id');
            }
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('transactions_invoice_type_status_idx');
            $cols = [];
            if (Schema::hasColumn('transactions', 'reason')) {
                $cols[] = 'reason';
            }
            if (Schema::hasColumn('transactions', 'type')) {
                $cols[] = 'type';
            }
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};

