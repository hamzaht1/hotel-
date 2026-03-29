<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'domain',
        'subdomain',
        'template',
        'logo',
        'email',
        'phone',
        'subscription_starts_at',
        'subscription_ends_at',
        'plan',
        'plan_id',
        'is_active',
        'settings',
        'payment_status',
        'payment_method',
        'bank_transfer_receipt',
        'payment_notes',
        'org_name_ar',
        'org_name_en',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'settings' => 'array',
            'subscription_starts_at' => 'date',
            'subscription_ends_at' => 'date',
        ];
    }

    public function planModel(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    public function galleryImages(): HasMany
    {
        return $this->hasMany(GalleryImage::class);
    }

    public function siteTexts(): HasMany
    {
        return $this->hasMany(SiteText::class);
    }

    public function siteSections(): HasMany
    {
        return $this->hasMany(SiteSection::class);
    }

    public function contactSettings(): HasOne
    {
        return $this->hasOne(ContactSetting::class);
    }

    public function hotelSettings(): HasOne
    {
        return $this->hasOne(HotelSetting::class);
    }

    public function isSubscriptionActive(): bool
    {
        if (!$this->is_active) return false;
        if (!$this->subscription_ends_at) return true;
        return $this->subscription_ends_at->isFuture();
    }
}
