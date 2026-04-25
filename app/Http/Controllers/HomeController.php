<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Plan;
use App\Models\Review;
use App\Models\SiteSetting;
use App\Models\Template;
use App\Models\Tenant;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        syncLangFiles('messages');

        // Published templates (active OR coming-soon — frontend dims the coming-soon ones).
        $templates = Template::orderBy('sort_order')
            ->get(['id', 'key', 'name_ar', 'name_en', 'city_ar', 'city_en', 'description_ar', 'description_en', 'preview_image', 'demo_url', 'is_active', 'is_coming_soon']);

        // Published positive reviews → testimonials slider.
        $testimonials = Review::withoutGlobalScope('tenant')
            ->where('is_published', true)
            ->where('rating', '>=', 4)
            ->whereNotNull('comment')
            ->latest()
            ->take(10)
            ->get(['id', 'guest_name', 'rating', 'comment', 'created_at']);

        // Active tenants with an uploaded logo → partners carousel.
        $partners = Tenant::where('is_active', true)
            ->whereNotNull('logo')
            ->take(12)
            ->get(['id', 'name', 'org_name_ar', 'org_name_en', 'logo']);

        return Inertia::render('public/Home', [
            'plans' => Plan::where('is_active', true)->orderBy('sort_order')->get(),
            'siteSettings' => SiteSetting::getAllGrouped(),
            'templates' => $templates,
            'testimonials' => $testimonials,
            'partners' => $partners,
            'headerMenu' => optional(Menu::where('location', 'header')->first())->items ?? [],
            'footerMenu' => optional(Menu::where('location', 'footer')->first())->items ?? [],
        ]);
    }
}
