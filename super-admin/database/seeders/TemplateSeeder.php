<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

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
                'is_active' => true,
                'sort_order' => 0,
                'settings' => json_encode([
                    'primary_color' => '#A67D5F',
                    'font_family' => 'Almarai',
                    'regions' => ['madinah', 'hijaz'],
                ]),
            ],
            [
                'key' => 'riyadh',
                'name_ar' => 'قالب الرياض',
                'name_en' => 'Riyadh Template',
                'description_ar' => 'قالب عصري مستوحى من طابع العاصمة الرياض، مناسب للفنادق الراقية',
                'description_en' => 'A modern template inspired by Riyadh capital style, suitable for luxury hotels',
                'is_active' => true,
                'sort_order' => 1,
                'settings' => json_encode([
                    'primary_color' => '#01004C',
                    'font_family' => 'Cairo',
                    'regions' => ['central', 'riyadh'],
                ]),
            ],
        ];

        foreach ($templates as $tpl) {
            DB::table('templates')->updateOrInsert(
                ['key' => $tpl['key']],
                array_merge($tpl, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
