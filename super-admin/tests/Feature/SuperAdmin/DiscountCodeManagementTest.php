<?php

use App\Models\DiscountCode;
use App\Models\Plan;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Index ─────────────────────────────────────────────────

test('super admin can list discount codes', function () {
    $user = User::factory()->superAdmin()->create();

    DiscountCode::unguard();
    DiscountCode::create(['code' => 'SAVE10', 'type' => 'percentage', 'value' => 10, 'is_active' => true]);
    DiscountCode::create(['code' => 'FLAT50', 'type' => 'fixed', 'value' => 50, 'is_active' => true]);
    DiscountCode::reguard();

    $this->actingAs($user)
        ->get('/super-admin/discount-codes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/discount-codes/index')
            ->has('codes.data', 2)
        );
});

// ─── Create ────────────────────────────────────────────────

test('super admin can create a discount code', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->post('/super-admin/discount-codes', [
            'code' => 'WELCOME20',
            'type' => 'percentage',
            'value' => 20,
            'max_uses' => 100,
            'valid_from' => '2026-01-01',
            'valid_until' => '2026-12-31',
            'is_active' => true,
        ])
        ->assertRedirect(route('super-admin.discount-codes.index'));

    $this->assertDatabaseHas('discount_codes', [
        'code' => 'WELCOME20',
        'type' => 'percentage',
    ]);
});

test('create discount code validates required fields', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->post('/super-admin/discount-codes', [])
        ->assertSessionHasErrors(['code', 'type', 'value']);
});

test('discount code is auto-uppercased on store', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->post('/super-admin/discount-codes', [
            'code' => 'lowercase',
            'type' => 'fixed',
            'value' => 25,
            'is_active' => true,
        ])
        ->assertRedirect(route('super-admin.discount-codes.index'));

    $this->assertDatabaseHas('discount_codes', [
        'code' => 'LOWERCASE',
    ]);
});

// ─── Update ────────────────────────────────────────────────

test('super admin can update a discount code', function () {
    $user = User::factory()->superAdmin()->create();

    DiscountCode::unguard();
    $code = DiscountCode::create(['code' => 'OLD10', 'type' => 'percentage', 'value' => 10, 'is_active' => true]);
    DiscountCode::reguard();

    $this->actingAs($user)
        ->put("/super-admin/discount-codes/{$code->id}", [
            'code' => 'NEW25',
            'type' => 'fixed',
            'value' => 25,
            'is_active' => true,
        ])
        ->assertRedirect(route('super-admin.discount-codes.index'));

    $code->refresh();
    expect($code->code)->toBe('NEW25')
        ->and($code->type)->toBe('fixed')
        ->and($code->value)->toBe('25.00');
});

// ─── Toggle Status ─────────────────────────────────────────

test('super admin can toggle discount code status', function () {
    $user = User::factory()->superAdmin()->create();

    DiscountCode::unguard();
    $code = DiscountCode::create(['code' => 'TOGGLE', 'type' => 'percentage', 'value' => 15, 'is_active' => true]);
    DiscountCode::reguard();

    $this->actingAs($user)
        ->post("/super-admin/discount-codes/{$code->id}/toggle")
        ->assertRedirect();

    $code->refresh();
    expect($code->is_active)->toBeFalse();

    // Toggle back
    $this->actingAs($user)
        ->post("/super-admin/discount-codes/{$code->id}/toggle")
        ->assertRedirect();

    $code->refresh();
    expect($code->is_active)->toBeTrue();
});
