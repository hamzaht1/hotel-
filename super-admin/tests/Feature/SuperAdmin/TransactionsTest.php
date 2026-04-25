<?php

use App\Models\Invoice;
use App\Models\Tenant;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->superAdmin()->create();
});

test('transactions page returns paginated invoices with KPIs', function () {
    $tenant = Tenant::factory()->create();

    Invoice::factory()->count(2)->create([
        'tenant_id' => $tenant->id,
        'status' => 'paid',
        'paid_at' => now(),
        'total' => 1000,
    ]);

    $this->actingAs($this->admin)
        ->get('/super-admin/transactions?range=all')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/transactions/index')
            ->has('transactions.data')
            ->has('stats.successful')
            ->has('stats.failed')
            ->has('stats.pending')
            ->has('stats.total_revenue')
            ->has('stats.net_profit')
        );
});

test('transactions filter by status chip works', function () {
    $tenant = Tenant::factory()->create();
    Invoice::factory()->create(['tenant_id' => $tenant->id, 'status' => 'paid', 'total' => 100]);
    Invoice::factory()->create(['tenant_id' => $tenant->id, 'status' => 'draft', 'total' => 200]);

    $this->actingAs($this->admin)
        ->get('/super-admin/transactions?range=all&status=successful')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('transactions.data', 1));
});

test('transaction can be paused', function () {
    $tenant = Tenant::factory()->create();
    $inv = Invoice::factory()->create(['tenant_id' => $tenant->id, 'status' => 'sent']);

    $this->actingAs($this->admin)
        ->post("/super-admin/transactions/{$inv->id}/pause")
        ->assertRedirect();

    expect($inv->fresh()->status)->toBe('draft');
});

test('paid transaction cannot be deleted', function () {
    $tenant = Tenant::factory()->create();
    $inv = Invoice::factory()->create(['tenant_id' => $tenant->id, 'status' => 'paid']);

    $this->actingAs($this->admin)
        ->delete("/super-admin/transactions/{$inv->id}")
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(Invoice::find($inv->id))->not->toBeNull();
});
