<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $tenantIds = DB::table('tenants')->pluck('id');
        $allPermissions = DB::table('permissions')->pluck('id', 'key');

        if ($allPermissions->isEmpty()) {
            return;
        }

        $receptionistKeys = [
            'rooms.view', 'gallery.view', 'site_texts.view', 'site_sections.view',
            'contact.view', 'hotel_settings.view',
            'services.view', 'service_categories.view',
            'reports.messages',
        ];

        foreach ($tenantIds as $tenantId) {
            $managerId = DB::table('roles')->where('tenant_id', $tenantId)->where('key', 'manager')->value('id');
            if (!$managerId) {
                $managerId = DB::table('roles')->insertGetId([
                    'tenant_id' => $tenantId,
                    'key' => 'manager',
                    'name_ar' => 'مدير',
                    'name_en' => 'Manager',
                    'is_system' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $receptionistId = DB::table('roles')->where('tenant_id', $tenantId)->where('key', 'receptionist')->value('id');
            if (!$receptionistId) {
                $receptionistId = DB::table('roles')->insertGetId([
                    'tenant_id' => $tenantId,
                    'key' => 'receptionist',
                    'name_ar' => 'موظف استقبال',
                    'name_en' => 'Receptionist',
                    'is_system' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            // Manager → all permissions.
            $managerRows = $allPermissions->map(fn ($id) => [
                'role_id' => $managerId,
                'permission_id' => $id,
            ])->all();

            $receptionistRows = collect($receptionistKeys)
                ->filter(fn ($key) => isset($allPermissions[$key]))
                ->map(fn ($key) => [
                    'role_id' => $receptionistId,
                    'permission_id' => $allPermissions[$key],
                ])->all();

            DB::table('role_permission')->insertOrIgnore(array_merge($managerRows, $receptionistRows));
        }
    }

    public function down(): void
    {
        // No-op: keep backfilled rows so we don't strip permissions admins may have customised.
    }
};
