<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_demands', fn (Blueprint $table) => $table->string('seed_key', 100)->nullable()->unique());
    }

    public function down(): void
    {
        Schema::table('customer_demands', function (Blueprint $table) {
            $table->dropUnique(['seed_key']);
            $table->dropColumn('seed_key');
        });
    }
};
