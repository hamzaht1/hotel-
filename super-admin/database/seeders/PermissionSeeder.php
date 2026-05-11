<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Super-admin scoped permissions only — no tenant-level rooms/gallery/services.
        // Those belong to the client-admin app.
        $permissions = [
            // Dashboard
            ['key' => 'dashboard.view', 'name_ar' => 'عرض لوحة التحكم', 'name_en' => 'View Dashboard', 'group' => 'dashboard'],

            // Tenants (requests)
            ['key' => 'tenants.view', 'name_ar' => 'عرض الطلبات', 'name_en' => 'View Requests', 'group' => 'tenants'],
            ['key' => 'tenants.create', 'name_ar' => 'إنشاء طلب', 'name_en' => 'Create Request', 'group' => 'tenants'],
            ['key' => 'tenants.edit', 'name_ar' => 'تعديل طلب', 'name_en' => 'Edit Request', 'group' => 'tenants'],
            ['key' => 'tenants.approve', 'name_ar' => 'قبول الطلب وتفعيل الموقع', 'name_en' => 'Approve & Activate Site', 'group' => 'tenants'],
            ['key' => 'tenants.reject', 'name_ar' => 'رفض الطلب', 'name_en' => 'Reject Request', 'group' => 'tenants'],
            ['key' => 'tenants.delete', 'name_ar' => 'حذف الطلب', 'name_en' => 'Delete Request', 'group' => 'tenants'],
            ['key' => 'tenants.message', 'name_ar' => 'مراسلة العميل', 'name_en' => 'Message Client', 'group' => 'tenants'],
            ['key' => 'tenants.deploy', 'name_ar' => 'نشر الموقع', 'name_en' => 'Deploy Site', 'group' => 'tenants'],

            // Clients (post-conversion view)
            ['key' => 'clients.view', 'name_ar' => 'عرض العملاء', 'name_en' => 'View Clients', 'group' => 'clients'],
            ['key' => 'clients.create', 'name_ar' => 'إضافة عميل', 'name_en' => 'Add Client', 'group' => 'clients'],
            ['key' => 'clients.edit', 'name_ar' => 'تعديل العميل', 'name_en' => 'Edit Client', 'group' => 'clients'],
            ['key' => 'clients.set_tier', 'name_ar' => 'تغيير وسام العميل', 'name_en' => 'Set Client Tier', 'group' => 'clients'],
            ['key' => 'clients.set_status', 'name_ar' => 'تغيير حالة العميل', 'name_en' => 'Set Client Status', 'group' => 'clients'],

            // Invoices
            ['key' => 'invoices.view', 'name_ar' => 'عرض الفواتير', 'name_en' => 'View Invoices', 'group' => 'invoices'],
            ['key' => 'invoices.create', 'name_ar' => 'إنشاء فاتورة', 'name_en' => 'Create Invoice', 'group' => 'invoices'],
            ['key' => 'invoices.edit', 'name_ar' => 'تعديل فاتورة', 'name_en' => 'Edit Invoice', 'group' => 'invoices'],
            ['key' => 'invoices.send', 'name_ar' => 'إرسال فاتورة', 'name_en' => 'Send Invoice', 'group' => 'invoices'],
            ['key' => 'invoices.mark_paid', 'name_ar' => 'تسجيل دفع الفاتورة', 'name_en' => 'Mark Invoice Paid', 'group' => 'invoices'],
            ['key' => 'invoices.delete', 'name_ar' => 'حذف فاتورة', 'name_en' => 'Delete Invoice', 'group' => 'invoices'],

            // Quotes
            ['key' => 'quotes.view', 'name_ar' => 'عرض عروض الأسعار', 'name_en' => 'View Quotes', 'group' => 'quotes'],
            ['key' => 'quotes.create', 'name_ar' => 'إنشاء عرض سعر', 'name_en' => 'Create Quote', 'group' => 'quotes'],
            ['key' => 'quotes.edit', 'name_ar' => 'تعديل عرض سعر', 'name_en' => 'Edit Quote', 'group' => 'quotes'],
            ['key' => 'quotes.send', 'name_ar' => 'إرسال عرض سعر', 'name_en' => 'Send Quote', 'group' => 'quotes'],
            ['key' => 'quotes.mark_accepted', 'name_ar' => 'قبول عرض السعر', 'name_en' => 'Mark Quote Accepted', 'group' => 'quotes'],
            ['key' => 'quotes.mark_refused', 'name_ar' => 'رفض عرض السعر', 'name_en' => 'Mark Quote Refused', 'group' => 'quotes'],
            ['key' => 'quotes.delete', 'name_ar' => 'حذف عرض سعر', 'name_en' => 'Delete Quote', 'group' => 'quotes'],

            // Transactions
            ['key' => 'transactions.view', 'name_ar' => 'عرض العمليات المالية', 'name_en' => 'View Transactions', 'group' => 'transactions'],
            ['key' => 'transactions.manage', 'name_ar' => 'إدارة العمليات المالية', 'name_en' => 'Manage Transactions', 'group' => 'transactions'],

            // Renewals
            ['key' => 'renewals.view', 'name_ar' => 'عرض التجديدات', 'name_en' => 'View Renewals', 'group' => 'renewals'],
            ['key' => 'renewals.approve', 'name_ar' => 'قبول طلب تجديد', 'name_en' => 'Approve Renewal', 'group' => 'renewals'],
            ['key' => 'renewals.reject', 'name_ar' => 'رفض طلب تجديد', 'name_en' => 'Reject Renewal', 'group' => 'renewals'],

            // Plans / Templates / Discount codes
            ['key' => 'plans.manage', 'name_ar' => 'إدارة الباقات', 'name_en' => 'Manage Plans', 'group' => 'catalog'],
            ['key' => 'templates.manage', 'name_ar' => 'إدارة القوالب', 'name_en' => 'Manage Templates', 'group' => 'catalog'],
            ['key' => 'discount_codes.manage', 'name_ar' => 'إدارة أكواد الخصم', 'name_en' => 'Manage Discount Codes', 'group' => 'catalog'],
            ['key' => 'form_builder.manage', 'name_ar' => 'إدارة نماذج الحجز', 'name_en' => 'Manage Form Builder', 'group' => 'catalog'],

            // CMS
            ['key' => 'pages.manage', 'name_ar' => 'إدارة الصفحات', 'name_en' => 'Manage Pages', 'group' => 'cms'],
            ['key' => 'menus.manage', 'name_ar' => 'إدارة القوائم', 'name_en' => 'Manage Menus', 'group' => 'cms'],
            ['key' => 'site_settings.edit', 'name_ar' => 'تعديل إعدادات الموقع', 'name_en' => 'Edit Site Settings', 'group' => 'cms'],

            // Reviews
            ['key' => 'reviews.view', 'name_ar' => 'عرض التقييمات', 'name_en' => 'View Reviews', 'group' => 'reviews'],
            ['key' => 'reviews.moderate', 'name_ar' => 'مراجعة وقبول التقييمات', 'name_en' => 'Moderate Reviews', 'group' => 'reviews'],
            ['key' => 'reviews.reply', 'name_ar' => 'الرد على التقييمات', 'name_en' => 'Reply to Reviews', 'group' => 'reviews'],

            // Reports
            ['key' => 'reports.view', 'name_ar' => 'عرض التقارير', 'name_en' => 'View Reports', 'group' => 'reports'],
            ['key' => 'reports.financial', 'name_ar' => 'التقارير المالية', 'name_en' => 'Financial Reports', 'group' => 'reports'],
            ['key' => 'reports.subscriptions', 'name_ar' => 'تقرير الاشتراكات', 'name_en' => 'Subscription Reports', 'group' => 'reports'],
            ['key' => 'reports.messages', 'name_ar' => 'الرسائل والدعم', 'name_en' => 'Messages & Support', 'group' => 'reports'],

            // Integrations
            ['key' => 'integrations.manage', 'name_ar' => 'إدارة التكاملات', 'name_en' => 'Manage Integrations', 'group' => 'integrations'],

            // Staff & roles (super-admin staff management)
            ['key' => 'staff.view', 'name_ar' => 'عرض الموظفين', 'name_en' => 'View Staff', 'group' => 'staff'],
            ['key' => 'staff.create', 'name_ar' => 'إنشاء موظف', 'name_en' => 'Create Staff', 'group' => 'staff'],
            ['key' => 'staff.edit', 'name_ar' => 'تعديل موظف', 'name_en' => 'Edit Staff', 'group' => 'staff'],
            ['key' => 'staff.delete', 'name_ar' => 'حذف موظف', 'name_en' => 'Delete Staff', 'group' => 'staff'],
            ['key' => 'roles.manage', 'name_ar' => 'إدارة الأدوار', 'name_en' => 'Manage Roles', 'group' => 'staff'],
        ];

        // NOTE: this seeder shares its `permissions` table with the main app,
        // which owns tenant-level perms (rooms.*, gallery.*, services.*, etc.).
        // We MUST NOT delete those — they belong to client_admin staff roles.
        // Instead, RoleController::index filters by group so the super-admin
        // role builder only surfaces super-admin scoped permissions.

        foreach ($permissions as $perm) {
            DB::table('permissions')->updateOrInsert(
                ['key' => $perm['key']],
                array_merge($perm, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // Restrict to super-admin scoped groups when handing perms to roles.
        $superAdminGroups = ['dashboard', 'tenants', 'clients', 'invoices', 'quotes', 'transactions', 'renewals', 'catalog', 'cms', 'reviews', 'reports', 'integrations', 'staff'];
        $allPermissionIds = DB::table('permissions')
            ->whereIn('group', $superAdminGroups)
            ->whereIn('key', array_column($permissions, 'key'))
            ->pluck('id')->toArray();

        // ─── System roles ────────────────────────────────────────
        // Super Admin — gets every permission.
        $superAdminId = $this->createRole('super_admin', 'مدير النظام', 'Super Admin', true);
        $this->syncPermissions($superAdminId, $allPermissionIds);

        // Operations — everything except staff/role management.
        $opsPerms = DB::table('permissions')
            ->whereNotIn('group', ['staff'])
            ->pluck('id')->toArray();
        $opsId = $this->createRole('operations', 'فريق العمليات', 'Operations', true);
        $this->syncPermissions($opsId, $opsPerms);

        // Support — read-only on requests/clients/invoices, can message and reply to reviews.
        $supportPerms = DB::table('permissions')
            ->whereIn('key', [
                'dashboard.view',
                'tenants.view', 'tenants.message',
                'clients.view',
                'invoices.view',
                'quotes.view',
                'reviews.view', 'reviews.reply',
                'reports.messages',
            ])
            ->pluck('id')->toArray();
        $supportId = $this->createRole('support', 'الدعم الفني', 'Support', true);
        $this->syncPermissions($supportId, $supportPerms);

        // Finance — invoices + transactions + financial reports.
        $financePerms = DB::table('permissions')
            ->whereIn('key', [
                'dashboard.view',
                'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.send', 'invoices.mark_paid',
                'quotes.view', 'quotes.create', 'quotes.edit', 'quotes.send', 'quotes.mark_accepted', 'quotes.mark_refused',
                'transactions.view', 'transactions.manage',
                'reports.view', 'reports.financial', 'reports.subscriptions',
                'tenants.view', 'clients.view',
                'renewals.view', 'renewals.approve', 'renewals.reject',
            ])
            ->pluck('id')->toArray();
        $financeId = $this->createRole('finance', 'المحاسبة', 'Finance', true);
        $this->syncPermissions($financeId, $financePerms);

        // Drop legacy tenant-level system roles that have no place in super-admin staff.
        DB::table('roles')
            ->whereNull('tenant_id')
            ->whereIn('key', ['client_admin', 'manager', 'receptionist'])
            ->delete();
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
