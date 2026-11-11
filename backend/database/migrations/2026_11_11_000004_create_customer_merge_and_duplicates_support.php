<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('customers') && !Schema::hasColumn('customers', 'merged_into_id')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->unsignedBigInteger('merged_into_id')->nullable()->after('assigned_to');
                $table->index('merged_into_id');
            });

            try {
                Schema::table('customers', function (Blueprint $table) {
                    $table->foreign('merged_into_id')->references('id')->on('customers')->nullOnDelete();
                });
            } catch (\Throwable $e) {}
        }

        if (!Schema::hasTable('customer_merge_histories')) {
            Schema::create('customer_merge_histories', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('primary_customer_id');
                $table->unsignedBigInteger('secondary_customer_id');
                $table->unsignedBigInteger('performed_by')->nullable();
                $table->string('reason', 255)->nullable();
                $table->unsignedInteger('transferred_demands')->default(0);
                $table->unsignedInteger('transferred_activities')->default(0);
                $table->unsignedInteger('transferred_interactions')->default(0);
                $table->json('secondary_snapshot')->nullable();
                $table->timestamps();

                $table->index('primary_customer_id');
                $table->index('secondary_customer_id');

                try {
                    $table->foreign('performed_by')->references('id')->on('users')->nullOnDelete();
                } catch (\Throwable $e) {}
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_merge_histories');

        if (Schema::hasTable('customers') && Schema::hasColumn('customers', 'merged_into_id')) {
            try {
                Schema::table('customers', function (Blueprint $table) {
                    $table->dropForeign(['merged_into_id']);
                });
            } catch (\Throwable $e) {}

            Schema::table('customers', function (Blueprint $table) {
                $table->dropColumn('merged_into_id');
            });
        }
    }
};

