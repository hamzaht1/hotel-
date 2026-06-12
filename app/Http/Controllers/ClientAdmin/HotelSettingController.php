<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\HotelSetting;
use App\Services\OtpGuard;
use App\Support\ActivityLogger;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HotelSettingController extends Controller
{
    public function edit()
    {
        $settings = HotelSetting::first() ?? new HotelSetting();

        return Inertia::render('client-admin/hotel-settings/edit', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request, OtpGuard $otp)
    {
        // Editing establishment profile is a sensitive operation — requires a
        // freshly verified OTP window.
        $otp->assertPassed('profile_update');

        $validated = $request->validate([
            'hotel_name_ar' => 'required|string|max:255',
            'hotel_name_en' => 'required|string|max:255',
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'star_rating' => 'required|integer|min:1|max:5',
            'currency' => 'required|string|max:10',
            'timezone' => 'required|string|max:50',
            'check_in_time' => 'required|date_format:H:i',
            'check_out_time' => 'required|date_format:H:i',
            'primary_color' => 'nullable|array',
            'primary_color.light' => 'nullable|string|regex:/^#[0-9A-Fa-f]{3,8}$/',
            'primary_color.dark' => 'nullable|string|regex:/^#[0-9A-Fa-f]{3,8}$/',
            'secondary_color' => 'nullable|array',
            'secondary_color.light' => 'nullable|string|regex:/^#[0-9A-Fa-f]{3,8}$/',
            'secondary_color.dark' => 'nullable|string|regex:/^#[0-9A-Fa-f]{3,8}$/',
            'meta_tags' => 'nullable|array',
            // Compliance / official establishment fields
            'commercial_activity' => 'nullable|string|max:255',
            'branches_count' => 'nullable|integer|min:0|max:9999',
            'manager_type' => 'nullable|in:owner,manager',
            'responsible_position' => 'nullable|string|max:100',
            'cr_number' => 'nullable|string|max:50',
            'cr_expiry' => 'nullable|date',
            'vat_number' => 'nullable|string|max:50',
            'license_number' => 'nullable|string|max:50',
            'license_expiry' => 'nullable|date',
            'municipality_license_number' => 'nullable|string|max:50',
            'municipality_license_expiry' => 'nullable|date',
        ]);

        $settings = HotelSetting::firstOrNew([]);
        $settings->fill($validated);
        if (!$settings->tenant_id) {
            $settings->tenant_id = app('current_tenant_id');
        }
        $settings->save();

        ActivityLogger::log('profile.updated', 'Establishment profile updated', [
            'fields' => array_keys($validated),
        ], $settings);

        return back()->with('success', 'Hotel settings updated');
    }
}
