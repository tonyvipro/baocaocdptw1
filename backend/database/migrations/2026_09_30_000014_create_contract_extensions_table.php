<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 4.2.1.19 Bảng contract_extensions (Spec trang 29, 39)
        Schema::create('contract_extensions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('contract_id');
            $table->date('extension_date');
            $table->date('new_end_date');
            $table->decimal('new_rental_price', 15, 2)->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->foreign('contract_id')->references('id')->on('contracts')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_extensions');
    }
};
