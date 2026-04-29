<?php

namespace App\Support;

use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class Mailer
{
    /**
     * Send a mailable only if the SMTP configuration is complete. Otherwise log
     * a debug message and skip silently — useful in dev/staging where mail isn't
     * wired yet, so the rest of a flow doesn't crash.
     *
     * Pass a Closure as the second argument to construct the mailable lazily;
     * this avoids instantiating (and potentially autoloading) the class when
     * mail is disabled or its file is missing.
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

    /**
     * SMTP is considered "configured" only when host, username, password, and
     * from-address are all non-empty. The driver itself doesn't need to be SMTP —
     * any non-empty `MAIL_HOST` plus credentials counts.
     */
    public static function isConfigured(): bool
    {
        $mailer = config('mail.default');
        $cfg = config("mail.mailers.{$mailer}", []);
        $from = config('mail.from.address');

        if (in_array($mailer, ['log', 'array'], true)) {
            // These drivers don't talk to a real server — always considered configured.
            return !empty($from);
        }

        return !empty($cfg['host'] ?? null)
            && !empty($cfg['username'] ?? null)
            && !empty($cfg['password'] ?? null)
            && !empty($from);
    }
}
