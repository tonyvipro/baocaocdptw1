<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Contract;
use App\Enums\InvoiceStatus;
use App\Enums\InvoiceType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $issueDate = Carbon::today()->subDays(fake()->numberBetween(1, 30));
        $yearMonth = $issueDate->format('Ym');

        return [
            'invoice_no' => 'QLTT-INV-' . $yearMonth . '-PROP-' . fake()->unique()->numerify('##'),
            'contract_id' => Contract::factory(),
            'issue_date' => $issueDate->toDateString(),
            'title' => 'Hóa đơn tiền thuê nhà ' . $yearMonth,
            'type' => InvoiceType::RENT,
            'amount' => 15000000.00,
            'due_date' => $issueDate->copy()->addDays(10)->toDateString(),
            'billing_period_start' => $issueDate->toDateString(),
            'billing_period_end' => $issueDate->copy()->addMonth()->subDay()->toDateString(),
            'status' => InvoiceStatus::UNPAID,
            'note' => '[Dữ liệu mẫu] Hóa đơn kiểm thử tự động',
            'paid_amount' => 0.00,
            'paid_at' => null,
            'created_by' => 1,
        ];
    }
}
