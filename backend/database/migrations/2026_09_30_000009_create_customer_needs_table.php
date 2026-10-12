<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 4.2.1.3 Bảng customer_needs (Spec trang 19, 29)
        Schema::create('customer_needs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('broker_id')->nullable();
            $table->unsignedInteger('property_type_id')->nullable();
            $table->text('environmental_preferences')->nullable();
            $table->decimal('budget_min', 15, 2)->default(0);
            $table->decimal('budget_max', 15, 2)->default(0);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('broker_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('property_type_id')->references('id')->on('property_types')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_needs');
    }
};
