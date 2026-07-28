<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Moyasar payment integration. Uses the Invoices API to obtain a hosted
 * payment page URL we redirect the customer to. After the customer pays,
 * Moyasar redirects back to `callback_url` with `id`/`status` query params,
 * and also fires a webhook with the payment payload.
 *
 * Credentials come from the super-admin integration settings when one is
 * configured, and fall back to `config/moyasar.php` (.env) otherwise — see
 * {@see PaymentGatewayManager}.
 */
class MoyasarPaymentService implements PaymentGateway
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
        $this->secretKey = (string) ($credentials['secret_key'] ?? config('moyasar.secret_key'));
        $this->publishableKey = ($credentials['publishable_key'] ?? config('moyasar.publishable_key')) ?: null;
        $this->baseUrl = (string) ($credentials['base_url'] ?? config('moyasar.base_url'));
        $this->currency = (string) ($credentials['currency'] ?? config('moyasar.currency'));
    }

    public function provider(): string
    {
        return 'moyasar';
    }

    public function label(): string
    {
        return 'Moyasar';
    }

    /**
     * Create a Moyasar invoice (hosted payment page) and return a redirect URL.
     */
    public function createCharge(array $params): array
    {
        $payload = [
            // Moyasar expects the smallest unit (halala for SAR).
            'amount' => (int) round(((float) $params['amount']) * 100),
            'currency' => $this->currency,
            'description' => $params['description'] ?? 'Diyafah Platform Payment',
            'callback_url' => $params['redirect_url'],
            'metadata' => array_merge($params['metadata'] ?? [], [
                'reference' => $params['reference'] ?? null,
                'order_id' => $params['order_id'] ?? null,
                'customer_name' => $params['customer_name'] ?? null,
                'customer_email' => $params['customer_email'] ?? null,
            ]),
        ];

        $response = Http::withBasicAuth($this->secretKey, '')
            ->acceptJson()
            ->post("{$this->baseUrl}/invoices", $payload);

        if ($response->failed()) {
            Log::error('Moyasar invoice creation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return ['success' => false, 'error' => 'Payment initiation failed'];
        }

        $data = $response->json();

        return [
            'success' => true,
            'charge_id' => $data['id'] ?? null,
            'redirect_url' => $data['url'] ?? null,
            'status' => $this->normalizeStatus($data['status'] ?? null),
        ];
    }

    /**
     * Retrieve a payment or invoice and normalise the response shape.
     *
     * Inline-form integrations (Moyasar JS SDK) create Payment objects directly,
     * so the callback receives a payment ID. Hosted-invoice integrations receive
     * an invoice ID. We try the Payment endpoint first and fall back to Invoices,
     * which keeps both flows usable through the same callback.
     */
    public function retrieveCharge(string $id): array
    {
        $response = Http::withBasicAuth($this->secretKey, '')
            ->acceptJson()
            ->get("{$this->baseUrl}/payments/{$id}");

        if ($response->status() === 404) {
            $response = Http::withBasicAuth($this->secretKey, '')
                ->acceptJson()
                ->get("{$this->baseUrl}/invoices/{$id}");
        }

        if ($response->failed()) {
            Log::error('Moyasar charge retrieval failed', [
                'id' => $id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return ['success' => false, 'error' => 'Could not verify payment'];
        }

        $data = $response->json();

        // Invoice response wraps `payments[]`; Payment response is flat.
        if (isset($data['payments']) && is_array($data['payments'])) {
            $latest = $data['payments'][0] ?? null;
            return [
                'success' => true,
                'charge_id' => $data['id'] ?? null,
                'status' => $this->normalizeStatus($data['status'] ?? null),
                'transaction_id' => $latest['id'] ?? ($data['id'] ?? null),
                'amount' => isset($data['amount']) ? ($data['amount'] / 100) : null,
                'payment_method' => $latest['source']['type'] ?? null,
                'receipt_url' => $latest['source']['transaction_url'] ?? null,
            ];
        }

        return [
            'success' => true,
            'charge_id' => $data['id'] ?? null,
            'status' => $this->normalizeStatus($data['status'] ?? null),
            'transaction_id' => $data['id'] ?? null,
            'amount' => isset($data['amount']) ? ($data['amount'] / 100) : null,
            'payment_method' => $data['source']['type'] ?? null,
            'receipt_url' => $data['source']['transaction_url'] ?? null,
        ];
    }

    public function isChargeCaptured(string $invoiceId): bool
    {
        $result = $this->retrieveCharge($invoiceId);
        return $result['success'] && ($result['status'] === 'paid');
    }

    /**
     * Moyasar already speaks our vocabulary; this only lowercases and maps the
     * few statuses that differ.
     */
    public function normalizeStatus(?string $status): string
    {
        return match (strtolower((string) $status)) {
            'paid', 'captured' => 'paid',
            'failed', 'voided', 'abandoned' => 'failed',
            'refunded' => 'refunded',
            'initiated', 'pending', 'authorized' => 'initiated',
            default => 'unknown',
        };
    }

    public function publishableKey(): ?string
    {
        return $this->publishableKey;
    }

    public function supportsInlineForm(): bool
    {
        // The Moyasar JS SDK (see resources/js/components/MoyasarForm.tsx) lets
        // the customer pay without leaving our page, but only with a
        // publishable key on top of the secret key.
        return (bool) $this->publishableKey;
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

        // Listing one payment is the cheapest authenticated read Moyasar offers.
        $response = Http::withBasicAuth($this->secretKey, '')
            ->acceptJson()
            ->get("{$this->baseUrl}/payments", ['page' => 1, 'per' => 1]);

        if ($response->status() === 401) {
            return ['success' => false, 'message' => 'المفتاح السري مرفوض / Secret key rejected (401)'];
        }

        if ($response->failed()) {
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
