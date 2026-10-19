<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 250);
            $table->string('company', 250)->nullable();
            $table->string('source', 250)->nullable();
            $table->string('email', 250)->nullable();
            $table->string('phone', 11)->nullable();
            $table->string('customer_group', 30)->default('new');
            $table->string('status', 30)->default('new');
            $table->string('notes', 250)->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['assigned_to', 'status', 'deleted_at']);
        });
        Schema::create('customer_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 30);
            $table->string('summary', 250);
            $table->dateTime('occurred_at');
            $table->timestamps();
            $table->index(['customer_id', 'occurred_at']);
        });
        Schema::create('customer_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 30);
            $table->string('title', 250);
            $table->dateTime('scheduled_at');
            $table->string('status', 20)->default('pending');
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();
            $table->index(['customer_id', 'status', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_activities');
        Schema::dropIfExists('customer_interactions');
        Schema::dropIfExists('customers');
    }
};
