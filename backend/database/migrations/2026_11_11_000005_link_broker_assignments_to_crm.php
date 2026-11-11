<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Thêm customer_id và requirement_id vào bảng broker_assignments
        if (Schema::hasTable('broker_assignments')) {
            if (!Schema::hasColumn('broker_assignments', 'customer_id')) {
                Schema::table('broker_assignments', function (Blueprint $table) {
                    $table->unsignedBigInteger('customer_id')->nullable()->after('property_location');
                    $table->unsignedBigInteger('requirement_id')->nullable()->after('customer_id');
                });
            }

            try {
                Schema::table('broker_assignments', function (Blueprint $table) {
                    $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
                    $table->foreign('requirement_id')->references('id')->on('customer_demands')->nullOnDelete();
                    $table->index(['customer_id', 'requirement_id']);
                });
            } catch (\Throwable $e) {
                // SQLite in-memory fallback
            }
        }

        // 2. Thêm primary_broker_id vào bảng customers
        if (Schema::hasTable('customers')) {
            if (!Schema::hasColumn('customers', 'primary_broker_id')) {
                Schema::table('customers', function (Blueprint $table) {
                    $table->unsignedBigInteger('primary_broker_id')->nullable()->after('assigned_to');
                });
            }

            try {
                Schema::table('customers', function (Blueprint $table) {
                    $table->foreign('primary_broker_id')->references('id')->on('brokers')->nullOnDelete();
                    $table->index('primary_broker_id');
                });
            } catch (\Throwable $e) {
                // SQLite in-memory fallback
            }
        }

        // 3. Khớp dữ liệu cũ: Đồng bộ primary_broker_id từ assigned_to (user_id -> brokers.user_id)
        if (Schema::hasTable('customers') && Schema::hasTable('brokers') && Schema::hasColumn('customers', 'primary_broker_id')) {
            $customers = DB::table('customers')->whereNotNull('assigned_to')->whereNull('primary_broker_id')->get();
            foreach ($customers as $c) {
                $broker = DB::table('brokers')->where('user_id', $c->assigned_to)->whereNull('deleted_at')->first();
                if ($broker) {
                    DB::table('customers')->where('id', $c->id)->update(['primary_broker_id' => $broker->id]);
                }
            }
        }

        // 4. Khớp dữ liệu cũ: Đồng bộ customer_id vào broker_assignments qua SĐT hoặc Email
        if (Schema::hasTable('broker_assignments') && Schema::hasTable('customers') && Schema::hasColumn('broker_assignments', 'customer_id')) {
            $assignments = DB::table('broker_assignments')->whereNull('customer_id')->get();
            foreach ($assignments as $a) {
                $customer = null;
                if (!empty($a->customer_phone)) {
                    $customer = DB::table('customers')->where('phone', $a->customer_phone)->whereNull('deleted_at')->first();
                }
                if (!$customer && !empty($a->customer_email)) {
                    $customer = DB::table('customers')->where('email', $a->customer_email)->whereNull('deleted_at')->first();
                }
                if ($customer) {
                    DB::table('broker_assignments')->where('id', $a->id)->update([
                        'customer_id' => $customer->id,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('broker_assignments')) {
            Schema::table('broker_assignments', function (Blueprint $table) {
                $table->dropColumn(['customer_id', 'requirement_id']);
            });
        }

        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropColumn('primary_broker_id');
            });
        }
    }
};

