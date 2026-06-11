<?php

namespace App\Http\Controllers\ClientAdmin;

use App\Http\Controllers\Controller;
use App\Services\OtpGuard;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Issues and verifies one-time codes for sensitive establishment-account
 * operations. The actual write endpoints call OtpGuard::assertPassed().
 */
class OtpController extends Controller
{
    public function request(Request $request, OtpGuard $guard)
    {
        $validated = $request->validate([
            'action' => ['required', 'string', Rule::in(OtpGuard::ACTIONS)],
        ]);

        $debugCode = $guard->issue($validated['action']);

        return back()->with([
            'success' => 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
            'otp_debug' => $debugCode,
        ]);
    }

    public function verify(Request $request, OtpGuard $guard)
    {
        $validated = $request->validate([
            'action' => ['required', 'string', Rule::in(OtpGuard::ACTIONS)],
            'code' => ['required', 'string'],
        ]);

        if (!$guard->verify($validated['action'], $validated['code'])) {
            return back()->withErrors(['code' => 'رمز التحقق غير صحيح أو منتهي الصلاحية']);
        }

        return back()->with('success', 'تم التحقق بنجاح');
    }
}
