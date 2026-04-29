<?php

use App\Models\GalleryImage;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function galleryAdmin(): array
{
    $tenant = Tenant::factory()->create();
    $user = User::factory()->clientAdmin($tenant->id)->create();
    return [$user, $tenant];
}

test('client admin can view gallery', function () {
    [$user] = galleryAdmin();

    $this->actingAs($user)
        ->get('/client-admin/gallery')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/gallery/index')
            ->has('images')
            ->has('categories')
        );
});

test('client admin can upload gallery images', function () {
    Storage::fake('public');
    [$user, $tenant] = galleryAdmin();

    $this->actingAs($user)
        ->post('/client-admin/gallery', [
            'title_ar' => 'صورة الفندق',
            'title_en' => 'Hotel Photo',
            'category' => 'lobby',
            'images' => [
                UploadedFile::fake()->image('lobby1.jpg', 600, 400),
                UploadedFile::fake()->image('lobby2.jpg', 600, 400),
            ],
        ])
        ->assertRedirect();

    $images = GalleryImage::where('tenant_id', $tenant->id)->get();
    expect($images)->toHaveCount(2);
    foreach ($images as $img) {
        expect($img->category)->toBe('lobby')
            ->and($img->is_active)->toBeTrue()
            ->and($img->path)->toStartWith('gallery/')
            ->and($img->url)->not->toBeNull();
        Storage::disk('public')->assertExists($img->path);
    }
});

test('gallery upload validates category', function () {
    [$user] = galleryAdmin();

    $this->actingAs($user)
        ->post('/client-admin/gallery', [
            'category' => 'invalid-category',
            'images' => [UploadedFile::fake()->create('test.txt', 100)],
        ])
        ->assertSessionHasErrors('category');
});

test('gallery upload requires at least one image', function () {
    [$user] = galleryAdmin();

    $this->actingAs($user)
        ->post('/client-admin/gallery', [
            'category' => 'general',
            'images' => [],
        ])
        ->assertSessionHasErrors('images');
});

test('client admin can delete a gallery image', function () {
    Storage::fake('public');
    [$user, $tenant] = galleryAdmin();

    GalleryImage::unguard();
    $image = GalleryImage::create([
        'tenant_id' => $tenant->id,
        'path' => 'gallery/test.jpg',
        'category' => 'general',
    ]);
    GalleryImage::reguard();
    Storage::disk('public')->put('gallery/test.jpg', 'dummy');

    $this->actingAs($user)
        ->delete("/client-admin/gallery/{$image->id}")
        ->assertRedirect();

    $this->assertDatabaseMissing('gallery_images', ['id' => $image->id]);
});

test('gallery images are filtered by category', function () {
    [$user, $tenant] = galleryAdmin();

    GalleryImage::unguard();
    GalleryImage::create(['tenant_id' => $tenant->id, 'path' => '1.jpg', 'category' => 'rooms']);
    GalleryImage::create(['tenant_id' => $tenant->id, 'path' => '2.jpg', 'category' => 'rooms']);
    GalleryImage::create(['tenant_id' => $tenant->id, 'path' => '3.jpg', 'category' => 'lobby']);
    GalleryImage::reguard();

    $this->actingAs($user)
        ->get('/client-admin/gallery?category=rooms')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('images.data', 2));
});

test('client admin only sees their own gallery images', function () {
    [$user, $tenant] = galleryAdmin();
    $otherTenant = Tenant::factory()->create();

    GalleryImage::unguard();
    GalleryImage::create(['tenant_id' => $tenant->id, 'path' => 'mine.jpg', 'category' => 'general']);
    GalleryImage::create(['tenant_id' => $otherTenant->id, 'path' => 'theirs.jpg', 'category' => 'general']);
    GalleryImage::reguard();

    $this->actingAs($user)
        ->get('/client-admin/gallery')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('images.data', 1));
});
