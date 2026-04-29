<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Room;
use App\Models\ServiceBooking;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $tenant = app('current_tenant');

        // ─── KPI cards ──────────────────────────────────────────
        // No room-level booking model exists yet, so morning bookings and
        // cancellations are derived from ServiceBooking until a dedicated
        // RoomBooking module ships.
        $totalRooms = Room::count();
        $bookingRequests = ServiceBooking::count();
        $confirmedBookings = ServiceBooking::where('status', 'confirmed')->count();
        $morningBookings = ServiceBooking::whereDate('created_at', Carbon::today())->count();
        $cancellations = ServiceBooking::where('status', 'canceled')->count();

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
                'booking_requests' => $bookingRequests,
                'confirmed_bookings' => $confirmedBookings,
                'morning_bookings' => $morningBookings,
                'cancellations' => $cancellations,
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
