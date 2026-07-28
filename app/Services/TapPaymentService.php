<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Tap Payments integration (Charges API v2).
 *
 * Tap has no hosted-invoice object: we create a Charge with `source.id = src_all`
 * and Tap answers with `transaction.url`, its hosted payment page. When the
 * customer is done, Tap redirects to `redirect.url` with a `tap_id` query
 * parameter and POSTs the charge payload to `post.url` (our webhook).
 *
 * Amounts are sent in major units (Tap applies the currency's own decimals),
 * unlike Moyasar which expects halalas — hence the different conversion here.
 */
class TapPaymentService implements PaymentGateway
{
    protected string $secretKey;
    protected ?string $publishableKey;
    protected string $baseUrl;
    protected string $currency;

    /**
     * @param array{secret_key?: string, publishable_key?: string, base_url?: string, currency?: string} $credentials
     */
    public function __construct(array $credentials = [])
    {
        $this->secretKey = (string) ($credentials['secret_key'] ?? config('tap.secret_key'));
        $this->publishableKey = ($credentials['publishable_key'] ?? config('tap.publishable_key')) ?: null;
        $this->baseUrl = (string) ($credentials['base_url'] ?? config('tap.base_url'));
        $this->currency = (string) ($credentials['currency'] ?? config('tap.currency'));
    }

    public function provider(): string
    {
        return 'tap';
    }

    public function label(): string
    {
        return 'Tap';
    }

    public function createCharge(array $params): array
    {
        // Tap rejects an empty `customer.first_name`, so fall back to a generic
        // label when the caller has no name to give (e.g. renewals keyed by org).
        $customerName = trim((string) ($params['customer_name'] ?? '')) ?: 'Customer';

        $payload = [
            'amount' => round((float) $params['amount'], 2),
            'currency' => $this->currency,
            'customer_initiated' => true,
            'threeDSecure' => true,
            'save_card' => false,
            'description' => $params['description'] ?? 'Diyafah Platform Payment',
            'metadata' => $params['metadata'] ?? [],
            'reference' => [
                'transaction' => $params['reference'] ?? null,
                'order' => $params['order_id'] ?? null,
            ],
            // We send our own confirmation mail, so Tap's receipts stay off.
            'receipt' => ['email' => false, 'sms' => false],
            'customer' => array_filter([
                'first_name' => $customerName,
                'email' => $params['customer_email'] ?? null,
            ]),
            // src_all lets the customer pick any method enabled on the merchant
            // account (mada, Visa, Mastercard, Apple Pay…).
            'source' => ['id' => 'src_all'],
            'redirect' => ['url' => $params['redirect_url']],
        ];

        if (!empty($params['webhook_url'])) {
            $payload['post'] = ['url' => $params['webhook_url']];
        }

        $response = Http::withToken($this->secretKey)
            ->acceptJson()
            ->post("{$this->baseUrl}/charges", $payload);

        if ($response->failed()) {
            Log::error('Tap charge creation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return ['success' => false, 'error' => 'Payment initiation failed'];
        }

        $data = $response->json();

        return [
            'success' => true,
            'charge_id' => $data['id'] ?? null,
            'redirect_url' => $data['transaction']['url'] ?? null,
            'status' => $this->normalizeStatus($data['status'] ?? null),
        ];
    }

    public function retrieveCharge(string $id): array
    {
        $response = Http::withToken($this->secretKey)
            ->acceptJson()
            ->get("{$this->baseUrl}/charges/{$id}");

        if ($response->failed()) {
            Log::error('Tap charge retrieval failed', [
                'id' => $id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return ['success' => false, 'error' => 'Could not verify payment'];
        }

        $data = $response->json();

        return [
            'success' => true,
            'charge_id' => $data['id'] ?? null,
            'status' => $this->normalizeStatus($data['status'] ?? null),
            // Tap's own charge id doubles as the transaction reference; the
            // acquirer reference is only present once the charge is captured.
            'transaction_id' => $data['reference']['gateway'] ?? ($data['id'] ?? null),
            'amount' => isset($data['amount']) ? (float) $data['amount'] : null,
            'payment_method' => $data['source']['payment_method'] ?? ($data['source']['type'] ?? null),
            'receipt_url' => $data['transaction']['url'] ?? null,
        ];
    }

    public function isChargeCaptured(string $id): bool
    {
        $result = $this->retrieveCharge($id);
        return $result['success'] && ($result['status'] === 'paid');
    }

    public function normalizeStatus(?string $status): string
    {
        return match (strtoupper((string) $status)) {
            'CAPTURED' => 'paid',
            'REFUNDED' => 'refunded',
            'FAILED', 'DECLINED', 'ABANDONED', 'CANCELLED', 'VOID', 'TIMEDOUT', 'RESTRICTED' => 'failed',
            'INITIATED', 'IN_PROGRESS', 'AUTHORIZED' => 'initiated',
            default => 'unknown',
        };
    }

    public function publishableKey(): ?string
    {
        return $this->publishableKey;
    }

    public function supportsInlineForm(): bool
    {
        // Tap's card SDK is not embedded in this app — customers always go
        // through Tap's hosted page.
        return false;
    }

    public function isTestMode(): bool
    {
        return str_contains($this->secretKey, '_test');
    }

    public function isConfigured(): bool
    {
        return $this->secretKey !== '';
    }

    public function testConnection(): array
    {
        if (!$this->isConfigured()) {
            return ['success' => false, 'message' => 'المفتاح السري غير مُعرَّف / Secret key is missing'];
        }

        // Tap exposes no "ping" endpoint, so we read a charge id that cannot
        // exist: a bad key answers 401, a good key answers 400/404 for the id.
        $response = Http::withToken($this->secretKey)
            ->acceptJson()
            ->get("{$this->baseUrl}/charges/chg_connection_test");

        if (in_array($response->status(), [401, 403], true)) {
            return ['success' => false, 'message' => 'المفتاح السري مرفوض / Secret key rejected (' . $response->status() . ')'];
        }

        if ($response->serverError()) {
            return [
                'success' => false,
                'message' => "تعذر الاتصال / Connection failed (HTTP {$response->status()})",
            ];
        }

        return [
            'success' => true,
            'message' => $this->isTestMode()
                ? 'الاتصال ناجح — مفاتيح اختبار / Connected — test keys'
                : 'الاتصال ناجح — مفاتيح إنتاج / Connected — live keys',
        ];
    }
}
