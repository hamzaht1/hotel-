<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

/**
 * Seeds the three subscription plans. Idempotent (keyed by slug) so it can be
 * re-run safely — e.g. to restore plans after a data reset. Without active
 * plans the public pricing/subscription flow silently falls back to a legacy
 * path that produces a 0 SAR order and no invoice.
 */
class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'slug' => 'starter',
                'name_ar' => 'ضيافة انطلاقة',
                'name_en' => 'Diyafah Starter',
                'description_ar' => 'الباقة المناسبة للبدء بموقع احترافي لمنشأتك',
                'description_en' => 'The perfect package to start with a professional website for your property',
                'price' => 860.00,
                'billing_cycle' => 'yearly',
                'features_ar' => ['موقع إلكتروني احترافي', 'لوحة تحكم كاملة', 'دعم فني أساسي', 'قالب واحد', 'شهادة SSL مجانية'],
                'features_en' => ['Professional website', 'Full control panel', 'Basic technical support', 'One template', 'Free SSL certificate'],
                'limits' => ['max_rooms' => 20, 'max_images' => 50, 'max_users' => 2],
                'icon' => 'starter',
                'variant' => 'light',
                'sort_order' => 0,
                'is_active' => true,
                'is_coming_soon' => false,
            ],
            [
                'slug' => 'growth',
                'name_ar' => 'ضيافة تطوير',
                'name_en' => 'Diyafah Growth',
                'description_ar' => 'باقة متقدمة لتطوير حضورك الرقمي',
                'description_en' => 'Advanced package to grow your digital presence',
                'price' => 1950.00,
                'billing_cycle' => 'yearly',
                'features_ar' => ['موقع إلكتروني احترافي', 'لوحة تحكم كاملة', 'دعم فني متقدم', 'جميع القوالب المتاحة', 'شهادة SSL مجانية', 'تقارير متقدمة'],
                'features_en' => ['Professional website', 'Full control panel', 'Advanced technical support', 'All available templates', 'Free SSL certificate', 'Advanced reports'],
                'limits' => ['max_rooms' => 50, 'max_images' => 150, 'max_users' => 5],
                'icon' => 'growth',
                'variant' => 'soft',
                'sort_order' => 1,
                'is_active' => true,
                'is_coming_soon' => false,
            ],
            [
                'slug' => 'premium',
                'name_ar' => 'ضيافة بريميوم',
                'name_en' => 'Diyafah Premium',
                'description_ar' => 'الباقة الشاملة مع جميع المميزات',
                'description_en' => 'The all-inclusive package with all features',
                'price' => 3150.00,
                'billing_cycle' => 'yearly',
                'features_ar' => ['موقع إلكتروني احترافي', 'لوحة تحكم كاملة', 'دعم فني على مدار الساعة', 'جميع القوالب المتاحة', 'شهادة SSL مجانية', 'تقارير متقدمة', 'تكاملات خارجية', 'نطاق مخصص'],
                'features_en' => ['Professional website', 'Full control panel', '24/7 technical support', 'All available templates', 'Free SSL certificate', 'Advanced reports', 'External integrations', 'Custom domain'],
                'limits' => ['max_rooms' => null, 'max_images' => null, 'max_users' => null],
                'icon' => 'premium',
                'variant' => 'solid',
                'sort_order' => 2,
                'is_active' => true,
                'is_coming_soon' => false,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
