import { useForm, usePage } from '@inertiajs/react';
import { useT } from '@/hooks/use-translations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Clock, CheckCircle, XCircle, AlertTriangle, CreditCard, Landmark, Building2, Copy, CheckCircle2 } from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';
import MoyasarForm from '@/components/MoyasarForm';

export interface Plan {
    name_ar: string;
    name_en: string;
    price: string;
    billing_cycle?: string;
    features_ar?: string[];
    features_en?: string[];
    limits?: Record<string, number | string>;
}

export interface BankDetails {
    bank_name_ar: string;
    bank_name_en: string;
    account_name: string;
    iban: string;
    account_number: string;
    swift: string;
}

export interface TenantInfo {
    name: string;
    subscription_starts_at: string | null;
    subscription_ends_at: string | null;
    is_active: boolean;
    plan: Plan | null;
}

export interface RenewalRequest {
    id: number;
    status: string;
    payment_method: string;
    receipt_path: string | null;
    notes: string | null;
    requested_at: string;
    processed_at: string | null;
    plan: Plan | null;
}

export interface RenewalProps {
    tenant: TenantInfo;
    renewals: RenewalRequest[];
    canRenew: boolean;
    bankDetails: BankDetails;
    moyasarPublishableKey: string | null;
    paymentCallbackUrl: string;
}

type PaymentMode = 'moyasar' | 'bank_transfer';

/**
 * Body of the Renewal screen. Extracted from `renewal/index.tsx` so it
 * can also live as a tab inside the unified Establishment Account page.
 */
export default function RenewalSection({ tenant, renewals, canRenew, bankDetails, moyasarPublishableKey, paymentCallbackUrl }: RenewalProps) {
    useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

    const [paymentMode, setPaymentMode] = useState<PaymentMode>('moyasar');
    const [copied, setCopied] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm<{
        receipt: File | null;
        notes: string;
    }>({
        receipt: null,
        notes: '',
    });

    const daysRemaining = useMemo(() => {
        if (!tenant.subscription_ends_at) return null;
        const end = new Date(tenant.subscription_ends_at);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    }, [tenant.subscription_ends_at]);

    const subscriptionStatus = useMemo(() => {
        if (!tenant.is_active || daysRemaining === null || daysRemaining < 0) return 'expired';
        if (daysRemaining <= 30) return 'expiring';
        return 'active';
    }, [tenant.is_active, daysRemaining]);

    const handleBankTransferSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/client-admin/renewal', {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="rounded-full bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 me-1" />
                        {isArabic ? 'مقبول' : 'Approved'}
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="rounded-full bg-red-100 text-red-700 hover:bg-red-100">
                        <XCircle className="h-3 w-3 me-1" />
                        {isArabic ? 'مرفوض' : 'Rejected'}
                    </Badge>
                );
            default:
                return (
                    <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100">
                        <Clock className="h-3 w-3 me-1" />
                        {isArabic ? 'قيد المراجعة' : 'Pending'}
                    </Badge>
                );
        }
    };

    const paymentMethodBadge = (method: string) => {
        if (method === 'moyasar' || method === 'tap') {
            return (
                <Badge className="rounded-full bg-blue-100 text-blue-700 hover:bg-blue-100">
                    <CreditCard className="h-3 w-3 me-1" />
                    {isArabic ? 'دفع إلكتروني' : 'Online'}
                </Badge>
            );
        }
        return (
            <Badge className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
                <Landmark className="h-3 w-3 me-1" />
                {isArabic ? 'تحويل بنكي' : 'Bank Transfer'}
            </Badge>
        );
    };

    const BankRow = ({ label, value, field }: { label: string; value: string; field: string }) => (
        <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div>
                <span className="text-xs text-muted-foreground">{label}</span>
                <p className="font-semibold text-sm" dir="ltr">{value}</p>
            </div>
            <button
                type="button"
                onClick={() => copyToClipboard(value, field)}
                className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs hover:bg-muted transition-colors"
            >
                {copied === field ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === field ? (isArabic ? 'تم' : 'Copied') : (isArabic ? 'نسخ' : 'Copy')}
            </button>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            {flash?.success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                    {flash.error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{isArabic ? 'حالة الاشتراك' : 'Subscription Status'}</span>
                        {subscriptionStatus === 'active' && (
                            <Badge className="rounded-full bg-green-100 text-green-700 hover:bg-green-100">
                                {isArabic ? 'نشط' : 'Active'}
                            </Badge>
                        )}
                        {subscriptionStatus === 'expiring' && (
                            <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100">
                                <AlertTriangle className="h-3 w-3 me-1" />
                                {isArabic ? 'ينتهي قريباً' : 'Expiring Soon'}
                            </Badge>
                        )}
                        {subscriptionStatus === 'expired' && (
                            <Badge className="rounded-full bg-red-100 text-red-700 hover:bg-red-100">
                                {isArabic ? 'منتهي' : 'Expired'}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <p className="text-sm text-muted-foreground">{isArabic ? 'اسم المنشأة' : 'Organization'}</p>
                            <p className="font-semibold">{tenant.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{isArabic ? 'الباقة' : 'Plan'}</p>
                            <p className="font-semibold">
                                {tenant.plan
                                    ? (isArabic ? tenant.plan.name_ar : tenant.plan.name_en)
                                    : (isArabic ? 'غير محدد' : 'N/A')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{isArabic ? 'تاريخ البداية' : 'Start Date'}</p>
                            <p className="font-semibold">{tenant.subscription_starts_at || '—'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{isArabic ? 'تاريخ الانتهاء' : 'End Date'}</p>
                            <p className="font-semibold">{tenant.subscription_ends_at || '—'}</p>
                        </div>
                    </div>
                    {daysRemaining !== null && (
                        <div className="mt-4 rounded-lg border p-3 text-center">
                            <span className="text-sm text-muted-foreground">
                                {isArabic ? 'الأيام المتبقية' : 'Days Remaining'}:{' '}
                            </span>
                            <span className={`text-lg font-bold ${
                                daysRemaining <= 0 ? 'text-red-600' :
                                daysRemaining <= 7 ? 'text-red-500' :
                                daysRemaining <= 30 ? 'text-amber-500' :
                                'text-green-600'
                            }`}>
                                {daysRemaining > 0 ? daysRemaining : (isArabic ? 'منتهي' : 'Expired')}
                            </span>
                            {tenant.plan?.price && (
                                <span className="ms-4 text-sm text-muted-foreground">
                                    {isArabic ? 'سعر التجديد' : 'Renewal Price'}: <strong>{Number(tenant.plan.price).toLocaleString()} SAR</strong>
                                </span>
                            )}
                        </div>
                    )}

                    {tenant.plan && (
                        (((isArabic ? tenant.plan.features_ar : tenant.plan.features_en) ?? []).length > 0 ||
                            Object.keys(tenant.plan.limits ?? {}).length > 0) && (
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                {((isArabic ? tenant.plan.features_ar : tenant.plan.features_en) ?? []).length > 0 && (
                                    <div className="rounded-lg border p-3">
                                        <p className="mb-2 text-sm font-semibold text-muted-foreground">
                                            {isArabic ? 'الميزات المتاحة' : 'Plan Features'}
                                        </p>
                                        <ul className="space-y-1 text-sm">
                                            {((isArabic ? tenant.plan.features_ar : tenant.plan.features_en) ?? []).map((f, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                                    <span>{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {tenant.plan.limits && Object.keys(tenant.plan.limits).length > 0 && (
                                    <div className="rounded-lg border p-3">
                                        <p className="mb-2 text-sm font-semibold text-muted-foreground">
                                            {isArabic ? 'الحدود' : 'Limits'}
                                        </p>
                                        <ul className="space-y-1 text-sm">
                                            {Object.entries(tenant.plan.limits).map(([k, v]) => (
                                                <li key={k} className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">{k}</span>
                                                    <span className="font-semibold">{String(v)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </CardContent>
            </Card>

            {canRenew && (
                <Card>
                    <CardHeader>
                        <CardTitle>{isArabic ? 'طلب تجديد' : 'Submit Renewal Request'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6 flex overflow-hidden rounded-xl border bg-muted/30">
                            <button
                                type="button"
                                onClick={() => setPaymentMode('moyasar')}
                                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all ${
                                    paymentMode === 'moyasar'
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                <CreditCard className="h-4 w-4" />
                                {isArabic ? 'دفع إلكتروني' : 'Online Payment'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMode('bank_transfer')}
                                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all ${
                                    paymentMode === 'bank_transfer'
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                <Landmark className="h-4 w-4" />
                                {isArabic ? 'تحويل بنكي' : 'Bank Transfer'}
                            </button>
                        </div>

                        {paymentMode === 'moyasar' && (
                            <div className="space-y-4 text-center">
                                <p className="text-sm text-muted-foreground">
                                    {isArabic
                                        ? 'ادفع بأمان عبر مدى أو فيزا أو ماستركارد أو Apple Pay. سيتم تجديد اشتراكك فوراً.'
                                        : 'Pay securely via Mada, Visa, Mastercard or Apple Pay. Your subscription will be renewed instantly.'}
                                </p>

                                {tenant.plan?.price && (
                                    <div className="rounded-xl border-2 border-dashed p-4">
                                        <p className="text-sm text-muted-foreground">
                                            {isArabic ? 'المبلغ المطلوب' : 'Amount Due'}
                                        </p>
                                        <p className="text-2xl font-extrabold">
                                            {Number(tenant.plan.price).toLocaleString()} SAR
                                        </p>
                                    </div>
                                )}

                                <div className="rounded-xl bg-green-50 border border-green-200 p-3 dark:bg-green-950 dark:border-green-800">
                                    <p className="text-sm text-green-700 font-medium dark:text-green-400">
                                        {isArabic
                                            ? '✓ التجديد فوري بعد الدفع — لا حاجة لانتظار مراجعة'
                                            : '✓ Instant renewal after payment — no review needed'}
                                    </p>
                                </div>

                                <div className="text-start">
                                    <MoyasarForm
                                        amount={Number(tenant.plan?.price ?? 0)}
                                        description={`Diyafah Renewal — ${isArabic ? tenant.plan?.name_ar : tenant.plan?.name_en}`}
                                        publishableKey={moyasarPublishableKey}
                                        callbackUrl={paymentCallbackUrl}
                                        methods={['creditcard', 'stcpay']}
                                        metadata={{
                                            type: 'renewal',
                                            tenant_id: tenant.name,
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {paymentMode === 'bank_transfer' && (
                            <div className="space-y-4">
                                <div className="rounded-xl border p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-semibold text-sm">
                                            {isArabic ? 'بيانات الحساب البنكي' : 'Bank Account Details'}
                                        </span>
                                    </div>
                                    <BankRow label={isArabic ? 'اسم البنك' : 'Bank'} value={bankDetails.bank_name_ar} field="rbank" />
                                    <BankRow label={isArabic ? 'اسم الحساب' : 'Account Name'} value={bankDetails.account_name} field="rname" />
                                    <BankRow label="IBAN" value={bankDetails.iban} field="riban" />
                                    <BankRow label={isArabic ? 'رقم الحساب' : 'Account #'} value={bankDetails.account_number} field="raccount" />
                                </div>

                                <form onSubmit={handleBankTransferSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="receipt">
                                            {isArabic ? 'إيصال التحويل البنكي' : 'Bank Transfer Receipt'}
                                            <span className="text-red-500"> *</span>
                                        </Label>
                                        <Input
                                            id="receipt"
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={(e) => setData('receipt', e.target.files?.[0] || null)}
                                            className="cursor-pointer"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {isArabic ? 'الصيغ المقبولة: JPG, PNG, PDF — الحد الأقصى: 5 ميجابايت' : 'Accepted formats: JPG, PNG, PDF — Max: 5MB'}
                                        </p>
                                        {errors.receipt && (
                                            <p className="text-sm text-red-500">{errors.receipt}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes">{isArabic ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</Label>
                                        <Textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder={isArabic ? 'أي ملاحظات إضافية...' : 'Any additional notes...'}
                                            rows={3}
                                        />
                                        {errors.notes && (
                                            <p className="text-sm text-red-500">{errors.notes}</p>
                                        )}
                                    </div>

                                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 dark:bg-amber-950 dark:border-amber-800">
                                        <p className="text-sm text-amber-700 font-medium dark:text-amber-400">
                                            {isArabic
                                                ? '⏱ سيتم مراجعة الإيصال وتجديد اشتراكك خلال 24 ساعة عمل'
                                                : '⏱ Your receipt will be reviewed and subscription renewed within 24 business hours'}
                                        </p>
                                    </div>

                                    <Button type="submit" disabled={processing || !data.receipt}>
                                        <Upload className="h-4 w-4 me-2" />
                                        {processing
                                            ? (isArabic ? 'جاري الإرسال...' : 'Submitting...')
                                            : (isArabic ? 'إرسال طلب التجديد' : 'Submit Renewal Request')}
                                    </Button>
                                </form>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {!canRenew && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                    {isArabic
                        ? 'لديك طلب تجديد قيد المراجعة. سيتم إخطارك عند معالجته.'
                        : 'You have a pending renewal request. You will be notified when it is processed.'}
                </div>
            )}

            {renewals.length > 0 && (
                <Card className="py-0">
                    <CardHeader>
                        <CardTitle>{isArabic ? 'سجل طلبات التجديد' : 'Renewal History'}</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-muted-foreground">
                                    <th className="px-4 py-3 text-start font-medium">{isArabic ? 'التاريخ' : 'Date'}</th>
                                    <th className="px-4 py-3 text-start font-medium">{isArabic ? 'طريقة الدفع' : 'Payment Method'}</th>
                                    <th className="px-4 py-3 text-start font-medium">{isArabic ? 'الحالة' : 'Status'}</th>
                                    <th className="px-4 py-3 text-start font-medium">{isArabic ? 'ملاحظات' : 'Notes'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renewals.map((renewal) => (
                                    <tr key={renewal.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(renewal.requested_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                                        </td>
                                        <td className="px-4 py-3">
                                            {paymentMethodBadge(renewal.payment_method || 'bank_transfer')}
                                        </td>
                                        <td className="px-4 py-3">{statusBadge(renewal.status)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{renewal.notes || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
