<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\IntegrationSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IntegrationController extends Controller
{
    public function index()
    {
        $integrations = IntegrationSetting::whereNull('tenant_id')
            ->get()
            ->groupBy('type');

        return Inertia::render('super-admin/integrations/index', [
            'integrations' => $integrations,
        ]);
    }

    public function update(Request $request, string $provider)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:payment,sms',
            'credentials' => 'nullable|string',
            'settings' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        IntegrationSetting::updateOrCreate(
            [
                'tenant_id' => null,
                'provider' => $provider,
            ],
            [
                'type' => $validated['type'],
                'credentials' => $validated['credentials'] ?? null,
                'settings' => $validated['settings'] ?? null,
                'is_active' => $validated['is_active'] ?? false,
            ]
        );

        return back()->with('success', 'تم تحديث إعدادات التكامل / Integration settings updated');
    }
}
