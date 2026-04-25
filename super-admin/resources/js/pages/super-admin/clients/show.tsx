import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft, Mail, Eye, Trash2, Star, Award, Gem, Trophy, Medal,
    CheckCircle, XCircle, AlertCircle, FileText, MessageSquare, CreditCard,
    RefreshCw, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useT } from '@/hooks/use-translations';
import { useState } from 'react';

interface Tenant {
    id: number;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    template: string;
    city: string | null;
    country: string | null;
    org_name_ar: string | null;
    org_name_en: string | null;
    plan_id: number | null;
    plan_model: { id: number; name_ar: string; name_en: string; price: string } | null;
    client_status: string;
    is_active: boolean;
    tier: string;
    logo_url: string | null;
    subscription_starts_at: string | null;
    subscription_ends_at: string | null;
    invoices_count: number;
    created_at: string;
}

interface PrimaryUser {
    id: number;
    name: string;
    email: string;
    phone: string | null;
}

interface Invoice {
    id: number;
    invoice_number: string;
    type: string;
    status: string;
    total: string;
    issue_date: string;
    due_date: string;
    payment_method: string | null;
    paid_at: string | null;
}

interface Renewal {
    id: number;
    status: string;
    payment_method: string | null;
    created_at: string;
    processed_at: string | null;
}

interface Msg {
    id: number;
    client_name: string;
    subject: string;
    message: string;
    status: string;
    is_urgent: boolean;
    source: string;
    created_at: string;
}

interface Review {
    id: number;
    guest_name: string;
    rating: number;
    comment: string | null;
    status: string;
    created_at: string;
}

interface Props {
    tenant: Tenant;
    primary_user: PrimaryUser | null;
    invoices: Invoice[];
    renewals: Renewal[];
    messages: Msg[];
    reviews: Review[];
    stats: { invoices_count: number; paid_count: number; days_remaining: number | null };
}

type Tab = 'payments' | 'invoices' | 'requests' | 'messages' | 'reports';

const TIER_ICONS: Record<string, { Icon: React.ComponentType<{ className?: string }>; cls: string }> = {
    platinum: { Icon: Gem, cls: 'text-violet-600' },
    gold: { Icon: Trophy, cls: 'text-amber-600' },
    silver: { Icon: Medal, cls: 'text-slate-500' },
    bronze: { Icon: Award, cls: 'text-orange-700' },
};

function paymentStatusBadge(invoice: Invoice, isAr: boolean) {
    if (invoice.status === 'paid') {
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1"><CheckCircle className="h-3 w-3" />{isAr ? 'ناجحة' : 'Successful'}</Badge>;
    }
    if (invoice.status === 'overdue' || invoice.status === 'cancelled') {
        return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1"><XCircle className="h-3 w-3" />{isAr ? 'فاشلة' : 'Failed'}</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1"><AlertCircle className="h-3 w-3" />{isAr ? 'معلقة' : 'Pending'}</Badge>;
}

export default function ClientShow({ tenant, primary_user, invoices, renewals, messages, reviews, stats }: Props) {
    const { t, locale, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [tab, setTab] = useState<Tab>('payments');
    const [msgOpen, setMsgOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'العملاء' : 'Clients', href: '/super-admin/clients' },
        { title: tenant.name, href: `/super-admin/clients/${tenant.id}` },
    ];

    const tabs: Array<{ key: Tab; labelAr: string; labelEn: string; icon: React.ComponentType<{ className?: string }> }> = [
        { key: 'payments', labelAr: 'المدفوعات', labelEn: 'Payments', icon: CreditCard },
        { key: 'invoices', labelAr: 'الفواتير', labelEn: 'Invoices', icon: FileText },
        { key: 'requests', labelAr: 'الطلبات', labelEn: 'Requests', icon: RefreshCw },
        { key: 'messages', labelAr: 'الرسائل', labelEn: 'Messages', icon: MessageSquare },
        { key: 'reports', labelAr: 'تقارير العميل', labelEn: 'Reports', icon: BarChart3 },
    ];

    const { Icon: TierIcon, cls: tierCls } = TIER_ICONS[tenant.tier] ?? TIER_ICONS.bronze;

    const tierLabel = {
        platinum: isArabic ? 'بلاتينيوم' : 'Platinum',
        gold: isArabic ? 'جولد' : 'Gold',
        silver: isArabic ? 'سيلفر' : 'Silver',
        bronze: isArabic ? 'برونز' : 'Bronze',
    }[tenant.tier] ?? tenant.tier;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={tenant.name} />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/super-admin/clients"><ArrowLeft className="h-4 w-4" /> {isArabic ? 'رجوع' : 'Back'}</Link>
                        </Button>
                        <h1 className="text-2xl font-bold">{tenant.name}</h1>
                        <Badge className={tenant.client_status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}>
                            {tenant.client_status === 'active' ? (isArabic ? 'نشط' : 'Active') : tenant.client_status === 'frozen' ? (isArabic ? 'مجمد' : 'Frozen') : (isArabic ? 'محظور' : 'Banned')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            {isArabic ? 'تاريخ التسجيل: ' : 'Registered: '}
                            {new Date(tenant.created_at).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Left: Tabs */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex flex-wrap gap-1 border-b">
                            {tabs.map((tb) => (
                                <button
                                    key={tb.key}
                                    onClick={() => setTab(tb.key)}
                                    className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 flex items-center gap-1.5 ${
                                        tab === tb.key
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <tb.icon className="h-4 w-4" />
                                    {isArabic ? tb.labelAr : tb.labelEn}
                                </button>
                            ))}
                        </div>

                        {/* Payments */}
                        {tab === 'payments' && (
                            <Card className="py-0">
                                <CardContent className="overflow-x-auto p-0">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50 text-muted-foreground text-xs">
                                                <th className="px-3 py-2.5 text-start">{isArabic ? 'العملية' : 'Operation'}</th>
                                                <th className="px-3 py-2.5 text-start">{isArabic ? 'التاريخ' : 'Date'}</th>
                                                <th className="px-3 py-2.5 text-start">{isArabic ? 'وسيلة الدفع' : 'Method'}</th>
                                                <th className="px-3 py-2.5 text-start">{isArabic ? 'حالة الدفع' : 'Status'}</th>
                                                <th className="px-3 py-2.5 text-start">{isArabic ? 'إجراء' : 'Action'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoices.length === 0 && (
                                                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">{isArabic ? 'لا توجد عمليات' : 'No operations'}</td></tr>
                                            )}
                                            {invoices.map((inv) => (
                                                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                                                    <td className="px-3 py-2 font-mono text-xs">#{inv.invoice_number}</td>
                                                    <td className="px-3 py-2 text-xs text-muted-foreground">
                                                        {new Date(inv.paid_at ?? inv.issue_date).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-3 py-2 text-xs">{inv.payment_method ?? '—'}</td>
                                                    <td className="px-3 py-2">{paymentStatusBadge(inv, isArabic)}</td>
                                                    <td className="px-3 py-2">
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" asChild title={isArabic ? 'عرض' : 'View'}>
                                                            <Link href={`/super-admin/invoices/${inv.id}`}><Eye className="h-4 w-4" /></Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        )}

                        {/* Invoices */}
                        {tab === 'invoices' && (
                            <Card className="py-0">
                                <CardContent className="overflow-x-auto p-0">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50 text-muted-foreground text-xs">
                                                <th className="px-3 py-2.5 text-start">#</th>
                                                <th className="px-3 py-2.5 text-start">{isArabic ? 'النوع' : 'Type'}</th>
                                                <th className="px-3 py-2.5 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                                                <th className="px-3 py-2.5 text-start">{isArabic ? 'الإجمالي' : 'Total'}</th>
                                                <th className="px-3 py-2.5 text-start">{isArabic ? 'تاريخ الإصدار' : 'Issue date'}</th>
                                                <th className="px-3 py-2.5 text-start">{isArabic ? 'إجراء' : 'Action'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoices.length === 0 && (
                                                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">—</td></tr>
                                            )}
                                            {invoices.map((inv) => (
                                                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                                                    <td className="px-3 py-2 font-mono text-xs">{inv.invoice_number}</td>
                                                    <td className="px-3 py-2 text-xs">{inv.type}</td>
                                                    <td className="px-3 py-2">{paymentStatusBadge(inv, isArabic)}</td>
                                                    <td className="px-3 py-2 text-xs">{inv.total} {isArabic ? 'ر.س' : 'SAR'}</td>
                                                    <td className="px-3 py-2 text-xs text-muted-foreground">{inv.issue_date}</td>
                                                    <td className="px-3 py-2">
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" asChild>
                                                            <Link href={`/super-admin/invoices/${inv.id}`}><Eye className="h-4 w-4" /></Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        )}

                        {/* Requests */}
                        {tab === 'requests' && (
                            <Card className="py-0">
                                <CardContent className="overflow-x-auto p-0">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50 text-muted-foreground text-xs">
                                                <th className="px-3 py-2.5 text-start">#</th>
                                                <th className="px-3 py-2.5 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                                                <th className="px-3 py-2.5 text-start">{isArabic ? 'طريقة الدفع' : 'Method'}</th>
                                                <th className="px-3 py-2.5 text-start">{isArabic ? 'التاريخ' : 'Created'}</th>
                                                <th className="px-3 py-2.5 text-start">{isArabic ? 'معالجة' : 'Processed'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {renewals.length === 0 && (
                                                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">—</td></tr>
                                            )}
                                            {renewals.map((r) => (
                                                <tr key={r.id} className="border-b last:border-0">
                                                    <td className="px-3 py-2 font-mono text-xs">#{r.id}</td>
                                                    <td className="px-3 py-2 text-xs"><Badge variant="outline">{r.status}</Badge></td>
                                                    <td className="px-3 py-2 text-xs">{r.payment_method ?? '—'}</td>
                                                    <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                                                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.processed_at ? new Date(r.processed_at).toLocaleDateString() : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        )}

                        {/* Messages */}
                        {tab === 'messages' && (
                            <div className="flex flex-col gap-3">
                                {messages.length === 0 && <p className="text-sm text-muted-foreground">{isArabic ? 'لا توجد رسائل' : 'No messages'}</p>}
                                {messages.map((m) => (
                                    <Card key={m.id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-medium">{m.subject}</div>
                                                <div className="flex items-center gap-2">
                                                    {m.is_urgent && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
                                                    <Badge variant="outline" className="text-xs">{m.status}</Badge>
                                                </div>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                                            <div className="mt-2 text-xs text-muted-foreground">
                                                {m.client_name} · {new Date(m.created_at).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Reports */}
                        {tab === 'reports' && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">{isArabic ? 'إجمالي الفواتير' : 'Total invoices'}</div><div className="text-2xl font-bold">{stats.invoices_count}</div></CardContent></Card>
                                <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">{isArabic ? 'المدفوعة' : 'Paid'}</div><div className="text-2xl font-bold text-emerald-600">{stats.paid_count}</div></CardContent></Card>
                                <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">{isArabic ? 'الأيام المتبقية' : 'Days remaining'}</div><div className="text-2xl font-bold text-red-600">{stats.days_remaining ?? '—'}</div></CardContent></Card>
                                <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">{isArabic ? 'التقييمات' : 'Reviews'}</div><div className="text-2xl font-bold flex items-center gap-1">{reviews.length}{reviews.length > 0 && <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />}</div></CardContent></Card>
                                {reviews.length > 0 && (
                                    <div className="sm:col-span-2 space-y-2">
                                        {reviews.slice(0, 5).map((rv) => (
                                            <Card key={rv.id}>
                                                <CardContent className="p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-sm font-medium">{rv.guest_name}</div>
                                                        <div className="flex items-center gap-0.5">
                                                            {[1,2,3,4,5].map((n) => <Star key={n} className={`h-3 w-3 ${n <= rv.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />)}
                                                        </div>
                                                    </div>
                                                    {rv.comment && <p className="text-xs text-muted-foreground mt-1">{rv.comment}</p>}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Profile card + Personal info */}
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-primary/20 mb-3">
                                    {tenant.logo_url ? (
                                        <img src={tenant.logo_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-muted flex items-center justify-center text-2xl font-bold">
                                            {tenant.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-lg font-bold">{tenant.name}</h2>
                                <p className="text-sm text-muted-foreground mb-2">{isArabic ? (tenant.org_name_ar ?? '') : (tenant.org_name_en ?? '')}</p>
                                <Badge variant="outline" className="gap-1 mb-2">
                                    <FileText className="h-3 w-3" /> {isArabic ? 'عدد الفواتير' : 'Invoices'}: {stats.invoices_count}
                                </Badge>
                                <Badge className="gap-1 mb-3" variant="outline">
                                    <TierIcon className={`h-3 w-3 ${tierCls}`} /> {isArabic ? 'عميل ' : ''}{tierLabel}
                                </Badge>
                                {stats.days_remaining !== null && (
                                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-center">
                                        <div className="text-xs text-red-600 font-medium">
                                            {isArabic ? 'الأيام المتبقية للاشتراك' : 'Days remaining'}
                                        </div>
                                        <div className="text-lg font-bold text-red-700">
                                            {stats.days_remaining} {isArabic ? 'يوم' : 'days'}
                                        </div>
                                    </div>
                                )}
                                <Button className="mt-4 w-full" onClick={() => setMsgOpen(true)}>
                                    <Mail className="h-4 w-4" /> {isArabic ? 'أرسل رسالة' : 'Send message'}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-sm">{isArabic ? 'المعلومات الشخصية' : 'Personal information'}</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-xs">
                                <InfoRow label={isArabic ? 'الرقم التعريفي' : 'ID'} value={`#${tenant.id}`} />
                                <InfoRow label={isArabic ? 'اسم المستخدم' : 'Username'} value={primary_user?.name ?? '—'} />
                                <InfoRow label={isArabic ? 'الإيميل' : 'Email'} value={primary_user?.email ?? tenant.email ?? '—'} />
                                <InfoRow label={isArabic ? 'رقم الجوال' : 'Phone'} value={tenant.phone ?? '—'} />
                                <InfoRow label={isArabic ? 'الدولة' : 'Country'} value={tenant.country === 'SA' ? (isArabic ? 'السعودية' : 'Saudi Arabia') : (tenant.country ?? '—')} />
                                <InfoRow label={isArabic ? 'المنطقة' : 'Region'} value={tenant.city ?? tenant.template} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {msgOpen && <MessageModal tenantId={tenant.id} onClose={() => setMsgOpen(false)} isArabic={isArabic} />}
        </AppLayout>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-end font-medium truncate max-w-[60%]" title={value}>{value}</span>
        </div>
    );
}

function MessageModal({ tenantId, onClose, isArabic }: { tenantId: number; onClose: () => void; isArabic: boolean }) {
    const { data, setData, post, processing, errors } = useForm({
        subject: '',
        message: '',
        is_urgent: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/super-admin/clients/${tenantId}/message`, { preserveScroll: true, onSuccess: () => onClose() });
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
            <div className="w-full max-w-md bg-background rounded-lg shadow-xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-bold">{isArabic ? 'إرسال رسالة' : 'Send message'}</h2>
                    <button onClick={onClose}><XCircle className="h-5 w-5 text-muted-foreground hover:text-foreground" /></button>
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
                    <div className="flex items-center gap-2">
                        <Checkbox id="urgent" checked={data.is_urgent} onCheckedChange={(v) => setData('is_urgent', v === true)} />
                        <Label htmlFor="urgent">{isArabic ? 'عاجل' : 'Urgent'}</Label>
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
