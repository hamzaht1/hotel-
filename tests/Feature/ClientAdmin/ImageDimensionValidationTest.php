<?php

use App\Models\GalleryImage;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->clientAdmin($this->tenant->id)->create();
    Storage::fake('public');
});

// ─── Gallery dimensions ────────────────────────────────────

test('gallery rejects images smaller than 600x400', function () {
    $this->actingAs($this->user)
        ->post('/client-admin/gallery', [
            'category' => 'general',
            'images' => [UploadedFile::fake()->image('tiny.jpg', 400, 300)],
        ])
        ->assertSessionHasErrors('images.0');

    expect(GalleryImage::count())->toBe(0);
});

test('gallery rejects images larger than 4000x3000', function () {
    $this->actingAs($this->user)
        ->post('/client-admin/gallery', [
            'category' => 'general',
            'images' => [UploadedFile::fake()->image('huge.jpg', 5000, 3500)],
        ])
        ->assertSessionHasErrors('images.0');

    expect(GalleryImage::count())->toBe(0);
});

test('gallery accepts images within recommended range', function () {
    $this->actingAs($this->user)
        ->post('/client-admin/gallery', [
            'category' => 'general',
            'images' => [UploadedFile::fake()->image('good.jpg', 1200, 800)],
        ])
        ->assertRedirect();

    expect(GalleryImage::count())->toBe(1);
});

// ─── Logo dimensions ───────────────────────────────────────

test('system-settings rejects logo smaller than 100x30', function () {
    $this->actingAs($this->user)
        ->post('/client-admin/system-settings', [
            '_method' => 'PUT',
            'site_logo' => UploadedFile::fake()->image('tiny-logo.png', 50, 20),
        ])
        ->assertSessionHasErrors('site_logo');
});

test('system-settings rejects logo larger than 2000x1000', function () {
    $this->actingAs($this->user)
        ->post('/client-admin/system-settings', [
            '_method' => 'PUT',
            'site_logo' => UploadedFile::fake()->image('huge-logo.png', 2500, 1500),
        ])
        ->assertSessionHasErrors('site_logo');
});

test('system-settings accepts a logo within range', function () {
    $this->actingAs($this->user)
        ->post('/client-admin/system-settings', [
            '_method' => 'PUT',
            'site_logo' => UploadedFile::fake()->image('logo.png', 400, 120),
        ])
        ->assertRedirect();

    Storage::disk('public')->assertExists('tenant-site/' . pathinfo(\App\Models\TenantSiteSetting::get('site_logo'), PATHINFO_BASENAME));
});

// ─── Favicon dimensions ────────────────────────────────────

test('system-settings rejects favicon smaller than 16x16', function () {
    $this->actingAs($this->user)
        ->post('/client-admin/system-settings', [
            '_method' => 'PUT',
            'site_favicon' => UploadedFile::fake()->image('tiny.ico', 8, 8),
        ])
        ->assertSessionHasErrors('site_favicon');
});

test('system-settings rejects favicon larger than 512x512', function () {
    $this->actingAs($this->user)
        ->post('/client-admin/system-settings', [
            '_method' => 'PUT',
            'site_favicon' => UploadedFile::fake()->image('huge.ico', 1024, 1024),
        ])
        ->assertSessionHasErrors('site_favicon');
});

test('system-settings rejects non-square favicon', function () {
    $this->actingAs($this->user)
        ->post('/client-admin/system-settings', [
            '_method' => 'PUT',
            'site_favicon' => UploadedFile::fake()->image('wide.png', 256, 64),
        ])
        ->assertSessionHasErrors('site_favicon');
});

test('system-settings accepts a square favicon within range', function () {
    $this->actingAs($this->user)
        ->post('/client-admin/system-settings', [
            '_method' => 'PUT',
            'site_favicon' => UploadedFile::fake()->image('favicon.png', 64, 64),
        ])
        ->assertRedirect();
});
