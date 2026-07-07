<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Super-admin managed images for the public landing page (Trusted Hotels strip
 * and footer partner logos). Shared DB with the super-admin app, which writes
 * these rows; the public app only reads them.
 */
class SiteGalleryImage extends Model
{
    protected $fillable = ['group', 'image_path', 'title', 'width', 'sort_order', 'is_active'];

    protected $casts = [
        'width' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Active images for a group, ordered, shaped for the public props.
     *
     * @return array<int, array{id:int, image_path:string, title:?string, width:int}>
     */
    public static function forGroup(string $group): array
    {
        return static::where('group', $group)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'image_path', 'title', 'width'])
            ->toArray();
    }
}
