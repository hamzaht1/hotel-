<?php

use App\Models\Tenant;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Index ─────────────────────────────────────────────────

test('super admin can list tenants', function () {
    $user = User::factory()->superAdmin()->create();
    Tenant::factory()->count(3)->create();

    $this->actingAs($user)
        ->get('/super-admin/tenants')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/tenants/index')
            ->has('tenants.data', 3)
        );
});

test('tenants can be searched by name', function () {
    $user = User::factory()->superAdmin()->create();
    Tenant::factory()->create(['name' => 'Grand Hotel Riyadh']);
    Tenant::factory()->create(['name' => 'Luxury Palace']);

    $this->actingAs($user)
        ->get('/super-admin/tenants?search=Grand')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tenants.data', 1)
            ->where('tenants.data.0.name', 'Grand Hotel Riyadh')
        );
});

test('tenants can be filtered by status', function () {
    $user = User::factory()->superAdmin()->create();
    // The unified TenantController uses derived status keys: completed,
    // pending, expired, rejected, inactive.
    Tenant::factory()->count(2)->create([
        'is_active' => true,
        'payment_status' => 'approved',
        'subscription_ends_at' => now()->addYear(),
    ]);
    Tenant::factory()->count(1)->inactive()->create();

    $this->actingAs($user)
        ->get('/super-admin/tenants?status=completed')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('tenants.data', 2));

    $this->actingAs($user)
        ->get('/super-admin/tenants?status=inactive')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('tenants.data', 1));
});

// ─── Create ────────────────────────────────────────────────

test('super admin can view create tenant form', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->get('/super-admin/tenants/create')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('super-admin/tenants/create'));
});

test('super admin can create a tenant with admin user', function () {
    $user = User::factory()->superAdmin()->create();

    // Create a plan for the tenant
    \App\Models\Plan::unguard();
    $plan = \App\Models\Plan::create(['slug' => 'pro', 'name_ar' => 'احترافية', 'name_en' => 'Professional', 'price' => 1950, 'billing_cycle' => 'yearly', 'is_active' => true]);
    \App\Models\Plan::reguard();

    $this->actingAs($user)
        ->post('/super-admin/tenants', [
            'name' => 'New Hotel',
            'slug' => 'new-hotel',
            'template' => 'madina',
            'plan_id' => $plan->id,
            'is_active' => true,
            'admin_name' => 'Hotel Admin',
            'admin_email' => 'admin@newhotel.com',
            'admin_password' => 'password123',
        ])
        ->assertRedirect(route('super-admin.tenants.index'));

    // Tenant was created
    $this->assertDatabaseHas('tenants', [
        'name' => 'New Hotel',
        'slug' => 'new-hotel',
        'template' => 'madina',
        'plan_id' => $plan->id,
    ]);

    // Admin user was created
    $this->assertDatabaseHas('users', [
        'email' => 'admin@newhotel.com',
        'role' => 'client_admin',
    ]);

    // Default site sections were created
    $tenant = Tenant::where('slug', 'new-hotel')->first();
    expect($tenant->siteSections)->toHaveCount(7);
});

test('create tenant validates required fields', function () {
    $user = User::factory()->superAdmin()->create();

    // After the unified controller refactor, only name, slug, and template are
    // strictly required. plan_id and admin_* are optional (admin form fills
    // them client-side) so we no longer assert on them.
    $this->actingAs($user)
        ->post('/super-admin/tenants', [])
        ->assertSessionHasErrors(['name', 'slug', 'template']);
});

test('create tenant validates unique slug', function () {
    $user = User::factory()->superAdmin()->create();
    Tenant::factory()->create(['slug' => 'taken-slug']);

    $this->actingAs($user)
        ->post('/super-admin/tenants', [
            'name' => 'Test',
            'slug' => 'taken-slug',
            'template' => 'madina',
            'plan_id' => 999,
            'admin_name' => 'Admin',
            'admin_email' => 'admin@test.com',
            'admin_password' => 'password123',
        ])
        ->assertSessionHasErrors('slug');
});

test('create tenant validates unique admin email', function () {
    $user = User::factory()->superAdmin()->create();
    User::factory()->create(['email' => 'taken@email.com']);

    $this->actingAs($user)
        ->post('/super-admin/tenants', [
            'name' => 'Test',
            'slug' => 'test-hotel',
            'template' => 'madina',
            'plan' => 'basic',
            'admin_name' => 'Admin',
            'admin_email' => 'taken@email.com',
            'admin_password' => 'password123',
        ])
        ->assertSessionHasErrors('admin_email');
});

test('create tenant validates template must be riyadh or madina', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->post('/super-admin/tenants', [
            'name' => 'Test',
            'slug' => 'test',
            'template' => 'invalid-template',
            'plan_id' => 999,
            'admin_name' => 'Admin',
            'admin_email' => 'admin@test.com',
            'admin_password' => 'password123',
        ])
        ->assertSessionHasErrors('template');
});

// ─── Edit / Update ─────────────────────────────────────────

test('super admin can view edit tenant form', function () {
    $user = User::factory()->superAdmin()->create();
    $tenant = Tenant::factory()->create();

    $this->actingAs($user)
        ->get("/super-admin/tenants/{$tenant->id}/edit")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/tenants/edit')
            ->has('tenant')
            ->where('tenant.id', $tenant->id)
        );
});

test('super admin can update a tenant', function () {
    $user = User::factory()->superAdmin()->create();
    $tenant = Tenant::factory()->create(['name' => 'Old Name', 'template' => 'riyadh']);

    \App\Models\Plan::unguard();
    $plan = \App\Models\Plan::create(['slug' => 'ent', 'name_ar' => 'مؤسسية', 'name_en' => 'Enterprise', 'price' => 3150, 'billing_cycle' => 'yearly', 'is_active' => true]);
    \App\Models\Plan::reguard();

    $this->actingAs($user)
        ->put("/super-admin/tenants/{$tenant->id}", [
            'name' => 'Updated Name',
            'slug' => $tenant->slug,
            'template' => 'madina',
            'plan_id' => $plan->id,
        ])
        // The unified controller returns back() so the user can keep editing.
        ->assertRedirect();

    $tenant->refresh();
    expect($tenant->name)->toBe('Updated Name')
        ->and($tenant->template)->toBe('madina')
        ->and($tenant->plan_id)->toBe($plan->id);
});

// ─── Toggle Status ─────────────────────────────────────────

test('super admin can toggle tenant status', function () {
    $user = User::factory()->superAdmin()->create();
    $tenant = Tenant::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->post("/super-admin/tenants/{$tenant->id}/toggle")
        ->assertRedirect();

    $tenant->refresh();
    expect($tenant->is_active)->toBeFalse();

    // Toggle back
    $this->actingAs($user)
        ->post("/super-admin/tenants/{$tenant->id}/toggle")
        ->assertRedirect();

    $tenant->refresh();
    expect($tenant->is_active)->toBeTrue();
});

// ─── Authorization ─────────────────────────────────────────

test('client admin cannot access tenant management', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->clientAdmin($tenant->id)->create();

    $this->actingAs($user)->get('/super-admin/tenants')->assertForbidden();
    $this->actingAs($user)->get('/super-admin/tenants/create')->assertForbidden();
    $this->actingAs($user)->post('/super-admin/tenants', [])->assertForbidden();
});
