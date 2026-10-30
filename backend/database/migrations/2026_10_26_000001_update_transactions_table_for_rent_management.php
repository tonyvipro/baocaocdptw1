<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Thêm các cột mới (tạm để nullable cho transaction_code để backfill dữ liệu cũ)
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('transaction_code', 50)->nullable()->after('id');
            $table->string('source', 20)->default('manual')->after('amount');
            $table->tinyInteger('status')->default(1)->after('source'); // 1: Thành công, 0: Chờ xử lý, 2: Thất bại, 3: Đã hoàn
            $table->string('reference_code', 100)->nullable()->after('payment_method');
            $table->text('note')->nullable()->after('reference_code');
            $table->unsignedBigInteger('recorded_by')->nullable()->after('note');
            $table->char('client_token', 36)->nullable()->after('recorded_by');
            $table->softDeletes()->after('updated_at');

            $table->foreign('recorded_by')->references('id')->on('users')->nullOnDelete();
        });

        // 2. Backfill dữ liệu cũ nếu bảng transactions đã có dữ liệu
        $existingTransactions = DB::table('transactions')->orderBy('id')->get();
        $counterByDate = [];

        foreach ($existingTransactions as $tx) {
            $dateStr = $tx->paid_at ? Carbon::parse($tx->paid_at)->format('Ymd') : Carbon::today()->format('Ymd');
            $counterByDate[$dateStr] = ($counterByDate[$dateStr] ?? 0) + 1;
            $seq = str_pad($counterByDate[$dateStr], 6, '0', STR_PAD_LEFT);
            $txCode = "TXN-{$dateStr}-{$seq}";

            DB::table('transactions')->where('id', $tx->id)->update([
                'transaction_code' => $txCode,
                'source' => 'manual',
                'status' => 1,
            ]);
        }

        // 3. Đổi transaction_code sang NOT NULL và UNIQUE, thêm indexes
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('transaction_code', 50)->nullable(false)->unique()->change();
            $table->unique('client_token', 'transactions_client_token_unique');
            $table->unique(['invoice_id', 'reference_code'], 'transactions_invoice_reference_unique');

            $table->index(['invoice_id', 'status'], 'transactions_invoice_id_status_index');
            $table->index(['paid_at'], 'transactions_paid_at_index');
            $table->index(['status', 'paid_at'], 'transactions_status_paid_at_index');
            $table->index(['invoice_id', 'amount', 'paid_at'], 'transactions_invoice_amount_paid_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['recorded_by']);
            $table->dropUnique('transactions_client_token_unique');
            $table->dropUnique('transactions_invoice_reference_unique');
            $table->dropUnique(['transaction_code']);

            $table->dropIndex('transactions_invoice_id_status_index');
            $table->dropIndex('transactions_paid_at_index');
            $table->dropIndex('transactions_status_paid_at_index');
            $table->dropIndex('transactions_invoice_amount_paid_at_index');

            $table->dropColumn([
                'transaction_code',
                'source',
                'status',
                'reference_code',
                'note',
                'recorded_by',
                'client_token',
                'deleted_at',
            ]);
        });
    }
};
