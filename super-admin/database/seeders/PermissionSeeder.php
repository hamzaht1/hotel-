<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Create Permissions ──────────────────────────────────
        $permissions = [
            ['key' => 'dashboard.view', 'name_ar' => 'عرض لوحة التحكم', 'name_en' => 'View Dashboard', 'group' => 'dashboard'],

            ['key' => 'rooms.view', 'name_ar' => 'عرض الغرف', 'name_en' => 'View Rooms', 'group' => 'rooms'],
            ['key' => 'rooms.create', 'name_ar' => 'إنشاء غرفة', 'name_en' => 'Create Room', 'group' => 'rooms'],
            ['key' => 'rooms.edit', 'name_ar' => 'تعديل غرفة', 'name_en' => 'Edit Room', 'group' => 'rooms'],
            ['key' => 'rooms.delete', 'name_ar' => 'حذف غرفة', 'name_en' => 'Delete Room', 'group' => 'rooms'],

            ['key' => 'gallery.view', 'name_ar' => 'عرض المعرض', 'name_en' => 'View Gallery', 'group' => 'gallery'],
            ['key' => 'gallery.upload', 'name_ar' => 'رفع صور', 'name_en' => 'Upload Images', 'group' => 'gallery'],
            ['key' => 'gallery.delete', 'name_ar' => 'حذف صور', 'name_en' => 'Delete Images', 'group' => 'gallery'],

            ['key' => 'site_texts.view', 'name_ar' => 'عرض النصوص', 'name_en' => 'View Site Texts', 'group' => 'site_texts'],
            ['key' => 'site_texts.edit', 'name_ar' => 'تعديل النصوص', 'name_en' => 'Edit Site Texts', 'group' => 'site_texts'],

            ['key' => 'site_sections.view', 'name_ar' => 'عرض الأقسام', 'name_en' => 'View Sections', 'group' => 'site_sections'],
            ['key' => 'site_sections.toggle', 'name_ar' => 'تفعيل/تعطيل الأقسام', 'name_en' => 'Toggle Sections', 'group' => 'site_sections'],

            ['key' => 'contact.view', 'name_ar' => 'عرض التواصل', 'name_en' => 'View Contact', 'group' => 'contact'],
            ['key' => 'contact.edit', 'name_ar' => 'تعديل التواصل', 'name_en' => 'Edit Contact', 'group' => 'contact'],

            ['key' => 'hotel_settings.view', 'name_ar' => 'عرض الإعدادات', 'name_en' => 'View Hotel Settings', 'group' => 'hotel_settings'],
            ['key' => 'hotel_settings.edit', 'name_ar' => 'تعديل الإعدادات', 'name_en' => 'Edit Hotel Settings', 'group' => 'hotel_settings'],

            ['key' => 'reports.subscriptions', 'name_ar' => 'تقرير الاشتراكات', 'name_en' => 'Subscription Reports', 'group' => 'reports'],
            ['key' => 'reports.messages', 'name_ar' => 'الرسائل والدعم', 'name_en' => 'Messages & Support', 'group' => 'reports'],

            ['key' => 'services.view', 'name_ar' => 'عرض الخدمات', 'name_en' => 'View Services', 'group' => 'services'],
            ['key' => 'services.create', 'name_ar' => 'إنشاء خدمة', 'name_en' => 'Create Service', 'group' => 'services'],
            ['key' => 'services.edit', 'name_ar' => 'تعديل خدمة', 'name_en' => 'Edit Service', 'group' => 'services'],
            ['key' => 'services.delete', 'name_ar' => 'حذف خدمة', 'name_en' => 'Delete Service', 'group' => 'services'],

            ['key' => 'staff.view', 'name_ar' => 'عرض الموظفين', 'name_en' => 'View Staff', 'group' => 'staff'],
            ['key' => 'staff.create', 'name_ar' => 'إنشاء موظف', 'name_en' => 'Create Staff', 'group' => 'staff'],
            ['key' => 'staff.edit', 'name_ar' => 'تعديل موظف', 'name_en' => 'Edit Staff', 'group' => 'staff'],
            ['key' => 'staff.delete', 'name_ar' => 'حذف موظف', 'name_en' => 'Delete Staff', 'group' => 'staff'],
        ];

        foreach ($permissions as $perm) {
            DB::table('permissions')->updateOrInsert(
                ['key' => $perm['key']],
                array_merge($perm, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        $allPermissionIds = DB::table('permissions')->pluck('id')->toArray();

        // ─── Create System Roles ─────────────────────────────────

        // Super Admin - all permissions
        $superAdminId = $this->createRole('super_admin', 'مدير النظام', 'Super Admin', true);
        $this->syncPermissions($superAdminId, $allPermissionIds);

        // Client Admin - all permissions
        $clientAdminId = $this->createRole('client_admin', 'مدير المنشأة', 'Hotel Admin', true);
        $this->syncPermissions($clientAdminId, $allPermissionIds);

        // Manager - all except staff.delete and hotel_settings.edit
        $managerPerms = DB::table('permissions')
            ->whereNotIn('key', ['staff.delete', 'hotel_settings.edit'])
            ->pluck('id')->toArray();
        $managerId = $this->createRole('manager', 'مدير', 'Manager', true);
        $this->syncPermissions($managerId, $managerPerms);

        // Receptionist - limited access
        $receptionistPerms = DB::table('permissions')
            ->whereIn('key', ['dashboard.view', 'rooms.view', 'gallery.view', 'reports.messages'])
            ->pluck('id')->toArray();
        $receptionistId = $this->createRole('receptionist', 'موظف استقبال', 'Receptionist', true);
        $this->syncPermissions($receptionistId, $receptionistPerms);
    }

    private function createRole(string $key, string $nameAr, string $nameEn, bool $isSystem): int
    {
        $existing = DB::table('roles')->where('key', $key)->whereNull('tenant_id')->first();

        if ($existing) {
            DB::table('roles')->where('id', $existing->id)->update([
                'name_ar' => $nameAr,
                'name_en' => $nameEn,
                'is_system' => $isSystem,
                'updated_at' => now(),
            ]);
            return $existing->id;
        }

        return DB::table('roles')->insertGetId([
            'key' => $key,
            'tenant_id' => null,
            'name_ar' => $nameAr,
            'name_en' => $nameEn,
            'is_system' => $isSystem,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function syncPermissions(int $roleId, array $permissionIds): void
    {
        DB::table('role_permission')->where('role_id', $roleId)->delete();

        $rows = array_map(fn ($pid) => ['role_id' => $roleId, 'permission_id' => $pid], $permissionIds);

        DB::table('role_permission')->insert($rows);
    }
}
