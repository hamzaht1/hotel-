/**
 * Active payment gateway as resolved by the backend
 * (App\Services\PaymentGatewayManager::frontendProps).
 *
 * The super-admin picks the gateway, so payment screens must not assume a
 * provider: render the embedded card form only when `supports_inline` is true
 * with a `publishable_key`, and fall back to a redirect button otherwise.
 */
export interface PaymentGatewayInfo {
    provider: string | null;
    label: string | null;
    publishable_key: string | null;
    supports_inline: boolean;
    configured: boolean;
    test_mode: boolean;
}
