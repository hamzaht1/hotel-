<?php

use App\Models\IntegrationSetting;
use App\Models\Plan;
use App\Models\Tenant;
use App\Services\MoyasarPaymentService;
use App\Services\PaymentGatewayManager;
use App\Services\TapPaymentService;
use Illuminate\Support\Facades\Http;

/**
 * The super-admin picks the live payment gateway from its Integrations page
 * (integration_settings, tenant_id = null, type = "payment"). These tests pin
 * down that the checkout actually follows that choice — including the
 * credentials it stores — and falls back to .env when nothing is active.
 */

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Helpers ───────────────────────────────────────────────

function activateGateway(string $provider, array $credentials): IntegrationSetting
{
    return IntegrationSetting::create([
        'tenant_id' => null,
        'provider' => $provider,
        'type' => 'payment',
        'credentials' => json_encode($credentials),
        'is_active' => true,
    ]);
}

function gatewayPlan(): Plan
{
    return Plan::create([
        'slug' => 'growth',
        'name_ar' => 'نمو',
        'name_en' => 'Growth',
        'price' => 1000.00,
        'billing_cycle' => 'yearly',
        'is_active' => true,
        'sort_order' => 1,
    ]);
}

/** Walk the wizard to the payment step (mirrors RegistrationPaymentFlowTest). */
function wizardToPayment($t, int $planId, string $email): void
{
    $t->post('/setup/plan', ['plan_id' => $planId]);
    $t->post('/setup/template', ['template_id' => 'madina', 'template_title' => 'Al Madina']);
    $t->post('/setup/org', ['org_name_ar' => 'فندق تجريبي', 'org_name_en' => 'Gateway Hotel']);
    $t->post('/setup/account', [
        'username' => 'owner',
        'email' => $email,
        'password' => 'password123',
        'first_name' => 'Sara',
        'last_name' => 'Owner',
        'city' => 'Riyadh',
        'phone' => '0500000000',
    ]);
    $t->post('/setup/verify-otp', ['otp' => session('setup.otp_code')]);
}

// ─── Resolution ────────────────────────────────────────────

test('the active integration row decides which gateway is used', function () {
    activateGateway('tap', ['secret_key' => 'sk_test_tap']);

    expect(app(PaymentGatewayManager::class)->gateway())->toBeInstanceOf(TapPaymentService::class);
});

test('checkout falls back to the env gateway when no integration is active', function () {
    // phpunit.xml only configures Moyasar keys.
    expect(app(PaymentGatewayManager::class)->gateway())->toBeInstanceOf(MoyasarPaymentService::class);
});

test('an active row with blank credentials falls back instead of breaking checkout', function () {
    activateGateway('tap', ['secret_key' => '']);

    expect(app(PaymentGatewayManager::class)->gateway())->toBeInstanceOf(MoyasarPaymentService::class);
});

test('an inactive row is ignored', function () {
    activateGateway('tap', ['secret_key' => 'sk_test_tap'])->update(['is_active' => false]);

    expect(app(PaymentGatewayManager::class)->gateway())->toBeInstanceOf(MoyasarPaymentService::class);
});

test('activating a gateway is scoped to the platform, not to a tenant', function () {
    $tenant = Tenant::factory()->create();
    IntegrationSetting::create([
        'tenant_id' => $tenant->id,
        'provider' => 'tap',
        'type' => 'payment',
        'credentials' => json_encode(['secret_key' => 'sk_test_tenant']),
        'is_active' => true,
    ]);

    expect(app(PaymentGatewayManager::class)->gateway())->toBeInstanceOf(MoyasarPaymentService::class);
});

// ─── Stored credentials are the ones used ──────────────────

test('the stored secret key is the one sent to the gateway', function () {
    activateGateway('moyasar', ['secret_key' => 'sk_test_from_db', 'publishable_key' => 'pk_test_from_db']);

    Http::fake([
        'api.moyasar.com/v1/invoices' => Http::response(['id' => 'inv_db', 'url' => 'https://pay.test/1'], 200),
    ]);

    $plan = gatewayPlan();
    wizardToPayment($this, $plan->id, 'creds@hotel.test');
    $this->post('/setup/payment');

    Http::assertSent(function ($request) {
        // Basic auth = base64("secret:")
        return str_contains($request->url(), '/v1/invoices')
            && $request->header('Authorization')[0] === 'Basic ' . base64_encode('sk_test_from_db:');
    });
});

test('the publishable key handed to the payment screen comes from the stored row', function () {
    activateGateway('moyasar', ['secret_key' => 'sk_test_db', 'publishable_key' => 'pk_test_db']);

    $plan = gatewayPlan();
    wizardToPayment($this, $plan->id, 'pk@hotel.test');

    $this->get('/setup/payment-method')
        ->assertInertia(fn ($page) => $page
            ->where('paymentGateway.provider', 'moyasar')
            ->where('paymentGateway.publishable_key', 'pk_test_db')
            ->where('paymentGateway.configured', true)
            ->where('paymentGateway.supports_inline', true)
            ->where('paymentGateway.test_mode', true)
        );
});

// ─── Tap end-to-end ────────────────────────────────────────

test('a Tap checkout redirects to Tap and records tap as the payment method', function () {
    activateGateway('tap', ['secret_key' => 'sk_test_tap']);

    Http::fake([
        'api.tap.company/v2/charges' => Http::response([
            'id' => 'chg_setup',
            'status' => 'INITIATED',
            'transaction' => ['url' => 'https://checkout.tap.test/chg_setup'],
        ], 200),
        'api.tap.company/v2/charges/*' => Http::response([
            'id' => 'chg_setup',
            'status' => 'CAPTURED',
            'amount' => 1000,
            'source' => ['payment_method' => 'VISA'],
        ], 200),
    ]);

    $plan = gatewayPlan();
    wizardToPayment($this, $plan->id, 'tap@hotel.test');

    $this->post('/setup/payment');
    Http::assertSent(fn ($request) => str_contains($request->url(), '/v2/charges')
        && $request->header('Authorization')[0] === 'Bearer sk_test_tap');

    // Tap returns the charge id as `tap_id`, not `id`.
    $this->get('/setup/payment-callback?tap_id=chg_setup')
        ->assertRedirect('/setup/complete');

    $tenant = Tenant::where('payment_charge_id', 'chg_setup')->first();
    expect($tenant)->not->toBeNull()
        ->and($tenant->payment_method)->toBe('tap')
        ->and($tenant->payment_status)->toBe('approved')
        ->and((bool) $tenant->is_active)->toBeTrue();
});

test('a Tap screen offers the hosted redirect rather than an inline form', function () {
    activateGateway('tap', ['secret_key' => 'sk_test_tap']);

    $plan = gatewayPlan();
    wizardToPayment($this, $plan->id, 'tapui@hotel.test');

    $this->get('/setup/payment-method')
        ->assertInertia(fn ($page) => $page
            ->where('paymentGateway.provider', 'tap')
            ->where('paymentGateway.supports_inline', false)
            ->where('paymentGateway.configured', true)
        );
});

// ─── Secret containment ────────────────────────────────────

test('the client integrations page never exposes the platform gateway secrets', function () {
    activateGateway('moyasar', ['secret_key' => 'sk_live_supersecret', 'publishable_key' => 'pk_live_x']);

    $tenant = Tenant::factory()->create();
    $owner = \App\Models\User::factory()->clientAdmin($tenant->id)->create();

    $response = $this->actingAs($owner)->get('/client-admin/integrations')->assertOk();

    expect($response->content())->not->toContain('sk_live_supersecret')
        ->and($response->content())->not->toContain('credentials');
});

// ─── Webhook status normalisation ──────────────────────────

test('the setup webhook accepts Tap CAPTURED as paid', function () {
    activateGateway('tap', ['secret_key' => 'sk_test_tap']);

    $plan = gatewayPlan();
    $tenant = Tenant::factory()->create([
        'plan_id' => $plan->id,
        'payment_status' => 'pending',
        'payment_method' => 'tap',
        'payment_charge_id' => 'chg_hook',
        'is_active' => false,
        'subscription_ends_at' => null,
    ]);

    $this->postJson('/webhooks/payment/setup', [
        'data' => ['id' => 'chg_hook', 'status' => 'CAPTURED'],
    ])->assertOk();

    $tenant->refresh();
    expect($tenant->payment_status)->toBe('approved')
        ->and((bool) $tenant->is_active)->toBeTrue();
});

test('the setup webhook ignores a Tap status that is not a capture', function () {
    activateGateway('tap', ['secret_key' => 'sk_test_tap']);

    $tenant = Tenant::factory()->create([
        'payment_status' => 'pending',
        'payment_method' => 'tap',
        'payment_charge_id' => 'chg_declined',
        'is_active' => false,
    ]);

    $this->postJson('/webhooks/payment/setup', [
        'data' => ['id' => 'chg_declined', 'status' => 'DECLINED'],
    ])->assertOk();

    expect($tenant->refresh()->payment_status)->toBe('pending');
});
