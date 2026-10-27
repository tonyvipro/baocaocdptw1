<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        foreach (['users', 'categories', 'brokers', 'broker_assignments'] as $table) {
            Schema::table($table, fn (Blueprint $blueprint) => $blueprint->unsignedInteger('version')->default(1));
        }
    }

    public function down(): void
    {
        foreach (['users', 'categories', 'brokers', 'broker_assignments'] as $table) {
            Schema::table($table, fn (Blueprint $blueprint) => $blueprint->dropColumn('version'));
        }
    }
};
