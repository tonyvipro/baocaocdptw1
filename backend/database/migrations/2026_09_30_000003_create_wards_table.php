<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 4.2.1.16 Bảng wards (Spec trang 27, 37)
        Schema::create('wards', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('district_id');
            $table->string('name', 100);
            $table->timestamps();

            $table->foreign('district_id')->references('id')->on('districts')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wards');
    }
};
