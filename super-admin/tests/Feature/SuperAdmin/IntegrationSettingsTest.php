<?php

use App\Models\IntegrationSetting;
use App\Models\User;
use Illuminate\Support\Facades\Http;

/**
 * The Integrations page is what switches the live checkout in the main app, so
 * these tests cover the guarantees the main app relies on: one active payment
 * gateway at a time, no activation without credentials, and secrets that never
 * travel back to the browser in clear.
 */

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Helpers ───────────────────────────────────────────────

function storedIntegration(string $provider, array $credentials, bool $isActive = false): IntegrationSetting
{
    return IntegrationSetting::create([
        'tenant_id' => null,
        'provider' => $provider,
        'type' => 'payment',
        'credentials' => json_encode($credentials),
        'is_active' => $isActive,
    ]);
}

// ─── Index ─────────────────────────────────────────────────

test('super admin can view the integrations page with every known provider', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->get('/super-admin/integrations')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/integrations/index')
            ->has('providers', 3)
            ->where('activePaymentProvider', null)
        );
});

test('stored secrets are masked and never sent to the browser', function () {
    $user = User::factory()->superAdmin()->create();
    storedIntegration('moyasar', ['secret_key' => 'sk_test_abcdef123456', 'publishable_key' => 'pk_test_public']);

    $response = $this->actingAs($user)->get('/super-admin/integrations');

    $response->assertInertia(function ($page) {
        $moyasar = collect($page->toArray()['props']['providers'])->firstWhere('provider', 'moyasar');
        $secret = collect($moyasar['fields'])->firstWhere('key', 'secret_key');
        $publishable = collect($moyasar['fields'])->firstWhere('key', 'publishable_key');

        expect($secret['value'])->toBeNull()
            ->and($secret['masked'])->toBe('sk_test_••••3456')
            ->and($secret['filled'])->toBeTrue()
            // The publishable key is public by design, so it round-trips in clear.
            ->and($publishable['value'])->toBe('pk_test_public');
    });

    // Belt and braces: the raw secret must not appear anywhere in the payload.
    expect($response->content())->not->toContain('sk_test_abcdef123456');
});

test('test mode is derived from the stored key rather than a separate toggle', function () {
    $user = User::factory()->superAdmin()->create();
    storedIntegration('moyasar', ['secret_key' => 'sk_test_abcdef123456']);
    storedIntegration('tap', ['secret_key' => 'sk_live_abcdef123456']);

    $this->actingAs($user)
        ->get('/super-admin/integrations')
        ->assertInertia(function ($page) {
            $providers = collect($page->toArray()['props']['providers'])->keyBy('provider');

            expect($providers['moyasar']['test_mode'])->toBeTrue()
                ->and($providers['tap']['test_mode'])->toBeFalse()
                // No key stored at all → nothing to report.
                ->and($providers['unifonic']['test_mode'])->toBeNull();
        });
});

// ─── Saving credentials ────────────────────────────────────

test('super admin can save credentials and activate a gateway', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->put('/super-admin/integrations/moyasar', [
            'credentials' => ['secret_key' => 'sk_test_new', 'publishable_key' => 'pk_test_new'],
            'is_active' => true,
        ])->assertRedirect();

    $setting = IntegrationSetting::whereNull('tenant_id')->where('provider', 'moyasar')->first();

    expect($setting)->not->toBeNull()
        ->and($setting->type)->toBe('payment')
        ->and((bool) $setting->is_active)->toBeTrue()
        ->and(json_decode($setting->credentials, true))
        ->toBe(['secret_key' => 'sk_test_new', 'publishable_key' => 'pk_test_new']);
});

test('an empty secret field keeps the stored secret', function () {
    $user = User::factory()->superAdmin()->create();
    storedIntegration('moyasar', ['secret_key' => 'sk_test_keepme', 'publishable_key' => 'pk_old']);

    $this->actingAs($user)
        ->put('/super-admin/integrations/moyasar', [
            'credentials' => ['secret_key' => '', 'publishable_key' => 'pk_new'],
            'is_active' => false,
        ])->assertRedirect();

    $credentials = json_decode(
        IntegrationSetting::whereNull('tenant_id')->where('provider', 'moyasar')->first()->credentials,
        true
    );

    expect($credentials['secret_key'])->toBe('sk_test_keepme')
        ->and($credentials['publishable_key'])->toBe('pk_new');
});

test('a non-secret field can be cleared', function () {
    $user = User::factory()->superAdmin()->create();
    storedIntegration('moyasar', ['secret_key' => 'sk_test_keepme', 'publishable_key' => 'pk_old']);

    $this->actingAs($user)
        ->put('/super-admin/integrations/moyasar', [
            'credentials' => ['secret_key' => '', 'publishable_key' => ''],
        ])->assertRedirect();

    $credentials = json_decode(
        IntegrationSetting::whereNull('tenant_id')->where('provider', 'moyasar')->first()->credentials,
        true
    );

    expect($credentials)->toBe(['secret_key' => 'sk_test_keepme']);
});

test('activating a gateway without credentials is refused', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->put('/super-admin/integrations/tap', [
            'credentials' => ['secret_key' => ''],
            'is_active' => true,
        ])->assertSessionHasErrors('credentials');

    expect(IntegrationSetting::whereNull('tenant_id')->where('is_active', true)->count())->toBe(0);
});

test('activating a gateway deactivates the other payment gateways', function () {
    $user = User::factory()->superAdmin()->create();
    storedIntegration('moyasar', ['secret_key' => 'sk_test_moyasar'], true);

    $this->actingAs($user)
        ->put('/super-admin/integrations/tap', [
            'credentials' => ['secret_key' => 'sk_test_tap'],
            'is_active' => true,
        ])->assertRedirect();

    $active = IntegrationSetting::whereNull('tenant_id')->where('is_active', true)->pluck('provider');

    expect($active->all())->toBe(['tap']);
});

test('activating the SMS provider leaves the payment gateway alone', function () {
    $user = User::factory()->superAdmin()->create();
    storedIntegration('moyasar', ['secret_key' => 'sk_test_moyasar'], true);

    $this->actingAs($user)
        ->put('/super-admin/integrations/unifonic', [
            'credentials' => ['app_sid' => 'sid_123456789', 'sender_id' => 'Diyafah'],
            'is_active' => true,
        ])->assertRedirect();

    $active = IntegrationSetting::whereNull('tenant_id')->where('is_active', true)->pluck('provider')->sort()->values();

    expect($active->all())->toBe(['moyasar', 'unifonic']);
});

test('the provider type cannot be moved by the request', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->put('/super-admin/integrations/unifonic', [
            'type' => 'payment',
            'credentials' => ['app_sid' => 'sid_123456789'],
        ])->assertRedirect();

    expect(IntegrationSetting::whereNull('tenant_id')->where('provider', 'unifonic')->first()->type)
        ->toBe('sms');
});

test('an unknown provider is rejected', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->put('/super-admin/integrations/stripe', [
            'credentials' => ['secret_key' => 'sk_test_x'],
            'is_active' => true,
        ])->assertRedirect();

    expect(IntegrationSetting::count())->toBe(0);
});

// ─── Connection test ───────────────────────────────────────

test('the connection test reports success when the gateway accepts the key', function () {
    $user = User::factory()->superAdmin()->create();
    storedIntegration('moyasar', ['secret_key' => 'sk_test_valid']);
    Http::fake(['api.moyasar.com/*' => Http::response(['payments' => []], 200)]);

    $this->actingAs($user)
        ->postJson('/super-admin/integrations/moyasar/test')
        ->assertOk()
        ->assertJson(['success' => true, 'test_mode' => true]);
});

test('the connection test reports a rejected key', function () {
    $user = User::factory()->superAdmin()->create();
    storedIntegration('moyasar', ['secret_key' => 'sk_live_wrong']);
    Http::fake(['api.moyasar.com/*' => Http::response(['message' => 'Unauthorized'], 401)]);

    $this->actingAs($user)
        ->postJson('/super-admin/integrations/moyasar/test')
        ->assertOk()
        ->assertJson(['success' => false, 'test_mode' => false]);
});

test('the connection test reports missing credentials without calling the API', function () {
    $user = User::factory()->superAdmin()->create();
    Http::fake();

    $this->actingAs($user)
        ->postJson('/super-admin/integrations/moyasar/test')
        ->assertOk()
        ->assertJson(['success' => false]);

    Http::assertNothingSent();
});

test('a Tap key that only fails on the probe id counts as accepted', function () {
    $user = User::factory()->superAdmin()->create();
    storedIntegration('tap', ['secret_key' => 'sk_test_tap']);
    Http::fake(['api.tap.company/*' => Http::response(['errors' => [['code' => '1104']]], 400)]);

    $this->actingAs($user)
        ->postJson('/super-admin/integrations/tap/test')
        ->assertOk()
        ->assertJson(['success' => true]);
});

test('the connection test is not offered for SMS providers', function () {
    $user = User::factory()->superAdmin()->create();
    storedIntegration('unifonic', ['app_sid' => 'sid_123456789']);

    $this->actingAs($user)
        ->postJson('/super-admin/integrations/unifonic/test')
        ->assertStatus(422)
        ->assertJson(['success' => false]);
});
