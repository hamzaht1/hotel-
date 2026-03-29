<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

function createClientAdminForStaff(): array
{
    $tenant = Tenant::factory()->create();
    $user = User::factory()->clientAdmin($tenant->id)->create();
    return [$user, $tenant];
}

function createStaffMember(int $tenantId, ?int $roleId = null): User
{
    if (!$roleId) {
        $key = 'staff_' . Str::random(6);
        $role = Role::create([
            'tenant_id' => $tenantId,
            'key' => $key,
            'name_ar' => 'موظف',
            'name_en' => 'Staff Role',
            'is_system' => false,
        ]);
        $roleId = $role->id;
    }

    return User::create([
        'name' => 'Staff Member',
        'email' => fake()->unique()->safeEmail(),
        'password' => Hash::make('password'),
        'tenant_id' => $tenantId,
        'role' => 'staff',
        'role_id' => $roleId,
        'email_verified_at' => now(),
    ]);
}

// ─── Index ─────────────────────────────────────────────────

test('client admin can list staff members', function () {
    [$user, $tenant] = createClientAdminForStaff();
    createStaffMember($tenant->id);
    createStaffMember($tenant->id);

    $this->actingAs($user)
        ->get('/client-admin/staff')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/staff/index')
            ->has('staff.data', 2)
        );
});

// ─── Create ────────────────────────────────────────────────

test('client admin can view create staff form', function () {
    [$user] = createClientAdminForStaff();

    $this->actingAs($user)
        ->get('/client-admin/staff/create')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('client-admin/staff/create'));
});

test('client admin can create a staff member', function () {
    [$user, $tenant] = createClientAdminForStaff();

    $role = Role::create([
        'tenant_id' => $tenant->id,
        'key' => 'receptionist',
        'name_ar' => 'موظف استقبال',
        'name_en' => 'Receptionist',
        'is_system' => false,
    ]);

    $this->actingAs($user)
        ->post('/client-admin/staff', [
            'name' => 'New Staff',
            'email' => 'newstaff@example.com',
            'password' => 'password123',
            'role_id' => $role->id,
        ])
        ->assertRedirect(route('client-admin.staff.index'));

    $this->assertDatabaseHas('users', [
        'tenant_id' => $tenant->id,
        'email' => 'newstaff@example.com',
        'role' => 'staff',
        'role_id' => $role->id,
    ]);
});

test('create staff validates required fields', function () {
    [$user] = createClientAdminForStaff();

    $this->actingAs($user)
        ->post('/client-admin/staff', [])
        ->assertSessionHasErrors(['name', 'email', 'password', 'role_id']);
});

test('create staff validates unique email', function () {
    [$user, $tenant] = createClientAdminForStaff();

    $role = Role::create([
        'tenant_id' => $tenant->id,
        'key' => 'receptionist',
        'name_ar' => 'موظف استقبال',
        'name_en' => 'Receptionist',
        'is_system' => false,
    ]);

    $existingUser = createStaffMember($tenant->id, $role->id);

    $this->actingAs($user)
        ->post('/client-admin/staff', [
            'name' => 'Another Staff',
            'email' => $existingUser->email,
            'password' => 'password123',
            'role_id' => $role->id,
        ])
        ->assertSessionHasErrors('email');
});

// ─── Update ────────────────────────────────────────────────

test('client admin can update staff member', function () {
    [$user, $tenant] = createClientAdminForStaff();

    $role = Role::create([
        'tenant_id' => $tenant->id,
        'key' => 'receptionist',
        'name_ar' => 'موظف استقبال',
        'name_en' => 'Receptionist',
        'is_system' => false,
    ]);

    $staff = createStaffMember($tenant->id, $role->id);

    $this->actingAs($user)
        ->put("/client-admin/staff/{$staff->id}", [
            'name' => 'Updated Name',
            'email' => $staff->email,
            'role_id' => $role->id,
        ])
        ->assertRedirect(route('client-admin.staff.index'));

    $staff->refresh();
    expect($staff->name)->toBe('Updated Name');
});

// ─── Delete ────────────────────────────────────────────────

test('client admin can delete staff member', function () {
    [$user, $tenant] = createClientAdminForStaff();
    $staff = createStaffMember($tenant->id);

    $this->actingAs($user)
        ->delete("/client-admin/staff/{$staff->id}")
        ->assertRedirect();

    $this->assertDatabaseMissing('users', ['id' => $staff->id]);
});

test('client admin cannot delete themselves', function () {
    [$user, $tenant] = createClientAdminForStaff();

    $this->actingAs($user)
        ->delete("/client-admin/staff/{$user->id}")
        ->assertRedirect();

    $this->assertDatabaseHas('users', ['id' => $user->id]);
});

// ─── Authorization ─────────────────────────────────────────

test('staff member without permission cannot access staff management', function () {
    [$admin, $tenant] = createClientAdminForStaff();

    // Create a role with NO staff.view permission
    $role = Role::create([
        'tenant_id' => $tenant->id,
        'key' => 'limited',
        'name_ar' => 'محدود',
        'name_en' => 'Limited',
        'is_system' => false,
    ]);

    $staff = User::create([
        'name' => 'Limited Staff',
        'email' => 'limited@example.com',
        'password' => Hash::make('password'),
        'tenant_id' => $tenant->id,
        'role' => 'staff',
        'role_id' => $role->id,
        'email_verified_at' => now(),
    ]);

    $this->actingAs($staff)
        ->get('/client-admin/staff')
        ->assertForbidden();
});
