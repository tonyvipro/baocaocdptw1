<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('contracts', 'version')) {
            Schema::table('contracts', function (Blueprint $table) {
                $table->unsignedInteger('version')->default(1)->after('status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('contracts', 'version')) {
            Schema::table('contracts', function (Blueprint $table) {
                $table->dropColumn('version');
            });
        }
    }
};

