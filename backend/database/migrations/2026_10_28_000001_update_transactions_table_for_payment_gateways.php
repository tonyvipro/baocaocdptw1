<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Đổi paid_at sang nullable để hỗ trợ giao dịch PENDING chờ thanh toán
        Schema::table('transactions', function (Blueprint $table) {
            $table->dateTime('paid_at')->nullable()->change();
        });

        // 2. Bổ sung các cột phục vụ cổng thanh toán và giao dịch QR
        Schema::table('transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('transactions', 'gateway')) {
                $table->string('gateway', 20)->nullable()->after('payment_method');
            }
            if (!Schema::hasColumn('transactions', 'gateway_order_id')) {
                $table->string('gateway_order_id', 100)->nullable()->after('gateway');
            }
            if (!Schema::hasColumn('transactions', 'gateway_txn_id')) {
                $table->string('gateway_txn_id', 100)->nullable()->after('gateway_order_id');
            }
            if (!Schema::hasColumn('transactions', 'qr_content')) {
                $table->text('qr_content')->nullable()->after('gateway_txn_id');
            }
            if (!Schema::hasColumn('transactions', 'pay_url')) {
                $table->string('pay_url', 500)->nullable()->after('qr_content');
            }
            if (!Schema::hasColumn('transactions', 'expires_at')) {
                $table->dateTime('expires_at')->nullable()->after('pay_url');
            }
            if (!Schema::hasColumn('transactions', 'failure_reason')) {
                $table->string('failure_reason', 255)->nullable()->after('expires_at');
            }

            // Cột ảo (Generated Virtual Column) để bảo đảm tối đa 1 giao dịch QR đang chờ mỗi hóa đơn
            if (!Schema::hasColumn('transactions', 'active_pending_invoice_id')) {
                $table->unsignedBigInteger('active_pending_invoice_id')
                    ->nullable()
                    ->virtualAs("CASE WHEN status = 0 AND source = 'gateway' THEN invoice_id ELSE NULL END")
                    ->after('failure_reason');
            }
        });

        // 2. Thêm indexes và unique constraints
        Schema::table('transactions', function (Blueprint $table) {
            $table->unique('gateway_order_id', 'transactions_gateway_order_id_unique');
            $table->unique(['gateway', 'gateway_txn_id'], 'transactions_gateway_txn_unique');
            $table->unique('active_pending_invoice_id', 'transactions_active_pending_invoice_unique');

            $table->index(['status', 'expires_at'], 'transactions_status_expires_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropUnique('transactions_gateway_order_id_unique');
            $table->dropUnique('transactions_gateway_txn_unique');
            $table->dropUnique('transactions_active_pending_invoice_unique');
            $table->dropIndex('transactions_status_expires_at_index');

            $table->dropColumn([
                'active_pending_invoice_id',
                'failure_reason',
                'expires_at',
                'pay_url',
                'qr_content',
                'gateway_txn_id',
                'gateway_order_id',
                'gateway',
            ]);
        });
    }
};
