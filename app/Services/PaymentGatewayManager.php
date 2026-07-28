<?php

namespace App\Services;

use App\Models\IntegrationSetting;
use Illuminate\Support\Facades\Log;

/**
 * Resolves which payment gateway the platform is currently using.
 *
 * Source of truth is the super-admin Integrations page, which stores one row
 * per provider in `integration_settings` (tenant_id = null, type = "payment")
 * and keeps at most one of them `is_active`. When no row is active we fall back
 * to the `.env` credentials so existing deployments keep charging as before.
 *
 * Registered as a singleton, so the lookup happens once per request.
 */
class PaymentGatewayManager
{
    /** Providers this app knows how to charge with. */
    public const PROVIDERS = ['moyasar', 'tap'];

    protected bool $resolved = false;
    protected ?PaymentGateway $gateway = null;

    /**
     * The active gateway, or null when nothing is configured anywhere.
     */
    public function gateway(): ?PaymentGateway
    {
        if ($this->resolved) {
            return $this->gateway;
        }

        $this->resolved = true;
        $this->gateway = $this->resolveFromDatabase() ?? $this->resolveFromEnv();

        return $this->gateway;
    }

    /**
     * Build a specific gateway from the stored settings (or .env) regardless of
     * which one is active — used by the "test connection" action and by
     * callbacks that must verify a charge created by a since-replaced gateway.
     */
    public function make(string $provider): ?PaymentGateway
    {
        if (!in_array($provider, self::PROVIDERS, true)) {
            return null;
        }

        $setting = IntegrationSetting::whereNull('tenant_id')
            ->where('type', 'payment')
            ->where('provider', $provider)
            ->first();

        return $this->instantiate($provider, $setting ? $this->credentialsOf($setting) : []);
    }

    /**
     * Gateway that created the given charge. Falls back to the active gateway
     * when the provider is unknown or no longer configured, so an old callback
     * still resolves to something rather than dying.
     */
    public function for(?string $provider): ?PaymentGateway
    {
        if ($provider && in_array($provider, self::PROVIDERS, true)) {
            $gateway = $this->make($provider);
            if ($gateway?->isConfigured()) {
                return $gateway;
            }
        }

        return $this->gateway();
    }

    public function isConfigured(): bool
    {
        return (bool) $this->gateway()?->isConfigured();
    }

    /**
     * Shape handed to the payment screens so the UI can decide between the
     * embedded card form and a redirect button without knowing the providers.
     *
     * @return array{provider: ?string, label: ?string, publishable_key: ?string, supports_inline: bool, configured: bool, test_mode: bool}
     */
    public function frontendProps(): array
    {
        $gateway = $this->gateway();

        if (!$gateway || !$gateway->isConfigured()) {
            return [
                'provider' => $gateway?->provider(),
                'label' => $gateway?->label(),
                'publishable_key' => null,
                'supports_inline' => false,
                'configured' => false,
                'test_mode' => false,
            ];
        }

        return [
            'provider' => $gateway->provider(),
            'label' => $gateway->label(),
            'publishable_key' => $gateway->publishableKey(),
            'supports_inline' => $gateway->supportsInlineForm(),
            'configured' => true,
            'test_mode' => $gateway->isTestMode(),
        ];
    }

    // ─── Internals ───────────────────────────────────────────

    protected function resolveFromDatabase(): ?PaymentGateway
    {
        $setting = IntegrationSetting::whereNull('tenant_id')
            ->where('type', 'payment')
            ->where('is_active', true)
            ->whereIn('provider', self::PROVIDERS)
            ->orderByDesc('updated_at')
            ->first();

        if (!$setting) {
            return null;
        }

        $gateway = $this->instantiate($setting->provider, $this->credentialsOf($setting));

        // An active-but-unconfigured row would silently break checkout; prefer
        // the .env fallback and leave a trace for the operator.
        if (!$gateway || !$gateway->isConfigured()) {
            Log::warning('Active payment integration has no usable credentials', [
                'provider' => $setting->provider,
            ]);
            return null;
        }

        return $gateway;
    }

    protected function resolveFromEnv(): ?PaymentGateway
    {
        foreach (self::PROVIDERS as $provider) {
            $gateway = $this->instantiate($provider, []);
            if ($gateway?->isConfigured()) {
                return $gateway;
            }
        }

        return null;
    }

    protected function instantiate(string $provider, array $credentials): ?PaymentGateway
    {
        return match ($provider) {
            'moyasar' => new MoyasarPaymentService($credentials),
            'tap' => new TapPaymentService($credentials),
            default => null,
        };
    }

    /**
     * `credentials` is an encrypted JSON blob written by the super-admin; be
     * lenient about its shape so a hand-edited row cannot break checkout.
     */
    protected function credentialsOf(IntegrationSetting $setting): array
    {
        $raw = $setting->credentials;

        $decoded = $raw;

        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
        }

        if (!is_array($decoded)) {
            return [];
        }

        // Blank fields must not shadow the .env fallback, so drop them.
        return array_filter($decoded, fn ($value) => $value !== null && $value !== '');
    }
}
