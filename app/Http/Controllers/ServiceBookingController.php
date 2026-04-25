<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceBooking;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ServiceBookingController extends Controller
{
    public function show(string $tenantSlug, Service $service)
    {
        $tenant = Tenant::where('slug', $tenantSlug)->where('is_active', true)->firstOrFail();
        app()->instance('current_tenant_id', $tenant->id);

        if ($service->tenant_id !== $tenant->id || !$service->is_active || !$service->accepts_bookings) {
            abort(404);
        }

        return Inertia::render('public/ServiceBooking', [
            'tenant' => $tenant->only(['id', 'name', 'slug', 'logo']),
            'service' => $service->only([
                'id', 'name_ar', 'name_en', 'description_ar', 'description_en',
                'price', 'duration', 'featured_image', 'required_fields',
            ]),
        ]);
    }

    public function store(Request $request, string $tenantSlug, Service $service)
    {
        $tenant = Tenant::where('slug', $tenantSlug)->where('is_active', true)->firstOrFail();
        app()->instance('current_tenant_id', $tenant->id);

        if ($service->tenant_id !== $tenant->id || !$service->is_active || !$service->accepts_bookings) {
            abort(404);
        }

        $rules = [
            'guest_name' => 'required|string|max:255',
            'guest_email' => 'nullable|email|max:255',
            'guest_phone' => 'nullable|string|max:20',
        ];

        $requiredFields = $service->required_fields ?? [];
        foreach ($requiredFields as $field) {
            $key = "data.{$field['key']}";
            $rule = $field['is_required'] ?? false ? 'required' : 'nullable';

            switch ($field['type']) {
                case 'email': $rule .= '|email|max:255'; break;
                case 'number': $rule .= '|numeric'; break;
                case 'date': $rule .= '|date'; break;
                case 'tel': $rule .= '|string|max:30'; break;
                case 'file': $rule .= '|file|max:5120'; break;
                case 'checkbox': $rule = ($field['is_required'] ?? false) ? 'accepted' : 'nullable|boolean'; break;
                case 'select':
                    $options = $field['options'] ?? [];
                    if (!empty($options)) {
                        $rule .= '|in:' . implode(',', $options);
                    }
                    break;
                default: $rule .= '|string|max:2000';
            }

            $rules[$key] = $rule;
        }

        $validated = $request->validate($rules);

        $data = $validated['data'] ?? [];
        foreach ($requiredFields as $field) {
            if ($field['type'] === 'file' && $request->hasFile("data.{$field['key']}")) {
                $data[$field['key']] = $request->file("data.{$field['key']}")
                    ->store('service-bookings', 'public');
            }
        }

        ServiceBooking::create([
            'tenant_id' => $tenant->id,
            'service_id' => $service->id,
            'guest_name' => $validated['guest_name'],
            'guest_email' => $validated['guest_email'] ?? null,
            'guest_phone' => $validated['guest_phone'] ?? null,
            'data' => $data,
        ]);

        return redirect()
            ->route('service.booking.show', ['tenantSlug' => $tenantSlug, 'service' => $service->id])
            ->with('success', 'تم إرسال طلب الحجز بنجاح');
    }
}
