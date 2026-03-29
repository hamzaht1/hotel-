<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\Room;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\GalleryImage;
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

        $rooms = Room::where('is_active', true)->orderBy('sort_order')->get();
        $services = Service::where('is_active', true)->with('category:id,name_ar,name_en', 'images')->orderBy('sort_order')->get();
        $serviceCategories = ServiceCategory::where('is_active', true)->orderBy('sort_order')->get(['id', 'name_ar', 'name_en', 'type', 'icon']);
        $gallery = GalleryImage::where('is_active', true)->orderBy('sort_order')->get();
        $siteTexts = SiteText::all()->groupBy('section')->map(fn ($items) => $items->keyBy('key'));
        $sections = SiteSection::where('is_active', true)->orderBy('sort_order')->pluck('section_name');

        $templatePage = match ($tenant->template) {
            'riyadh' => 'templates/Riyadh/index',
            'madina' => 'templates/Madina/index',
            default => 'templates/Madina/index',
        };

        return Inertia::render($templatePage, [
            'tenant' => $tenant,
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
            'siteTexts' => $siteTexts,
            'activeSections' => $sections,
            'templateTranslations' => __($tenant->template === 'madina' ? 'madina' : 'templates', [], $locale),
            'locale' => $locale,
        ]);
    }
}
