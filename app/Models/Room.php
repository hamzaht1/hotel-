<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name_ar',
        'name_en',
        'description_ar',
        'description_en',
        'short_description_ar',
        'short_description_en',
        'internal_notes',
        'price',
        'capacity',
        'featured_image',
        'text_color',
        'is_active',
        'is_featured',
        'booking_channel',
        'whatsapp_number',
        'whatsapp_message_ar',
        'whatsapp_message_en',
        'booking_email',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    public function images(): HasMany
    {
        return $this->hasMany(RoomImage::class)->orderBy('sort_order');
    }

    public function amenities(): HasMany
    {
        return $this->hasMany(RoomAmenity::class)->orderBy('sort_order');
    }

    public function getNameAttribute(): string
    {
        return app()->getLocale() === 'ar' ? $this->name_ar : $this->name_en;
    }

    public function getDescriptionAttribute(): string
    {
        return app()->getLocale() === 'ar' ? ($this->description_ar ?? '') : ($this->description_en ?? '');
    }
}
