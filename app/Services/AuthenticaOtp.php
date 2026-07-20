<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Authentica (authentica.sa) SMS / WhatsApp OTP gateway.
 *
 * We generate and verify the OTP ourselves (session / DB). Authentica is only
 * used to *deliver* the code: its `POST /send-otp` endpoint accepts an `otp`
 * field, so we pass our own code and keep verification local. This preserves
 * the existing OTP TTL / single-use / pass-window logic and means every flow
 * still works in dev/staging when the gateway isn't configured.
 *
 * Mirrors the graceful-degrade contract of {@see \App\Support\Mailer}: it never
 * throws — a delivery failure must not break the surrounding request, since the
 * code is still valid and can be resent (or shown via the debug channel).
 */
class AuthenticaOtp
{
    /**
     * Deliver a pre-generated code to a phone number via Authentica.
     *
     * @param  string       $phone    Recipient number (any common Saudi format).
     * @param  string       $code     The OTP we generated and will verify locally.
     * @param  string|null  $channel  sms | whatsapp | email (defaults to config).
     * @param  string       $context  Label used in log lines.
     * @return bool                    True when the gateway accepted the request.
     */
    public static function send(string $phone, string $code, ?string $channel = null, string $context = 'otp'): bool
    {
        if (!self::isConfigured()) {
            Log::debug("Skipped {$context} SMS: Authentica not configured", ['phone' => $phone]);
            return false;
        }

        $normalized = self::normalizePhone($phone);
        if ($normalized === null) {
            Log::warning("{$context} SMS skipped: invalid phone", ['phone' => $phone]);
            return false;
        }

        $payload = [
            'method' => $channel ?: config('authentica.channel', 'sms'),
            'phone' => $normalized,
            'otp' => $code,
        ];

        $templateId = config('authentica.template_id');
        if (!empty($templateId)) {
            $payload['template_id'] = (int) $templateId;
        }

        try {
            $response = Http::withHeaders(['X-Authorization' => config('authentica.key')])
                ->acceptJson()
                ->timeout((int) config('authentica.timeout', 15))
                ->post(self::endpoint('/send-otp'), $payload);

            // Authentica returns { success: true, message } on success and a
            // { errors: [...] } envelope on failure.
            if ($response->failed() || $response->json('success') === false) {
                Log::warning("{$context} SMS send failed", [
                    'phone' => $normalized,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::warning("{$context} SMS send error: " . $e->getMessage(), ['phone' => $normalized]);
            return false;
        }
    }

    public static function isConfigured(): bool
    {
        return !empty(config('authentica.key')) && !empty(config('authentica.base_url'));
    }

    private static function endpoint(string $path): string
    {
        return rtrim((string) config('authentica.base_url'), '/') . $path;
    }

    /**
     * Normalise to E.164 (Authentica expects e.g. +9665XXXXXXXX). Accepts the
     * common Saudi variants: 05XXXXXXXX, 5XXXXXXXX, 9665XXXXXXXX, +9665XXXXXXXX,
     * and the 00 international prefix. Returns null when nothing usable remains.
     */
    public static function normalizePhone(string $phone): ?string
    {
        $digits = preg_replace('/[^0-9+]/', '', $phone) ?? '';
        if ($digits === '' || $digits === '+') {
            return null;
        }

        if (str_starts_with($digits, '+')) {
            return $digits;
        }
        if (str_starts_with($digits, '00')) {
            return '+' . substr($digits, 2);
        }
        if (str_starts_with($digits, '966')) {
            return '+' . $digits;
        }
        // Local mobile 05XXXXXXXX → +9665XXXXXXXX
        if (str_starts_with($digits, '05') && strlen($digits) === 10) {
            return '+966' . substr($digits, 1);
        }
        // Bare mobile 5XXXXXXXX → +9665XXXXXXXX
        if (str_starts_with($digits, '5') && strlen($digits) === 9) {
            return '+966' . $digits;
        }

        // Last resort: assume the caller passed a full international number.
        return '+' . $digits;
    }
}
