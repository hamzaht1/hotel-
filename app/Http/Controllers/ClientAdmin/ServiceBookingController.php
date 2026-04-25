<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\ServiceBooking;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServiceBookingController extends Controller
{
    public function index(Request $request)
    {
        $bookings = ServiceBooking::query()
            ->with('service:id,name_ar,name_en')
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->search, fn ($q, $s) => $q->where('guest_name', 'like', "%{$s}%"))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('client-admin/service-bookings/index', [
            'bookings' => $bookings,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function updateStatus(Request $request, ServiceBooking $booking)
    {
        $this->authorizeTenant($booking);

        $validated = $request->validate([
            'status' => 'required|in:new,confirmed,completed,canceled',
            'admin_notes' => 'nullable|string|max:2000',
        ]);

        $booking->update($validated);

        return back()->with('success', 'تم تحديث حالة الحجز');
    }

    private function authorizeTenant(ServiceBooking $booking): void
    {
        if ($booking->tenant_id !== app('current_tenant_id')) {
            abort(403);
        }
    }
}
