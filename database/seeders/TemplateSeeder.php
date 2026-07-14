<?php

namespace Database\Seeders;

use App\Models\Template;
use Illuminate\Database\Seeder;

/**
 * Seeds the available site templates. Idempotent (keyed by `key`) so it can be
 * re-run safely to restore templates after a data reset.
 */
class TemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'key' => 'madina',
                'name_ar' => 'قالب المدينة',
                'name_en' => 'Madina Template',
                'description_ar' => 'قالب أنيق مستوحى من طابع المدينة المنورة، مناسب للفنادق والشقق المفروشة',
                'description_en' => 'An elegant template inspired by Madinah style, suitable for hotels and furnished apartments',
                'settings' => ['primary_color' => '#A67D5F', 'font_family' => 'Almarai', 'regions' => ['madinah', 'hijaz']],
                'sort_order' => 0,
                'is_active' => true,
                'is_coming_soon' => false,
            ],
            [
                'key' => 'riyadh',
                'name_ar' => 'قالب الرياض',
                'name_en' => 'Riyadh Template',
                'description_ar' => 'قالب عصري مستوحى من طابع العاصمة الرياض، مناسب للفنادق الراقية',
                'description_en' => 'A modern template inspired by Riyadh capital style, suitable for luxury hotels',
                'settings' => ['primary_color' => '#01004C', 'font_family' => 'Cairo', 'regions' => ['central', 'riyadh']],
                'sort_order' => 1,
                'is_active' => true,
                'is_coming_soon' => false,
            ],
        ];

        foreach ($templates as $template) {
            Template::updateOrCreate(['key' => $template['key']], $template);
        }
    }
}
