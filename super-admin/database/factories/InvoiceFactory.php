<?php

namespace Database\Factories;

use App\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $amount = $this->faker->numberBetween(100, 5000);
        $tax = round($amount * 0.15, 2);

        return [
            'invoice_number' => 'INV-'.now()->year.'-'.str_pad((string) $this->faker->unique()->numberBetween(1, 99999), 4, '0', STR_PAD_LEFT),
            'type' => 'subscription',
            'status' => 'draft',
            'amount' => $amount,
            'tax_rate' => 15,
            'tax_amount' => $tax,
            'discount' => 0,
            'total' => $amount + $tax,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addMonth()->toDateString(),
            'commission_rate' => 0,
            'commission_amount' => 0,
        ];
    }
}
