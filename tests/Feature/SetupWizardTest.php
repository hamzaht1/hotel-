<?php

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Plan Step ─────────────────────────────────────────────

test('setup plan page loads', function () {
    $this->get('/setup/plan')->assertOk();
});

test('can store plan choice in session', function () {
    $plan = Plan::create([
        'slug' => 'starter', 'name_ar' => 'انطلاقة', 'name_en' => 'Starter',
        'price' => 820, 'billing_cycle' => 'yearly', 'is_active' => true, 'sort_order' => 1,
    ]);

    $this->post('/setup/plan', ['plan_id' => $plan->id])
        ->assertRedirect('/setup/template');

    expect(session('setup.plan_key'))->toBe('starter');
});

test('plan validation rejects invalid plan id', function () {
    $this->post('/setup/plan', ['plan_id' => 999999])
        ->assertSessionHasErrors('plan_id');
});

// ─── Template Step ─────────────────────────────────────────

test('setup template page loads', function () {
    $this->get('/setup/template')->assertOk();
});

test('can store template choice in session', function () {
    $this->post('/setup/template', [
        'template_id' => 'madina',
        'template_title' => 'Al Madina',
    ])->assertRedirect('/setup/org');

    expect(session('setup.template_id'))->toBe('madina');
});

// ─── Org Step ──────────────────────────────────────────────

test('setup org page loads', function () {
    $this->get('/setup/org')->assertOk();
});

test('can store org info in session', function () {
    $this->post('/setup/org', [
        'org_name_ar' => 'فندق تجريبي',
        'org_name_en' => 'Test Hotel',
    ])->assertRedirect('/setup/account');

    expect(session('setup.org_name_en'))->toBe('Test Hotel');
    expect(session('setup.slug'))->toBe('test-hotel');
});

test('org rejects duplicate slug', function () {
    Tenant::factory()->create(['slug' => 'test-hotel']);

    $this->post('/setup/org', [
        'org_name_ar' => 'فندق تجريبي',
        'org_name_en' => 'Test Hotel',
    ])->assertSessionHasErrors('org_name_en');
});

// ─── Account Step ──────────────────────────────────────────

test('setup account page loads', function () {
    $this->get('/setup/account')->assertOk();
});

test('can store account info and generate OTP', function () {
    $this->post('/setup/account', [
        'username' => 'testuser',
        'email' => 'test@example.com',
        'password' => 'password123',
        // first_name/last_name/city/phone are required by the default form config.
        'first_name' => 'Sara',
        'last_name' => 'Owner',
        'city' => 'Riyadh',
        'phone' => '0500000000',
    ])->assertRedirect('/setup/verify-otp');

    expect(session('setup.email'))->toBe('test@example.com');
    expect(session('setup.otp_code'))->toHaveLength(6);
});

test('account rejects duplicate email', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->post('/setup/account', [
        'username' => 'testuser',
        'email' => 'taken@example.com',
        'password' => 'password123',
    ])->assertSessionHasErrors('email');
});

test('account rejects short password', function () {
    $this->post('/setup/account', [
        'username' => 'testuser',
        'email' => 'test@example.com',
        'password' => '123',
    ])->assertSessionHasErrors('password');
});

// ─── OTP Verification ──────────────────────────────────────

test('verify otp page redirects if no email in session', function () {
    $this->get('/setup/verify-otp')->assertRedirect('/setup/account');
});

test('can verify correct OTP', function () {
    session(['setup' => [
        'email' => 'test@example.com',
        'otp_code' => '123456',
        'otp_expires_at' => now()->addMinutes(10)->toISOString(),
    ]]);

    $this->post('/setup/verify-otp', ['otp' => '123456'])
        ->assertRedirect('/setup/review');

    expect(session('setup.otp_verified'))->toBeTrue();
});

test('wrong OTP is rejected', function () {
    session(['setup' => [
        'email' => 'test@example.com',
        'otp_code' => '123456',
        'otp_expires_at' => now()->addMinutes(10)->toISOString(),
    ]]);

    $this->post('/setup/verify-otp', ['otp' => '000000'])
        ->assertSessionHasErrors('otp');
});

test('expired OTP is rejected', function () {
    session(['setup' => [
        'email' => 'test@example.com',
        'otp_code' => '123456',
        'otp_expires_at' => now()->subMinute()->toISOString(),
    ]]);

    $this->post('/setup/verify-otp', ['otp' => '123456'])
        ->assertSessionHasErrors('otp');
});

// ─── Review Step ───────────────────────────────────────────

test('review page redirects if OTP not verified', function () {
    session(['setup' => ['email' => 'test@test.com']]);
    $this->get('/setup/review')->assertRedirect('/setup/verify-otp');
});

test('review page loads when OTP verified', function () {
    session(['setup' => [
        'email' => 'test@test.com',
        'otp_verified' => true,
        'plan_key' => 'starter',
    ]]);

    $this->get('/setup/review')->assertOk();
});

// ─── Payment Step ──────────────────────────────────────────

test('payment page loads when OTP verified', function () {
    session(['setup' => [
        'email' => 'test@test.com',
        'otp_verified' => true,
    ]]);

    $this->get('/setup/payment-method')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/setup/PaymentMethod')
            ->has('bankDetails')
        );
});

test('can submit payment with receipt and create tenant', function () {
    session(['setup' => [
        'plan_key' => 'starter',
        'template_id' => 'madina',
        'template_title' => 'Al Madina',
        'org_name_ar' => 'فندق تجريبي',
        'org_name_en' => 'Test Hotel',
        'slug' => 'test-hotel',
        'username' => 'testuser',
        'email' => 'test@example.com',
        'password' => 'password123',
        'otp_verified' => true,
    ]]);

    $receipt = \Illuminate\Http\UploadedFile::fake()->image('receipt.jpg');

    $this->post('/setup/payment-method', [
        'receipt' => $receipt,
        'payment_notes' => 'Test payment',
    ])->assertRedirect('/setup/pending');

    $this->assertDatabaseHas('tenants', [
        'slug' => 'test-hotel',
        'template' => 'madina',
        'payment_status' => 'pending',
        'is_active' => false,
    ]);

    $this->assertDatabaseHas('users', [
        'email' => 'test@example.com',
        'role' => 'client_admin',
    ]);
});

// ─── Pending Page ──────────────────────────────────────────

test('pending page loads', function () {
    $this->get('/setup/pending')->assertOk();
});
