<?php

use App\Models\Room;
use App\Models\Tenant;
use App\Models\GalleryImage;
use App\Models\SiteSection;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('global scope filters records by current tenant', function () {
    $tenant1 = Tenant::factory()->create();
    $tenant2 = Tenant::factory()->create();

    // Create rooms for both tenants
    Room::unguard();
    Room::create(['tenant_id' => $tenant1->id, 'name_ar' => 'غرفة 1', 'name_en' => 'Room T1', 'type' => 'standard', 'price' => 100, 'capacity' => 2]);
    Room::create(['tenant_id' => $tenant1->id, 'name_ar' => 'غرفة 2', 'name_en' => 'Room T1-2', 'type' => 'deluxe', 'price' => 200, 'capacity' => 2]);
    Room::create(['tenant_id' => $tenant2->id, 'name_ar' => 'غرفة 3', 'name_en' => 'Room T2', 'type' => 'standard', 'price' => 150, 'capacity' => 2]);
    Room::reguard();

    // Set tenant context to tenant1
    app()->instance('current_tenant_id', $tenant1->id);

    $rooms = Room::all();
    expect($rooms)->toHaveCount(2)
        ->and($rooms->pluck('name_en')->toArray())->each->toContain('T1');
});

test('global scope returns all records when no tenant is set', function () {
    $tenant1 = Tenant::factory()->create();
    $tenant2 = Tenant::factory()->create();

    Room::unguard();
    Room::create(['tenant_id' => $tenant1->id, 'name_ar' => 'غرفة', 'name_en' => 'Room 1', 'type' => 'standard', 'price' => 100, 'capacity' => 2]);
    Room::create(['tenant_id' => $tenant2->id, 'name_ar' => 'غرفة', 'name_en' => 'Room 2', 'type' => 'standard', 'price' => 100, 'capacity' => 2]);
    Room::reguard();

    // No tenant context set (null)
    app()->instance('current_tenant_id', null);

    expect(Room::all())->toHaveCount(2);
});

test('auto-assigns tenant_id on creation when context is set', function () {
    $tenant = Tenant::factory()->create();
    app()->instance('current_tenant_id', $tenant->id);

    $room = Room::create([
        'name_ar' => 'غرفة جديدة',
        'name_en' => 'New Room',
        'type' => 'standard',
        'price' => 100,
        'capacity' => 2,
    ]);

    expect($room->tenant_id)->toBe($tenant->id);
});

test('does not override explicit tenant_id', function () {
    $tenant1 = Tenant::factory()->create();
    $tenant2 = Tenant::factory()->create();
    app()->instance('current_tenant_id', $tenant1->id);

    $room = Room::create([
        'tenant_id' => $tenant2->id,
        'name_ar' => 'غرفة',
        'name_en' => 'Room',
        'type' => 'standard',
        'price' => 100,
        'capacity' => 2,
    ]);

    expect($room->tenant_id)->toBe($tenant2->id);
});

test('tenant isolation works for gallery images', function () {
    $tenant1 = Tenant::factory()->create();
    $tenant2 = Tenant::factory()->create();

    GalleryImage::unguard();
    GalleryImage::create(['tenant_id' => $tenant1->id, 'path' => 'img1.jpg', 'category' => 'general']);
    GalleryImage::create(['tenant_id' => $tenant1->id, 'path' => 'img2.jpg', 'category' => 'rooms']);
    GalleryImage::create(['tenant_id' => $tenant2->id, 'path' => 'img3.jpg', 'category' => 'general']);
    GalleryImage::reguard();

    app()->instance('current_tenant_id', $tenant1->id);
    expect(GalleryImage::all())->toHaveCount(2);

    app()->instance('current_tenant_id', $tenant2->id);
    expect(GalleryImage::all())->toHaveCount(1);
});

test('tenant isolation works for site sections', function () {
    // Tenant booted() seeds the 7 default sections per tenant.
    $tenant1 = Tenant::factory()->create();
    $tenant2 = Tenant::factory()->create();

    app()->instance('current_tenant_id', $tenant1->id);
    expect(SiteSection::all())->toHaveCount(7);
    expect(SiteSection::pluck('tenant_id')->unique()->values()->all())->toBe([$tenant1->id]);

    app()->instance('current_tenant_id', $tenant2->id);
    expect(SiteSection::all())->toHaveCount(7);
    expect(SiteSection::pluck('tenant_id')->unique()->values()->all())->toBe([$tenant2->id]);
});
