<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Models\IntegrationSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IntegrationController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = app('current_tenant_id');

        // Never ship `credentials` to the tenant browser: the cast decrypts it,
        // so returning whole models would hand every client admin the platform's
        // gateway secret keys. The page only needs identity + status.
        $publicFields = ['id', 'provider', 'type', 'is_active'];

        $globalIntegrations = IntegrationSetting::whereNull('tenant_id')
            ->get()
            ->map(fn (IntegrationSetting $setting) => $setting->only($publicFields))
            ->values();

        $tenantSettings = IntegrationSetting::where('tenant_id', $tenantId)->get()->keyBy('provider');
        $tenantIntegrations = $tenantSettings->map(fn (IntegrationSetting $setting) => $setting->only($publicFields));

        $analytics = $tenantSettings->get('google_analytics');

        return Inertia::render('client-admin/integrations/index', [
            'globalIntegrations' => $globalIntegrations,
            'tenantIntegrations' => $tenantIntegrations,
            'googleAnalytics' => [
                'measurement_id' => $analytics?->settings['measurement_id'] ?? '',
                'is_active' => (bool) ($analytics?->is_active ?? false),
            ],
        ]);
    }

    public function toggle(Request $request, string $provider)
    {
        $tenantId = app('current_tenant_id');

        $setting = IntegrationSetting::firstOrNew([
            'tenant_id' => $tenantId,
            'provider' => $provider,
        ]);

        // google_analytics is tenant-only and does not require a global parent
        // entry; the type is set the first time the row is created.
        if ($provider === 'google_analytics') {
            $setting->type = $setting->type ?: 'analytics';
            $setting->is_active = !$setting->is_active;
            $setting->save();

            return back()->with('success', $setting->is_active
                ? 'تم تفعيل التكامل / Integration enabled'
                : 'تم تعطيل التكامل / Integration disabled');
        }

        // Get the global integration to copy type
        $global = IntegrationSetting::whereNull('tenant_id')
            ->where('provider', $provider)
            ->first();

        if (!$global) {
            return back()->with('error', 'هذا التكامل غير متوفر / This integration is not available');
        }

        $setting->type = $global->type;
        $setting->is_active = !$setting->is_active;
        $setting->save();

        return back()->with('success', $setting->is_active
            ? 'تم تفعيل التكامل / Integration enabled'
            : 'تم تعطيل التكامل / Integration disabled');
    }

    public function saveGoogleAnalytics(Request $request)
    {
        $data = $request->validate([
            // GA4 measurement ids look like "G-XXXXXXXXXX". Accept lowercase too
            // and normalise below, so a pasted lowercase id isn't rejected.
            'measurement_id' => ['nullable', 'string', 'regex:/^G-[A-Za-z0-9]+$/'],
        ]);

        $tenantId = app('current_tenant_id');

        $measurementId = $data['measurement_id'] ? strtoupper($data['measurement_id']) : null;

        $setting = IntegrationSetting::firstOrNew([
            'tenant_id' => $tenantId,
            'provider' => 'google_analytics',
        ]);

        $setting->type = 'analytics';
        $existing = $setting->settings ?? [];
        $existing['measurement_id'] = $measurementId;
        $setting->settings = $existing;
        // Activate automatically when a valid id is present, and switch off when
        // it is cleared — so saving an id is enough to start tracking.
        $setting->is_active = (bool) $measurementId;
        $setting->save();

        return back()->with('success', 'تم حفظ معرف Google Analytics / Google Analytics ID saved');
    }
}
