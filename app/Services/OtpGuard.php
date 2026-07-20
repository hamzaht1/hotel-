<?php

namespace App\Services;

use App\Mail\SetupOtpMail;
use App\Services\AuthenticaOtp;
use App\Support\ActivityLogger;
use App\Support\Mailer;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

/**
 * Session-based OTP gate for sensitive client-admin actions (profile edit,
 * subdomain change). Mirrors the setup-wizard OTP approach: a code is e-mailed
 * to the authenticated user, verified, then a short-lived "passed" window lets
 * the actual write endpoint proceed.
 */
class OtpGuard
{
    /** Actions allowed to request an OTP. */
    public const ACTIONS = ['profile_update', 'subdomain_change'];

    private const CODE_TTL_MINUTES = 10;
    private const PASS_TTL_MINUTES = 15;

    /**
     * Generate + e-mail a code for the given action. Returns the plain code only
     * when the app is in debug mode (so the UI can surface it during testing).
     */
    public function issue(string $action): ?string
    {
        $user = Auth::user();
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        session()->put("otp.{$action}", [
            'hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(self::CODE_TTL_MINUTES)->toIso8601String(),
            'passed_until' => null,
        ]);

        // Deliver over SMS when we have a phone, and always e-mail as a fallback
        // channel. Both are best-effort — the code stays valid regardless.
        if ($user?->phone) {
            AuthenticaOtp::send($user->phone, $code, context: "OTP {$action}");
        }

        if ($user?->email) {
            Mailer::sendIfConfigured(
                $user->email,
                fn () => new SetupOtpMail(otpCode: $code, userName: $user->name ?? ''),
                "OTP {$action}",
            );
        }

        return config('app.debug') ? $code : null;
    }

    /**
     * Verify a submitted code. On success opens a short pass window.
     */
    public function verify(string $action, string $code): bool
    {
        $state = session("otp.{$action}");

        if (!$state || empty($state['hash'])) {
            return false;
        }

        if (now()->isAfter($state['expires_at'])) {
            return false;
        }

        if (!Hash::check($code, $state['hash'])) {
            return false;
        }

        $state['passed_until'] = now()->addMinutes(self::PASS_TTL_MINUTES)->toIso8601String();
        $state['hash'] = null; // single-use code
        session()->put("otp.{$action}", $state);

        ActivityLogger::log('otp.verified', "OTP verified for {$action}", ['action' => $action]);

        return true;
    }

    /**
     * Has the user recently passed OTP for this action?
     */
    public function passed(string $action): bool
    {
        $state = session("otp.{$action}");

        return $state
            && !empty($state['passed_until'])
            && now()->isBefore($state['passed_until']);
    }

    /**
     * Abort the request unless the action's OTP window is open. Consumes the
     * window so each sensitive write requires a fresh verification.
     */
    public function assertPassed(string $action): void
    {
        if (!$this->passed($action)) {
            abort(403, 'OTP verification required');
        }

        session()->forget("otp.{$action}");
    }
}
