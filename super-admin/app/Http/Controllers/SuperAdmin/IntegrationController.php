<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\IntegrationSetting;
use App\Services\PaymentGatewayTester;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Platform-wide integrations (tenant_id = null): payment gateways and SMS.
 *
 * At most one payment provider is active at a time; the main app resolves it
 * through App\Services\PaymentGatewayManager and charges with those exact
 * credentials, so activating a provider here switches the live checkout.
 */
class IntegrationController extends Controller
{
    /**
     * Providers we know how to configure, with the credential fields each one
     * needs. `secret` fields are never sent back to the browser in clear.
     */
    private const PROVIDERS = [
        'moyasar' => [
            'type' => 'payment',
            'label' => 'Moyasar',
            'label_ar' => 'مويسر',
            'docs_url' => 'https://docs.moyasar.com/',
            'fields' => [
                'secret_key' => ['label' => 'Secret Key', 'placeholder' => 'sk_live_… / sk_test_…', 'secret' => true, 'required' => true],
                'publishable_key' => ['label' => 'Publishable Key', 'placeholder' => 'pk_live_… / pk_test_…', 'secret' => false, 'required' => false],
            ],
        ],
        'tap' => [
            'type' => 'payment',
            'label' => 'Tap',
            'label_ar' => 'تاب',
            'docs_url' => 'https://developers.tap.company/',
            'fields' => [
                'secret_key' => ['label' => 'Secret Key', 'placeholder' => 'sk_live_… / sk_test_…', 'secret' => true, 'required' => true],
                'publishable_key' => ['label' => 'Publishable Key', 'placeholder' => 'pk_live_… / pk_test_…', 'secret' => false, 'required' => false],
            ],
        ],
        'unifonic' => [
            'type' => 'sms',
            'label' => 'Unifonic',
            'label_ar' => 'يونيفونك',
            'docs_url' => 'https://docs.unifonic.com/',
            'fields' => [
                'app_sid' => ['label' => 'App SID', 'placeholder' => 'Application SID', 'secret' => true, 'required' => true],
                'sender_id' => ['label' => 'Sender ID', 'placeholder' => 'Diyafah', 'secret' => false, 'required' => false],
            ],
        ],
    ];

    public function index()
    {
        $stored = IntegrationSetting::whereNull('tenant_id')->get()->keyBy('provider');

        $providers = [];
        foreach (self::PROVIDERS as $provider => $meta) {
            $setting = $stored->get($provider);
            $credentials = $this->credentialsOf($setting);
            $secret = $credentials['secret_key'] ?? $credentials['app_sid'] ?? '';

            $providers[] = [
                'provider' => $provider,
                'type' => $meta['type'],
                'label' => $meta['label'],
                'label_ar' => $meta['label_ar'],
                'docs_url' => $meta['docs_url'],
                'is_active' => (bool) ($setting?->is_active),
                'configured' => $this->isConfigured($provider, $credentials),
                // Derived from the key itself rather than a separate toggle, so
                // the badge can never contradict the credentials in use.
                'test_mode' => $secret !== '' ? str_contains($secret, '_test') : null,
                'updated_at' => $setting?->updated_at?->toDateTimeString(),
                'fields' => collect($meta['fields'])->map(fn ($field, $key) => [
                    'key' => $key,
                    'label' => $field['label'],
                    'placeholder' => $field['placeholder'],
                    'secret' => $field['secret'],
                    'required' => $field['required'],
                    'filled' => ($credentials[$key] ?? '') !== '',
                    // Secrets only ever leave the server masked; the UI keeps the
                    // input empty and treats "empty on save" as "unchanged".
                    'value' => $field['secret'] ? null : ($credentials[$key] ?? ''),
                    'masked' => $field['secret'] ? $this->mask($credentials[$key] ?? '') : null,
                ])->values()->all(),
            ];
        }

        return Inertia::render('super-admin/integrations/index', [
            'providers' => $providers,
            'activePaymentProvider' => collect($providers)
                ->firstWhere(fn ($p) => $p['type'] === 'payment' && $p['is_active'])['provider'] ?? null,
        ]);
    }

    public function update(Request $request, string $provider)
    {
        $meta = self::PROVIDERS[$provider] ?? null;

        if (!$meta) {
            return back()->with('error', 'مزود غير معروف / Unknown provider');
        }

        $validated = $request->validate([
            'credentials' => 'nullable|array',
            'settings' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $setting = IntegrationSetting::whereNull('tenant_id')
            ->where('provider', $provider)
            ->first();

        $credentials = $this->mergeCredentials($meta, $this->credentialsOf($setting), $validated['credentials'] ?? []);
        $isActive = (bool) ($validated['is_active'] ?? false);

        // Activating a provider whose secret is missing would break checkout the
        // moment a customer tries to pay, so refuse it here.
        if ($isActive && !$this->isConfigured($provider, $credentials)) {
            return back()->withErrors([
                'credentials' => 'أدخل بيانات الاعتماد قبل التفعيل / Enter the credentials before activating',
            ]);
        }

        // Mutual exclusion: activating a payment gateway deactivates the others.
        if ($isActive && $meta['type'] === 'payment') {
            IntegrationSetting::whereNull('tenant_id')
                ->where('type', 'payment')
                ->where('provider', '!=', $provider)
                ->update(['is_active' => false]);
        }

        IntegrationSetting::updateOrCreate(
            [
                'tenant_id' => null,
                'provider' => $provider,
            ],
            [
                // Derived from our own table so a crafted request cannot move a
                // provider between payment and sms.
                'type' => $meta['type'],
                'credentials' => $credentials ? json_encode($credentials) : null,
                'settings' => $validated['settings'] ?? $setting?->settings,
                'is_active' => $isActive,
            ]
        );

        return back()->with('success', 'تم تحديث إعدادات التكامل / Integration settings updated');
    }

    /**
     * Probe the stored credentials against the provider's API.
     * Answers JSON so the card can show the result without a page reload.
     */
    public function test(string $provider, PaymentGatewayTester $tester)
    {
        $meta = self::PROVIDERS[$provider] ?? null;

        if (!$meta || $meta['type'] !== 'payment') {
            return response()->json([
                'success' => false,
                'message' => 'اختبار الاتصال غير مدعوم لهذا المزود / Connection test not supported for this provider',
            ], 422);
        }

        $setting = IntegrationSetting::whereNull('tenant_id')
            ->where('provider', $provider)
            ->first();

        return response()->json($tester->test($provider, $this->credentialsOf($setting)));
    }

    // ─── Internals ───────────────────────────────────────────

    /**
     * Keep existing secrets when the field comes back empty (the UI never
     * receives them, so "empty" means "left untouched"). Non-secret fields are
     * taken as submitted so they can be cleared.
     */
    private function mergeCredentials(array $meta, array $existing, array $submitted): array
    {
        $merged = [];

        foreach ($meta['fields'] as $key => $field) {
            $value = trim((string) ($submitted[$key] ?? ''));

            if ($value === '' && $field['secret']) {
                $value = (string) ($existing[$key] ?? '');
            }

            if ($value !== '') {
                $merged[$key] = $value;
            }
        }

        return $merged;
    }

    private function isConfigured(string $provider, array $credentials): bool
    {
        foreach (self::PROVIDERS[$provider]['fields'] ?? [] as $key => $field) {
            if ($field['required'] && ($credentials[$key] ?? '') === '') {
                return false;
            }
        }

        return true;
    }

    /**
     * `credentials` is an encrypted JSON blob; tolerate a legacy/hand-edited
     * shape rather than blowing up the settings page.
     */
    private function credentialsOf(?IntegrationSetting $setting): array
    {
        $raw = $setting?->credentials;
        $decoded = is_string($raw) && $raw !== '' ? json_decode($raw, true) : $raw;

        if (!is_array($decoded)) {
            return [];
        }

        return array_map(fn ($value) => is_scalar($value) ? (string) $value : '', $decoded);
    }

    /** "sk_test_abc123def456" → "sk_test_••••f456" */
    private function mask(string $value): ?string
    {
        if ($value === '') {
            return null;
        }

        if (strlen($value) < 8) {
            return '••••';
        }

        $tail = substr($value, -4);
        $prefix = str_contains($value, '_') ? substr($value, 0, strrpos($value, '_') + 1) : '';

        return $prefix . '••••' . $tail;
    }
}
