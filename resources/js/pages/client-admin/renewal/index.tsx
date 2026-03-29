import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useT } from '@/hooks/use-translations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { FormEventHandler, useMemo } from 'react';

interface Plan {
    name_ar: string;
    name_en: string;
    price: string;
}

interface TenantInfo {
    name: string;
    subscription_starts_at: string | null;
    subscription_ends_at: string | null;
    is_active: boolean;
    plan: Plan | null;
}

interface RenewalRequest {
    id: number;
    status: string;
    receipt_path: string | null;
    notes: string | null;
    requested_at: string;
    processed_at: string | null;
    plan: Plan | null;
}

interface Props {
    tenant: TenantInfo;
    renewals: RenewalRequest[];
    canRenew: boolean;
}

export default function RenewalIndex({ tenant, renewals, canRenew }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const isArabic = document.documentElement.dir === 'rtl';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard', 'Dashboard'), href: '/client-admin' },
        { title: isArabic ? 'تجديد الاشتراك' : 'Renewal', href: '/client-admin/renewal' },
    ];

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

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/client-admin/renewal', {
            forceFormData: true,
            onSuccess: () => reset(),
        });
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'تجديد الاشتراك' : 'Renewal'} />
            <div className="flex flex-col gap-6 p-6">
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

                <h1 className="text-2xl font-bold">{isArabic ? 'تجديد الاشتراك' : 'Subscription Renewal'}</h1>

                {/* Subscription Status Card */}
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
                    </CardContent>
                </Card>

                {/* Renewal Form */}
                {canRenew && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{isArabic ? 'طلب تجديد' : 'Submit Renewal Request'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
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

                                <Button type="submit" disabled={processing || !data.receipt}>
                                    <Upload className="h-4 w-4 me-2" />
                                    {processing
                                        ? (isArabic ? 'جاري الإرسال...' : 'Submitting...')
                                        : (isArabic ? 'إرسال طلب التجديد' : 'Submit Renewal Request')}
                                </Button>
                            </form>
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

                {/* Renewal History */}
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
        </AppLayout>
    );
}
