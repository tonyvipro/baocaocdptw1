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
        // 1. Thêm các cột mới (tạm để nullable cho invoice_no và issue_date để backfill dữ liệu cũ)
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('invoice_no', 50)->nullable()->after('id');
            $table->date('issue_date')->nullable()->after('contract_id');
            $table->date('billing_period_start')->nullable()->after('due_date');
            $table->date('billing_period_end')->nullable()->after('billing_period_start');
            $table->text('note')->nullable()->after('status');
            $table->text('cancel_reason')->nullable()->after('note');
            $table->decimal('paid_amount', 15, 2)->default(0.00)->after('amount');
            $table->dateTime('paid_at')->nullable()->after('paid_amount');
            $table->dateTime('email_sent_at')->nullable()->after('paid_at');
            $table->unsignedBigInteger('created_by')->nullable()->after('email_sent_at');
            $table->softDeletes()->after('updated_at');

            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });

        // 2. Backfill dữ liệu cũ (nếu có hóa đơn tồn tại trong DB)
        $existingInvoices = DB::table('invoices')->orderBy('id')->get();
        $counterByContractAndMonth = [];

        foreach ($existingInvoices as $inv) {
            $issueDate = $inv->created_at ? Carbon::parse($inv->created_at)->toDateString() : Carbon::today()->toDateString();
            $yearMonth = Carbon::parse($issueDate)->format('Ym');

            // Lấy mã căn hộ
            $propertyCode = 'PROP';
            $contract = DB::table('contracts')->where('id', $inv->contract_id)->first();
            if ($contract && $contract->property_id) {
                $prop = DB::table('properties')->where('id', $contract->property_id)->first();
                if ($prop && !empty($prop->code)) {
                    $cleanedCode = preg_replace('/[^A-Za-z0-9]/', '', $prop->code);
                    $propertyCode = !empty($cleanedCode) ? strtoupper($cleanedCode) : 'P' . $prop->id;
                } elseif ($prop) {
                    $propertyCode = 'P' . $prop->id;
                }
            }

            $key = $inv->contract_id . '_' . $yearMonth;
            $counterByContractAndMonth[$key] = ($counterByContractAndMonth[$key] ?? 0) + 1;
            $seq = str_pad($counterByContractAndMonth[$key], 2, '0', STR_PAD_LEFT);

            $invoiceNo = "QLTT-INV-{$yearMonth}-{$propertyCode}-{$seq}";
            
            // Đảm bảo không trùng nếu lặp
            $checkNo = $invoiceNo;
            $duplicateCount = 1;
            while (DB::table('invoices')->where('invoice_no', $checkNo)->exists()) {
                $checkNo = "QLTT-INV-{$yearMonth}-{$propertyCode}-" . str_pad($counterByContractAndMonth[$key] + $duplicateCount, 2, '0', STR_PAD_LEFT);
                $duplicateCount++;
            }

            // Đồng bộ paid_amount nếu status = 1
            $paidAmount = 0.00;
            $paidAt = null;
            if ($inv->status == 1) {
                $paidAmount = $inv->amount;
                $paidAt = $inv->updated_at ?? now();
            }

            DB::table('invoices')->where('id', $inv->id)->update([
                'invoice_no' => $checkNo,
                'issue_date' => $issueDate,
                'paid_amount' => $paidAmount,
                'paid_at' => $paidAt,
            ]);
        }

        // 3. Đổi các cột sang NOT NULL và thêm Indexes + Unique constraints
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('invoice_no', 50)->nullable(false)->unique()->change();
            $table->date('issue_date')->nullable(false)->change();

            // Ràng buộc duy nhất (contract_id, type, billing_period_start) cho hóa đơn theo kỳ
            $table->unique(['contract_id', 'type', 'billing_period_start'], 'invoices_contract_type_period_unique');

            // Indexes phục vụ tìm kiếm & cron
            $table->index(['contract_id', 'status'], 'invoices_contract_id_status_index');
            $table->index(['status', 'due_date'], 'invoices_status_due_date_index');
            $table->index(['contract_id', 'issue_date'], 'invoices_contract_id_issue_date_index');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Drop foreign keys & unique & indexes
            $table->dropForeign(['created_by']);
            $table->dropUnique('invoices_contract_type_period_unique');
            $table->dropUnique(['invoice_no']);
            $table->dropIndex('invoices_contract_id_status_index');
            $table->dropIndex('invoices_status_due_date_index');
            $table->dropIndex('invoices_contract_id_issue_date_index');

            // Drop columns
            $table->dropColumn([
                'invoice_no',
                'issue_date',
                'billing_period_start',
                'billing_period_end',
                'note',
                'cancel_reason',
                'paid_amount',
                'paid_at',
                'email_sent_at',
                'created_by',
                'deleted_at',
            ]);
        });
    }
};
