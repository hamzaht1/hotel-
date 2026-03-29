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

        $globalIntegrations = IntegrationSetting::whereNull('tenant_id')->get();
        $tenantIntegrations = IntegrationSetting::where('tenant_id', $tenantId)->get()->keyBy('provider');

        return Inertia::render('client-admin/integrations/index', [
            'globalIntegrations' => $globalIntegrations,
            'tenantIntegrations' => $tenantIntegrations,
        ]);
    }

    public function toggle(Request $request, string $provider)
    {
        $tenantId = app('current_tenant_id');

        $setting = IntegrationSetting::firstOrNew([
            'tenant_id' => $tenantId,
            'provider' => $provider,
        ]);

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
}
