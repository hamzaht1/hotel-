<?php

use App\Models\Tenant;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->superAdmin()->create();
});

test('clients index returns the paginated list with tier stats', function () {
    Tenant::factory()->count(2)->create(['is_active' => true]);

    $this->actingAs($this->admin)
        ->get('/super-admin/clients?range=all')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/clients/index')
            ->has('tenants.data', 2)
            ->has('stats.total')
            ->has('stats.platinum')
            ->has('stats.gold')
            ->has('stats.silver')
            ->has('stats.bronze')
            ->has('cities')
        );
});

test('client tier can be overridden', function () {
    $tenant = Tenant::factory()->create();

    $this->actingAs($this->admin)
        ->post("/super-admin/clients/{$tenant->id}/tier", ['tier' => 'platinum'])
        ->assertRedirect();

    expect($tenant->fresh()->tier_override)->toBe('platinum');
});

test('client status can be changed', function () {
    $tenant = Tenant::factory()->create();

    $this->actingAs($this->admin)
        ->post("/super-admin/clients/{$tenant->id}/status", ['client_status' => 'banned'])
        ->assertRedirect();

    expect($tenant->fresh()->client_status)->toBe('banned');
});

test('client show page loads profile data', function () {
    $tenant = Tenant::factory()->create();

    $this->actingAs($this->admin)
        ->get("/super-admin/clients/{$tenant->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/clients/show')
            ->where('tenant.id', $tenant->id)
            ->has('invoices')
            ->has('renewals')
            ->has('messages')
            ->has('reviews')
            ->has('stats')
        );
});

test('clients csv export streams correctly', function () {
    Tenant::factory()->create();

    $response = $this->actingAs($this->admin)->get('/super-admin/clients?export=csv');
    $response->assertOk();
    expect($response->headers->get('content-disposition'))->toContain('clients.csv');
});
