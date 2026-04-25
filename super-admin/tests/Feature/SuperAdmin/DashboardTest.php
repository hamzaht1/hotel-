<?php

use App\Models\Tenant;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('super admin can access super admin dashboard', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->get('/super-admin')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/dashboard')
            ->has('stats')
            ->has('stats.total_clients')
            ->has('stats.total_sites')
            ->has('stats.total_revenue')
            ->has('stats.satisfaction')
            ->has('stats.total_templates')
            ->has('recentRequests')
            ->has('recentPayments')
            ->has('newClients')
            ->has('revenueSeries')
            ->has('topTemplates')
            ->has('byRegion')
        );
});

test('client admin cannot access super admin dashboard', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->clientAdmin($tenant->id)->create();

    $this->actingAs($user)
        ->get('/super-admin')
        ->assertForbidden();
});

test('guest cannot access super admin dashboard', function () {
    $this->get('/super-admin')
        ->assertRedirect('/login');
});

test('dashboard stats reflect tenant counts', function () {
    $user = User::factory()->superAdmin()->create();

    Tenant::factory()->count(3)->create(['is_active' => true]);
    Tenant::factory()->count(2)->inactive()->create();

    $this->actingAs($user)
        ->get('/super-admin')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.total_clients', 5)
            ->where('stats.total_sites', 3)
        );
});

test('dashboard accepts range filter', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->get('/super-admin?range=this_week')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('range.key', 'this_week'));
});
