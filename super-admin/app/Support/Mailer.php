<?php

namespace App\Support;

use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class Mailer
{
    /**
     * Send a mailable only if SMTP is configured. No-op (with debug log) otherwise.
     */
    public static function sendIfConfigured(string $to, Mailable|\Closure $mailable, string $context = 'mail'): bool
    {
        if (!self::isConfigured()) {
            Log::debug("Skipped {$context}: SMTP not configured", ['to' => $to]);
            return false;
        }

        try {
            $resolved = $mailable instanceof \Closure ? $mailable() : $mailable;
            Mail::to($to)->send($resolved);
            return true;
        } catch (\Throwable $e) {
            Log::warning("{$context} send failed: " . $e->getMessage(), ['to' => $to]);
            return false;
        }
    }

    public static function isConfigured(): bool
    {
        $mailer = config('mail.default');
        $cfg = config("mail.mailers.{$mailer}", []);
        $from = config('mail.from.address');

        if (in_array($mailer, ['log', 'array'], true)) {
            return !empty($from);
        }

        return !empty($cfg['host'] ?? null)
            && !empty($cfg['username'] ?? null)
            && !empty($cfg['password'] ?? null)
            && !empty($from);
    }
}
