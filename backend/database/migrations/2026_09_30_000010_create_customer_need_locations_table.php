<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 4.2.1.20 Customer_need_locations (Spec trang 29, 39)
        Schema::create('customer_need_locations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_need_id');
            $table->unsignedInteger('province_id');
            $table->unsignedInteger('district_id')->nullable();
            $table->unsignedInteger('ward_id')->nullable();
            $table->timestamps();

            $table->foreign('customer_need_id')->references('id')->on('customer_needs')->onDelete('cascade');
            $table->foreign('province_id')->references('id')->on('provinces')->onDelete('cascade');
            $table->foreign('district_id')->references('id')->on('districts')->nullOnDelete();
            $table->foreign('ward_id')->references('id')->on('wards')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_need_locations');
    }
};
