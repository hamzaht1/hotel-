<?php

use App\Models\Plan;
use App\Models\RenewalRequest;
use App\Models\Tenant;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Index ─────────────────────────────────────────────────

test('super admin can list renewal requests', function () {
    $user = User::factory()->superAdmin()->create();
    $tenant = Tenant::factory()->create();

    Plan::unguard();
    $plan = Plan::create(['slug' => 'basic', 'name_ar' => 'أساسي', 'name_en' => 'Basic', 'price' => 100, 'billing_cycle' => 'yearly', 'sort_order' => 0, 'is_active' => true]);
    Plan::reguard();

    RenewalRequest::unguard();
    RenewalRequest::create(['tenant_id' => $tenant->id, 'plan_id' => $plan->id, 'status' => 'pending', 'requested_at' => now()]);
    RenewalRequest::create(['tenant_id' => $tenant->id, 'plan_id' => $plan->id, 'status' => 'pending', 'requested_at' => now()]);
    RenewalRequest::reguard();

    $this->actingAs($user)
        ->get('/super-admin/renewals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/renewals/index')
            ->has('renewals.data', 2)
        );
});

// ─── Approve ───────────────────────────────────────────────

test('super admin can approve a renewal and extend subscription', function () {
    $user = User::factory()->superAdmin()->create();
    $tenant = Tenant::factory()->create([
        'subscription_ends_at' => now()->addMonths(2),
    ]);

    Plan::unguard();
    $plan = Plan::create(['slug' => 'pro', 'name_ar' => 'احترافي', 'name_en' => 'Pro', 'price' => 300, 'billing_cycle' => 'yearly', 'sort_order' => 0, 'is_active' => true]);
    Plan::reguard();

    RenewalRequest::unguard();
    $renewal = RenewalRequest::create([
        'tenant_id' => $tenant->id,
        'plan_id' => $plan->id,
        'status' => 'pending',
        'requested_at' => now(),
    ]);
    RenewalRequest::reguard();

    $originalEnd = $tenant->subscription_ends_at;

    $this->actingAs($user)
        ->post("/super-admin/renewals/{$renewal->id}/approve")
        ->assertRedirect();

    $renewal->refresh();
    expect($renewal->status)->toBe('approved')
        ->and($renewal->processed_at)->not->toBeNull()
        ->and($renewal->processed_by)->toBe($user->id);

    $tenant->refresh();
    expect($tenant->subscription_ends_at->gt($originalEnd))->toBeTrue()
        ->and($tenant->is_active)->toBeTrue();
});

// ─── Reject ────────────────────────────────────────────────

test('super admin can reject a renewal with reason', function () {
    $user = User::factory()->superAdmin()->create();
    $tenant = Tenant::factory()->create();

    Plan::unguard();
    $plan = Plan::create(['slug' => 'basic', 'name_ar' => 'أساسي', 'name_en' => 'Basic', 'price' => 100, 'billing_cycle' => 'yearly', 'sort_order' => 0, 'is_active' => true]);
    Plan::reguard();

    RenewalRequest::unguard();
    $renewal = RenewalRequest::create([
        'tenant_id' => $tenant->id,
        'plan_id' => $plan->id,
        'status' => 'pending',
        'requested_at' => now(),
    ]);
    RenewalRequest::reguard();

    $this->actingAs($user)
        ->post("/super-admin/renewals/{$renewal->id}/reject", [
            'reason' => 'Invalid payment receipt',
        ])
        ->assertRedirect();

    $renewal->refresh();
    expect($renewal->status)->toBe('rejected')
        ->and($renewal->notes)->toBe('Invalid payment receipt')
        ->and($renewal->processed_at)->not->toBeNull()
        ->and($renewal->processed_by)->toBe($user->id);
});
