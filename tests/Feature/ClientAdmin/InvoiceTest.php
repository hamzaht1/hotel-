<?php

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Tenant;
use App\Models\User;

function createClientAdminForInvoices(): array
{
    $tenant = Tenant::factory()->create();
    $user = User::factory()->clientAdmin($tenant->id)->create();
    return [$user, $tenant];
}

function createInvoice(int $tenantId, string $status = 'sent', array $overrides = []): Invoice
{
    Invoice::unguard();
    $invoice = Invoice::create(array_merge([
        'tenant_id' => $tenantId,
        'invoice_number' => 'INV-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
        'type' => 'subscription',
        'status' => $status,
        'amount' => 1000.00,
        'tax_rate' => 15.00,
        'tax_amount' => 150.00,
        'discount' => 0,
        'total' => 1150.00,
        'issue_date' => now(),
        'due_date' => now()->addDays(30),
    ], $overrides));
    Invoice::reguard();

    InvoiceItem::unguard();
    InvoiceItem::create([
        'invoice_id' => $invoice->id,
        'description_ar' => 'اشتراك شهري',
        'description_en' => 'Monthly Subscription',
        'quantity' => 1,
        'unit_price' => 1000.00,
        'total' => 1000.00,
    ]);
    InvoiceItem::reguard();

    return $invoice;
}

// ─── Index ─────────────────────────────────────────────────

test('client admin can list their invoices', function () {
    [$user, $tenant] = createClientAdminForInvoices();
    createInvoice($tenant->id, 'sent');
    createInvoice($tenant->id, 'paid');

    $this->actingAs($user)
        ->get('/client-admin/invoices')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/invoices/index')
            ->has('invoices.data', 2)
        );
});

test('client admin only sees sent paid and overdue invoices not drafts', function () {
    [$user, $tenant] = createClientAdminForInvoices();
    createInvoice($tenant->id, 'sent');
    createInvoice($tenant->id, 'paid');
    createInvoice($tenant->id, 'overdue');
    createInvoice($tenant->id, 'draft');

    $this->actingAs($user)
        ->get('/client-admin/invoices')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('invoices.data', 3));
});

test('client admin cannot see other tenants invoices', function () {
    [$user, $tenant] = createClientAdminForInvoices();
    $otherTenant = Tenant::factory()->create();

    createInvoice($tenant->id, 'sent');
    createInvoice($otherTenant->id, 'sent');

    $this->actingAs($user)
        ->get('/client-admin/invoices')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('invoices.data', 1));
});
