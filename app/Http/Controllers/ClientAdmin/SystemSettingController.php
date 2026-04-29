<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\TenantSiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SystemSettingController extends Controller
{
    public function edit()
    {
        return Inertia::render('client-admin/system-settings/edit', [
            'settings' => TenantSiteSetting::getAllGrouped(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'site_name_ar' => 'nullable|string|max:255',
            'site_name_en' => 'nullable|string|max:255',
            'site_logo' => 'nullable|file|image|max:5120',
            'site_logo_dark' => 'nullable|file|image|max:5120',
            'site_favicon' => 'nullable|file|image|max:1024',
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'accent_color' => 'nullable|string|max:20',
            'dark_primary_color' => 'nullable|string|max:20',
            'dark_secondary_color' => 'nullable|string|max:20',
            'dark_accent_color' => 'nullable|string|max:20',
            'font_family' => 'nullable|string|max:100',
            'hero_title_ar' => 'nullable|string|max:500',
            'hero_title_en' => 'nullable|string|max:500',
            'hero_subtitle_ar' => 'nullable|string|max:500',
            'hero_subtitle_en' => 'nullable|string|max:500',
            'site_text_ar' => 'nullable|string|max:2000',
            'site_text_en' => 'nullable|string|max:2000',
            'footer_text_ar' => 'nullable|string|max:500',
            'footer_text_en' => 'nullable|string|max:500',
            'social_twitter' => 'nullable|string|max:255',
            'social_instagram' => 'nullable|string|max:255',
            'social_linkedin' => 'nullable|string|max:255',
            'social_facebook' => 'nullable|string|max:255',
        ]);

        // File uploads — replace any previous file on the same key.
        foreach (['site_logo', 'site_logo_dark', 'site_favicon'] as $fileField) {
            if ($request->hasFile($fileField)) {
                $old = TenantSiteSetting::get($fileField);
                if ($old) {
                    Storage::disk('public')->delete($old);
                }
                $validated[$fileField] = $request->file($fileField)->store('tenant-site', 'public');
            } else {
                // Avoid overwriting an existing file with null when the form sends no file.
                unset($validated[$fileField]);
            }
        }

        foreach ($validated as $key => $value) {
            TenantSiteSetting::set($key, $value);
        }

        return back()->with('success', 'تم تحديث إعدادات النظام بنجاح');
    }
}
