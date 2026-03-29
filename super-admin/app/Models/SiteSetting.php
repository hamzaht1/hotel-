<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function get(string $key, ?string $default = null): ?string
    {
        return static::where('key', $key)->value('value') ?? $default;
    }

    public static function set(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    public static function getAllGrouped(): array
    {
        $settings = static::pluck('value', 'key')->toArray();

        return [
            'identity' => [
                'site_name_ar' => $settings['site_name_ar'] ?? 'ضيافة',
                'site_name_en' => $settings['site_name_en'] ?? 'Diyafah',
                'site_logo' => $settings['site_logo'] ?? null,
                'site_favicon' => $settings['site_favicon'] ?? null,
            ],
            'colors' => [
                'primary_color' => $settings['primary_color'] ?? '#01004C',
                'secondary_color' => $settings['secondary_color'] ?? '#5A5ECD',
            ],
            'typography' => [
                'font_family' => $settings['font_family'] ?? 'Cairo',
            ],
            'hero' => [
                'hero_title_ar' => $settings['hero_title_ar'] ?? '',
                'hero_title_en' => $settings['hero_title_en'] ?? '',
                'hero_subtitle_ar' => $settings['hero_subtitle_ar'] ?? '',
                'hero_subtitle_en' => $settings['hero_subtitle_en'] ?? '',
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
