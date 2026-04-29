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
 * Public surface kept compatible with the previous TapPaymentService so
 * controllers only need to map the returned status string.
 */
class MoyasarPaymentService
{
    protected string $secretKey;
    protected string $baseUrl;
    protected string $currency;

    public function __construct()
    {
        $this->secretKey = config('moyasar.secret_key');
        $this->baseUrl = config('moyasar.base_url');
        $this->currency = config('moyasar.currency');
    }

    /**
     * Create a Moyasar invoice (hosted payment page) and return a redirect URL.
     *
     * Required keys in $params:
     *   - amount (float, in major units of the currency, e.g. SAR)
     *   - description (string)
     *   - redirect_url (string) — Moyasar's "callback_url"
     * Optional:
     *   - reference, order_id, customer_name, customer_email, metadata, webhook_url
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
            'status' => $data['status'] ?? null,
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
                'status' => $data['status'] ?? null,
                'transaction_id' => $latest['id'] ?? ($data['id'] ?? null),
                'amount' => isset($data['amount']) ? ($data['amount'] / 100) : null,
                'payment_method' => $latest['source']['type'] ?? null,
                'receipt_url' => $latest['source']['transaction_url'] ?? null,
            ];
        }

        return [
            'success' => true,
            'charge_id' => $data['id'] ?? null,
            'status' => $data['status'] ?? null,
            'transaction_id' => $data['id'] ?? null,
            'amount' => isset($data['amount']) ? ($data['amount'] / 100) : null,
            'payment_method' => $data['source']['type'] ?? null,
            'receipt_url' => $data['source']['transaction_url'] ?? null,
        ];
    }

    /**
     * Was this invoice fully paid?
     */
    public function isChargeCaptured(string $invoiceId): bool
    {
        $result = $this->retrieveCharge($invoiceId);
        return $result['success'] && ($result['status'] === 'paid');
    }
}
