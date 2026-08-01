<?php

use App\Models\Plan;
use App\Models\SiteSetting;
use App\Models\Tenant;
use App\Support\RegistrationForm;

/**
 * Official establishment data moved off the org step and onto the payment page.
 * These tests pin down where it is now collected, that a required field can't be
 * paid around, and that it still reaches hotel_settings when the tenant is born.
 */

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function setupPlan(): Plan
{
    return Plan::create([
        'slug' => 'starter', 'name_ar' => 'انطلاقة', 'name_en' => 'Starter',
        'price' => 820, 'billing_cycle' => 'yearly', 'is_active' => true, 'sort_order' => 1,
    ]);
}

/** A wizard session sitting on the payment step, everything before it done. */
function checkoutSession(array $overrides = []): void
{
    session(['setup' => array_merge([
        'plan_id' => setupPlan()->id,
        'plan_key' => 'starter',
        'plan_name' => 'انطلاقة',
        'template_id' => 'madina',
        'template_title' => 'Al Madina',
        'org_name_ar' => 'فندق تجريبي',
        'org_name_en' => 'Test Hotel',
        'slug' => 'test-hotel',
        'username' => 'testuser',
        'email' => 'test@example.com',
        'password' => 'password123',
        'otp_verified' => true,
    ], $overrides)]);
}

/** Override the admin's field config for the given establishment keys. */
function establishmentConfig(array $fields): void
{
    SiteSetting::set(RegistrationForm::SETTING_KEY, json_encode(['fields' => $fields]));
}

const ESTABLISHMENT_PAYLOAD = [
    'commercial_activity' => 'Hotel',
    'branches_count' => '3',
    'manager_type' => 'owner',
    'responsible_position' => 'General Manager',
    'cr_number' => '1010101010',
    'vat_number' => '300000000000003',
    'license_number' => 'TL-4455',
    'license_expiry' => '2027-01-31',
    'municipality_license_number' => 'BL-9911',
    'municipality_license_expiry' => '2027-06-30',
];

// ─── Where the section lives now ───────────────────────────

test('the payment page ships the establishment field config', function () {
    checkoutSession();

    $this->get('/setup/payment-method')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/setup/PaymentMethod')
            ->has('formConfig.fields.cr_number')
            ->where('formConfig.fields.cr_number.step', 'payment')
        );
});

test('the org step ignores establishment data posted to it', function () {
    $this->post('/setup/org', array_merge([
        'org_name_ar' => 'فندق تجريبي',
        'org_name_en' => 'Test Hotel',
    ], ESTABLISHMENT_PAYLOAD))->assertRedirect('/setup/account');

    expect(session('setup.cr_number'))->toBeNull();
    expect(session('setup.org_name_en'))->toBe('Test Hotel');
});

// ─── Saving from the payment page ──────────────────────────

test('establishment data posted from the payment page lands in the session', function () {
    checkoutSession();

    $this->post('/setup/establishment', ESTABLISHMENT_PAYLOAD)->assertSessionHasNoErrors();

    expect(session('setup.cr_number'))->toBe('1010101010');
    expect(session('setup.manager_type'))->toBe('owner');
    expect(session('setup.branches_count'))->toBe('3');
});

test('a disabled field is never stored, even when posted', function () {
    establishmentConfig(['cr_number' => ['enabled' => false, 'required' => false]]);
    checkoutSession();

    $this->post('/setup/establishment', ESTABLISHMENT_PAYLOAD)->assertSessionHasNoErrors();

    expect(session('setup.cr_number'))->toBeNull();
    expect(session('setup.vat_number'))->toBe('300000000000003');
});

test('the establishment endpoint refuses a session that has not verified its OTP', function () {
    session(['setup' => ['email' => 'test@example.com']]);

    $this->post('/setup/establishment', ESTABLISHMENT_PAYLOAD)
        ->assertRedirect('/setup/account');

    expect(session('setup.cr_number'))->toBeNull();
});

test('a bad value is rejected rather than stored', function () {
    checkoutSession();

    $this->post('/setup/establishment', ['license_expiry' => 'not-a-date'])
        ->assertSessionHasErrors('license_expiry');

    expect(session('setup.license_expiry'))->toBeNull();
});

// ─── Paying with the section filled in ─────────────────────

test('bank transfer carries the establishment data onto the new tenant', function () {
    checkoutSession();
    \Illuminate\Support\Facades\Storage::fake('public');

    $this->post('/setup/payment-method', array_merge([
        'receipt' => \Illuminate\Http\UploadedFile::fake()->image('receipt.jpg'),
        'payment_notes' => 'Test payment',
    ], ESTABLISHMENT_PAYLOAD))->assertRedirect('/setup/pending');

    $tenant = Tenant::where('slug', 'test-hotel')->firstOrFail();

    $this->assertDatabaseHas('hotel_settings', [
        'tenant_id' => $tenant->id,
        'commercial_activity' => 'Hotel',
        'cr_number' => '1010101010',
        'license_number' => 'TL-4455',
        'municipality_license_number' => 'BL-9911',
    ]);
});

test('a required establishment field blocks the bank transfer', function () {
    establishmentConfig(['cr_number' => ['enabled' => true, 'required' => true]]);
    checkoutSession();
    \Illuminate\Support\Facades\Storage::fake('public');

    $this->post('/setup/payment-method', [
        'receipt' => \Illuminate\Http\UploadedFile::fake()->image('receipt.jpg'),
    ])->assertSessionHasErrors('cr_number');

    expect(Tenant::where('slug', 'test-hotel')->exists())->toBeFalse();
});

test('a required establishment field blocks starting an online payment', function () {
    establishmentConfig(['cr_number' => ['enabled' => true, 'required' => true]]);
    checkoutSession();

    $this->post('/setup/payment', [])->assertSessionHasErrors('cr_number');
});

test('data saved before an online payment survives to the tenant', function () {
    checkoutSession();

    // What the page does while the client fills the section in, before the
    // inline card form hands them to the gateway.
    $this->post('/setup/establishment', ESTABLISHMENT_PAYLOAD);

    // The callback then builds the tenant from the session alone.
    expect(session('setup.commercial_activity'))->toBe('Hotel');
    expect(session('setup.municipality_license_expiry'))->toBe('2027-06-30');
});
