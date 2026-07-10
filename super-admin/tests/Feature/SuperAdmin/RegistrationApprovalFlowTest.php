<?php

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\RenewalRequest;
use App\Models\Tenant;
use App\Models\User;

/**
 * Platform-side of the registration/payment process (super-admin app):
 * a bank-transfer request is reviewed → approved (activating the tenant and
 * issuing a paid subscription invoice) → the client shows in the directory and
 * reports → a later renewal request is approved and extends the subscription.
 *
 * The customer-facing half (wizard, online payment, client renewal) is covered
 * by the main app's tests/Feature/RegistrationPaymentFlowTest.php.
 */

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->superAdmin()->create();
});

/** A pending bank-transfer request, as produced by the public setup wizard. */
function pendingBankTransferTenant(Plan $plan): Tenant
{
    return Tenant::factory()->create([
        'plan_id' => $plan->id,
        'payment_status' => 'pending',
        'payment_method' => 'bank_transfer',
        'is_active' => false,
        'subscription_starts_at' => null,
        'subscription_ends_at' => null,
    ]);
}

// ─── Approve a bank-transfer request ───────────────────────

test('approving a bank-transfer request activates the tenant and issues a paid invoice', function () {
    $plan = Plan::factory()->create(['price' => 1000]);
    $tenant = pendingBankTransferTenant($plan);

    $this->actingAs($this->admin)
        ->post("/super-admin/tenants/{$tenant->id}/approve")
        ->assertRedirect();

    $tenant->refresh();
    expect($tenant->payment_status)->toBe('approved')
        ->and((bool) $tenant->is_active)->toBeTrue()
        ->and($tenant->subscription_starts_at)->not->toBeNull()
        ->and($tenant->subscription_ends_at)->not->toBeNull()
        ->and($tenant->approved_by)->toBe($this->admin->id);

    $invoice = Invoice::where('tenant_id', $tenant->id)->where('type', 'subscription')->first();
    expect($invoice)->not->toBeNull()
        ->and($invoice->status)->toBe('paid')
        ->and((float) $invoice->amount)->toBe(1000.0)
        // Super-admin approval invoices carry no VAT (Diyafah is not VAT-registered),
        // unlike the main app's online-checkout invoice which applies 15%.
        ->and((float) $invoice->tax_rate)->toBe(0.0)
        ->and((float) $invoice->total)->toBe(1000.0);
});

test('rejecting a bank-transfer request marks the tenant rejected without an invoice', function () {
    $plan = Plan::factory()->create(['price' => 1000]);
    $tenant = pendingBankTransferTenant($plan);

    $this->actingAs($this->admin)
        ->post("/super-admin/tenants/{$tenant->id}/reject", [
            'rejection_reason' => 'Receipt unreadable',
        ])->assertRedirect();

    $tenant->refresh();
    expect($tenant->payment_status)->toBe('rejected')
        ->and((bool) $tenant->is_active)->toBeFalse();
    expect(Invoice::where('tenant_id', $tenant->id)->count())->toBe(0);
});

// ─── Approved client flows into the directory ──────────────

test('an approved client appears in the clients directory', function () {
    $plan = Plan::factory()->create(['price' => 1000]);
    $tenant = pendingBankTransferTenant($plan);

    $this->actingAs($this->admin)->post("/super-admin/tenants/{$tenant->id}/approve");

    // The directory now defaults to "all time", so earlier-registered clients show.
    $this->actingAs($this->admin)
        ->get('/super-admin/clients')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/clients/index')
            ->has('tenants.data', 1)
        );
});

// ─── Renewal approval extends the subscription ─────────────

test('approving a renewal request extends the subscription and issues a renewal invoice', function () {
    $plan = Plan::factory()->create(['price' => 1200]);
    $tenant = Tenant::factory()->create([
        'plan_id' => $plan->id,
        'payment_status' => 'approved',
        'is_active' => true,
        'subscription_starts_at' => now()->subYear(),
        'subscription_ends_at' => now()->addDays(5),
    ]);
    $endBefore = $tenant->subscription_ends_at;

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

    $renewal->refresh();
    $tenant->refresh();
    expect($renewal->status)->toBe('approved')
        ->and($tenant->subscription_ends_at->greaterThan($endBefore))->toBeTrue();

    expect(Invoice::where('tenant_id', $tenant->id)
        ->where('notes_en', 'like', "%Renewal #{$renewal->id}%")
        ->count())->toBe(1);
});

// ─── Reports reflect the approved revenue ──────────────────

test('reports reflect the approved client and its revenue', function () {
    $plan = Plan::factory()->create(['price' => 1000]);
    $tenant = pendingBankTransferTenant($plan);

    $this->actingAs($this->admin)->post("/super-admin/tenants/{$tenant->id}/approve");

    $this->actingAs($this->admin)
        ->get('/super-admin/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/reports/index')
            ->has('kpis.total_clients')
            ->has('kpis.active_subscriptions')
            ->has('kpis.total_revenue')
        );
});
