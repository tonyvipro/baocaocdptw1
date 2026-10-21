<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contract_extensions', function (Blueprint $table) {
            // Đổi extension_date sang nullable (chỉ cập nhật ngày được duyệt)
            $table->date('extension_date')->nullable()->change();

            // Bổ sung các cột nghiệp vụ gia hạn
            if (!Schema::hasColumn('contract_extensions', 'extension_type')) {
                $table->tinyInteger('extension_type')->default(1)->after('contract_id')
                    ->comment('0: Tự động, 1: Thủ công, 2: Theo điều khoản mới');
            }

            if (!Schema::hasColumn('contract_extensions', 'duration_months')) {
                $table->integer('duration_months')->default(12)->after('extension_type')
                    ->comment('Số tháng gia hạn: 3, 6, 12');
            }

            if (!Schema::hasColumn('contract_extensions', 'new_start_date')) {
                $table->date('new_start_date')->nullable()->after('duration_months');
            }

            if (!Schema::hasColumn('contract_extensions', 'old_end_date')) {
                $table->date('old_end_date')->nullable()->after('new_end_date')
                    ->comment('Ngày kết thúc cũ để đối soát/rollback');
            }

            if (!Schema::hasColumn('contract_extensions', 'old_rental_price')) {
                $table->decimal('old_rental_price', 15, 2)->nullable()->after('new_rental_price')
                    ->comment('Giá thuê cũ để đối soát/rollback');
            }

            if (!Schema::hasColumn('contract_extensions', 'reason')) {
                $table->text('reason')->nullable()->after('note');
            }

            if (!Schema::hasColumn('contract_extensions', 'status')) {
                $table->tinyInteger('status')->default(0)->after('reason')
                    ->comment('0: Nháp, 1: Chờ duyệt, 2: Đã duyệt, 3: Từ chối, 4: Đã hủy');
            }

            if (!Schema::hasColumn('contract_extensions', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('status');
                $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            }

            if (!Schema::hasColumn('contract_extensions', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('created_by');
                $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
            }

            if (!Schema::hasColumn('contract_extensions', 'approved_at')) {
                $table->dateTime('approved_at')->nullable()->after('approved_by');
            }

            if (!Schema::hasColumn('contract_extensions', 'reject_reason')) {
                $table->text('reject_reason')->nullable()->after('approved_at');
            }

            if (!Schema::hasColumn('contract_extensions', 'deleted_at')) {
                $table->softDeletes()->after('updated_at');
            }

            // Composite indexes cho truy vấn và kiểm tra duplicate nhanh
            $table->index(['contract_id', 'status'], 'idx_ce_contract_status');
            $table->index(['status', 'created_at'], 'idx_ce_status_created_at');
        });
    }

    public function down(): void
    {
        Schema::table('contract_extensions', function (Blueprint $table) {
            $table->dropIndex('idx_ce_contract_status');
            $table->dropIndex('idx_ce_status_created_at');

            $table->dropForeign(['created_by']);
            $table->dropForeign(['approved_by']);

            $table->dropColumn([
                'extension_type',
                'duration_months',
                'new_start_date',
                'old_end_date',
                'old_rental_price',
                'reason',
                'status',
                'created_by',
                'approved_by',
                'approved_at',
                'reject_reason',
                'deleted_at',
            ]);

            $table->date('extension_date')->nullable(false)->change();
        });
    }
};
