<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('customer_activities')) {
            Schema::table('customer_activities', function (Blueprint $table) {
                if (!Schema::hasColumn('customer_activities', 'assigned_to')) {
                    $table->unsignedBigInteger('assigned_to')->nullable()->after('created_by');
                }
                if (!Schema::hasColumn('customer_activities', 'result')) {
                    $table->string('result', 250)->nullable()->after('status');
                }
            });

            try {
                Schema::table('customer_activities', function (Blueprint $table) {
                    $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
                    $table->index('assigned_to');
                });
            } catch (\Throwable $e) {
                // SQLite fallback
            }

            // Đồng bộ dữ liệu cũ: assigned_to = created_by nếu chưa có
            DB::table('customer_activities')
                ->whereNull('assigned_to')
                ->whereNotNull('created_by')
                ->update(['assigned_to' => DB::raw('created_by')]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('customer_activities')) {
            Schema::table('customer_activities', function (Blueprint $table) {
                $table->dropColumn(['assigned_to', 'result']);
            });
        }
    }
};

