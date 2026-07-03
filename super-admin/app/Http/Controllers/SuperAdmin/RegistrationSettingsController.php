<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Support\RegistrationForm;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegistrationSettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('super-admin/registration-settings/index', [
            'config' => RegistrationForm::withMeta(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'require_email_verification' => 'boolean',
            'require_phone_verification' => 'boolean',
            'fields' => 'array',
            'fields.*.enabled' => 'boolean',
            'fields.*.required' => 'boolean',
        ]);

        // Rebuild from the known field list only — never trust arbitrary keys.
        $config = [
            'require_email_verification' => (bool) ($validated['require_email_verification'] ?? true),
            'require_phone_verification' => (bool) ($validated['require_phone_verification'] ?? false),
            'fields' => [],
        ];

        foreach (array_keys(RegistrationForm::FIELDS) as $key) {
            $f = $validated['fields'][$key] ?? [];
            $enabled = (bool) ($f['enabled'] ?? true);
            $config['fields'][$key] = [
                'enabled' => $enabled,
                // A disabled field can't be required.
                'required' => $enabled && (bool) ($f['required'] ?? false),
            ];
        }

        SiteSetting::set(RegistrationForm::SETTING_KEY, json_encode($config));

        return back()->with('success', 'تم حفظ إعدادات نموذج التسجيل');
    }
}
