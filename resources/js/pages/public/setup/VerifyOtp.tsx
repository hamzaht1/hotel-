import React, { useState, useRef, useEffect } from "react";
import { router, usePage, Head } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import SetupBanner from "@/components/public/setup/SetupBanner";
import AnimatedHeading from '@/components/motion/AnimatedHeading'
import { useLang } from '@/hooks/useLang'
import { MailCheck, RefreshCw, Smartphone } from "lucide-react";

interface Props {
  email: string;
  phone?: string;
  requireEmail?: boolean;
  requirePhone?: boolean;
  debugOtp?: string | null;
  debugPhoneOtp?: string | null;
}

/** Six single-digit boxes with auto-advance / paste support. */
function OtpBoxes({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...value];
    next[i] = v.slice(-1);
    onChange(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...value];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    onChange(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  return (
    <div className="flex justify-center gap-3 my-6" dir="ltr" onPaste={handlePaste}>
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-14 w-12 rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-2xl font-bold text-public-primary
                     focus:border-public-active focus:bg-white focus:outline-none focus:ring-2 focus:ring-public-active/20 transition-all"
        />
      ))}
    </div>
  );
}

export default function VerifyOtp({ email, phone, requireEmail = true, requirePhone = false, debugOtp, debugPhoneOtp }: Props) {
  const { __ } = useLang()
  const serverErrors = usePage().props.errors as Record<string, string>;
  const flash = usePage().props.flash as { success?: string };
  const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [phoneOtp, setPhoneOtp] = useState(["", "", "", "", "", ""]);
  const [processing, setProcessing] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const maskedEmail = (() => {
    const [u, d] = (email || "").split("@");
    if (!u || !d) return email;
    return u[0] + "•••@" + d;
  })();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const emailReady = !requireEmail || emailOtp.join("").length === 6;
  const phoneReady = !requirePhone || phoneOtp.join("").length === 6;

  const submitOtp = () => {
    if (!emailReady || !phoneReady) return;
    setProcessing(true);
    const payload: Record<string, string> = {};
    if (requireEmail) payload.otp = emailOtp.join("");
    if (requirePhone) payload.phone_otp = phoneOtp.join("");
    router.post("/setup/verify-otp", payload, { onFinish: () => setProcessing(false) });
  };

  const resendOtp = () => {
    setResending(true);
    router.post("/setup/resend-otp", {}, {
      onFinish: () => { setResending(false); setCountdown(60); },
    });
  };

  return (
    <PublicLayout>
      <Head title={isArabic ? 'تأكيد الحساب | ضيافة' : 'Verify account | Diyafah'} />

      <section className="py-10">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <SetupBanner />
          <div className="mx-auto max-w-lg rounded-3xl border border-public-border bg-white p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-blue-50">
                <MailCheck className="size-8 text-blue-600" />
              </div>
              <AnimatedHeading dir="up" delay={0.30}>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-public-primary">
                  {isArabic ? 'تأكيد الحساب' : 'Verify your account'}
                </h1>
              </AnimatedHeading>
            </div>

            {flash?.success && (
              <div className="mb-4 rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-600">{flash.success}</div>
            )}

            {/* Email verification */}
            {requireEmail && (
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                  <MailCheck className="h-4 w-4 text-blue-600" />
                  {isArabic ? 'رمز البريد الإلكتروني' : 'Email code'} — <span className="font-semibold text-public-primary">{maskedEmail}</span>
                </div>
                {serverErrors?.otp && (
                  <div className="mt-2 rounded-lg bg-red-50 p-2 text-center text-sm font-medium text-red-600">{serverErrors.otp}</div>
                )}
                <OtpBoxes value={emailOtp} onChange={setEmailOtp} />
                {debugOtp && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-center">
                    <span className="text-xs text-amber-600">{isArabic ? 'وضع التطوير — رمز البريد: ' : 'Dev — email code: '}</span>
                    <span className="text-lg font-bold text-amber-800 tracking-widest" dir="ltr">{debugOtp}</span>
                  </div>
                )}
              </div>
            )}

            {/* Phone verification */}
            {requirePhone && (
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  {isArabic ? 'رمز الجوال' : 'Phone code'} — <span className="font-semibold text-public-primary" dir="ltr">{phone}</span>
                </div>
                {serverErrors?.phone_otp && (
                  <div className="mt-2 rounded-lg bg-red-50 p-2 text-center text-sm font-medium text-red-600">{serverErrors.phone_otp}</div>
                )}
                <OtpBoxes value={phoneOtp} onChange={setPhoneOtp} />
                {debugPhoneOtp && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-center">
                    <span className="text-xs text-amber-600">{isArabic ? 'وضع التطوير — رمز الجوال: ' : 'Dev — phone code: '}</span>
                    <span className="text-lg font-bold text-amber-800 tracking-widest" dir="ltr">{debugPhoneOtp}</span>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={submitOtp}
              disabled={processing || !emailReady || !phoneReady}
              className="w-full rounded-xl bg-public-primary px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {processing ? (isArabic ? 'جاري التحقق...' : 'Verifying...') : (isArabic ? 'تأكيد' : 'Confirm')}
            </button>

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500 mb-2">{isArabic ? 'لم يصلك الرمز؟' : "Didn't get the code?"}</p>
              <button
                type="button"
                onClick={resendOtp}
                disabled={resending || countdown > 0}
                className="inline-flex items-center gap-2 text-sm font-semibold text-public-active hover:underline disabled:opacity-50 disabled:no-underline"
              >
                <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
                {countdown > 0
                  ? (isArabic ? `إعادة الإرسال بعد ${countdown} ثانية` : `Resend in ${countdown}s`)
                  : (isArabic ? 'إعادة إرسال الرمز' : 'Resend code')}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              {isArabic ? 'الرمز صالح لمدة 10 دقائق' : 'Code valid for 10 minutes'}
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
