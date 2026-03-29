<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SiteSettingController extends Controller
{
    public function index()
    {
        return Inertia::render('super-admin/site-settings/index', [
            'settings' => SiteSetting::getAllGrouped(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'site_name_ar' => 'nullable|string|max:255',
            'site_name_en' => 'nullable|string|max:255',
            'site_logo' => 'nullable|file|max:2048',
            'site_favicon' => 'nullable|file|max:1024',
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'font_family' => 'nullable|string|max:100',
            'hero_title_ar' => 'nullable|string|max:500',
            'hero_title_en' => 'nullable|string|max:500',
            'hero_subtitle_ar' => 'nullable|string|max:500',
            'hero_subtitle_en' => 'nullable|string|max:500',
            'footer_text_ar' => 'nullable|string|max:500',
            'footer_text_en' => 'nullable|string|max:500',
            'social_twitter' => 'nullable|string|max:255',
            'social_instagram' => 'nullable|string|max:255',
            'social_linkedin' => 'nullable|string|max:255',
            'social_facebook' => 'nullable|string|max:255',
        ]);

        // Handle file uploads
        foreach (['site_logo', 'site_favicon'] as $fileField) {
            if ($request->hasFile($fileField)) {
                $old = SiteSetting::get($fileField);
                if ($old) {
                    Storage::disk('public')->delete($old);
                }
                $validated[$fileField] = $request->file($fileField)->store('site', 'public');
            }
        }

        // Save all non-file settings
        foreach ($validated as $key => $value) {
            if (!$request->hasFile($key)) {
                SiteSetting::set($key, $value);
            } else {
                SiteSetting::set($key, $validated[$key]);
            }
        }

        return back()->with('success', 'تم تحديث إعدادات الموقع بنجاح');
    }
}
