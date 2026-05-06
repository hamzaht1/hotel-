<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageSubmission extends Model
{
    protected $fillable = [
        'page_id',
        'tenant_id',
        'data',
        'ip',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
        ];
    }

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
