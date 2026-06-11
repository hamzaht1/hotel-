<?php

namespace App\Support;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/**
 * Records important actions to the shared `activity_logs` table. Resolves the
 * current tenant / user / IP automatically so callers only pass the action and
 * a human-readable description.
 */
class ActivityLogger
{
    public static function log(string $action, string $description = '', array $properties = [], ?Model $subject = null): void
    {
        try {
            ActivityLog::create([
                'tenant_id' => app()->bound('current_tenant_id') ? app('current_tenant_id') : null,
                'user_id' => Auth::id(),
                'action' => $action,
                'subject_type' => $subject ? $subject::class : null,
                'subject_id' => $subject?->getKey(),
                'description' => $description !== '' ? $description : null,
                'properties' => $properties ?: null,
                'ip_address' => request()?->ip(),
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Auditing must never break the main flow.
            \Illuminate\Support\Facades\Log::warning('ActivityLogger failed: ' . $e->getMessage());
        }
    }
}
