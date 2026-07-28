<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Verifies that the credentials stored for a provider are actually accepted by
 * its API, so the super-admin can catch a bad key before a customer hits it.
 *
 * The charging code itself lives in the main app
 * (App\Services\PaymentGatewayManager) — this is read-only probing.
 */
class PaymentGatewayTester
{
    /**
     * @param array<string, string> $credentials
     * @return array{success: bool, message: string, test_mode: bool}
     */
    public function test(string $provider, array $credentials): array
    {
        $secret = trim((string) ($credentials['secret_key'] ?? $credentials['app_sid'] ?? ''));
        $testMode = str_contains($secret, '_test');

        if ($secret === '') {
            return [
                'success' => false,
                'message' => 'المفتاح السري غير مُعرَّف / Secret key is missing',
                'test_mode' => false,
            ];
        }

        $result = match ($provider) {
            'moyasar' => $this->testMoyasar($secret),
            'tap' => $this->testTap($secret),
            default => [
                'success' => false,
                'message' => 'اختبار الاتصال غير مدعوم لهذا المزود / Connection test not supported for this provider',
            ],
        };

        return $result + ['test_mode' => $testMode];
    }

    /**
     * Listing one payment is the cheapest authenticated read Moyasar offers.
     */
    protected function testMoyasar(string $secret): array
    {
        $response = Http::withBasicAuth($secret, '')
            ->acceptJson()
            ->timeout(15)
            ->get('https://api.moyasar.com/v1/payments', ['page' => 1, 'per' => 1]);

        if ($response->status() === 401) {
            return ['success' => false, 'message' => 'المفتاح السري مرفوض / Secret key rejected (401)'];
        }

        if ($response->failed()) {
            return ['success' => false, 'message' => "تعذر الاتصال / Connection failed (HTTP {$response->status()})"];
        }

        return ['success' => true, 'message' => 'الاتصال ناجح / Connection successful'];
    }

    /**
     * Tap exposes no "ping" endpoint, so we read a charge id that cannot exist:
     * a bad key answers 401, a good key answers 400/404 about the id.
     */
    protected function testTap(string $secret): array
    {
        $response = Http::withToken($secret)
            ->acceptJson()
            ->timeout(15)
            ->get('https://api.tap.company/v2/charges/chg_connection_test');

        if (in_array($response->status(), [401, 403], true)) {
            return ['success' => false, 'message' => 'المفتاح السري مرفوض / Secret key rejected (' . $response->status() . ')'];
        }

        if ($response->serverError()) {
            return ['success' => false, 'message' => "تعذر الاتصال / Connection failed (HTTP {$response->status()})"];
        }

        return ['success' => true, 'message' => 'الاتصال ناجح / Connection successful'];
    }
}
