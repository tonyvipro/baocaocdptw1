<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_gateway_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('transaction_id')->nullable();
            $table->string('gateway', 30);
            $table->string('event', 50); // ipn_received, order_created, query_status, signature_failed, etc.
            $table->json('payload');
            $table->boolean('signature_valid')->default(true);
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('transaction_id')
                ->references('id')
                ->on('transactions')
                ->nullOnDelete();

            $table->index('transaction_id', 'payment_gateway_logs_transaction_id_index');
            $table->index('created_at', 'payment_gateway_logs_created_at_index');
            $table->index(['gateway', 'event'], 'payment_gateway_logs_gateway_event_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_gateway_logs');
    }
};
