<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\GalleryImage;
use App\Models\Review;
use App\Models\Room;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\SiteText;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $tenant = app('current_tenant');

        // ─── KPI cards ──────────────────────────────────────────
        // Content-driven KPIs: what the establishment has configured on its site.
        $totalRooms = Room::count();
        $servicesCount = Service::count();
        $serviceCategoriesCount = ServiceCategory::count();
        $galleryCount = GalleryImage::count();

        // "Other services" = the Madina template's additional-services section,
        // which has 4 fixed slots; count those that have a title filled in.
        $additionalServicesCount = SiteText::where('section', 'additional_services')
            ->whereIn('key', ['service_1_title', 'service_2_title', 'service_3_title', 'service_4_title'])
            ->whereNotNull('value')
            ->where('value', '!=', '')
            ->count();

        // ─── Visitor chart placeholder ──────────────────────────
        // Real visitor analytics aren't tracked yet. Generate an empty 30-day
        // series so the chart renders; replace with real data when a
        // page_views table exists.
        $visitorSeries = collect(range(0, 29))->map(function ($i) {
            $date = Carbon::today()->subDays(29 - $i);
            return [
                'date' => $date->format('m-d'),
                'visitors' => 0,
            ];
        })->all();

        // ─── Rooms (newest first) ───────────────────────────────
        $rooms = Room::with('images')
            ->where('is_active', true)
            ->latest()
            ->take(6)
            ->get(['id', 'name_ar', 'name_en', 'capacity', 'price', 'featured_image']);

        // ─── Reviews (latest 3) ─────────────────────────────────
        $reviews = Review::latest()
            ->take(3)
            ->get(['id', 'guest_name', 'rating', 'comment', 'status', 'created_at']);

        // ─── Calendar (current month skeleton) ──────────────────
        // The cell `state` will be wired to availability once a room booking
        // model exists. For now every cell is `available`.
        $first = Carbon::now()->startOfMonth();
        $last = Carbon::now()->endOfMonth();
        $calendarDays = [];
        for ($d = $first->copy(); $d <= $last; $d->addDay()) {
            $calendarDays[] = [
                'day' => $d->day,
                'iso' => $d->toDateString(),
                'state' => 'available',
            ];
        }

        return Inertia::render('client-admin/dashboard', [
            'kpis' => [
                'rooms' => $totalRooms,
                'services' => $servicesCount,
                'partners' => $serviceCategoriesCount,
                'other_services' => $additionalServicesCount,
                'gallery' => $galleryCount,
            ],
            'visitorSeries' => $visitorSeries,
            'rooms' => $rooms,
            'reviews' => $reviews,
            'calendar' => [
                'month' => Carbon::now()->format('F Y'),
                'first_weekday' => (int) $first->dayOfWeek, // 0 = Sun
                'days' => $calendarDays,
            ],
            'tenant' => $tenant->load(['hotelSettings', 'contactSettings']),
        ]);
    }
}
