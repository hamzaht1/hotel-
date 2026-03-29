<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

function createClientAdminForRoles(): array
{
    $tenant = Tenant::factory()->create();
    $user = User::factory()->clientAdmin($tenant->id)->create();
    return [$user, $tenant];
}

function seedPermissions(): array
{
    $permissions = [
        ['key' => 'staff.view', 'name_ar' => 'عرض الموظفين', 'name_en' => 'View Staff', 'group' => 'staff'],
        ['key' => 'staff.create', 'name_ar' => 'إضافة موظف', 'name_en' => 'Create Staff', 'group' => 'staff'],
        ['key' => 'staff.edit', 'name_ar' => 'تعديل موظف', 'name_en' => 'Edit Staff', 'group' => 'staff'],
        ['key' => 'staff.delete', 'name_ar' => 'حذف موظف', 'name_en' => 'Delete Staff', 'group' => 'staff'],
        ['key' => 'rooms.view', 'name_ar' => 'عرض الغرف', 'name_en' => 'View Rooms', 'group' => 'rooms'],
        ['key' => 'rooms.create', 'name_ar' => 'إضافة غرفة', 'name_en' => 'Create Room', 'group' => 'rooms'],
    ];

    $ids = [];
    foreach ($permissions as $perm) {
        $ids[] = DB::table('permissions')->insertGetId(array_merge($perm, [
            'created_at' => now(),
            'updated_at' => now(),
        ]));
    }

    return $ids;
}

// ─── Index ─────────────────────────────────────────────────

test('client admin can list roles with permissions', function () {
    [$user, $tenant] = createClientAdminForRoles();
    $permIds = seedPermissions();

    $role = Role::create([
        'tenant_id' => $tenant->id,
        'key' => 'receptionist',
        'name_ar' => 'موظف استقبال',
        'name_en' => 'Receptionist',
        'is_system' => false,
    ]);
    $role->permissions()->sync([$permIds[0], $permIds[1]]);

    $this->actingAs($user)
        ->get('/client-admin/roles')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('client-admin/roles/index')
            ->has('roles')
            ->has('permissions')
        );
});

// ─── Create ────────────────────────────────────────────────

test('client admin can create a custom role with permissions', function () {
    [$user, $tenant] = createClientAdminForRoles();
    $permIds = seedPermissions();

    $this->actingAs($user)
        ->post('/client-admin/roles', [
            'name_ar' => 'مشرف',
            'name_en' => 'Supervisor',
            'key' => 'supervisor',
            'permissions' => [$permIds[0], $permIds[1], $permIds[2]],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('roles', [
        'tenant_id' => $tenant->id,
        'key' => 'supervisor',
        'is_system' => false,
    ]);

    $role = Role::where('key', 'supervisor')->where('tenant_id', $tenant->id)->first();
    expect($role->permissions)->toHaveCount(3);
});

// ─── Delete ────────────────────────────────────────────────

test('client admin cannot delete system roles', function () {
    [$user, $tenant] = createClientAdminForRoles();

    $systemRole = Role::create([
        'tenant_id' => null,
        'key' => 'system_role',
        'name_ar' => 'دور نظام',
        'name_en' => 'System Role',
        'is_system' => true,
    ]);

    $this->actingAs($user)
        ->delete("/client-admin/roles/{$systemRole->id}")
        ->assertRedirect();

    $this->assertDatabaseHas('roles', ['id' => $systemRole->id]);
});

test('client admin cannot delete role with assigned users', function () {
    [$user, $tenant] = createClientAdminForRoles();

    $role = Role::create([
        'tenant_id' => $tenant->id,
        'key' => 'receptionist',
        'name_ar' => 'موظف استقبال',
        'name_en' => 'Receptionist',
        'is_system' => false,
    ]);

    // Assign a user to this role
    User::create([
        'name' => 'Staff',
        'email' => 'staff@example.com',
        'password' => Hash::make('password'),
        'tenant_id' => $tenant->id,
        'role' => 'staff',
        'role_id' => $role->id,
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user)
        ->delete("/client-admin/roles/{$role->id}")
        ->assertRedirect();

    $this->assertDatabaseHas('roles', ['id' => $role->id]);
});

// ─── Update ────────────────────────────────────────────────

test('client admin can update custom role permissions', function () {
    [$user, $tenant] = createClientAdminForRoles();
    $permIds = seedPermissions();

    $role = Role::create([
        'tenant_id' => $tenant->id,
        'key' => 'receptionist',
        'name_ar' => 'موظف استقبال',
        'name_en' => 'Receptionist',
        'is_system' => false,
    ]);
    $role->permissions()->sync([$permIds[0]]);

    $this->actingAs($user)
        ->put("/client-admin/roles/{$role->id}", [
            'name_ar' => 'موظف استقبال محدث',
            'name_en' => 'Updated Receptionist',
            'permissions' => [$permIds[0], $permIds[1], $permIds[2], $permIds[3]],
        ])
        ->assertRedirect();

    $role->refresh();
    expect($role->name_en)->toBe('Updated Receptionist')
        ->and($role->permissions)->toHaveCount(4);
});
