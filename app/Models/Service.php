<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'category_id',
        'name_ar',
        'name_en',
        'description_ar',
        'description_en',
        'short_description_ar',
        'short_description_en',
        'internal_notes',
        'price',
        'capacity',
        'room_type',
        'duration',
        'featured_image',
        'text_color',
        'video_url',
        'required_fields',
        'accepts_bookings',
        'booking_channel',
        'whatsapp_number',
        'whatsapp_message_ar',
        'whatsapp_message_en',
        'booking_email',
        'is_active',
        'is_featured',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'capacity' => 'integer',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'accepts_bookings' => 'boolean',
            'required_fields' => 'array',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'category_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ServiceImage::class)->orderBy('sort_order');
    }

    public function features(): HasMany
    {
        return $this->hasMany(ServiceFeature::class)->orderBy('sort_order');
    }
}
