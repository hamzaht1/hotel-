<?php

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Index ─────────────────────────────────────────────────

test('super admin can list plans', function () {
    $user = User::factory()->superAdmin()->create();

    Plan::unguard();
    Plan::create(['slug' => 'basic', 'name_ar' => 'أساسي', 'name_en' => 'Basic', 'price' => 100, 'billing_cycle' => 'yearly', 'sort_order' => 0, 'is_active' => true]);
    Plan::create(['slug' => 'pro', 'name_ar' => 'احترافي', 'name_en' => 'Professional', 'price' => 300, 'billing_cycle' => 'yearly', 'sort_order' => 1, 'is_active' => true]);
    Plan::reguard();

    $this->actingAs($user)
        ->get('/super-admin/plans')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/plans/index')
            ->has('plans.data', 2)
        );
});

// ─── Create ────────────────────────────────────────────────

test('super admin can view create plan form', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->get('/super-admin/plans/create')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('super-admin/plans/create'));
});

test('super admin can create a plan', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->post('/super-admin/plans', [
            'name_ar' => 'باقة ذهبية',
            'name_en' => 'Gold Plan',
            'slug' => 'gold-plan',
            'price' => 500.00,
            'billing_cycle' => 'yearly',
            'features_ar' => ['ميزة 1', 'ميزة 2'],
            'features_en' => ['Feature 1', 'Feature 2'],
            'sort_order' => 1,
            'is_active' => true,
        ])
        ->assertRedirect(route('super-admin.plans.index'));

    $this->assertDatabaseHas('plans', [
        'slug' => 'gold-plan',
        'name_en' => 'Gold Plan',
        'billing_cycle' => 'yearly',
    ]);
});

test('create plan validates required fields', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->post('/super-admin/plans', [])
        ->assertSessionHasErrors(['name_ar', 'name_en', 'slug', 'price', 'billing_cycle']);
});

test('create plan validates unique slug', function () {
    $user = User::factory()->superAdmin()->create();

    Plan::unguard();
    Plan::create(['slug' => 'taken-slug', 'name_ar' => 'test', 'name_en' => 'test', 'price' => 100, 'billing_cycle' => 'yearly', 'sort_order' => 0, 'is_active' => true]);
    Plan::reguard();

    $this->actingAs($user)
        ->post('/super-admin/plans', [
            'name_ar' => 'باقة',
            'name_en' => 'Plan',
            'slug' => 'taken-slug',
            'price' => 200,
            'billing_cycle' => 'monthly',
            'sort_order' => 0,
            'is_active' => true,
        ])
        ->assertSessionHasErrors('slug');
});

// ─── Update ────────────────────────────────────────────────

test('super admin can update a plan', function () {
    $user = User::factory()->superAdmin()->create();

    Plan::unguard();
    $plan = Plan::create(['slug' => 'old-plan', 'name_ar' => 'قديم', 'name_en' => 'Old', 'price' => 100, 'billing_cycle' => 'yearly', 'sort_order' => 0, 'is_active' => true]);
    Plan::reguard();

    $this->actingAs($user)
        ->put("/super-admin/plans/{$plan->id}", [
            'name_ar' => 'محدث',
            'name_en' => 'Updated',
            'slug' => 'old-plan',
            'price' => 250,
            'billing_cycle' => 'monthly',
            'sort_order' => 1,
            'is_active' => true,
        ])
        ->assertRedirect(route('super-admin.plans.index'));

    $plan->refresh();
    expect($plan->name_en)->toBe('Updated')
        ->and($plan->price)->toBe('250.00')
        ->and($plan->billing_cycle)->toBe('monthly');
});

// ─── Toggle Status ─────────────────────────────────────────

test('super admin can toggle plan status', function () {
    $user = User::factory()->superAdmin()->create();

    Plan::unguard();
    $plan = Plan::create(['slug' => 'toggle-plan', 'name_ar' => 'test', 'name_en' => 'test', 'price' => 100, 'billing_cycle' => 'yearly', 'sort_order' => 0, 'is_active' => true]);
    Plan::reguard();

    $this->actingAs($user)
        ->post("/super-admin/plans/{$plan->id}/toggle")
        ->assertRedirect();

    $plan->refresh();
    expect($plan->is_active)->toBeFalse();

    // Toggle back
    $this->actingAs($user)
        ->post("/super-admin/plans/{$plan->id}/toggle")
        ->assertRedirect();

    $plan->refresh();
    expect($plan->is_active)->toBeTrue();
});

// ─── Authorization ─────────────────────────────────────────

test('client admin cannot access plan management', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->clientAdmin($tenant->id)->create();

    $this->actingAs($user)->get('/super-admin/plans')->assertForbidden();
    $this->actingAs($user)->get('/super-admin/plans/create')->assertForbidden();
    $this->actingAs($user)->post('/super-admin/plans', [])->assertForbidden();
});
