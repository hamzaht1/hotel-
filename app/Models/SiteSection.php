<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class SiteSection extends Model
{
    use BelongsToTenant;

    public const AVAILABLE = ['hero', 'rooms', 'services', 'additional_services', 'gallery', 'testimonials', 'partners', 'contact'];

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
}
