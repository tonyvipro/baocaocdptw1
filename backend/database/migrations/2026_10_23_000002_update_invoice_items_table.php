<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->string('description', 255)->nullable()->after('total_price');
            $table->integer('sort_order')->default(0)->after('description');

            // Tạo index cho invoice_id nếu chưa có
            $table->index('invoice_id', 'invoice_items_invoice_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropIndex('invoice_items_invoice_id_index');
            $table->dropColumn(['description', 'sort_order']);
        });
    }
};
