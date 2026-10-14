<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            if (!Schema::hasColumn('contracts', 'signing_method')) {
                $table->string('signing_method', 30)->default('ONLINE')->after('status');
            }
            if (!Schema::hasColumn('contracts', 'meeting_location')) {
                $table->string('meeting_location', 255)->nullable()->after('signing_method');
            }
            if (!Schema::hasColumn('contracts', 'meeting_time')) {
                $table->dateTime('meeting_time')->nullable()->after('meeting_location');
            }
            if (!Schema::hasColumn('contracts', 'notary_office')) {
                $table->string('notary_office', 255)->nullable()->after('meeting_time');
            }
            if (!Schema::hasColumn('contracts', 'is_high_value')) {
                $table->boolean('is_high_value')->default(false)->after('notary_office');
            }
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn([
                'signing_method',
                'meeting_location',
                'meeting_time',
                'notary_office',
                'is_high_value',
            ]);
        });
    }
};
