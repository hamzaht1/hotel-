import React, { useState } from "react";
import { router, usePage, Head } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import SetupBanner from "@/components/public/setup/SetupBanner";
import AnimatedHeading from '@/components/motion/AnimatedHeading';
import { useLang } from '@/hooks/useLang';
import { Upload, Building2, Copy, CheckCircle2, CreditCard, Landmark } from "lucide-react";
import MoyasarForm from "@/components/MoyasarForm";

interface BankDetails {
  bank_name_ar: string;
  bank_name_en: string;
  account_name: string;
  iban: string;
  account_number: string;
  swift: string;
}

interface Props {
  setup: Record<string, string>;
  bankDetails: BankDetails;
  planPrice: number;
  moyasarPublishableKey: string | null;
  paymentCallbackUrl: string;
}

type PaymentMode = 'moyasar' | 'bank_transfer';

export default function PaymentMethod({ setup, bankDetails, planPrice, moyasarPublishableKey, paymentCallbackUrl }: Props) {
  const { __ } = useLang();
  const serverErrors = usePage().props.errors as Record<string, string>;

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('moyasar');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const planName = setup?.plan_name ?? '';
  const price = Number(planPrice) || 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceipt(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const submitBankTransfer = () => {
    if (!receipt) return;

    setProcessing(true);
    const formData = new FormData();
    formData.append("receipt", receipt);
    if (notes) formData.append("payment_notes", notes);

    router.post("/setup/payment-method", formData, {
      forceFormData: true,
      onFinish: () => setProcessing(false),
    });
  };

  // Inline Moyasar form handles its own submission; no manual click handler needed.

  const goPrev = () => router.visit("/setup/review");

  const BankRow = ({ label, value, field }: { label: string; value: string; field: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <span className="text-xs text-slate-500">{label}</span>
        <p className="font-semibold text-slate-800 text-sm" dir="ltr">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => copyToClipboard(value, field)}
        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
      >
        {copied === field ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        {copied === field ? "تم النسخ" : "نسخ"}
      </button>
    </div>
  );

  return (
    <PublicLayout>
      <Head title="الدفع | ضيافة" />

      <section className="py-10">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <SetupBanner title="شكراً لاختيارك ضيافة" subtitle="أكمل عملية الدفع لتفعيل حسابك" />

          <div className="mx-auto rounded-3xl border border-public-border bg-white p-6 sm:p-8 shadow-sm">
            <AnimatedHeading dir="up" delay={0.30}>
              <h1 className="mb-8 text-center text-2xl sm:text-3xl font-extrabold text-public-primary">
                اختر طريقة الدفع
              </h1>
            </AnimatedHeading>

            {/* Payment mode toggle */}
            <div className="mx-auto mb-8 flex max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setPaymentMode('moyasar')}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${
                  paymentMode === 'moyasar'
                    ? 'bg-public-primary text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                دفع إلكتروني
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('bank_transfer')}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${
                  paymentMode === 'bank_transfer'
                    ? 'bg-public-primary text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Landmark className="h-4 w-4" />
                تحويل بنكي
              </button>
            </div>

            {/* Error messages */}
            {(serverErrors?.payment || serverErrors?.receipt) && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 text-center">
                {serverErrors.payment || serverErrors.receipt}
              </div>
            )}

            {/* ─── ONLINE PAYMENT (Moyasar) ─── */}
            {paymentMode === 'moyasar' && (
              <div className="mx-auto max-w-lg">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                  <div className="mx-auto grid size-16 place-items-center rounded-full bg-blue-50 mb-4">
                    <CreditCard className="size-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">الدفع الإلكتروني عبر Moyasar</h3>
                  <p className="text-sm text-slate-600 mb-6">
                    ادفع بأمان باستخدام بطاقة مدى أو فيزا أو ماستركارد أو Apple Pay.
                    سيتم تفعيل حسابك فوراً بعد إتمام الدفع.
                  </p>

                  {/* Amount */}
                  <div className="mb-6 rounded-2xl border-2 border-dashed border-public-active/30 bg-public-active/5 p-4">
                    <p className="text-sm text-slate-600">المبلغ المطلوب</p>
                    <p className="mt-1 text-3xl font-extrabold text-public-primary">
                      {price.toLocaleString("en-US")} <span className="text-lg">ر.س</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {planName} — {setup?.org_name_ar}
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-50 border border-green-200 p-3 mb-6">
                    <p className="text-sm text-green-700 font-medium">
                      ✓ التفعيل فوري بعد الدفع — لا حاجة لانتظار مراجعة
                    </p>
                  </div>

                  <div className="text-start">
                    <MoyasarForm
                      amount={price}
                      description={`Diyafah — ${planName} — ${setup?.org_name_ar ?? ''}`}
                      publishableKey={moyasarPublishableKey}
                      callbackUrl={paymentCallbackUrl}
                      // Apple Pay requires a registered merchant ID + server-side
                      // validate_merchant_url; enable once that infrastructure is in place.
                      methods={['creditcard', 'stcpay']}
                      metadata={{
                        type: 'setup',
                        plan_id: setup?.plan_id ?? '',
                        email: setup?.email ?? '',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─── BANK TRANSFER ─── */}
            {paymentMode === 'bank_transfer' && (
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Right: Bank Details */}
                <div className="order-1">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="grid size-10 place-items-center rounded-full bg-blue-50">
                        <Building2 className="size-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">بيانات الحساب البنكي</h3>
                        <p className="text-xs text-slate-500">قم بالتحويل إلى الحساب التالي</p>
                      </div>
                    </div>

                    <BankRow label="اسم البنك" value={bankDetails.bank_name_ar} field="bank" />
                    <BankRow label="اسم الحساب" value={bankDetails.account_name} field="name" />
                    <BankRow label="IBAN" value={bankDetails.iban} field="iban" />
                    <BankRow label="رقم الحساب" value={bankDetails.account_number} field="account" />
                    <BankRow label="SWIFT" value={bankDetails.swift} field="swift" />
                  </div>

                  {/* Amount to transfer */}
                  <div className="mt-4 rounded-2xl border-2 border-dashed border-public-active/30 bg-public-active/5 p-4 text-center">
                    <p className="text-sm text-slate-600">المبلغ المطلوب تحويله</p>
                    <p className="mt-1 text-3xl font-extrabold text-public-primary">
                      {price.toLocaleString("en-US")} <span className="text-lg">ر.س</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {planName} — {setup?.org_name_ar}
                    </p>
                  </div>
                </div>

                {/* Left: Upload Receipt */}
                <div className="order-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4">رفع إيصال التحويل</h3>

                    <p className="text-sm text-slate-600 mb-4">
                      بعد إتمام التحويل البنكي، قم برفع صورة أو ملف PDF لإيصال التحويل.
                      سيتم مراجعة الإيصال وتفعيل حسابك خلال 24 ساعة.
                    </p>

                    {/* File upload zone */}
                    <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 cursor-pointer hover:border-public-active hover:bg-public-active/5 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {previewUrl ? (
                        <img src={previewUrl} alt="إيصال" className="max-h-40 rounded-lg mb-3" />
                      ) : (
                        <Upload className="h-10 w-10 text-slate-400 mb-3" />
                      )}
                      <span className="font-semibold text-slate-700">
                        {receipt ? receipt.name : "اضغط لاختيار الملف"}
                      </span>
                      <span className="mt-1 text-xs text-slate-400">
                        JPG, PNG أو PDF — حد أقصى 5 ميجا
                      </span>
                    </label>

                    {/* Notes */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        ملاحظات (اختياري)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="مثال: تم التحويل من حساب شركة..."
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-public-active focus:outline-none focus:ring-2 focus:ring-public-active/20"
                      />
                    </div>
                  </div>

                  {/* Info notice */}
                  <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <p className="text-sm text-amber-800 font-medium">
                      ⏱ بعد رفع الإيصال، سيتم مراجعته من قبل فريق ضيافة وتفعيل حسابك خلال 24 ساعة عمل.
                      ستصلك رسالة على بريدك الإلكتروني عند التفعيل.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-8 flex items-center justify-between">
              <button type="button" onClick={goPrev} className="rounded-xl border border-public-primary bg-white px-5 py-2 font-semibold text-public-primary hover:bg-public-primary/5">
                السابق
              </button>
              {paymentMode === 'bank_transfer' && (
                <button
                  type="button"
                  onClick={submitBankTransfer}
                  disabled={!receipt || processing}
                  className="rounded-xl bg-public-primary px-8 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {processing ? "جاري الإرسال..." : "إرسال الإيصال وإنشاء الحساب"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
