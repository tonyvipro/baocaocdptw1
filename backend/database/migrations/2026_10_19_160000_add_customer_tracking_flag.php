<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->boolean('is_tracked')->default(true)->index();
            $table->string('seed_key', 100)->nullable()->unique();
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropUnique(['seed_key']);
            $table->dropIndex(['is_tracked']);
            $table->dropColumn(['is_tracked', 'seed_key']);
        });
    }
};
