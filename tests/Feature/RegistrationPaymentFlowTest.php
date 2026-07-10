<?php

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\RenewalRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/**
 * End-to-end coverage of the customer-facing process (main app):
 *   register → online payment (Moyasar) OR bank transfer → renewal → invoices → reports.
 *
 * The platform-side of the journey (super-admin approval of a bank-transfer
 * request, renewal approval, reports) lives in a separate Laravel app and is
 * covered by super-admin/tests/Feature/SuperAdmin/RegistrationApprovalFlowTest.php.
 */

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Helpers ───────────────────────────────────────────────

/** Create an active, subscribable plan. (Main app has no PlanFactory.) */
function flowPlan(array $overrides = []): Plan
{
    return Plan::create(array_merge([
        'slug' => 'growth',
        'name_ar' => 'نمو',
        'name_en' => 'Growth',
        'price' => 1000.00,
        'billing_cycle' => 'yearly',
        'is_active' => true,
        'sort_order' => 1,
    ], $overrides));
}

/**
 * Walk the setup wizard from the plan step through OTP verification, leaving
 * the session ready at the payment step (otp_verified = true).
 */
function walkWizardThroughOtp($t, int $planId, string $email, string $orgEn): void
{
    $t->post('/setup/plan', ['plan_id' => $planId])
        ->assertRedirect('/setup/template');

    $t->post('/setup/template', ['template_id' => 'madina', 'template_title' => 'Al Madina'])
        ->assertRedirect('/setup/org');

    $t->post('/setup/org', ['org_name_ar' => 'فندق تجريبي', 'org_name_en' => $orgEn])
        ->assertRedirect('/setup/account');

    // first_name / last_name / city / phone are required by the default
    // registration-form config, so the account step needs them.
    $t->post('/setup/account', [
        'username' => 'owner',
        'email' => $email,
        'password' => 'password123',
        'first_name' => 'Sara',
        'last_name' => 'Owner',
        'city' => 'Riyadh',
        'phone' => '0500000000',
    ])->assertRedirect('/setup/verify-otp');

    // Email verification is on by default, so an OTP was generated in the session.
    $otp = session('setup.otp_code');
    expect($otp)->toHaveLength(6);

    $t->post('/setup/verify-otp', ['otp' => $otp])
        ->assertRedirect('/setup/review');

    expect(session('setup.otp_verified'))->toBeTrue();
}

/** Fake Moyasar's hosted-invoice + payment-retrieval endpoints as a paid charge. */
function fakeMoyasarPaid(string $chargeId): void
{
    Http::fake([
        'api.moyasar.com/v1/invoices' => Http::response([
            'id' => $chargeId,
            'url' => "https://pay.moyasar.test/{$chargeId}",
            'status' => 'initiated',
        ], 200),
        'api.moyasar.com/v1/payments/*' => Http::response([
            'id' => $chargeId,
            'status' => 'paid',
            'amount' => 115000,
            'source' => ['type' => 'creditcard', 'transaction_url' => 'https://receipt.test'],
        ], 200),
    ]);
}

// ─── Bank transfer registration ────────────────────────────

test('full bank-transfer registration creates a pending tenant with a complete profile', function () {
    Storage::fake('public');
    $plan = flowPlan();

    walkWizardThroughOtp($this, $plan->id, 'bank@hotel.test', 'Bank Hotel');

    $this->post('/setup/payment-method', [
        'receipt' => UploadedFile::fake()->image('receipt.jpg'),
        'payment_notes' => 'Wire transfer sent',
    ])->assertRedirect('/setup/pending');

    $tenant = Tenant::where('email', 'bank@hotel.test')->first();
    expect($tenant)->not->toBeNull()
        ->and($tenant->payment_status)->toBe('pending')
        ->and($tenant->payment_method)->toBe('bank_transfer')
        ->and((bool) $tenant->is_active)->toBeFalse()
        ->and($tenant->bank_transfer_receipt)->not->toBeNull();

    // Registration must produce a complete tenant profile, not just a shell row.
    $this->assertDatabaseHas('users', [
        'email' => 'bank@hotel.test',
        'role' => 'client_admin',
        'tenant_id' => $tenant->id,
    ]);
    $this->assertDatabaseHas('hotel_settings', ['tenant_id' => $tenant->id]);
    $this->assertDatabaseHas('contact_settings', ['tenant_id' => $tenant->id]);
    // Sections are seeded by Tenant::booted() so the new site renders immediately.
    expect(\App\Models\SiteSection::where('tenant_id', $tenant->id)->count())->toBeGreaterThan(0);

    // No invoice yet — it is issued when the super-admin approves the transfer.
    expect(Invoice::where('tenant_id', $tenant->id)->count())->toBe(0);
});

// ─── Online (Moyasar) registration — redirect callback ─────

test('online payment registration activates the tenant and issues a paid invoice', function () {
    Storage::fake('public');
    fakeMoyasarPaid('inv_setup_online');
    $plan = flowPlan(['price' => 1000]);

    walkWizardThroughOtp($this, $plan->id, 'online@hotel.test', 'Online Hotel');

    // Kick off the hosted payment (creates the Moyasar invoice).
    $this->post('/setup/payment');
    Http::assertSent(fn ($req) => str_contains($req->url(), '/v1/invoices'));

    // Customer returns from Moyasar with the paid charge id.
    $this->get('/setup/payment-callback?id=inv_setup_online')
        ->assertRedirect('/setup/complete');

    $tenant = Tenant::where('payment_charge_id', 'inv_setup_online')->first();
    expect($tenant)->not->toBeNull()
        ->and($tenant->payment_status)->toBe('approved')
        ->and($tenant->payment_method)->toBe('moyasar')
        ->and((bool) $tenant->is_active)->toBeTrue()
        ->and($tenant->subscription_starts_at)->not->toBeNull()
        ->and($tenant->subscription_ends_at)->not->toBeNull();

    $invoice = Invoice::where('tenant_id', $tenant->id)->where('type', 'subscription')->first();
    expect($invoice)->not->toBeNull()
        ->and($invoice->status)->toBe('paid')
        ->and((float) $invoice->tax_amount)->toBe(0.0) // VAT removed app-wide
        ->and((float) $invoice->total)->toBe(1000.0);
});

// ─── Online (Moyasar) registration — server webhook ────────

test('setup payment webhook approves a pending online tenant', function () {
    $plan = flowPlan();
    $tenant = Tenant::factory()->create([
        'plan_id' => $plan->id,
        'payment_status' => 'pending',
        'payment_method' => 'moyasar',
        'payment_charge_id' => 'inv_hook',
        'is_active' => false,
        'subscription_starts_at' => null,
        'subscription_ends_at' => null,
    ]);

    $this->postJson('/webhooks/payment/setup', [
        'type' => 'payment_paid',
        'data' => ['id' => 'inv_hook', 'status' => 'paid'],
    ])->assertOk();

    $tenant->refresh();
    expect($tenant->payment_status)->toBe('approved')
        ->and((bool) $tenant->is_active)->toBeTrue()
        ->and($tenant->subscription_ends_at)->not->toBeNull();
});

// ─── Renewal — bank transfer ───────────────────────────────

test('client can request a renewal by bank transfer', function () {
    Storage::fake('public');
    $plan = flowPlan();
    $tenant = Tenant::factory()->create(['plan_id' => $plan->id, 'payment_status' => 'approved']);
    $owner = User::factory()->clientAdmin($tenant->id)->create();

    $this->actingAs($owner)
        ->post('/client-admin/renewal', [
            'receipt' => UploadedFile::fake()->create('receipt.pdf', 120, 'application/pdf'),
            'notes' => 'Renewal wire sent',
        ])->assertRedirect();

    $this->assertDatabaseHas('renewal_requests', [
        'tenant_id' => $tenant->id,
        'status' => 'pending',
        'payment_method' => 'bank_transfer',
    ]);
});

// ─── Renewal — online (Moyasar) ────────────────────────────

test('client can renew online and gets an extended subscription plus a renewal invoice', function () {
    fakeMoyasarPaid('inv_renew_online');
    $plan = flowPlan(['price' => 1000]);
    $tenant = Tenant::factory()->create([
        'plan_id' => $plan->id,
        'payment_status' => 'approved',
        'subscription_starts_at' => now()->subMonths(11),
        'subscription_ends_at' => now()->addMonth(),
    ]);
    $owner = User::factory()->clientAdmin($tenant->id)->create();
    $endBefore = $tenant->subscription_ends_at;

    // Start the hosted renewal payment.
    $this->actingAs($owner)->post('/client-admin/renewal/payment');
    $renewal = RenewalRequest::where('tenant_id', $tenant->id)->latest('id')->first();
    expect($renewal)->not->toBeNull()
        ->and($renewal->payment_method)->toBe('moyasar')
        ->and($renewal->payment_charge_id)->toBe('inv_renew_online');

    // Return from Moyasar as paid.
    $this->actingAs($owner)
        ->get('/client-admin/renewal/payment-callback?id=inv_renew_online')
        ->assertRedirect();

    $renewal->refresh();
    $tenant->refresh();
    expect($renewal->status)->toBe('approved')
        ->and($tenant->subscription_ends_at->greaterThan($endBefore))->toBeTrue();

    // Renewal invoices are subscription-typed but tagged in their notes.
    expect(Invoice::where('tenant_id', $tenant->id)
        ->where('notes_en', 'like', "%Renewal #{$renewal->id}%")
        ->count())->toBe(1);
});

// ─── Downstream: invoices + reports the client can see ─────

test('client sees issued invoices and can open the financial and subscription reports', function () {
    fakeMoyasarPaid('inv_setup_reports');
    flowPlan(['price' => 1000]);
    $plan = Plan::first();

    walkWizardThroughOtp($this, $plan->id, 'reports@hotel.test', 'Reports Hotel');
    $this->post('/setup/payment');
    $this->get('/setup/payment-callback?id=inv_setup_reports')->assertRedirect('/setup/complete');

    $tenant = Tenant::where('payment_charge_id', 'inv_setup_reports')->first();
    $owner = User::where('tenant_id', $tenant->id)->where('role', 'client_admin')->first();

    // The paid subscription invoice from registration shows in the client's list.
    $this->actingAs($owner)
        ->get('/client-admin/invoices')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/invoices/index')
            ->has('invoices.data', 1)
        );

    $this->actingAs($owner)
        ->get('/client-admin/reports/financial')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('client-admin/reports/Financial'));

    $this->actingAs($owner)
        ->get('/client-admin/reports/subscriptions')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/reports/Subscriptions')
            ->has('subscription.is_active')
        );
});
