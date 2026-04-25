import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Plus, Pencil, ExternalLink, CheckCircle, XCircle, FileImage,
    Tag as TagIcon, Download, Search, Power, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';
import { useState } from 'react';

interface Tag { id: number; label: string; color: string }

interface Tenant {
    id: number;
    name: string;
    slug: string;
    domain: string | null;
    custom_domain: string | null;
    template: string;
    plan_id: number | null;
    plan_model: { id: number; name_ar: string; name_en: string; price: string } | null;
    is_active: boolean;
    payment_status: string | null;
    payment_method: string | null;
    bank_transfer_receipt: string | null;
    bank_transfer_receipt_url: string | null;
    admin_notes: string | null;
    subscription_starts_at: string | null;
    subscription_ends_at: string | null;
    users_count: number;
    email: string | null;
    phone: string | null;
    created_at: string;
    pending_count: number | null;
    last_request_at: string | null;
    tags: Tag[];
}

interface Stats {
    total: number;
    completed: number;
    pending: number;
    expired: number;
    rejected: number;
    inactive: number;
}

interface Plan { id: number; name_ar: string; name_en: string; slug: string }

interface Props {
    tenants: { data: Tenant[]; links: { url: string | null; label: string; active: boolean }[]; last_page: number };
    stats: Stats;
    filters: Record<string, string | undefined>;
    plans: Plan[];
    tags: Tag[];
}

const STATUS_CARDS: Array<{ key: keyof Stats; labelAr: string; labelEn: string; color: string }> = [
    { key: 'total', labelAr: 'إجمالي الطلبات', labelEn: 'Total requests', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
    { key: 'completed', labelAr: 'الطلبات المكتملة', labelEn: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    { key: 'pending', labelAr: 'قيد المراجعة', labelEn: 'Pending review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    { key: 'expired', labelAr: 'منتهية', labelEn: 'Expired', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
    { key: 'rejected', labelAr: 'مرفوضة', labelEn: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
    { key: 'inactive', labelAr: 'معطلة', labelEn: 'Inactive', color: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
];

function deriveStatus(t: Tenant): 'completed' | 'pending' | 'expired' | 'rejected' | 'inactive' {
    if ((t.pending_count ?? 0) > 0) return 'pending';
    if (t.payment_status === 'rejected') return 'rejected';
    if (!t.is_active) return 'inactive';
    if (t.subscription_ends_at && new Date(t.subscription_ends_at) < new Date()) return 'expired';
    if (t.payment_status === 'pending') return 'pending';
    return 'completed';
}

function statusBadge(status: string, isAr: boolean) {
    const map: Record<string, { ar: string; en: string; cls: string }> = {
        completed: { ar: 'مكتمل', en: 'Completed', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        pending: { ar: 'قيد المراجعة', en: 'Pending', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
        expired: { ar: 'منتهية', en: 'Expired', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
        rejected: { ar: 'مرفوضة', en: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-200' },
        inactive: { ar: 'معطلة', en: 'Inactive', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
    };
    const s = map[status] ?? { ar: status, en: status, cls: 'bg-gray-100 text-gray-600' };
    return <Badge variant="outline" className={s.cls}>{isAr ? s.ar : s.en}</Badge>;
}

export default function TenantsIndex({ tenants, stats, filters, plans, tags }: Props) {
    const { t, locale, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string; new_password?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'الطلبات' : 'Requests', href: '/super-admin/tenants' },
    ];

    const [editing, setEditing] = useState<Tenant | null>(null);
    const [tagManagerOpen, setTagManagerOpen] = useState(false);

    function applyFilter(key: string, value: string | undefined) {
        const next = { ...filters, [key]: value || undefined };
        router.get('/super-admin/tenants', next, { preserveState: true, preserveScroll: true });
    }

    function doExport(format: 'csv' | 'excel' | 'pdf') {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
        params.append('export', format);
        window.location.href = `/super-admin/tenants?${params.toString()}`;
    }

    function approveRenewal(t: Tenant) {
        if (!confirm(isArabic ? 'قبول طلب التجديد؟' : 'Approve renewal?')) return;
        router.post(`/super-admin/tenants/${t.id}/approve-renewal`, {}, { preserveScroll: true });
    }

    function rejectRenewal(t: Tenant) {
        const reason = prompt(isArabic ? 'سبب الرفض؟' : 'Rejection reason?');
        if (reason === null) return;
        router.post(`/super-admin/tenants/${t.id}/reject-renewal`, { rejection_reason: reason }, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'الطلبات' : 'Requests'} />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</div>
                )}

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold">{isArabic ? 'الطلبات' : 'Requests'}</h1>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setTagManagerOpen(true)}>
                            <TagIcon className="h-4 w-4" /> {isArabic ? 'الوسوم' : 'Tags'}
                        </Button>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => doExport('csv')}><Download className="h-4 w-4" /> CSV</Button>
                            <Button variant="outline" size="sm" onClick={() => doExport('excel')}><Download className="h-4 w-4" /> Excel</Button>
                            <Button variant="outline" size="sm" onClick={() => doExport('pdf')}><Download className="h-4 w-4" /> PDF</Button>
                        </div>
                        <Button asChild>
                            <Link href="/super-admin/tenants/create">
                                <Plus className="h-4 w-4" /> {isArabic ? 'إضافة طلب جديد' : 'Add new request'}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats cards (6) */}
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                    {STATUS_CARDS.map((c) => (
                        <button
                            key={c.key}
                            onClick={() => applyFilter('status', c.key === 'total' ? undefined : c.key)}
                            className={`rounded-lg border p-3 text-start transition hover:shadow ${c.color} ${filters.status === c.key ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                        >
                            <div className="text-xs">{isArabic ? c.labelAr : c.labelEn}</div>
                            <div className="text-2xl font-bold mt-1">{stats[c.key].toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}</div>
                        </button>
                    ))}
                </div>

                {/* Search + filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="grid gap-3 md:grid-cols-6">
                            <div className="relative md:col-span-2">
                                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={isArabic ? 'ابحث في المستأجرين، الفواتير...' : 'Search tenants, invoices...'}
                                    defaultValue={filters.search ?? ''}
                                    onBlur={(e) => applyFilter('search', e.target.value)}
                                    className="ps-10"
                                />
                            </div>
                            <Select value={filters.status ?? 'all'} onValueChange={(v) => applyFilter('status', v === 'all' ? undefined : v)}>
                                <SelectTrigger><SelectValue placeholder={isArabic ? 'جميع الحالات' : 'All statuses'} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'جميع الحالات' : 'All statuses'}</SelectItem>
                                    <SelectItem value="completed">{isArabic ? 'مكتمل' : 'Completed'}</SelectItem>
                                    <SelectItem value="pending">{isArabic ? 'قيد المراجعة' : 'Pending'}</SelectItem>
                                    <SelectItem value="expired">{isArabic ? 'منتهية' : 'Expired'}</SelectItem>
                                    <SelectItem value="rejected">{isArabic ? 'مرفوضة' : 'Rejected'}</SelectItem>
                                    <SelectItem value="inactive">{isArabic ? 'معطلة' : 'Inactive'}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.template ?? 'all'} onValueChange={(v) => applyFilter('template', v === 'all' ? undefined : v)}>
                                <SelectTrigger><SelectValue placeholder={isArabic ? 'القالب' : 'Template'} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'كل القوالب' : 'All templates'}</SelectItem>
                                    <SelectItem value="madina">Madina</SelectItem>
                                    <SelectItem value="riyadh">Riyadh</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.payment_method ?? 'all'} onValueChange={(v) => applyFilter('payment_method', v === 'all' ? undefined : v)}>
                                <SelectTrigger><SelectValue placeholder={isArabic ? 'الدفع' : 'Payment'} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'كل طرق الدفع' : 'All payment methods'}</SelectItem>
                                    <SelectItem value="tap">Tap</SelectItem>
                                    <SelectItem value="bank_transfer">{isArabic ? 'تحويل بنكي' : 'Bank transfer'}</SelectItem>
                                    <SelectItem value="credit_card">{isArabic ? 'بطاقة' : 'Credit card'}</SelectItem>
                                    <SelectItem value="mada">مدى</SelectItem>
                                    <SelectItem value="manual">{isArabic ? 'يدوي' : 'Manual'}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.plan_id ?? 'all'} onValueChange={(v) => applyFilter('plan_id', v === 'all' ? undefined : v)}>
                                <SelectTrigger><SelectValue placeholder={isArabic ? 'الخطة' : 'Plan'} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'كل الخطط' : 'All plans'}</SelectItem>
                                    {plans.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>{isArabic ? p.name_ar : p.name_en}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-3 md:grid-cols-4 mt-3">
                            <div>
                                <Label className="text-xs">{isArabic ? 'من تاريخ' : 'From'}</Label>
                                <Input type="date" defaultValue={filters.date_from ?? ''} onChange={(e) => applyFilter('date_from', e.target.value)} />
                            </div>
                            <div>
                                <Label className="text-xs">{isArabic ? 'إلى تاريخ' : 'To'}</Label>
                                <Input type="date" defaultValue={filters.date_to ?? ''} onChange={(e) => applyFilter('date_to', e.target.value)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="py-0">
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-muted-foreground">
                                    <th className="px-3 py-3 text-start">#</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'الاسم' : 'Name'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'النطاق' : 'Domain'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'القالب' : 'Template'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'الخطة' : 'Plan'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'المستخدمون' : 'Users'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'الاشتراك' : 'Subscription'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'الدفع' : 'Payment'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'الإجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.data.map((row) => {
                                    const status = deriveStatus(row);
                                    const siteUrl = row.custom_domain
                                        ? `https://${row.custom_domain}`
                                        : `/hotel/${row.slug}`;
                                    return (
                                        <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 align-middle">
                                            <td className="px-3 py-2 text-muted-foreground text-xs font-mono">#{row.id}</td>
                                            <td className="px-3 py-2">
                                                <div className="font-medium">{row.name}</div>
                                                <div className="text-xs text-muted-foreground">{row.email ?? '—'}</div>
                                                {row.tags.length > 0 && (
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {row.tags.map((tag) => (
                                                            <span key={tag.id} className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ background: tag.color }}>
                                                                {tag.label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-xs">
                                                {row.custom_domain ?? row.domain ?? row.slug}
                                            </td>
                                            <td className="px-3 py-2 text-xs"><Badge variant="outline">{row.template}</Badge></td>
                                            <td className="px-3 py-2 text-xs">{row.plan_model ? (isArabic ? row.plan_model.name_ar : row.plan_model.name_en) : '—'}</td>
                                            <td className="px-3 py-2 text-center">{row.users_count}</td>
                                            <td className="px-3 py-2 text-xs">
                                                {row.subscription_starts_at && <div>{row.subscription_starts_at}</div>}
                                                {row.subscription_ends_at && <div className="text-muted-foreground">→ {row.subscription_ends_at}</div>}
                                            </td>
                                            <td className="px-3 py-2">{statusBadge(status, isArabic)}</td>
                                            <td className="px-3 py-2 text-xs">
                                                <div>{row.payment_method ?? '—'}</div>
                                                {row.bank_transfer_receipt_url && (
                                                    <a
                                                        href={row.bank_transfer_receipt_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-primary hover:underline mt-1"
                                                    >
                                                        <FileImage className="h-3 w-3" /> {isArabic ? 'الإيصال' : 'Receipt'}
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-1">
                                                    {status === 'pending' && (row.pending_count ?? 0) > 0 && (
                                                        <>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={() => approveRenewal(row)} title={isArabic ? 'قبول' : 'Approve'}>
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => rejectRenewal(row)} title={isArabic ? 'رفض' : 'Reject'}>
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" asChild title={isArabic ? 'زيارة الموقع' : 'Visit site'}>
                                                        <a href={siteUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" asChild title={isArabic ? 'عرض' : 'View'}>
                                                        <Link href={`/super-admin/tenants/${row.id}`}><Eye className="h-4 w-4" /></Link>
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" asChild title={isArabic ? 'تفاصيل' : 'Details'}>
                                                        <Link href={`/super-admin/tenants/${row.id}`}><Pencil className="h-4 w-4" /></Link>
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7"
                                                        onClick={() => router.post(`/super-admin/tenants/${row.id}/toggle`, {}, { preserveScroll: true })}
                                                        title={row.is_active ? (isArabic ? 'تعطيل' : 'Disable') : (isArabic ? 'تفعيل' : 'Enable')}
                                                    >
                                                        <Power className={`h-4 w-4 ${row.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {tenants.data.length === 0 && (
                                    <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                                        {isArabic ? 'لا توجد طلبات' : 'No requests found'}
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {tenants.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {tenants.links.map((link, i) => (
                            <Button key={i} variant={link.active ? 'default' : 'ghost'} size="sm" disabled={!link.url} asChild={!!link.url}>
                                {link.url
                                    ? <Link href={link.url} preserveState dangerouslySetInnerHTML={{ __html: link.label }} />
                                    : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {editing && <EditModal tenant={editing} plans={plans} tags={tags} onClose={() => setEditing(null)} isArabic={isArabic} />}
            {tagManagerOpen && <TagManager tags={tags} onClose={() => setTagManagerOpen(false)} isArabic={isArabic} />}
        </AppLayout>
    );
}

// ─── Edit modal (all fields + notes + tags) ─────────────────────
function EditModal({ tenant, plans, tags, onClose, isArabic }: {
    tenant: Tenant; plans: Plan[]; tags: Tag[]; onClose: () => void; isArabic: boolean
}) {
    const { data, setData, put, processing, errors } = useForm({
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain ?? '',
        subdomain: '',
        template: tenant.template,
        email: tenant.email ?? '',
        phone: tenant.phone ?? '',
        plan_id: tenant.plan_id ?? '',
        subscription_starts_at: tenant.subscription_starts_at ?? '',
        subscription_ends_at: tenant.subscription_ends_at ?? '',
        is_active: tenant.is_active,
        admin_notes: tenant.admin_notes ?? '',
        payment_method: tenant.payment_method ?? 'manual',
        payment_status: tenant.payment_status ?? 'approved',
        tag_ids: tenant.tags.map((t) => t.id),
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/super-admin/tenants/${tenant.id}`, { preserveScroll: true, onSuccess: () => onClose() });
    }

    function toggleTag(id: number) {
        setData('tag_ids', data.tag_ids.includes(id) ? data.tag_ids.filter((x) => x !== id) : [...data.tag_ids, id]);
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto flex items-start justify-center">
            <div className="w-full max-w-3xl bg-background rounded-lg shadow-xl my-8">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-bold">{isArabic ? 'تعديل الطلب' : 'Edit request'} #{tenant.id}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><XCircle className="h-5 w-5" /></button>
                </div>
                <form onSubmit={submit} className="p-6 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label={isArabic ? 'الاسم' : 'Name'} error={errors.name}><Input value={data.name} onChange={(e) => setData('name', e.target.value)} /></Field>
                        <Field label="Slug" error={errors.slug}><Input value={data.slug} onChange={(e) => setData('slug', e.target.value)} /></Field>
                        <Field label={isArabic ? 'البريد' : 'Email'} error={errors.email}><Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} /></Field>
                        <Field label={isArabic ? 'الهاتف' : 'Phone'} error={errors.phone}><Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} /></Field>
                        <Field label={isArabic ? 'النطاق' : 'Domain'} error={errors.domain}><Input value={data.domain} onChange={(e) => setData('domain', e.target.value)} /></Field>
                        <Field label={isArabic ? 'القالب' : 'Template'} error={errors.template}>
                            <Select value={data.template} onValueChange={(v) => setData('template', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="madina">Madina</SelectItem>
                                    <SelectItem value="riyadh">Riyadh</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label={isArabic ? 'الخطة' : 'Plan'} error={(errors as Record<string, string>).plan_id}>
                            <Select value={String(data.plan_id)} onValueChange={(v) => setData('plan_id', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {plans.map((p) => <SelectItem key={p.id} value={String(p.id)}>{isArabic ? p.name_ar : p.name_en}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label={isArabic ? 'طريقة الدفع' : 'Payment method'} error={(errors as Record<string, string>).payment_method}>
                            <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manual">Manual</SelectItem>
                                    <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                                    <SelectItem value="tap">Tap</SelectItem>
                                    <SelectItem value="credit_card">Credit card</SelectItem>
                                    <SelectItem value="mada">مدى</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label={isArabic ? 'حالة الدفع' : 'Payment status'} error={(errors as Record<string, string>).payment_status}>
                            <Select value={data.payment_status} onValueChange={(v) => setData('payment_status', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label={isArabic ? 'بداية الاشتراك' : 'Subscription start'} error={errors.subscription_starts_at}><Input type="date" value={data.subscription_starts_at} onChange={(e) => setData('subscription_starts_at', e.target.value)} /></Field>
                        <Field label={isArabic ? 'نهاية الاشتراك' : 'Subscription end'} error={errors.subscription_ends_at}><Input type="date" value={data.subscription_ends_at} onChange={(e) => setData('subscription_ends_at', e.target.value)} /></Field>
                        <div className="flex items-center gap-2 sm:col-span-2">
                            <Checkbox id="active" checked={data.is_active} onCheckedChange={(v) => setData('is_active', v === true)} />
                            <Label htmlFor="active">{isArabic ? 'نشط' : 'Active'}</Label>
                        </div>
                    </div>

                    {tenant.bank_transfer_receipt_url && (
                        <div className="rounded border p-3 bg-muted/30">
                            <div className="text-xs text-muted-foreground mb-2">{isArabic ? 'الإيصال' : 'Receipt'}</div>
                            <a href={tenant.bank_transfer_receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                <FileImage className="h-4 w-4" /> {isArabic ? 'فتح الملف' : 'Open file'}
                            </a>
                        </div>
                    )}

                    <Field label={isArabic ? 'ملاحظات المسؤول' : 'Admin notes'} error={(errors as Record<string, string>).admin_notes}>
                        <Textarea value={data.admin_notes} onChange={(e) => setData('admin_notes', e.target.value)} rows={3} placeholder={isArabic ? 'ملاحظات داخلية، غير مرئية للعميل' : 'Internal notes, not shown to the client'} />
                    </Field>

                    <div>
                        <Label className="text-xs mb-1.5 block">{isArabic ? 'الوسوم' : 'Tags'}</Label>
                        <div className="flex flex-wrap gap-2">
                            {tags.length === 0 && <span className="text-xs text-muted-foreground">{isArabic ? 'لا توجد وسوم بعد — أنشئها من زر "الوسوم"' : 'No tags yet — create one from the Tags button'}</span>}
                            {tags.map((tag) => {
                                const selected = data.tag_ids.includes(tag.id);
                                return (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium transition ${selected ? 'text-white' : 'opacity-50'}`}
                                        style={{ background: tag.color, border: selected ? 'none' : '1px dashed ' + tag.color, color: selected ? 'white' : tag.color }}
                                    >
                                        {tag.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>{isArabic ? 'إلغاء' : 'Cancel'}</Button>
                        <Button type="submit" disabled={processing}>{processing ? '...' : (isArabic ? 'حفظ' : 'Save')}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Tag manager modal ─────────────────────────────────────────
function TagManager({ tags, onClose, isArabic }: { tags: Tag[]; onClose: () => void; isArabic: boolean }) {
    const [newLabel, setNewLabel] = useState('');
    const [newColor, setNewColor] = useState('#6366f1');

    function createTag() {
        if (!newLabel.trim()) return;
        router.post('/super-admin/tags', { label: newLabel, color: newColor }, {
            preserveScroll: true,
            onSuccess: () => {
                setNewLabel('');
                setNewColor('#6366f1');
            },
        });
    }

    function deleteTag(id: number) {
        if (!confirm(isArabic ? 'حذف الوسم؟' : 'Delete tag?')) return;
        router.delete(`/super-admin/tags/${id}`, { preserveScroll: true });
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto flex items-start justify-center">
            <div className="w-full max-w-md bg-background rounded-lg shadow-xl my-8">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-bold">{isArabic ? 'إدارة الوسوم' : 'Manage tags'}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><XCircle className="h-5 w-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                            <Label>{isArabic ? 'الاسم' : 'Label'}</Label>
                            <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>{isArabic ? 'اللون' : 'Color'}</Label>
                            <Input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-9 w-16 p-1" />
                        </div>
                        <Button onClick={createTag}>{isArabic ? 'إضافة' : 'Add'}</Button>
                    </div>

                    <div className="space-y-2">
                        {tags.length === 0 && <p className="text-sm text-muted-foreground">{isArabic ? 'لا توجد وسوم' : 'No tags'}</p>}
                        {tags.map((tag) => (
                            <div key={tag.id} className="flex items-center justify-between rounded border p-2">
                                <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium text-white" style={{ background: tag.color }}>
                                    {tag.label}
                                </span>
                                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteTag(tag.id)}>
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
