<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('activity_logs', 'actor_id')) {
                $table->unsignedBigInteger('actor_id')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('activity_logs', 'actor_name')) {
                $table->string('actor_name', 255)->nullable()->after('actor_id');
            }
            if (!Schema::hasColumn('activity_logs', 'actor_role')) {
                $table->string('actor_role', 100)->nullable()->after('actor_name');
            }
            if (!Schema::hasColumn('activity_logs', 'actor_snapshot')) {
                $table->json('actor_snapshot')->nullable()->after('actor_role');
            }
            if (!Schema::hasColumn('activity_logs', 'subject_snapshot')) {
                $table->json('subject_snapshot')->nullable()->after('new_data');
            }
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $dropCols = [];
            foreach (['subject_snapshot', 'actor_snapshot', 'actor_role', 'actor_name', 'actor_id'] as $col) {
                if (Schema::hasColumn('activity_logs', $col)) {
                    $dropCols[] = $col;
                }
            }
            if (!empty($dropCols)) {
                $table->dropColumn($dropCols);
            }
        });
    }
};

