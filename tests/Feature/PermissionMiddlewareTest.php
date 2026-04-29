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

    // Permission keys are seeded automatically by seed_default_permissions migration.
    $permId = DB::table('permissions')->where('key', 'staff.view')->value('id')
        ?? DB::table('permissions')->insertGetId([
            'key' => 'staff.view',
            'name_ar' => 'عرض الموظفين',
            'name_en' => 'View Staff',
            'group' => 'staff',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

    // Tenant booted hook auto-creates 'manager' role per tenant.
    $role = Role::updateOrCreate(
        ['tenant_id' => $tenant->id, 'key' => 'manager'],
        ['name_ar' => 'مدير', 'name_en' => 'Manager', 'is_system' => false]
    );

    DB::table('role_permission')->insertOrIgnore([
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

    // Use a key not in the auto-seeded defaults so the role has zero permissions.
    $role = Role::updateOrCreate(
        ['tenant_id' => $tenant->id, 'key' => 'limited'],
        ['name_ar' => 'محدود', 'name_en' => 'Limited', 'is_system' => false]
    );

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
