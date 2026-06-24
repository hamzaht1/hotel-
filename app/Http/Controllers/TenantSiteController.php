<?php

namespace App\Http\Controllers;

use App\Models\IntegrationSetting;
use App\Models\Menu;
use App\Models\Tenant;
use App\Models\Room;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\GalleryImage;
use App\Models\Review;
use App\Models\SiteText;
use App\Models\SiteSection;
use Inertia\Inertia;

class TenantSiteController extends Controller
{
    public function show(string $slug)
    {
        $tenant = Tenant::where('slug', $slug)->where('is_active', true)->firstOrFail();

        // Set tenant context for scoped queries
        app()->instance('current_tenant_id', $tenant->id);
        app()->instance('current_tenant', $tenant);

        $locale = app()->getLocale();
        $hotelSettings = $tenant->hotelSettings;
        $contactSettings = $tenant->contactSettings;

        $rooms = Room::where('is_active', true)->with('images', 'amenities')->orderBy('sort_order')->get();
        $services = Service::where('is_active', true)->with('category:id,name_ar,name_en', 'images', 'features')->orderBy('sort_order')->get();
        $serviceCategories = ServiceCategory::where('is_active', true)->orderBy('sort_order')->get(['id', 'name_ar', 'name_en', 'type', 'icon']);
        $gallery = GalleryImage::where('is_active', true)->orderBy('sort_order')->get();
        $siteTexts = SiteText::all()->groupBy('section')->map(fn ($items) => $items->keyBy('key'));
        $sections = SiteSection::where('is_active', true)->orderBy('sort_order')->pluck('section_name');

        // Published guest reviews feed the public "testimonials" section.
        // Only published reviews that actually carry a comment are shown.
        $reviews = Review::where('is_published', true)
            ->whereNotNull('comment')
            ->where('comment', '!=', '')
            ->orderByDesc('created_at')
            ->take(12)
            ->get(['id', 'guest_name', 'rating', 'comment', 'created_at']);

        $templatePage = match ($tenant->template) {
            'riyadh' => 'templates/Riyadh/index',
            'madina' => 'templates/Madina/index',
            default => 'templates/Madina/index',
        };

        // Active Google Analytics measurement ID for this tenant (if enabled).
        $analytics = IntegrationSetting::where('tenant_id', $tenant->id)
            ->where('provider', 'google_analytics')
            ->where('is_active', true)
            ->first();
        $googleAnalyticsId = $analytics?->settings['measurement_id'] ?? null;

        return Inertia::render($templatePage, [
            'tenant' => $tenant,
            'googleAnalyticsId' => $googleAnalyticsId,
            'hotelSettings' => $hotelSettings,
            'contactSettings' => $contactSettings,
            'rooms' => $rooms->map(fn ($room) => [
                ...$room->toArray(),
                'name' => $room->name,
                'description' => $room->description,
                'images' => $room->images,
            ]),
            'services' => $services,
            'serviceCategories' => $serviceCategories,
            'gallery' => $gallery,
            'reviews' => $reviews,
            'siteTexts' => $siteTexts,
            'activeSections' => $sections,
            'headerMenu' => optional(Menu::where('location', 'header')->first())->items ?? [],
            'footerMenu' => optional(Menu::where('location', 'footer')->first())->items ?? [],
            'templateTranslations' => __($tenant->template === 'madina' ? 'madina' : 'templates', [], $locale),
            'locale' => $locale,
        ]);
    }
}
