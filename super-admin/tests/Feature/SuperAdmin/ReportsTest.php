<?php

use App\Models\Tenant;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->superAdmin()->create();
});

test('unified reports page defaults to requests tab', function () {
    Tenant::factory()->count(3)->create();

    $this->actingAs($this->admin)
        ->get('/super-admin/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/reports/index')
            ->where('tab', 'requests')
            ->has('kpis.total_clients')
            ->has('kpis.active_subscriptions')
            ->has('kpis.total_revenue')
            ->has('available_columns')
            ->has('rows.data')
        );
});

test('reports clients tab returns correct columns', function () {
    Tenant::factory()->count(2)->create();

    $this->actingAs($this->admin)
        ->get('/super-admin/reports?tab=clients')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('tab', 'clients')
            ->has('available_columns', 11) // 11 columns defined
        );
});

test('reports invoices tab returns correct columns', function () {
    $this->actingAs($this->admin)
        ->get('/super-admin/reports?tab=invoices')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('tab', 'invoices')->has('available_columns', 8));
});

test('reports csv export works', function () {
    Tenant::factory()->create();

    $response = $this->actingAs($this->admin)->get('/super-admin/reports?tab=requests&export=csv');
    $response->assertOk();
    expect($response->headers->get('content-disposition'))->toContain('report-requests.csv');
});
