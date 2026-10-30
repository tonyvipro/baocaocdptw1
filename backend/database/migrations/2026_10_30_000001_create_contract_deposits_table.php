<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('contract_deposits')) {
            Schema::create('contract_deposits', function (Blueprint $table) {
                $table->id();
                $table->foreignId('contract_id')->unique()->constrained('contracts')->cascadeOnDelete();
                $table->foreignId('invoice_id')->nullable()->unique()->constrained('invoices')->nullOnDelete();
                $table->decimal('required_amount', 15, 2);
                $table->date('refund_due_date')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedInteger('version')->default(1);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index('refund_due_date', 'contract_deposits_refund_due_date_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_deposits');
    }
};

