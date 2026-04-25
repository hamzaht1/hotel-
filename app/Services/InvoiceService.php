<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\RenewalRequest;
use App\Models\Tenant;

class InvoiceService
{
    public function createRenewalInvoice(Tenant $tenant, RenewalRequest $renewal, Plan $plan): Invoice
    {
        $paymentMethod = $renewal->payment_method ?? 'bank_transfer';
        $notes = $paymentMethod === 'tap'
            ? "Renewal #{$renewal->id} via Tap (charge {$renewal->tap_charge_id})"
            : "Renewal #{$renewal->id} via bank transfer";

        return $this->createSubscriptionInvoice($tenant, $plan, $paymentMethod, $notes);
    }

    private function createSubscriptionInvoice(Tenant $tenant, Plan $plan, string $paymentMethod, string $notes): Invoice
    {
        $amount = (float) $plan->price;
        $taxRate = 15.00;
        $taxAmount = round($amount * ($taxRate / 100), 2);
        $total = round($amount + $taxAmount, 2);

        return Invoice::create([
            'tenant_id' => $tenant->id,
            'invoice_number' => Invoice::generateNumber(),
            'type' => 'subscription',
            'status' => 'paid',
            'amount' => $amount,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'discount' => 0,
            'total' => $total,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->toDateString(),
            'paid_at' => now(),
            'payment_method' => $paymentMethod,
            'notes_en' => $notes,
            'notes_ar' => $notes,
        ]);
    }
}
