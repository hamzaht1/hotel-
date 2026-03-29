<?php

use App\Models\Template;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Index ─────────────────────────────────────────────────

test('super admin can list templates', function () {
    $user = User::factory()->superAdmin()->create();

    Template::unguard();
    Template::create(['key' => 'riyadh', 'name_ar' => 'الرياض', 'name_en' => 'Riyadh', 'is_active' => true, 'sort_order' => 0]);
    Template::create(['key' => 'madina', 'name_ar' => 'المدينة', 'name_en' => 'Madina', 'is_active' => true, 'sort_order' => 1]);
    Template::reguard();

    $this->actingAs($user)
        ->get('/super-admin/templates')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/templates/index')
            ->has('templates', 2)
        );
});

// ─── Toggle Status ─────────────────────────────────────────

test('super admin can toggle template status', function () {
    $user = User::factory()->superAdmin()->create();

    Template::unguard();
    $template = Template::create(['key' => 'riyadh', 'name_ar' => 'الرياض', 'name_en' => 'Riyadh', 'is_active' => true, 'sort_order' => 0]);
    Template::reguard();

    $this->actingAs($user)
        ->post("/super-admin/templates/{$template->id}/toggle")
        ->assertRedirect();

    $template->refresh();
    expect($template->is_active)->toBeFalse();

    // Toggle back
    $this->actingAs($user)
        ->post("/super-admin/templates/{$template->id}/toggle")
        ->assertRedirect();

    $template->refresh();
    expect($template->is_active)->toBeTrue();
});

// ─── Update Settings ───────────────────────────────────────

test('super admin can update template settings', function () {
    $user = User::factory()->superAdmin()->create();

    Template::unguard();
    $template = Template::create(['key' => 'riyadh', 'name_ar' => 'الرياض', 'name_en' => 'Riyadh', 'is_active' => true, 'sort_order' => 0, 'settings' => null]);
    Template::reguard();

    $newSettings = [
        'primary_color' => '#1a73e8',
        'show_hero' => true,
        'layout' => 'boxed',
    ];

    $this->actingAs($user)
        ->put("/super-admin/templates/{$template->id}/settings", [
            'settings' => $newSettings,
        ])
        ->assertRedirect();

    $template->refresh();
    expect($template->settings)->toBe($newSettings);
});
