<?php

use App\Models\Plan;
use App\Models\Template;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->superAdmin()->create();
});

test('plans-templates unified page returns plans + templates + KPIs', function () {
    Plan::factory()->count(3)->create();
    Template::factory()->count(2)->create();

    $this->actingAs($this->admin)
        ->get('/super-admin/plans-templates')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/plans-templates/index')
            ->has('plans', 3)
            ->has('templates', 2)
            ->has('stats.active_plans')
            ->has('stats.inactive_plans')
            ->has('stats.total_plans')
            ->has('stats.total_templates')
        );
});

test('plans tab filter status works', function () {
    Plan::factory()->create(['is_active' => true, 'is_coming_soon' => false]);
    Plan::factory()->create(['is_active' => false, 'is_coming_soon' => false]);

    $this->actingAs($this->admin)
        ->get('/super-admin/plans-templates?status=active')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('plans', 1));
});
