<?php

namespace App\Services;

/**
 * Common surface every payment gateway must expose so controllers can stay
 * gateway-agnostic. The active gateway is chosen by the super-admin from
 * `integration_settings` and resolved through {@see PaymentGatewayManager}.
 *
 * Statuses returned by implementations are normalised to this vocabulary:
 *   initiated | paid | failed | refunded | unknown
 * so callers keep comparing against `'paid'` regardless of the provider.
 */
interface PaymentGateway
{
    /** Machine name stored in `payment_method` columns (e.g. "moyasar", "tap"). */
    public function provider(): string;

    /** Human label used on payment screens. */
    public function label(): string;

    /**
     * Create a charge and return a URL to send the customer to.
     *
     * Required keys in $params: amount (major units), description, redirect_url.
     * Optional: reference, order_id, customer_name, customer_email, metadata, webhook_url.
     *
     * @return array{success: bool, charge_id?: ?string, redirect_url?: ?string, status?: ?string, error?: string}
     */
    public function createCharge(array $params): array;

    /**
     * Fetch a charge and normalise it.
     *
     * @return array{success: bool, charge_id?: ?string, status?: ?string, transaction_id?: ?string, amount?: ?float, payment_method?: ?string, receipt_url?: ?string, error?: string}
     */
    public function retrieveCharge(string $id): array;

    /** Was this charge fully paid? */
    public function isChargeCaptured(string $id): bool;

    /** Map a provider-specific status string onto the normalised vocabulary. */
    public function normalizeStatus(?string $status): string;

    /** Client-side key, when the gateway offers an embeddable form. */
    public function publishableKey(): ?string;

    /** Can the card form be embedded in our page (vs. redirecting off-site)? */
    public function supportsInlineForm(): bool;

    /** True when the configured secret key is a sandbox/test key. */
    public function isTestMode(): bool;

    /** Are the minimum credentials present to attempt a charge? */
    public function isConfigured(): bool;

    /**
     * Cheap authenticated call used by the super-admin "test connection" button.
     *
     * @return array{success: bool, message: string}
     */
    public function testConnection(): array;
}
