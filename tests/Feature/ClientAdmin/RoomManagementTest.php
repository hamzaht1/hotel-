<?php

use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function createClientAdmin(): array
{
    $tenant = Tenant::factory()->create();
    $user = User::factory()->clientAdmin($tenant->id)->create();
    return [$user, $tenant];
}

function createRoom(int $tenantId, array $overrides = []): Room
{
    Room::unguard();
    $room = Room::create(array_merge([
        'tenant_id' => $tenantId,
        'name_ar' => 'غرفة ديلوكس',
        'name_en' => 'Deluxe Room',
        'type' => 'deluxe',
        'price' => 500,
        'capacity' => 2,
        'is_active' => true,
    ], $overrides));
    Room::reguard();
    return $room;
}

// ─── Index ─────────────────────────────────────────────────

test('client admin can list their rooms', function () {
    [$user, $tenant] = createClientAdmin();
    createRoom($tenant->id);
    createRoom($tenant->id, ['name_en' => 'Suite', 'type' => 'suite']);

    $this->actingAs($user)
        ->get('/client-admin/rooms')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/rooms/index')
            ->has('rooms.data', 2)
        );
});

test('client admin only sees their own rooms', function () {
    [$user, $tenant] = createClientAdmin();
    $otherTenant = Tenant::factory()->create();

    createRoom($tenant->id);
    createRoom($otherTenant->id, ['name_en' => 'Other Room']);

    $this->actingAs($user)
        ->get('/client-admin/rooms')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('rooms.data', 1));
});

test('rooms can be filtered by type', function () {
    [$user, $tenant] = createClientAdmin();
    createRoom($tenant->id, ['type' => 'standard']);
    createRoom($tenant->id, ['type' => 'deluxe']);
    createRoom($tenant->id, ['type' => 'standard']);

    $this->actingAs($user)
        ->get('/client-admin/rooms?type=standard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('rooms.data', 2));
});

test('rooms can be searched by name', function () {
    [$user, $tenant] = createClientAdmin();
    createRoom($tenant->id, ['name_en' => 'Royal Suite']);
    createRoom($tenant->id, ['name_en' => 'Basic Room']);

    $this->actingAs($user)
        ->get('/client-admin/rooms?search=Royal')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('rooms.data', 1));
});

// ─── Create ────────────────────────────────────────────────

test('client admin can view create room form', function () {
    [$user] = createClientAdmin();

    $this->actingAs($user)
        ->get('/client-admin/rooms/create')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('client-admin/rooms/create'));
});

test('client admin can create a room', function () {
    [$user, $tenant] = createClientAdmin();

    $this->actingAs($user)
        ->post('/client-admin/rooms', [
            'name_ar' => 'غرفة فاخرة',
            'name_en' => 'Luxury Room',
            'type' => 'suite',
            'description_ar' => 'وصف عربي',
            'description_en' => 'English description',
            'price' => 750.50,
            'capacity' => 3,
            'amenities' => ['wifi', 'minibar', 'tv'],
            'is_active' => true,
        ])
        ->assertRedirect(route('client-admin.rooms.index'));

    $room = Room::where('tenant_id', $tenant->id)->where('name_en', 'Luxury Room')->first();
    expect($room)->not->toBeNull()
        ->and($room->type)->toBe('suite')
        ->and((float) $room->price)->toBe(750.50)
        ->and($room->capacity)->toBe(3)
        ->and($room->description_ar)->toBe('وصف عربي')
        ->and($room->description_en)->toBe('English description')
        ->and($room->amenities)->toBe(['wifi', 'minibar', 'tv'])
        ->and($room->is_active)->toBeTrue();
});

test('client admin can create a room with featured image', function () {
    Storage::fake('public');
    [$user, $tenant] = createClientAdmin();

    $this->actingAs($user)
        ->post('/client-admin/rooms', [
            'name_ar' => 'غرفة',
            'name_en' => 'Room',
            'type' => 'standard',
            'price' => 200,
            'capacity' => 2,
            'featured_image' => UploadedFile::fake()->create('room.jpg', 100, 'image/jpeg'),
        ])
        ->assertRedirect(route('client-admin.rooms.index'));

    $room = Room::where('tenant_id', $tenant->id)->first();
    expect($room->featured_image)->not->toBeNull();
    Storage::disk('public')->assertExists($room->featured_image);
});

test('create room validates required fields', function () {
    [$user] = createClientAdmin();

    $this->actingAs($user)
        ->post('/client-admin/rooms', [])
        ->assertSessionHasErrors(['name_ar', 'name_en', 'type', 'price', 'capacity']);
});

test('create room validates type enum', function () {
    [$user] = createClientAdmin();

    $this->actingAs($user)
        ->post('/client-admin/rooms', [
            'name_ar' => 'غرفة',
            'name_en' => 'Room',
            'type' => 'invalid',
            'price' => 100,
            'capacity' => 2,
        ])
        ->assertSessionHasErrors('type');
});

test('create room validates price is non-negative', function () {
    [$user] = createClientAdmin();

    $this->actingAs($user)
        ->post('/client-admin/rooms', [
            'name_ar' => 'غرفة',
            'name_en' => 'Room',
            'type' => 'standard',
            'price' => -100,
            'capacity' => 2,
        ])
        ->assertSessionHasErrors('price');
});

// ─── Edit / Update ─────────────────────────────────────────

test('client admin can view edit room form', function () {
    [$user, $tenant] = createClientAdmin();
    $room = createRoom($tenant->id);

    $this->actingAs($user)
        ->get("/client-admin/rooms/{$room->id}/edit")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/rooms/edit')
            ->has('room')
            ->where('room.id', $room->id)
        );
});

test('client admin can update a room', function () {
    [$user, $tenant] = createClientAdmin();
    $room = createRoom($tenant->id);

    $this->actingAs($user)
        ->put("/client-admin/rooms/{$room->id}", [
            'name_ar' => 'غرفة محدثة',
            'name_en' => 'Updated Room',
            'type' => 'suite',
            'price' => 999,
            'capacity' => 4,
        ])
        ->assertRedirect(route('client-admin.rooms.index'));

    $room->refresh();
    expect($room->name_en)->toBe('Updated Room')
        ->and($room->type)->toBe('suite')
        ->and((float)$room->price)->toBe(999.0)
        ->and($room->capacity)->toBe(4);
});

// ─── Delete ────────────────────────────────────────────────

test('client admin can delete a room', function () {
    [$user, $tenant] = createClientAdmin();
    $room = createRoom($tenant->id);

    $this->actingAs($user)
        ->delete("/client-admin/rooms/{$room->id}")
        ->assertRedirect();

    $this->assertDatabaseMissing('rooms', ['id' => $room->id]);
});

// ─── Authorization ─────────────────────────────────────────

test('super admin cannot access room management', function () {
    $user = User::factory()->superAdmin()->create();

    $this->actingAs($user)->get('/client-admin/rooms')->assertRedirect('/login');
});
