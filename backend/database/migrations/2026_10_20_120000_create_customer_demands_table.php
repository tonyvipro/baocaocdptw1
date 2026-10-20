<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_demands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->unsignedInteger('property_type_id');
            $table->foreign('property_type_id')->references('id')->on('property_types')->restrictOnDelete();
            $table->decimal('budget_min', 15, 0);
            $table->decimal('budget_max', 15, 0);
            $table->string('area', 250);
            $table->string('status', 30)->default('processing');
            $table->string('notes', 250)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['customer_id', 'deleted_at']);
            $table->index(['property_type_id', 'status', 'deleted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_demands');
    }
};
