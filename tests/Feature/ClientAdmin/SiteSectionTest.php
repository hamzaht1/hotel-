<?php

use App\Models\SiteSection;
use App\Models\Tenant;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function sectionAdmin(): array
{
    $tenant = Tenant::factory()->create();
    $user = User::factory()->clientAdmin($tenant->id)->create();

    // Tenant booted() seeds the 7 default sections automatically; ensure deterministic sort_order for the test.
    $sections = ['hero', 'rooms', 'services', 'gallery', 'testimonials', 'partners', 'contact'];
    foreach ($sections as $i => $name) {
        SiteSection::unguard();
        SiteSection::updateOrCreate(
            ['tenant_id' => $tenant->id, 'section_name' => $name],
            ['is_active' => true, 'sort_order' => $i]
        );
        SiteSection::reguard();
    }

    return [$user, $tenant];
}

test('client admin can view site sections', function () {
    [$user] = sectionAdmin();

    $this->actingAs($user)
        ->get('/client-admin/site-sections')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/site-sections/index')
            ->has('sections', 7)
        );
});

test('client admin can toggle a section on/off', function () {
    [$user, $tenant] = sectionAdmin();
    $section = SiteSection::where('tenant_id', $tenant->id)->where('section_name', 'gallery')->first();

    expect($section->is_active)->toBeTrue();

    $this->actingAs($user)
        ->post("/client-admin/site-sections/{$section->id}/toggle")
        ->assertRedirect();

    $section->refresh();
    expect($section->is_active)->toBeFalse();

    // Toggle back on
    $this->actingAs($user)
        ->post("/client-admin/site-sections/{$section->id}/toggle")
        ->assertRedirect();

    $section->refresh();
    expect($section->is_active)->toBeTrue();
});

test('client admin only sees their own sections', function () {
    [$user, $tenant] = sectionAdmin();
    $otherTenant = Tenant::factory()->create();

    SiteSection::unguard();
    SiteSection::updateOrCreate(
        ['tenant_id' => $otherTenant->id, 'section_name' => 'hero'],
        ['is_active' => true]
    );
    SiteSection::reguard();

    $this->actingAs($user)
        ->get('/client-admin/site-sections')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('sections', 7)); // Only sees own 7, not the other tenant's
});
