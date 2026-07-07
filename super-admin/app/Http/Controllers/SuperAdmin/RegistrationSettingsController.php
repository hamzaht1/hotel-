<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Support\RegistrationForm;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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
            // Custom fields defined by the admin (name + input type + step).
            'custom_fields' => 'array',
            'custom_fields.*.key' => 'nullable|string|max:60',
            'custom_fields.*.label_ar' => 'nullable|string|max:100',
            'custom_fields.*.label_en' => 'nullable|string|max:100',
            'custom_fields.*.type' => 'required|in:' . implode(',', RegistrationForm::CUSTOM_TYPES),
            'custom_fields.*.step' => 'required|in:org,account',
            'custom_fields.*.required' => 'boolean',
            'custom_fields.*.enabled' => 'boolean',
            // Options for select-type fields, provided as a comma-separated string.
            'custom_fields.*.options' => 'nullable|string|max:1000',
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

        // Normalize custom fields: assign a stable `custom_*` key (generated from
        // the label when missing/invalid), coerce type/step, and parse select options.
        $config['custom_fields'] = [];
        $usedKeys = [];
        foreach ($validated['custom_fields'] ?? [] as $f) {
            $labelAr = trim((string) ($f['label_ar'] ?? ''));
            $labelEn = trim((string) ($f['label_en'] ?? ''));
            // Skip rows with no label at all.
            if ($labelAr === '' && $labelEn === '') {
                continue;
            }

            $key = (string) ($f['key'] ?? '');
            if (!preg_match('/^custom_[a-z0-9_]+$/', $key) || in_array($key, $usedKeys, true)) {
                $base = 'custom_' . (Str::slug($labelEn ?: $labelAr, '_') ?: 'field');
                $key = $base;
                $n = 2;
                while (in_array($key, $usedKeys, true)) {
                    $key = $base . '_' . $n++;
                }
            }
            $usedKeys[] = $key;

            $type = in_array($f['type'] ?? '', RegistrationForm::CUSTOM_TYPES, true) ? $f['type'] : 'text';
            $enabled = (bool) ($f['enabled'] ?? true);
            $options = [];
            if ($type === 'select') {
                $options = collect(explode(',', (string) ($f['options'] ?? '')))
                    ->map(fn ($o) => trim($o))
                    ->filter()
                    ->values()
                    ->all();
            }

            $config['custom_fields'][] = [
                'key' => $key,
                'label_ar' => $labelAr,
                'label_en' => $labelEn,
                'type' => $type,
                'step' => in_array($f['step'] ?? '', ['org', 'account'], true) ? $f['step'] : 'account',
                'required' => $enabled && (bool) ($f['required'] ?? false),
                'enabled' => $enabled,
                'options' => $options,
            ];
        }

        SiteSetting::set(RegistrationForm::SETTING_KEY, json_encode($config));

        return back()->with('success', 'تم حفظ إعدادات نموذج التسجيل');
    }
}
