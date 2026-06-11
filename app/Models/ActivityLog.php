<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Lightweight audit trail shared across the platform (same `activity_logs`
 * table is readable from the super-admin app). Only `created_at` is tracked.
 */
class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'action',
        'subject_type',
        'subject_id',
        'description',
        'properties',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'properties' => 'array',
        ];
    }
}
