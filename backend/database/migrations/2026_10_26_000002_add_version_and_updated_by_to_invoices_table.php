<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->unsignedInteger('version')->default(1)->after('status');
            $table->unsignedBigInteger('updated_by')->nullable()->after('created_by');

            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });

        // Backfill hóa đơn cũ
        DB::table('invoices')->whereNull('version')->orWhere('version', 0)->update([
            'version' => 1,
        ]);
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['updated_by']);
            $table->dropColumn(['version', 'updated_by']);
        });
    }
};
