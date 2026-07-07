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
                'site_logo_dark' => $settings['site_logo_dark'] ?? null,
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
                'hero_cta_ar' => $settings['hero_cta_ar'] ?? '',
                'hero_cta_en' => $settings['hero_cta_en'] ?? '',
            ],
            'why_us' => [
                'why_us_title_ar' => $settings['why_us_title_ar'] ?? '',
                'why_us_title_en' => $settings['why_us_title_en'] ?? '',
            ],
            'how_we_work' => [
                'how_we_work_title_ar' => $settings['how_we_work_title_ar'] ?? '',
                'how_we_work_title_en' => $settings['how_we_work_title_en'] ?? '',
            ],
            'hotels_section' => [
                'hotels_title_ar' => $settings['hotels_title_ar'] ?? '',
                'hotels_title_en' => $settings['hotels_title_en'] ?? '',
                'hotels_subtitle_ar' => $settings['hotels_subtitle_ar'] ?? '',
                'hotels_subtitle_en' => $settings['hotels_subtitle_en'] ?? '',
                'hotels_description_ar' => $settings['hotels_description_ar'] ?? '',
                'hotels_description_en' => $settings['hotels_description_en'] ?? '',
            ],
            'testimonials_section' => [
                'testimonials_title_ar' => $settings['testimonials_title_ar'] ?? '',
                'testimonials_title_en' => $settings['testimonials_title_en'] ?? '',
                'testimonials_subtitle_ar' => $settings['testimonials_subtitle_ar'] ?? '',
                'testimonials_subtitle_en' => $settings['testimonials_subtitle_en'] ?? '',
            ],
            'contact_section' => [
                'contact_title_ar' => $settings['contact_title_ar'] ?? '',
                'contact_title_en' => $settings['contact_title_en'] ?? '',
                'contact_subtitle_ar' => $settings['contact_subtitle_ar'] ?? '',
                'contact_subtitle_en' => $settings['contact_subtitle_en'] ?? '',
                'contact_methods_title_ar' => $settings['contact_methods_title_ar'] ?? '',
                'contact_methods_title_en' => $settings['contact_methods_title_en'] ?? '',
                'contact_button_text_ar' => $settings['contact_button_text_ar'] ?? '',
                'contact_button_text_en' => $settings['contact_button_text_en'] ?? '',
            ],
            'contact_info' => [
                'contact_address_ar' => $settings['contact_address_ar'] ?? '',
                'contact_address_en' => $settings['contact_address_en'] ?? '',
                'contact_email' => $settings['contact_email'] ?? '',
                'contact_phone' => $settings['contact_phone'] ?? '',
            ],
            'footer' => [
                'footer_text_ar' => $settings['footer_text_ar'] ?? '',
                'footer_text_en' => $settings['footer_text_en'] ?? '',
                'footer_business_number_ar' => $settings['footer_business_number_ar'] ?? '',
                'footer_business_number_en' => $settings['footer_business_number_en'] ?? '',
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
