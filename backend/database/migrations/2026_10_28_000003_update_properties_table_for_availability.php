<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            if (!Schema::hasColumn('properties', 'closed_reason')) {
                $table->string('closed_reason', 10)->nullable()->after('status'); // 'rented' hoặc 'sold'
            }
            if (!Schema::hasColumn('properties', 'closed_at')) {
                $table->dateTime('closed_at')->nullable()->after('closed_reason');
            }
            if (!Schema::hasColumn('properties', 'closed_contract_id')) {
                $table->unsignedBigInteger('closed_contract_id')->nullable()->after('closed_at');

                $table->foreign('closed_contract_id')
                    ->references('id')
                    ->on('contracts')
                    ->nullOnDelete();
            }

            $table->index(['status', 'closed_contract_id'], 'properties_status_closed_contract_index');
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropForeign(['closed_contract_id']);
            $table->dropIndex('properties_status_closed_contract_index');
            $table->dropColumn(['closed_contract_id', 'closed_at', 'closed_reason']);
        });
    }
};
