<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 4.2.1.9 Bảng contracts (Spec trang 23, 33)
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('property_id');
            $table->unsignedBigInteger('broker_id')->nullable();
            $table->unsignedBigInteger('customer_id');
            $table->string('contract_code', 50)->unique();
            $table->string('contract_name', 255);
            $table->text('party_a_info')->nullable();
            $table->text('party_b_info')->nullable();
            $table->string('tax_code', 50)->nullable();
            $table->longText('terms')->nullable();
            $table->string('currency', 10)->default('VND');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('deposit_amount', 15, 2)->default(0);
            $table->decimal('rental_price', 15, 2)->default(0);
            $table->tinyInteger('status')->default(0);
            $table->integer('billing_cycle')->default(1);
            $table->date('next_billing_date')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('property_id')->references('id')->on('properties')->onDelete('cascade');
            $table->foreign('broker_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('customer_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
