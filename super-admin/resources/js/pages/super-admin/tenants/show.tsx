import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft, Trash2, CheckCircle, Clock, CreditCard, FileText,
    Eye, Globe, Palette, Mail, Phone, User as UserIcon, XCircle,
    AlertCircle, Wallet, Rocket, Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/hooks/use-translations';
import { useStorageUrl } from '@/lib/storage';
import { usePermission } from '@/hooks/use-permission';
import { useState } from 'react';

interface Tenant {
    id: number;
    name: string;
    slug: string;
    template: string;
    domain: string | null;
    custom_domain: string | null;
    subdomain: string | null;
    plan_model: { id: number; name_ar: string; name_en: string; slug: string; price: string } | null;
    is_active: boolean;
    payment_status: string | null;
    payment_method: string | null;
    payment_notes: string | null;
    bank_transfer_receipt_url: string | null;
    city: string | null;
    created_at: string;
    updated_at: string;
    approved_at: string | null;
    deployed_at: string | null;
    org_name_ar: string | null;
    tags: { id: number; label: string; color: string }[];
    approver: { id: number; name: string } | null;
    deployer: { id: number; name: string } | null;
}

interface Deployment {
    url: string;
    subdomain: string | null;
    base_domain: string;
}

interface PrimaryUser {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    photo: string | null;
}

interface Invoice {
    id: number;
    invoice_number: string;
    status: string;
    total: string;
    payment_method: string | null;
    paid_at: string | null;
}

interface Renewal {
    id: number;
    status: string;
    payment_method: string | null;
    created_at: string;
    processed_at: string | null;
    processed_by_user?: { id: number; name: string } | null;
}

interface ActivityEvent {
    label_ar: string;
    label_en: string;
    date: string | null;
    type: 'created' | 'review' | 'payment' | 'completed';
    actor: string | null;
}

interface Props {
    tenant: Tenant;
    primary_user: PrimaryUser | null;
    latest_invoice: Invoice | null;
    latest_renewal: Renewal | null;
    completed_requests_count: number;
    activity: ActivityEvent[];
    deployment: Deployment;
}

function statusBadge(tenant: Tenant, isAr: boolean) {
    if (tenant.payment_status === 'approved' && tenant.is_active) {
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{isAr ? 'مكتمل' : 'Completed'}</Badge>;
    }
    if (tenant.payment_status === 'pending') {
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">{isAr ? 'قيد المراجعة' : 'Under review'}</Badge>;
    }
    if (tenant.payment_status === 'rejected') {
        return <Badge variant="destructive">{isAr ? 'مرفوض' : 'Rejected'}</Badge>;
    }
    return <Badge variant="secondary">{tenant.payment_status ?? '—'}</Badge>;
}

function paymentStatusBadge(status: string, isAr: boolean) {
    if (status === 'paid') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1"><CheckCircle className="h-3 w-3" />{isAr ? 'ناجحة' : 'Successful'}</Badge>;
    if (['overdue', 'cancelled'].includes(status)) return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1"><XCircle className="h-3 w-3" />{isAr ? 'فاشلة' : 'Failed'}</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1"><AlertCircle className="h-3 w-3" />{isAr ? 'معلقة' : 'Pending'}</Badge>;
}

const TIMELINE_COLORS: Record<ActivityEvent['type'], string> = {
    created: 'bg-blue-500',
    review: 'bg-amber-500',
    payment: 'bg-emerald-500',
    completed: 'bg-violet-500',
};

export default function TenantShow({ tenant, primary_user, latest_invoice, latest_renewal, completed_requests_count, activity, deployment }: Props) {
    const { t, locale, isArabic } = useT();
    const storageUrl = useStorageUrl();
    const { can } = usePermission();
    const pageProps = usePage().props as { flash?: { success?: string; error?: string }; mainAppUrl?: string };
    const flash = pageProps.flash;
    const mainAppUrl = (pageProps.mainAppUrl ?? '').replace(/\/$/, '');
    const numLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

    const [msgOpen, setMsgOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'الطلبات' : 'Requests', href: '/super-admin/tenants' },
        { title: `#${tenant.id}`, href: `/super-admin/tenants/${tenant.id}` },
    ];

    const siteUrl = tenant.custom_domain
        ? `https://${tenant.custom_domain}`
        : `${mainAppUrl}/hotel/${tenant.slug}`;

    function deleteRequest() {
        if (!confirm(isArabic ? 'تأكيد حذف الطلب؟ لا يمكن التراجع.' : 'Confirm delete? This cannot be undone.')) return;
        router.delete(`/super-admin/tenants/${tenant.id}`);
    }

    function approveRequest() {
        if (!confirm(isArabic ? 'قبول الطلب وتفعيل الموقع؟' : 'Approve and activate site?')) return;
        router.post(`/super-admin/tenants/${tenant.id}/approve`, {}, { preserveScroll: true });
    }

    function rejectRequest() {
        const reason = prompt(isArabic ? 'سبب الرفض؟' : 'Rejection reason?');
        if (!reason) return;
        router.post(`/super-admin/tenants/${tenant.id}/reject`, { rejection_reason: reason }, { preserveScroll: true });
    }

    const paymentMethodLabel = (() => {
        const pm = tenant.payment_method;
        if (!pm) return '—';
        const map: Record<string, { ar: string; en: string }> = {
            bank_transfer: { ar: 'حوالة بنكية', en: 'Bank transfer' },
            moyasar: { ar: 'ميسر', en: 'Moyasar' },
            tap: { ar: 'تاب', en: 'Tap' },
            manual: { ar: 'يدوي / كاش', en: 'Manual / Cash' },
            credit_card: { ar: 'بطاقة ائتمان', en: 'Credit card' },
            mada: { ar: 'مدى', en: 'Mada' },
            apple_pay: { ar: 'Apple Pay', en: 'Apple Pay' },
        };
        return isArabic ? (map[pm]?.ar ?? pm) : (map[pm]?.en ?? pm);
    })();

    const isPending = tenant.payment_status === 'pending';
    const isDeployed = !!tenant.deployed_at;
    const [subdomainInput, setSubdomainInput] = useState(tenant.subdomain ?? tenant.slug);
    const [copied, setCopied] = useState(false);

    function deploySite() {
        const subdomain = subdomainInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
        if (!subdomain) return;
        const msg = isDeployed
            ? (isArabic ? 'إعادة نشر الموقع بهذا النطاق الفرعي؟' : 'Re-deploy site with this subdomain?')
            : (isArabic ? 'نشر الموقع وتفعيله؟' : 'Deploy and activate site?');
        if (!confirm(msg)) return;
        router.post(`/super-admin/tenants/${tenant.id}/deploy`, { subdomain }, { preserveScroll: true });
    }

    function copyDeploymentUrl() {
        navigator.clipboard.writeText(deployment.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const cardMasked = (() => {
        if (!latest_invoice) return null;
        // Mask for display — we don't store real card numbers, show last-4 pattern as placeholder
        return '•••• •••• •••• 4291';
    })();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${isArabic ? 'طلب' : 'Request'} #${tenant.id}`} />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/super-admin/tenants"><ArrowLeft className="h-4 w-4" /> {isArabic ? 'رجوع' : 'Back'}</Link>
                        </Button>
                        <h1 className="text-2xl font-bold">{isArabic ? 'طلب' : 'Request'} #{tenant.id}</h1>
                        {statusBadge(tenant, isArabic)}
                        <span className="text-xs text-muted-foreground">
                            {new Date(tenant.created_at).toLocaleString(numLocale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700">
                            <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                                <Globe className="h-4 w-4" /> {isArabic ? 'زيارة الموقع' : 'Visit site'}
                            </a>
                        </Button>
                        {isPending && can('tenants.approve') && (
                            <Button size="sm" onClick={approveRequest} className="bg-emerald-600 hover:bg-emerald-700">
                                <CheckCircle className="h-4 w-4" /> {isArabic ? 'قبول الطلب' : 'Approve'}
                            </Button>
                        )}
                        {isPending && can('tenants.reject') && (
                            <Button size="sm" variant="outline" onClick={rejectRequest} className="text-red-600 border-red-200 hover:bg-red-50">
                                <XCircle className="h-4 w-4" /> {isArabic ? 'رفض الطلب' : 'Reject'}
                            </Button>
                        )}
                        {can('tenants.delete') && (
                            <Button variant="destructive" size="sm" onClick={deleteRequest}>
                                <Trash2 className="h-4 w-4" /> {isArabic ? 'حذف الطلب' : 'Delete request'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Activator (who approved) */}
                {tenant.approver && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span className="text-muted-foreground">{isArabic ? 'تم تفعيل الموقع بواسطة' : 'Site activated by'}</span>
                        <strong>{tenant.approver.name}</strong>
                        {tenant.approved_at && (
                            <span className="text-xs text-muted-foreground">
                                · {new Date(tenant.approved_at).toLocaleString(numLocale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                )}

                {/* Row 1: Details + Client data */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">{isArabic ? 'التفاصيل' : 'Details'}</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <InfoRow label={isArabic ? 'الباقة المختارة' : 'Selected plan'} value={tenant.plan_model ? (isArabic ? tenant.plan_model.name_ar : tenant.plan_model.name_en) : '—'} />
                            <InfoRow label={isArabic ? 'المدينة' : 'City'} value={tenant.city ? ({ madina: isArabic ? 'المدينة المنورة' : 'Madinah', riyadh: isArabic ? 'الرياض' : 'Riyadh', mecca: isArabic ? 'مكة' : 'Mecca', jeddah: isArabic ? 'جدة' : 'Jeddah' } as Record<string, string>)[tenant.city] ?? tenant.city : '—'} />
                            <InfoRow label={isArabic ? 'القالب المختار' : 'Selected template'} value={tenant.template} />
                            <InfoRow label={isArabic ? 'رابط الموقع' : 'Site URL'} value={
                                <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {tenant.custom_domain ?? siteUrl.replace(/^https?:\/\//, '')}
                                </a>
                            } />
                            {tenant.tags.length > 0 && (
                                <div className="pt-2 border-t">
                                    <div className="text-xs text-muted-foreground mb-2">{isArabic ? 'الوسوم' : 'Tags'}</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {tenant.tags.map((tag) => (
                                            <span key={tag.id} className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white" style={{ background: tag.color }}>
                                                {tag.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">{isArabic ? 'بيانات العميل' : 'Client data'}</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-14 w-14 rounded-full overflow-hidden border bg-muted flex items-center justify-center flex-shrink-0">
                                    {primary_user?.photo ? (
                                        <img src={storageUrl(primary_user.photo) ?? ''} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <UserIcon className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium">{primary_user?.name ?? '—'}</div>
                                    <div className="text-xs text-muted-foreground">{isArabic ? 'مدير' : 'Admin'} {tenant.org_name_ar ?? tenant.name}</div>
                                    <Badge variant="outline" className="mt-1 text-xs">
                                        {isArabic ? `لديه ${completed_requests_count} طلبات مكتملة` : `${completed_requests_count} completed requests`}
                                    </Badge>
                                </div>
                            </div>

                            {primary_user && (
                                <div className="pt-2 border-t space-y-1.5 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <a href={`mailto:${primary_user.email}`} className="text-primary hover:underline">{primary_user.email}</a>
                                    </div>
                                    {primary_user.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <a href={`tel:${primary_user.phone}`} className="text-primary hover:underline">{primary_user.phone}</a>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button variant="outline" className="w-full" asChild>
                                <Link href={`/super-admin/clients/${tenant.id}`}>
                                    {isArabic ? 'رؤية المزيد' : 'See more'}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity timeline */}
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base">{isArabic ? 'سجل النشاط' : 'Activity log'}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="relative">
                            {/* Horizontal line */}
                            <div className="absolute top-3 start-4 end-4 h-0.5 bg-muted" />
                            <div className="relative grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(activity.length, 1)}, minmax(0, 1fr))` }}>
                                {activity.map((e, i) => (
                                    <div key={i} className="flex flex-col items-center text-center">
                                        <div className={`h-6 w-6 rounded-full ${TIMELINE_COLORS[e.type]} border-4 border-background relative z-10`} />
                                        <div className="mt-2 text-xs font-medium">{isArabic ? e.label_ar : e.label_en}</div>
                                        {e.date && (
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {new Date(e.date).toLocaleDateString(numLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        )}
                                        {e.actor && (
                                            <Badge variant="outline" className="mt-1 text-[10px] gap-1">
                                                <UserIcon className="h-2.5 w-2.5" />
                                                {e.actor}
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Deployment card */}
                <Card className={isDeployed ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/40'}>
                    <CardHeader className="pb-3 flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Rocket className={`h-4 w-4 ${isDeployed ? 'text-emerald-600' : 'text-amber-600'}`} />
                            {isArabic ? 'نشر الموقع' : 'Site deployment'}
                        </CardTitle>
                        {isDeployed && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                {isArabic ? 'منشور' : 'Deployed'}
                            </Badge>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {isDeployed && (
                            <div className="flex items-center gap-2 rounded-lg border bg-white p-3">
                                <Globe className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                <a href={deployment.url} target="_blank" rel="noopener noreferrer"
                                   className="text-sm font-mono text-emerald-700 hover:underline truncate flex-1" dir="ltr">
                                    {deployment.url}
                                </a>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copyDeploymentUrl}
                                        title={isArabic ? 'نسخ' : 'Copy'}>
                                    {copied ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        )}
                        {tenant.deployer && tenant.deployed_at && (
                            <p className="text-xs text-muted-foreground">
                                {isArabic ? 'نُشر بواسطة' : 'Deployed by'} <strong>{tenant.deployer.name}</strong>{' '}
                                · {new Date(tenant.deployed_at).toLocaleString(numLocale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                        {can('tenants.deploy') && (
                            <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                                <div>
                                    <Label className="text-xs">
                                        {isArabic ? 'النطاق الفرعي' : 'Subdomain'}
                                    </Label>
                                    <div className="flex items-center gap-1" dir="ltr">
                                        <Input value={subdomainInput} onChange={(e) => setSubdomainInput(e.target.value)}
                                               placeholder="grand-hotel" className="font-mono" />
                                        {deployment.base_domain && (
                                            <span className="text-sm text-muted-foreground whitespace-nowrap">.{deployment.base_domain}</span>
                                        )}
                                    </div>
                                </div>
                                <Button onClick={deploySite} className="bg-emerald-600 hover:bg-emerald-700">
                                    <Rocket className="h-4 w-4" />
                                    {isDeployed
                                        ? (isArabic ? 'إعادة النشر' : 'Re-deploy')
                                        : (isArabic ? 'نشر الموقع' : 'Deploy site')}
                                </Button>
                            </div>
                        )}
                        {!deployment.base_domain && (
                            <p className="text-xs text-amber-700">
                                {isArabic
                                    ? 'لتفعيل النطاقات الفرعية الكاملة (مثال: grand.diyafah.com) يرجى ضبط متغير البيئة TENANT_BASE_DOMAIN'
                                    : 'To enable full subdomain URLs (e.g. grand.diyafah.com), set TENANT_BASE_DOMAIN env var.'}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Row 3: Payment operation + Quick links */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-3 flex-row items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                {isArabic ? 'عملية الدفع' : 'Payment operation'}
                            </CardTitle>
                            {latest_renewal && latest_renewal.status === 'pending' ? (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1"><Clock className="h-3 w-3" />{isArabic ? 'بانتظار الدفع' : 'Awaiting payment'}</Badge>
                            ) : (
                                latest_invoice && paymentStatusBadge(latest_invoice.status, isArabic)
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-muted p-3">
                                    <CreditCard className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{paymentMethodLabel}</div>
                                    {latest_invoice && <div className="text-xs text-muted-foreground">{cardMasked}</div>}
                                </div>
                            </div>
                            {tenant.payment_method === 'bank_transfer' && tenant.bank_transfer_receipt_url && (
                                <a href={tenant.bank_transfer_receipt_url} target="_blank" rel="noopener noreferrer"
                                   className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs hover:bg-muted">
                                    <FileText className="h-4 w-4 text-amber-600" />
                                    {isArabic ? 'إيصال الحوالة البنكية' : 'Bank transfer receipt'}
                                </a>
                            )}
                            {tenant.payment_notes && (
                                <p className="text-xs text-muted-foreground border-t pt-2">{tenant.payment_notes}</p>
                            )}
                            {latest_invoice ? (
                                <>
                                    <div className="grid gap-2 text-sm border-t pt-3">
                                        <InfoRow label={isArabic ? 'رقم الفاتورة' : 'Invoice #'} value={<span className="font-mono text-xs">#{latest_invoice.invoice_number}</span>} />
                                        <InfoRow label={isArabic ? 'المبلغ' : 'Amount'} value={<strong>{Number(latest_invoice.total).toLocaleString(numLocale)} {isArabic ? 'ر.س' : 'SAR'}</strong>} />
                                        {latest_invoice.paid_at && (
                                            <InfoRow label={isArabic ? 'تاريخ الدفع' : 'Paid at'} value={new Date(latest_invoice.paid_at).toLocaleString(numLocale, { day: 'numeric', month: 'short', year: 'numeric' })} />
                                        )}
                                    </div>
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href={`/super-admin/invoices/${latest_invoice.id}`}>
                                            {isArabic ? 'رؤية الفاتورة' : 'See invoice'}
                                        </Link>
                                    </Button>
                                </>
                            ) : (
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/super-admin/invoices/create?tenant_id=${tenant.id}`}>
                                        <FileText className="h-4 w-4" /> {isArabic ? 'إنشاء فاتورة' : 'Create invoice'}
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">{isArabic ? 'روابط سريعة' : 'Quick links'}</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <QuickLink
                                icon={Globe}
                                label={isArabic ? 'زيارة الموقع' : 'Visit website'}
                                href={siteUrl}
                                external
                            />
                            <QuickLink
                                icon={Palette}
                                label={isArabic ? 'معاينة القالب المختار' : 'Preview selected template'}
                                href={`${mainAppUrl}/template/${tenant.template}`}
                                external
                            />
                            <QuickLink
                                icon={FileText}
                                label={latest_invoice ? (isArabic ? 'رؤية الفاتورة' : 'View invoice') : (isArabic ? 'إنشاء فاتورة' : 'Create invoice')}
                                href={latest_invoice ? `/super-admin/invoices/${latest_invoice.id}` : `/super-admin/invoices/create?tenant_id=${tenant.id}`}
                                external={false}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Center action: Send message */}
                <div className="flex justify-center">
                    <Button size="lg" onClick={() => setMsgOpen(true)}>
                        <Mail className="h-5 w-5" /> {isArabic ? 'أرسل رسالة للعميل' : 'Send message to client'}
                    </Button>
                </div>
            </div>

            {msgOpen && <MessageModal tenantId={tenant.id} onClose={() => setMsgOpen(false)} isArabic={isArabic} />}
        </AppLayout>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-3 text-sm">
            <span className="text-muted-foreground flex-shrink-0">{label}</span>
            <span className="text-end font-medium truncate">{value}</span>
        </div>
    );
}

function QuickLink({ icon: Icon, label, href, external }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href: string;
    external: boolean;
}) {
    const className = 'flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted/50 transition';
    if (external) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
                <Icon className="h-5 w-5 text-primary" />
                <span>{label}</span>
            </a>
        );
    }
    return (
        <Link href={href} className={className}>
            <Icon className="h-5 w-5 text-primary" />
            <span>{label}</span>
        </Link>
    );
}

function MessageModal({ tenantId, onClose, isArabic }: { tenantId: number; onClose: () => void; isArabic: boolean }) {
    const { data, setData, post, processing, errors } = useForm({ subject: '', message: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/super-admin/tenants/${tenantId}/message`, { preserveScroll: true, onSuccess: () => onClose() });
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
            <div className="w-full max-w-md bg-background rounded-lg shadow-xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-bold">{isArabic ? 'إرسال رسالة' : 'Send message'}</h2>
                    <button type="button" onClick={onClose}><XCircle className="h-5 w-5 text-muted-foreground" /></button>
                </div>
                <form onSubmit={submit} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <Label>{isArabic ? 'الموضوع' : 'Subject'}</Label>
                        <Input value={data.subject} onChange={(e) => setData('subject', e.target.value)} required />
                        {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label>{isArabic ? 'الرسالة' : 'Message'}</Label>
                        <Textarea value={data.message} onChange={(e) => setData('message', e.target.value)} rows={5} required />
                        {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>{isArabic ? 'إلغاء' : 'Cancel'}</Button>
                        <Button type="submit" disabled={processing}>{isArabic ? 'إرسال' : 'Send'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
