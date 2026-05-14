<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\SiteText;
use App\Models\Tenant;
use App\Models\TenantSiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Unified live-preview site branding editor for tenants.
 *
 * Consolidates everything previously split across system-settings and site-texts
 * into a single page with an iframe preview. The form streams edits to the iframe
 * via postMessage (see resources/js/hooks/use-tenant-preview-overrides.tsx).
 */
class SiteBrandingController extends Controller
{
    public function index()
    {
        /** @var Tenant $tenant */
        $tenant = app('current_tenant');

        $texts = SiteText::orderBy('section')->orderBy('key')->get(['id', 'section', 'key', 'value_ar', 'value_en']);

        return Inertia::render('client-admin/site-branding/index', [
            'tenant' => [
                'id' => $tenant->id,
                'slug' => $tenant->slug,
                'name' => $tenant->name,
            ],
            'settings' => TenantSiteSetting::getAllGrouped() + [
                'media' => [
                    'hero_image' => TenantSiteSetting::get('hero_image'),
                ],
            ],
            'siteTexts' => $texts->groupBy('section')->map(fn ($items) => $items->values()),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            // Branding
            'site_logo' => 'nullable|file|image|max:5120',
            'site_logo_dark' => 'nullable|file|image|max:5120',
            'site_favicon' => 'nullable|file|image|max:1024',
            'hero_image' => 'nullable|file|image|max:10240',

            // Hero text
            'hero_title_ar' => 'nullable|string|max:500',
            'hero_title_en' => 'nullable|string|max:500',
            'hero_subtitle_ar' => 'nullable|string|max:500',
            'hero_subtitle_en' => 'nullable|string|max:500',

            // Colors + typography
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'accent_color' => 'nullable|string|max:20',
            'font_family' => 'nullable|string|max:100',

            // Footer + social
            'footer_text_ar' => 'nullable|string|max:500',
            'footer_text_en' => 'nullable|string|max:500',
            'social_twitter' => 'nullable|string|max:255',
            'social_instagram' => 'nullable|string|max:255',
            'social_linkedin' => 'nullable|string|max:255',
            'social_facebook' => 'nullable|string|max:255',

            // Per-section page texts
            'texts' => 'nullable|array',
            'texts.*.section' => 'required_with:texts|string',
            'texts.*.key' => 'required_with:texts|string',
            'texts.*.value_ar' => 'nullable|string',
            'texts.*.value_en' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $validated) {
            // Replace any previous upload on the same key before storing the new path.
            foreach (['site_logo', 'site_logo_dark', 'site_favicon', 'hero_image'] as $fileField) {
                if ($request->hasFile($fileField)) {
                    $old = TenantSiteSetting::get($fileField);
                    if ($old) Storage::disk('public')->delete($old);
                    $validated[$fileField] = $request->file($fileField)->store('tenant-site', 'public');
                } else {
                    unset($validated[$fileField]);
                }
            }

            $texts = $validated['texts'] ?? [];
            unset($validated['texts']);

            foreach ($validated as $key => $value) {
                TenantSiteSetting::set($key, $value);
            }

            $tenantId = app('current_tenant_id');
            foreach ($texts as $t) {
                SiteText::updateOrCreate(
                    ['tenant_id' => $tenantId, 'section' => $t['section'], 'key' => $t['key']],
                    ['value_ar' => $t['value_ar'] ?? '', 'value_en' => $t['value_en'] ?? '']
                );
            }
        });

        return back()->with('success', 'تم حفظ التغييرات');
    }
}
