<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $permissions = [
            ['key' => 'reviews.view',    'group' => 'reviews', 'name_ar' => 'عرض آراء العملاء',  'name_en' => 'View Reviews'],
            ['key' => 'reviews.reply',   'group' => 'reviews', 'name_ar' => 'الرد على المراجعات', 'name_en' => 'Reply to Reviews'],
            ['key' => 'reviews.publish', 'group' => 'reviews', 'name_ar' => 'نشر المراجعات',     'name_en' => 'Publish Reviews'],
            ['key' => 'account.view',    'group' => 'account', 'name_ar' => 'عرض حساب المنشأة',   'name_en' => 'View Establishment Account'],
            ['key' => 'account.manage',  'group' => 'account', 'name_ar' => 'إدارة حساب المنشأة', 'name_en' => 'Manage Establishment Account'],
        ];

        $rows = array_map(fn ($p) => array_merge($p, [
            'created_at' => $now,
            'updated_at' => $now,
        ]), $permissions);

        DB::table('permissions')->insertOrIgnore($rows);

        // Existing manager roles should automatically get the new permissions, mirroring the
        // Tenant booted hook which assigns every permission to manager.
        $newPermissionIds = DB::table('permissions')
            ->whereIn('key', array_column($permissions, 'key'))
            ->pluck('id');

        $managerRoleIds = DB::table('roles')->where('key', 'manager')->pluck('id');

        $rolePermRows = [];
        foreach ($managerRoleIds as $roleId) {
            foreach ($newPermissionIds as $permId) {
                $rolePermRows[] = ['role_id' => $roleId, 'permission_id' => $permId];
            }
        }

        if (!empty($rolePermRows)) {
            DB::table('role_permission')->insertOrIgnore($rolePermRows);
        }
    }

    public function down(): void
    {
        // Don't delete — admins may have assigned these to custom roles.
    }
};
