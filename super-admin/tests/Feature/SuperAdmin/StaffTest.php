<?php

use App\Models\Role;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->superAdmin()->create();
});

test('staff page renders with users and roles', function () {
    User::factory()->count(2)->create(['role' => 'staff']);

    $this->actingAs($this->admin)
        ->get('/super-admin/staff')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super-admin/staff/index')
            ->where('tab', 'staff')
            ->has('users.data')
            ->has('roles')
            ->has('permissions')
        );
});

test('staff page can switch to permissions tab', function () {
    $this->actingAs($this->admin)
        ->get('/super-admin/staff?tab=permissions')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('tab', 'permissions'));
});

test('admin can create a staff member', function () {
    $this->actingAs($this->admin)
        ->post('/super-admin/staff', [
            'name' => 'Test Staff',
            'email' => 'staff@test.local',
            'phone' => '+966555000000',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertRedirect();

    expect(User::where('email', 'staff@test.local')->exists())->toBeTrue();
});

test('admin can toggle staff active state', function () {
    $staff = User::factory()->create(['role' => 'staff', 'is_active' => true]);

    $this->actingAs($this->admin)
        ->post("/super-admin/staff/{$staff->id}/toggle")
        ->assertRedirect();

    expect($staff->fresh()->is_active)->toBeFalse();
});

test('admin cannot disable their own account', function () {
    $this->actingAs($this->admin)
        ->post("/super-admin/staff/{$this->admin->id}/toggle")
        ->assertRedirect()
        ->assertSessionHas('error');
});

test('admin can reset a staff password', function () {
    $staff = User::factory()->create(['role' => 'staff']);
    $oldHash = $staff->password;

    $this->actingAs($this->admin)
        ->post("/super-admin/staff/{$staff->id}/reset-password", ['password' => 'newpass123'])
        ->assertRedirect();

    expect($staff->fresh()->password)->not->toBe($oldHash);
});

test('admin can create a custom role', function () {
    $this->actingAs($this->admin)
        ->post('/super-admin/roles', [
            'name_ar' => 'محرر',
            'name_en' => 'Editor',
        ])
        ->assertRedirect();

    expect(Role::where('name_en', 'Editor')->exists())->toBeTrue();
});
