<?php

namespace Database\Factories;

use App\Models\Transaction;
use App\Models\Invoice;
use App\Enums\PaymentMethod;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        return [
            'invoice_id' => Invoice::factory(),
            'amount' => 5000000.00,
            'payment_method' => fake()->randomElement(PaymentMethod::all()),
            'paid_at' => now(),
        ];
    }
}
