<?php

namespace Database\Factories;

use App\Models\InvoiceItem;
use App\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceItemFactory extends Factory
{
    protected $model = InvoiceItem::class;

    public function definition(): array
    {
        $qty = fake()->numberBetween(1, 5);
        $price = fake()->numberBetween(500, 2000) * 1000;

        return [
            'invoice_id' => Invoice::factory(),
            'item_name' => fake()->randomElement(['Tiền thuê nhà', 'Phí dịch vụ', 'Tiền điện', 'Tiền nước', 'Internet']),
            'quantity' => $qty,
            'unit_price' => $price,
            'total_price' => $qty * $price,
            'description' => null,
            'sort_order' => 1,
        ];
    }
}
