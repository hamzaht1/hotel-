<?php

use App\Models\GalleryImage;
use App\Models\Review;
use App\Models\Room;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\User;

function seedTenant(string $slug): Tenant
{
    return Tenant::create([
        'name' => ucfirst($slug),
        'slug' => $slug,
        'template' => 'madina',
        'email' => "{$slug}@example.com",
        'is_active' => true,
    ]);
}

it('scopes BelongsToTenant models to the current tenant context', function () {
    $a = seedTenant('tenant-a');
    $b = seedTenant('tenant-b');

    // Seed rooms under tenant A
    app()->instance('current_tenant_id', $a->id);
    Room::create(['tenant_id' => $a->id, 'name_ar' => 'A1', 'name_en' => 'A1', 'price' => 100, 'is_active' => true]);
    Room::create(['tenant_id' => $a->id, 'name_ar' => 'A2', 'name_en' => 'A2', 'price' => 100, 'is_active' => true]);

    // Seed rooms under tenant B
    app()->instance('current_tenant_id', $b->id);
    Room::create(['tenant_id' => $b->id, 'name_ar' => 'B1', 'name_en' => 'B1', 'price' => 100, 'is_active' => true]);

    expect(Room::count())->toBe(1);
    expect(Room::first()->name_ar)->toBe('B1');

    // Switch back to A
    app()->instance('current_tenant_id', $a->id);
    expect(Room::count())->toBe(2);
});

it('does not leak reviews across tenants when listed by a client admin', function () {
    $a = seedTenant('tenant-reviews-a');
    $b = seedTenant('tenant-reviews-b');

    app()->instance('current_tenant_id', $a->id);
    Review::create(['tenant_id' => $a->id, 'guest_name' => 'A1', 'rating' => 5]);

    app()->instance('current_tenant_id', $b->id);
    Review::create(['tenant_id' => $b->id, 'guest_name' => 'B1', 'rating' => 3]);
    Review::create(['tenant_id' => $b->id, 'guest_name' => 'B2', 'rating' => 4]);

    app()->instance('current_tenant_id', $a->id);
    expect(Review::count())->toBe(1);
    expect(Review::first()->guest_name)->toBe('A1');
});

it('blocks a client admin from viewing another tenant\'s invoice PDF', function () {
    $a = seedTenant('owner-tenant');
    $b = seedTenant('other-tenant');

    $admin = User::create([
        'name' => 'Admin',
        'email' => 'admin@owner.test',
        'password' => bcrypt('password'),
        'tenant_id' => $a->id,
        'role' => 'client_admin',
    ]);

    $invoice = \App\Models\Invoice::create([
        'tenant_id' => $b->id,
        'invoice_number' => 'INV-TEST-0001',
        'type' => 'subscription',
        'status' => 'paid',
        'amount' => 100,
        'tax_rate' => 15,
        'tax_amount' => 15,
        'discount' => 0,
        'total' => 115,
        'issue_date' => now()->toDateString(),
        'due_date' => now()->toDateString(),
    ]);

    $this->actingAs($admin)
        ->get("/client-admin/invoices/{$invoice->id}/pdf")
        ->assertForbidden();
});
