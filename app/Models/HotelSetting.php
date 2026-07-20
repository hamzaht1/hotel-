<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class HotelSetting extends Model
{
    use BelongsToTenant;

    protected $appends = ['logo_url', 'favicon_url'];

    protected $fillable = [
        'tenant_id',
        'hotel_name_ar',
        'hotel_name_en',
        'first_name',
        'last_name',
        'city',
        'phone',
        'description_ar',
        'description_en',
        'logo',
        'favicon',
        'star_rating',
        'currency',
        'timezone',
        'check_in_time',
        'check_out_time',
        'primary_color',
        'secondary_color',
        'meta_tags',
        'commercial_activity',
        'branches_count',
        'manager_type',
        'responsible_position',
        'cr_number',
        'cr_expiry',
        'vat_number',
        'license_number',
        'license_expiry',
        'municipality_license_number',
        'municipality_license_expiry',
        'custom_fields',
    ];

    protected function casts(): array
    {
        return [
            'primary_color' => 'array',
            'secondary_color' => 'array',
            'meta_tags' => 'array',
            // Serialize as plain Y-m-d so the front-end <input type="date">
            // fields can read them back; a full ISO datetime would render the
            // inputs blank and silently wipe the stored dates on the next save.
            'cr_expiry' => 'date:Y-m-d',
            'license_expiry' => 'date:Y-m-d',
            'municipality_license_expiry' => 'date:Y-m-d',
            'branches_count' => 'integer',
            'custom_fields' => 'array',
        ];
    }

    public function getHotelNameAttribute(): string
    {
        return app()->getLocale() === 'ar' ? $this->hotel_name_ar : $this->hotel_name_en;
    }

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo ? Storage::disk('public')->url($this->logo) : null;
    }

    public function getFaviconUrlAttribute(): ?string
    {
        return $this->favicon ? Storage::disk('public')->url($this->favicon) : null;
    }
}
