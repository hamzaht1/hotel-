<?php

use App\Models\Invoice;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function createInvoice(int $tenantId, array $overrides = []): Invoice
{
    Invoice::unguard();
    $invoice = Invoice::create(array_merge([
        'tenant_id' => $tenantId,
        'invoice_number' => 'INV-' . date('Y') . '-' . str_pad(random_int(1, 9999), 4, '0', STR_PAD_LEFT),
        'type' => 'subscription',
        'status' => 'draft',
        'amount' => 1000.00,
        'tax_rate' => 15.00,
        'tax_amount' => 150.00,
        'discount' => 0,
        'total' => 1150.00,
        'issue_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
    ], $overrides));
    Invoice::reguard();

    return $invoice;
}

// ─── Index ─────────────────────────────────────────────────

test('super admin can list invoices', function () {
    $user = User::factory()->superAdmin()->create();
    $tenant = Tenant::factory()->create();

    createInvoice($tenant->id);
    createInvoice($tenant->id);

    $this->actingAs($user)
        ->get('/super-admin/invoices')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/invoices/index')
            ->has('invoices.data', 2)
        );
});

// ─── Create ────────────────────────────────────────────────

test('super admin can view create invoice form', function () {
    $user = User::factory()->superAdmin()->create();
    Tenant::factory()->count(2)->create();

    $this->actingAs($user)
        ->get('/super-admin/invoices/create')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/invoices/create')
            ->has('tenants')
        );
});

test('super admin can create invoice with items', function () {
    $user = User::factory()->superAdmin()->create();
    $tenant = Tenant::factory()->create();

    $this->actingAs($user)
        ->post('/super-admin/invoices', [
            'tenant_id' => $tenant->id,
            'type' => 'subscription',
            'issue_date' => '2026-03-01',
            'due_date' => '2026-03-31',
            'tax_rate' => 15,
            'discount' => 0,
            'items' => [
                [
                    'description_ar' => 'اشتراك سنوي',
                    'description_en' => 'Annual subscription',
                    'quantity' => 1,
                    'unit_price' => 1000,
                ],
                [
                    'description_ar' => 'إعداد',
                    'description_en' => 'Setup fee',
                    'quantity' => 1,
                    'unit_price' => 200,
                ],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('invoices', [
        'tenant_id' => $tenant->id,
        'type' => 'subscription',
        'status' => 'draft',
    ]);

    $this->assertDatabaseHas('invoice_items', [
        'description_en' => 'Annual subscription',
        'quantity' => 1,
        'unit_price' => '1000.00',
    ]);

    $this->assertDatabaseHas('invoice_items', [
        'description_en' => 'Setup fee',
    ]);
});

// ─── Show ──────────────────────────────────────────────────

test('super admin can view invoice detail', function () {
    $user = User::factory()->superAdmin()->create();
    $tenant = Tenant::factory()->create();
    $invoice = createInvoice($tenant->id);

    $this->actingAs($user)
        ->get("/super-admin/invoices/{$invoice->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/invoices/show')
            ->has('invoice')
            ->where('invoice.id', $invoice->id)
        );
});

// ─── Status Transitions ───────────────────────────────────

test('super admin can mark invoice as sent', function () {
    $user = User::factory()->superAdmin()->create();
    $tenant = Tenant::factory()->create();
    $invoice = createInvoice($tenant->id, ['status' => 'draft']);

    $this->actingAs($user)
        ->post("/super-admin/invoices/{$invoice->id}/send")
        ->assertRedirect();

    $invoice->refresh();
    expect($invoice->status)->toBe('sent');
});

test('super admin can mark invoice as paid', function () {
    $user = User::factory()->superAdmin()->create();
    $tenant = Tenant::factory()->create();
    $invoice = createInvoice($tenant->id, ['status' => 'sent']);

    $this->actingAs($user)
        ->post("/super-admin/invoices/{$invoice->id}/mark-paid", [
            'payment_method' => 'bank_transfer',
        ])
        ->assertRedirect();

    $invoice->refresh();
    expect($invoice->status)->toBe('paid')
        ->and($invoice->paid_at)->not->toBeNull()
        ->and($invoice->payment_method)->toBe('bank_transfer');
});

// ─── Edit Restrictions ─────────────────────────────────────

test('only draft invoices can be edited', function () {
    $user = User::factory()->superAdmin()->create();
    $tenant = Tenant::factory()->create();

    $sentInvoice = createInvoice($tenant->id, ['status' => 'sent']);

    $this->actingAs($user)
        ->get("/super-admin/invoices/{$sentInvoice->id}/edit")
        ->assertRedirect();

    $paidInvoice = createInvoice($tenant->id, ['status' => 'paid']);

    $this->actingAs($user)
        ->get("/super-admin/invoices/{$paidInvoice->id}/edit")
        ->assertRedirect();
});
