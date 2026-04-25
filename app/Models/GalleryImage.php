<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class GalleryImage extends Model
{
    use BelongsToTenant;

    protected $appends = ['url'];

    protected $fillable = [
        'tenant_id',
        'title_ar',
        'title_en',
        'path',
        'category',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function getTitleAttribute(): string
    {
        return app()->getLocale() === 'ar' ? ($this->title_ar ?? '') : ($this->title_en ?? '');
    }

    protected function url(): Attribute
    {
        return Attribute::get(fn () => $this->path ? Storage::disk('public')->url($this->path) : null);
    }
}
