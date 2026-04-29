<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class TenantSiteSetting extends Model
{
    use BelongsToTenant;

    protected $fillable = ['tenant_id', 'key', 'value'];

    public static function get(string $key, ?string $default = null): ?string
    {
        return static::where('key', $key)->value('value') ?? $default;
    }

    public static function set(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    /**
     * Return all settings for the current tenant grouped by section, with sane defaults
     * so a brand-new tenant still renders a usable form.
     */
    public static function getAllGrouped(): array
    {
        $settings = static::pluck('value', 'key')->toArray();

        return [
            'identity' => [
                'site_name_ar' => $settings['site_name_ar'] ?? '',
                'site_name_en' => $settings['site_name_en'] ?? '',
                'site_logo' => $settings['site_logo'] ?? null,
                'site_logo_dark' => $settings['site_logo_dark'] ?? null,
                'site_favicon' => $settings['site_favicon'] ?? null,
            ],
            'colors' => [
                'primary_color' => $settings['primary_color'] ?? '',
                'secondary_color' => $settings['secondary_color'] ?? '',
                'accent_color' => $settings['accent_color'] ?? '',
                'dark_primary_color' => $settings['dark_primary_color'] ?? '',
                'dark_secondary_color' => $settings['dark_secondary_color'] ?? '',
                'dark_accent_color' => $settings['dark_accent_color'] ?? '',
            ],
            'typography' => [
                'font_family' => $settings['font_family'] ?? '',
            ],
            'hero' => [
                'hero_title_ar' => $settings['hero_title_ar'] ?? '',
                'hero_title_en' => $settings['hero_title_en'] ?? '',
                'hero_subtitle_ar' => $settings['hero_subtitle_ar'] ?? '',
                'hero_subtitle_en' => $settings['hero_subtitle_en'] ?? '',
            ],
            'texts' => [
                'site_text_ar' => $settings['site_text_ar'] ?? '',
                'site_text_en' => $settings['site_text_en'] ?? '',
            ],
            'footer' => [
                'footer_text_ar' => $settings['footer_text_ar'] ?? '',
                'footer_text_en' => $settings['footer_text_en'] ?? '',
            ],
            'social' => [
                'social_twitter' => $settings['social_twitter'] ?? '',
                'social_instagram' => $settings['social_instagram'] ?? '',
                'social_linkedin' => $settings['social_linkedin'] ?? '',
                'social_facebook' => $settings['social_facebook'] ?? '',
            ],
        ];
    }
}
