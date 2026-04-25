<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'name_ar',
        'name_en',
        'description_ar',
        'description_en',
        'price',
        'billing_cycle',
        'features_ar',
        'features_en',
        'feature_styles',
        'limits',
        'icon',
        'variant',
        'sort_order',
        'is_active',
        'is_coming_soon',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'features_ar' => 'array',
            'features_en' => 'array',
            'feature_styles' => 'array',
            'limits' => 'array',
            'is_active' => 'boolean',
            'is_coming_soon' => 'boolean',
        ];
    }

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class);
    }

    public function discountCodes(): HasMany
    {
        return $this->hasMany(DiscountCode::class);
    }
}
