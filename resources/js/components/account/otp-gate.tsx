import { router, usePage } from '@inertiajs/react';
import { ShieldCheck, X, Mail, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Reusable OTP gate for sensitive establishment-account actions. Requests a
 * code (e-mailed to the user), verifies it against the server session, then
 * calls `onVerified()` so the parent can submit the actual write. The server's
 * OtpGuard keeps a short "passed" window that the write endpoint enforces.
 */
export default function OtpGate({
    action,
    open,
    onClose,
    onVerified,
    title,
}: {
    action: 'profile_update' | 'subdomain_change';
    open: boolean;
    onClose: () => void;
    onVerified: () => void;
    title?: string;
}) {
    const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    const [code, setCode] = useState('');
    const [sent, setSent] = useState(false);
    const [debug, setDebug] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    const sendCode = () => {
        setLoading(true);
        setError(null);
        router.post(
            '/client-admin/account/otp/request',
            { action },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    setSent(true);
                    const flash = (page.props as { flash?: { otp_debug?: string | null } }).flash;
                    setDebug(flash?.otp_debug ?? null);
                },
                onError: () => setError(isArabic ? 'تعذر إرسال الرمز' : 'Could not send code'),
                onFinish: () => setLoading(false),
            },
        );
    };

    const verify = () => {
        setLoading(true);
        setError(null);
        router.post(
            '/client-admin/account/otp/verify',
            { action, code },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setCode('');
                    setSent(false);
                    onVerified();
                    onClose();
                },
                onError: (errs) => setError((errs.code as string) ?? (isArabic ? 'رمز غير صحيح' : 'Invalid code')),
                onFinish: () => setLoading(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-semibold">
                            {title ?? (isArabic ? 'تحقق أمني' : 'Security verification')}
                        </h3>
                    </div>
                    <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <p className="mb-4 text-sm text-muted-foreground">
                    {isArabic
                        ? 'لحماية حسابك، نرسل رمز تحقق إلى بريدك الإلكتروني قبل تنفيذ هذه العملية.'
                        : 'To protect your account, we send a verification code to your e-mail before this action.'}
                </p>

                {!sent ? (
                    <Button onClick={sendCode} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        {isArabic ? 'إرسال رمز التحقق' : 'Send verification code'}
                    </Button>
                ) : (
                    <div className="space-y-3">
                        {debug && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                {isArabic ? 'رمز التطوير' : 'Debug code'}: <strong>{debug}</strong>
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label>{isArabic ? 'رمز التحقق' : 'Verification code'}</Label>
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="000000"
                                dir="ltr"
                                className="text-center text-lg tracking-[0.5em]"
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <div className="flex gap-2">
                            <Button onClick={verify} disabled={loading || code.length < 4} className="flex-1">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                {isArabic ? 'تحقق ومتابعة' : 'Verify & continue'}
                            </Button>
                            <Button variant="outline" onClick={sendCode} disabled={loading}>
                                {isArabic ? 'إعادة إرسال' : 'Resend'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
