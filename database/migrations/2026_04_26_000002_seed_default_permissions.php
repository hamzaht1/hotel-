<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $permissions = [
            // Content management
            ['key' => 'rooms.view',              'group' => 'content',  'name_ar' => 'عرض الغرف',                'name_en' => 'View Rooms'],
            ['key' => 'rooms.create',            'group' => 'content',  'name_ar' => 'إنشاء غرفة',               'name_en' => 'Create Room'],
            ['key' => 'rooms.edit',              'group' => 'content',  'name_ar' => 'تعديل غرفة',               'name_en' => 'Edit Room'],
            ['key' => 'rooms.delete',            'group' => 'content',  'name_ar' => 'حذف غرفة',                 'name_en' => 'Delete Room'],

            ['key' => 'gallery.view',            'group' => 'content',  'name_ar' => 'عرض المعرض',               'name_en' => 'View Gallery'],
            ['key' => 'gallery.manage',          'group' => 'content',  'name_ar' => 'إدارة المعرض',             'name_en' => 'Manage Gallery'],

            ['key' => 'site_texts.view',         'group' => 'content',  'name_ar' => 'عرض نصوص الموقع',          'name_en' => 'View Site Texts'],
            ['key' => 'site_texts.edit',         'group' => 'content',  'name_ar' => 'تعديل نصوص الموقع',        'name_en' => 'Edit Site Texts'],

            ['key' => 'site_sections.view',      'group' => 'content',  'name_ar' => 'عرض الأقسام',              'name_en' => 'View Sections'],
            ['key' => 'site_sections.manage',    'group' => 'content',  'name_ar' => 'إدارة الأقسام',            'name_en' => 'Manage Sections'],

            // Contact / hotel
            ['key' => 'contact.view',            'group' => 'settings', 'name_ar' => 'عرض إعدادات التواصل',      'name_en' => 'View Contact Settings'],
            ['key' => 'contact.edit',            'group' => 'settings', 'name_ar' => 'تعديل إعدادات التواصل',    'name_en' => 'Edit Contact Settings'],

            ['key' => 'hotel_settings.view',     'group' => 'settings', 'name_ar' => 'عرض إعدادات الفندق',       'name_en' => 'View Hotel Settings'],
            ['key' => 'hotel_settings.edit',     'group' => 'settings', 'name_ar' => 'تعديل إعدادات الفندق',     'name_en' => 'Edit Hotel Settings'],

            // Services
            ['key' => 'services.view',           'group' => 'services', 'name_ar' => 'عرض الخدمات',              'name_en' => 'View Services'],
            ['key' => 'services.manage',         'group' => 'services', 'name_ar' => 'إدارة الخدمات',            'name_en' => 'Manage Services'],
            ['key' => 'service_categories.view', 'group' => 'services', 'name_ar' => 'عرض أقسام الخدمات',        'name_en' => 'View Service Categories'],
            ['key' => 'service_categories.manage','group' => 'services','name_ar' => 'إدارة أقسام الخدمات',      'name_en' => 'Manage Service Categories'],

            // Reports
            ['key' => 'reports.subscriptions',   'group' => 'reports',  'name_ar' => 'تقارير الاشتراك',          'name_en' => 'Subscription Reports'],
            ['key' => 'reports.messages',        'group' => 'reports',  'name_ar' => 'الرسائل والدعم',           'name_en' => 'Messages & Support'],

            // Staff / users
            ['key' => 'staff.view',              'group' => 'staff',    'name_ar' => 'عرض الموظفين',             'name_en' => 'View Staff'],
            ['key' => 'staff.create',            'group' => 'staff',    'name_ar' => 'إنشاء موظف',               'name_en' => 'Create Staff'],
            ['key' => 'staff.edit',              'group' => 'staff',    'name_ar' => 'تعديل موظف',               'name_en' => 'Edit Staff'],
            ['key' => 'staff.delete',            'group' => 'staff',    'name_ar' => 'حذف موظف',                 'name_en' => 'Delete Staff'],
        ];

        $rows = array_map(fn ($p) => array_merge($p, [
            'created_at' => $now,
            'updated_at' => $now,
        ]), $permissions);

        // Idempotent: `key` is unique; insertOrIgnore skips existing rows so re-running migrate is safe.
        DB::table('permissions')->insertOrIgnore($rows);
    }

    public function down(): void
    {
        // Don't delete — other tenants' role_permission rows depend on these IDs.
    }
};
