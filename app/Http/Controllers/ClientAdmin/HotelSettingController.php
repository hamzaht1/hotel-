<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\HotelSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

    public function update(Request $request)
    {
        $validated = $request->validate([
            'hotel_name_ar' => 'required|string|max:255',
            'hotel_name_en' => 'required|string|max:255',
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
            'logo' => 'nullable|file|image|mimes:jpg,jpeg,png,svg,webp|max:5120',
            'favicon' => 'nullable|file|image|mimes:jpg,jpeg,png,ico,svg|max:1024',
        ]);

        $settings = HotelSetting::firstOrNew([]);

        if ($request->hasFile('logo')) {
            if ($settings->logo) {
                Storage::disk('public')->delete($settings->logo);
            }
            $validated['logo'] = $request->file('logo')->store('hotel', 'public');
        } else {
            unset($validated['logo']);
        }

        if ($request->hasFile('favicon')) {
            if ($settings->favicon) {
                Storage::disk('public')->delete($settings->favicon);
            }
            $validated['favicon'] = $request->file('favicon')->store('hotel', 'public');
        } else {
            unset($validated['favicon']);
        }

        $settings->fill($validated);
        if (!$settings->tenant_id) {
            $settings->tenant_id = app('current_tenant_id');
        }
        $settings->save();

        return back()->with('success', 'Hotel settings updated');
    }
}
