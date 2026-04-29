<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteSection extends Model
{
    public const AVAILABLE = ['hero', 'rooms', 'services', 'gallery', 'testimonials', 'partners', 'contact'];

    protected $fillable = [
        'tenant_id',
        'section_name',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
