<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

// ─── Admin Bypass ──────────────────────────────────────────

test('admin users bypass permission checks', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->clientAdmin($tenant->id)->create();

    // Staff routes require can:staff.view but client_admin bypasses via hasPermission()
    $this->actingAs($user)
        ->get('/client-admin/staff')
        ->assertOk();
});

// ─── Staff With Permission ─────────────────────────────────

test('staff user with permission can access route', function () {
    $tenant = Tenant::factory()->create();

    // Create permission
    $permId = DB::table('permissions')->insertGetId([
        'key' => 'staff.view',
        'name_ar' => 'عرض الموظفين',
        'name_en' => 'View Staff',
        'group' => 'staff',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Create role with the permission
    $role = Role::create([
        'tenant_id' => $tenant->id,
        'key' => 'manager',
        'name_ar' => 'مدير',
        'name_en' => 'Manager',
        'is_system' => false,
    ]);

    DB::table('role_permission')->insert([
        'role_id' => $role->id,
        'permission_id' => $permId,
    ]);

    $staff = User::create([
        'name' => 'Manager',
        'email' => 'manager@example.com',
        'password' => Hash::make('password'),
        'tenant_id' => $tenant->id,
        'role' => 'staff',
        'role_id' => $role->id,
        'email_verified_at' => now(),
    ]);

    $this->actingAs($staff)
        ->get('/client-admin/staff')
        ->assertOk();
});

// ─── Staff Without Permission ──────────────────────────────

test('staff user without permission gets 403', function () {
    $tenant = Tenant::factory()->create();

    // Create role WITHOUT staff.view permission
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
