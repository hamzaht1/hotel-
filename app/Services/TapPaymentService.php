<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TapPaymentService
{
    protected string $secretKey;
    protected string $baseUrl;
    protected string $currency;

    public function __construct()
    {
        $this->secretKey = config('tap.secret_key');
        $this->baseUrl = config('tap.base_url');
        $this->currency = config('tap.currency');
    }

    /**
     * Create a Tap charge and return the response.
     */
    public function createCharge(array $params): array
    {
        $payload = [
            'amount' => $params['amount'],
            'currency' => $this->currency,
            'customer_initiated' => true,
            'threeDSecure' => true,
            'save_card' => false,
            'description' => $params['description'] ?? 'Diyafah Platform Payment',
            'metadata' => $params['metadata'] ?? [],
            'reference' => [
                'transaction' => $params['reference'] ?? uniqid('txn_'),
                'order' => $params['order_id'] ?? uniqid('ord_'),
            ],
            'receipt' => [
                'email' => true,
                'sms' => false,
            ],
            'customer' => [
                'first_name' => $params['customer_name'] ?? '',
                'email' => $params['customer_email'] ?? '',
            ],
            'source' => ['id' => 'src_all'],
            'redirect' => [
                'url' => $params['redirect_url'],
            ],
            'post' => [
                'url' => $params['webhook_url'] ?? null,
            ],
        ];

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->secretKey}",
            'Content-Type' => 'application/json',
        ])->post("{$this->baseUrl}/charges", $payload);

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
            'status' => $data['status'] ?? null,
        ];
    }

    /**
     * Retrieve a charge by ID to verify payment status.
     */
    public function retrieveCharge(string $chargeId): array
    {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->secretKey}",
        ])->get("{$this->baseUrl}/charges/{$chargeId}");

        if ($response->failed()) {
            Log::error('Tap charge retrieval failed', [
                'charge_id' => $chargeId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return ['success' => false, 'error' => 'Could not verify payment'];
        }

        $data = $response->json();

        return [
            'success' => true,
            'charge_id' => $data['id'] ?? null,
            'status' => $data['status'] ?? null,
            'transaction_id' => $data['reference']['transaction'] ?? null,
            'amount' => $data['amount'] ?? null,
            'payment_method' => $data['source']['payment_method'] ?? null,
            'receipt_url' => $data['receipt']['url'] ?? null,
        ];
    }

    /**
     * Check if a charge was captured (paid successfully).
     */
    public function isChargeCaptured(string $chargeId): bool
    {
        $result = $this->retrieveCharge($chargeId);
        return $result['success'] && ($result['status'] === 'CAPTURED');
    }
}
