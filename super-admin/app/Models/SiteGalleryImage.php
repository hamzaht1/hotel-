<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Super-admin managed images for the public landing page (Trusted Hotels strip
 * and footer partner logos). The super-admin app manages these rows; the public
 * app reads them from the shared DB.
 */
class SiteGalleryImage extends Model
{
    protected $fillable = ['group', 'image_path', 'title', 'width', 'sort_order', 'is_active'];

    protected $casts = [
        'width' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    /** Allowed gallery groups surfaced in the editor. */
    public const GROUPS = ['hotels', 'footer'];
}
