<?php

use App\Models\GalleryImage;
use App\Models\Tenant;
use App\Models\User;

/**
 * Each client-gallery category feeds exactly one section of the public template.
 * Before this split, `hotels` fed both the gallery carousel and the partner-logo
 * strip, so a partner logo turned up as a gallery photo — these tests pin the
 * routing down so the two can't be conflated again.
 */

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function galleryImage(int $tenantId, string $category, string $title): GalleryImage
{
    return GalleryImage::create([
        'tenant_id' => $tenantId,
        'title_ar' => $title,
        'title_en' => $title,
        'path' => "gallery/{$category}-{$title}.jpg",
        'category' => $category,
        'sort_order' => 1,
        'is_active' => true,
    ]);
}

test('each category lands in its own section of the tenant site', function () {
    $tenant = Tenant::factory()->create(['template' => 'madina', 'slug' => 'split-hotel']);

    galleryImage($tenant->id, 'photos', 'lobby');
    galleryImage($tenant->id, 'partners', 'marriott');
    galleryImage($tenant->id, 'footer', 'visa');

    $this->get('/hotel/split-hotel')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            // The carousel gets photos only — no logos.
            ->has('gallery', 1)
            ->where('gallery.0.title_en', 'lobby')
            // The partner strip gets partner logos only.
            ->has('partnerLogos', 1)
            ->where('partnerLogos.0.title_en', 'marriott')
            // The footer row is shared globally because it renders in the layout.
            ->has('tenantGallery.footer', 1)
            ->where('tenantGallery.footer.0.title_en', 'visa')
        );
});

test('partner logos never leak into the gallery carousel', function () {
    $tenant = Tenant::factory()->create(['template' => 'madina', 'slug' => 'logos-only']);

    galleryImage($tenant->id, 'partners', 'marriott');
    galleryImage($tenant->id, 'footer', 'mada');

    $this->get('/hotel/logos-only')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('gallery', 0)
            ->has('partnerLogos', 1)
        );
});

test('inactive images are excluded from every section', function () {
    $tenant = Tenant::factory()->create(['template' => 'madina', 'slug' => 'hidden-hotel']);

    galleryImage($tenant->id, 'photos', 'lobby')->update(['is_active' => false]);
    galleryImage($tenant->id, 'partners', 'marriott')->update(['is_active' => false]);
    galleryImage($tenant->id, 'footer', 'visa')->update(['is_active' => false]);

    $this->get('/hotel/hidden-hotel')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('gallery', 0)
            ->has('partnerLogos', 0)
            ->has('tenantGallery.footer', 0)
        );
});

test('one tenant never sees another tenant gallery', function () {
    $mine = Tenant::factory()->create(['template' => 'madina', 'slug' => 'mine']);
    $other = Tenant::factory()->create(['template' => 'madina', 'slug' => 'other']);

    galleryImage($mine->id, 'photos', 'my-lobby');
    galleryImage($other->id, 'photos', 'their-lobby');

    $this->get('/hotel/mine')
        ->assertInertia(fn ($page) => $page
            ->has('gallery', 1)
            ->where('gallery.0.title_en', 'my-lobby')
        );
});

// ─── Client-admin side ─────────────────────────────────────

test('the client gallery offers one category per public section', function () {
    $tenant = Tenant::factory()->create();
    $owner = User::factory()->clientAdmin($tenant->id)->create();

    $this->actingAs($owner)
        ->get('/client-admin/gallery')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/gallery/index')
            ->where('categories', ['photos', 'partners', 'footer'])
        );
});

test('a legacy category is rejected on upload', function () {
    $tenant = Tenant::factory()->create();
    $owner = User::factory()->clientAdmin($tenant->id)->create();

    \Illuminate\Support\Facades\Storage::fake('public');

    $this->actingAs($owner)
        ->post('/client-admin/gallery', [
            'category' => 'hotels',
            'images' => [\Illuminate\Http\UploadedFile::fake()->image('logo.jpg', 1200, 800)],
        ])->assertSessionHasErrors('category');
});

test('an image can be moved between categories', function () {
    $tenant = Tenant::factory()->create();
    $owner = User::factory()->clientAdmin($tenant->id)->create();
    $image = galleryImage($tenant->id, 'photos', 'lobby');

    $this->actingAs($owner)
        ->put("/client-admin/gallery/{$image->id}", [
            'title_ar' => 'ماريوت',
            'title_en' => 'Marriott',
            'category' => 'partners',
            'is_active' => true,
        ])->assertRedirect();

    expect($image->refresh()->category)->toBe('partners');
});
