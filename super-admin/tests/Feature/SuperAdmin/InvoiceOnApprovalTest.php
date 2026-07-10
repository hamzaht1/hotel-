<?php

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\RenewalRequest;
use App\Models\Tenant;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->superAdmin()->create();
});

test('approving a tenant payment creates a subscription invoice', function () {
    $plan = Plan::factory()->create(['price' => 1000]);
    $tenant = Tenant::factory()->create([
        'payment_status' => 'pending',
        'plan_id' => $plan->id,
    ]);

    $this->actingAs($this->admin)
        ->post("/super-admin/tenants/{$tenant->id}/approve")
        ->assertRedirect();

    $invoice = Invoice::where('tenant_id', $tenant->id)->first();
    expect($invoice)->not->toBeNull();
    expect($invoice->type)->toBe('subscription');
    expect($invoice->status)->toBe('paid');
    expect((float) $invoice->amount)->toBe(1000.0);
    expect((float) $invoice->total)->toBe(1000.0); // VAT removed app-wide
});

test('approving the same tenant twice does not create a duplicate invoice', function () {
    $plan = Plan::factory()->create(['price' => 500]);
    $tenant = Tenant::factory()->create([
        'payment_status' => 'pending',
        'plan_id' => $plan->id,
    ]);

    $this->actingAs($this->admin)->post("/super-admin/tenants/{$tenant->id}/approve");
    $this->actingAs($this->admin)->post("/super-admin/tenants/{$tenant->id}/approve");

    expect(Invoice::where('tenant_id', $tenant->id)->count())->toBe(1);
});

test('approving a renewal creates a separate invoice tagged with the renewal id', function () {
    $plan = Plan::factory()->create(['price' => 1200]);
    $tenant = Tenant::factory()->create([
        'payment_status' => 'approved',
        'plan_id' => $plan->id,
        'subscription_starts_at' => now()->subYear(),
        'subscription_ends_at' => now()->addDay(),
    ]);

    // Existing initial invoice
    Invoice::create([
        'tenant_id' => $tenant->id,
        'invoice_number' => 'INV-OLD',
        'type' => 'subscription',
        'status' => 'paid',
        'amount' => 1000, 'tax_rate' => 15, 'tax_amount' => 150,
        'discount' => 0, 'total' => 1150,
        'issue_date' => now()->subYear()->toDateString(),
        'due_date' => now()->subYear()->toDateString(),
        'paid_at' => now()->subYear(),
        'notes_en' => 'Initial subscription #' . $tenant->id,
    ]);

    $renewal = RenewalRequest::create([
        'tenant_id' => $tenant->id,
        'plan_id' => $plan->id,
        'payment_method' => 'bank_transfer',
        'status' => 'pending',
        'requested_at' => now(),
    ]);

    $this->actingAs($this->admin)
        ->post("/super-admin/tenants/{$tenant->id}/approve-renewal")
        ->assertRedirect();

    $renewalInvoices = Invoice::where('tenant_id', $tenant->id)
        ->where('notes_en', 'like', "%Renewal #{$renewal->id}%")
        ->get();
    expect($renewalInvoices)->toHaveCount(1);

    expect(Invoice::where('tenant_id', $tenant->id)->count())->toBe(2);
});

test('backfill command creates missing invoices for approved tenants', function () {
    $plan = Plan::factory()->create(['price' => 800]);
    $tenant = Tenant::factory()->create([
        'payment_status' => 'approved',
        'plan_id' => $plan->id,
    ]);

    expect(Invoice::where('tenant_id', $tenant->id)->count())->toBe(0);

    $this->artisan('invoices:backfill')->assertSuccessful();

    expect(Invoice::where('tenant_id', $tenant->id)->where('type', 'subscription')->count())->toBe(1);
});

test('backfill command is idempotent', function () {
    $plan = Plan::factory()->create(['price' => 500]);
    $tenant = Tenant::factory()->create(['payment_status' => 'approved', 'plan_id' => $plan->id]);

    $this->artisan('invoices:backfill');
    $this->artisan('invoices:backfill');

    expect(Invoice::where('tenant_id', $tenant->id)->count())->toBe(1);
});
