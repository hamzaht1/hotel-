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
        $notes = $paymentMethod === 'moyasar'
            ? "Renewal #{$renewal->id} via Moyasar (invoice {$renewal->payment_charge_id})"
            : "Renewal #{$renewal->id} via bank transfer";

        return $this->createSubscriptionInvoice($tenant, $plan, $paymentMethod, $notes, (float) $renewal->discount_amount);
    }

    public function createInitialInvoice(Tenant $tenant, Plan $plan, string $paymentMethod = 'bank_transfer'): Invoice
    {
        $notes = "Initial subscription #{$tenant->id}";
        return $this->createSubscriptionInvoice($tenant, $plan, $paymentMethod, $notes);
    }

    private function createSubscriptionInvoice(Tenant $tenant, Plan $plan, string $paymentMethod, string $notes, float $discount = 0.0): Invoice
    {
        $amount = (float) $plan->price;
        $discount = max(0.0, min($discount, $amount));
        $net = round($amount - $discount, 2);
        // Diyafah is not VAT-registered — subscription invoices carry no tax.
        $taxRate = 0.00;
        $taxAmount = 0.00;
        $total = $net;

        return Invoice::create([
            'tenant_id' => $tenant->id,
            'invoice_number' => Invoice::generateNumber(),
            'type' => 'subscription',
            'status' => 'paid',
            'amount' => $amount,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'discount' => $discount,
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
