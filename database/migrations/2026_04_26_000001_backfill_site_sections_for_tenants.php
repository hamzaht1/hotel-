<?php

use App\Models\SiteSection;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $tenantIds = DB::table('tenants')->pluck('id');

        foreach ($tenantIds as $tenantId) {
            $existing = DB::table('site_sections')
                ->where('tenant_id', $tenantId)
                ->pluck('section_name')
                ->all();

            $missing = array_values(array_diff(SiteSection::AVAILABLE, $existing));
            if (empty($missing)) {
                continue;
            }

            $maxOrder = (int) DB::table('site_sections')
                ->where('tenant_id', $tenantId)
                ->max('sort_order');

            $rows = [];
            foreach ($missing as $i => $name) {
                $rows[] = [
                    'tenant_id' => $tenantId,
                    'section_name' => $name,
                    'is_active' => true,
                    'sort_order' => $maxOrder + $i + 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            DB::table('site_sections')->insertOrIgnore($rows);
        }
    }

    public function down(): void
    {
        // No-op: we don't know which rows were backfilled vs created by users.
    }
};
