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
            ? "Renewal #{$renewal->id} via Moyasar"
            : "Renewal #{$renewal->id} via bank transfer";

        return $this->createSubscriptionInvoice($tenant, $plan, $paymentMethod, $notes);
    }

    public function createInitialInvoice(Tenant $tenant, Plan $plan, string $paymentMethod = 'bank_transfer'): Invoice
    {
        $notes = "Initial subscription #{$tenant->id}";
        return $this->createSubscriptionInvoice($tenant, $plan, $paymentMethod, $notes);
    }

    private function createSubscriptionInvoice(Tenant $tenant, Plan $plan, string $paymentMethod, string $notes): Invoice
    {
        $amount = (float) $plan->price;
        // Diyafah is not VAT-registered, so subscription invoices carry no tax by
        // default. A tax rate can still be applied per-invoice from the admin
        // invoice form if the company ever registers for VAT.
        $taxRate = 0.00;
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
