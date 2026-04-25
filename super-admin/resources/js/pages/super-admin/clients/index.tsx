import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Plus, Search, Eye, Pencil, Star, Users, Download,
    Award, Gem, Medal, Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface Tenant {
    id: number;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    template: string;
    city: string | null;
    logo: string | null;
    logo_url: string | null;
    hotel_name: string | null;
    org_name_ar: string | null;
    org_name_en: string | null;
    client_status: string;
    plan_id: number | null;
    plan_model: { id: number; name_ar: string; name_en: string } | null;
    paid_invoices_count: number;
    total_invoices_count: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    created_at: string;
}

interface Plan { id: number; name_ar: string; name_en: string; slug: string }
interface City { key: string; label_ar: string; label_en: string }

interface Stats { total: number; bronze: number; silver: number; gold: number; platinum: number }

interface Props {
    tenants: {
        data: Tenant[];
        links: { url: string | null; label: string; active: boolean }[];
        last_page: number;
        current_page: number;
        per_page: number;
        total: number;
    };
    stats: Stats;
    range: { key: string };
    filters: Record<string, string | undefined>;
    plans: Plan[];
    cities: City[];
}

const TIER_META: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string; color: string; border: string; textColor: string; labelAr: string; labelEn: string }> = {
    platinum: { icon: Gem, bg: 'bg-violet-50 dark:bg-violet-950', color: 'text-violet-600', border: 'border-violet-300', textColor: 'text-violet-800 dark:text-violet-200', labelAr: 'عملاء بلاتينيوم', labelEn: 'Platinum clients' },
    gold: { icon: Trophy, bg: 'bg-amber-50 dark:bg-amber-950', color: 'text-amber-600', border: 'border-amber-300', textColor: 'text-amber-800 dark:text-amber-200', labelAr: 'عملاء جولد', labelEn: 'Gold clients' },
    silver: { icon: Medal, bg: 'bg-slate-100 dark:bg-slate-800', color: 'text-slate-500', border: 'border-slate-300', textColor: 'text-slate-800 dark:text-slate-200', labelAr: 'عملاء سيلفر', labelEn: 'Silver clients' },
    bronze: { icon: Award, bg: 'bg-orange-50 dark:bg-orange-950', color: 'text-orange-700', border: 'border-orange-300', textColor: 'text-orange-800 dark:text-orange-200', labelAr: 'عملاء برونز', labelEn: 'Bronze clients' },
};

function tierBadge(tier: string, isAr: boolean) {
    const meta = TIER_META[tier] ?? TIER_META.bronze;
    const Icon = meta.icon;
    return (
        <Badge variant="outline" className={`${meta.border} ${meta.textColor} gap-1`}>
            <Icon className={`h-3 w-3 ${meta.color}`} />
            {(isAr ? meta.labelAr : meta.labelEn).replace(isAr ? 'عملاء ' : '', '').replace('clients', '').trim()}
        </Badge>
    );
}

function statusBadge(status: string, isAr: boolean) {
    const map: Record<string, { ar: string; en: string; cls: string }> = {
        active: { ar: 'نشط', en: 'Active', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        frozen: { ar: 'مجمد', en: 'Frozen', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
        banned: { ar: 'محظور', en: 'Banned', cls: 'bg-red-100 text-red-700 border-red-200' },
    };
    const s = map[status] ?? map.active;
    return <Badge variant="outline" className={s.cls}>{isAr ? s.ar : s.en}</Badge>;
}

export default function ClientsIndex({ tenants, stats, range, filters, plans, cities }: Props) {
    const { t, locale, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'العملاء' : 'Clients', href: '/super-admin/clients' },
    ];

    function apply(key: string, value: string | undefined) {
        router.get('/super-admin/clients', { ...filters, [key]: value || undefined }, { preserveState: true, preserveScroll: true });
    }

    function changeTier(tenantId: number, tier: string) {
        router.post(`/super-admin/clients/${tenantId}/tier`, { tier: tier === 'auto' ? null : tier }, { preserveScroll: true });
    }

    function doExport(format: 'csv' | 'excel' | 'pdf') {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
        params.append('export', format);
        window.location.href = `/super-admin/clients?${params.toString()}`;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'العملاء' : 'Clients'} />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">{isArabic ? 'العملاء' : 'Clients'}</h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isArabic
                                ? 'يتم تصنيف العملاء تلقائيًا حسب عدد الفواتير المدفوعة'
                                : 'Clients are automatically tiered by paid invoice count'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Select value={range.key} onValueChange={(v) => apply('range', v)}>
                            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">{isArabic ? 'اليوم' : 'Today'}</SelectItem>
                                <SelectItem value="this_week">{isArabic ? 'هذا الأسبوع' : 'This week'}</SelectItem>
                                <SelectItem value="this_month">{isArabic ? 'هذا الشهر' : 'This month'}</SelectItem>
                                <SelectItem value="this_year">{isArabic ? 'هذه السنة' : 'This year'}</SelectItem>
                                <SelectItem value="all">{isArabic ? 'الكل' : 'All time'}</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => doExport('csv')}><Download className="h-4 w-4" /> CSV</Button>
                            <Button variant="outline" size="sm" onClick={() => doExport('excel')}><Download className="h-4 w-4" /> Excel</Button>
                            <Button variant="outline" size="sm" onClick={() => doExport('pdf')}><Download className="h-4 w-4" /> PDF</Button>
                        </div>
                        <Button asChild>
                            <Link href="/super-admin/clients/create">
                                <Plus className="h-4 w-4" /> {isArabic ? 'إضافة عميل' : 'Add client'}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Tier cards (4) + total */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {(['platinum', 'gold', 'silver', 'bronze'] as const).map((tier) => {
                        const meta = TIER_META[tier];
                        const Icon = meta.icon;
                        const active = filters.tier === tier;
                        return (
                            <button
                                key={tier}
                                onClick={() => apply('tier', active ? undefined : tier)}
                                className={`${meta.bg} ${meta.border} border rounded-lg p-4 text-start transition hover:shadow ${active ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <Icon className={`h-6 w-6 ${meta.color}`} />
                                    <span className={`text-2xl font-bold ${meta.textColor}`}>{stats[tier].toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}</span>
                                </div>
                                <div className={`text-sm font-medium ${meta.textColor}`}>{isArabic ? meta.labelAr : meta.labelEn}</div>
                            </button>
                        );
                    })}
                    <button
                        onClick={() => apply('tier', undefined)}
                        className={`bg-indigo-50 dark:bg-indigo-950 border border-indigo-300 rounded-lg p-4 text-start transition hover:shadow ${!filters.tier ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Users className="h-6 w-6 text-indigo-600" />
                            <span className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">
                                {stats.total.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                            </span>
                        </div>
                        <div className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                            {isArabic ? 'كل العملاء' : 'All clients'}
                        </div>
                    </button>
                </div>

                {/* City chips */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => apply('city', undefined)}
                        className={`rounded-full px-4 py-1.5 text-sm border transition ${!filters.city ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                    >
                        {isArabic ? 'الكل' : 'All'}
                    </button>
                    {cities.map((c) => {
                        const active = filters.city === c.key;
                        return (
                            <button
                                key={c.key}
                                onClick={() => apply('city', c.key)}
                                className={`rounded-full px-4 py-1.5 text-sm border transition ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                            >
                                {isArabic ? c.label_ar : c.label_en}
                            </button>
                        );
                    })}
                </div>

                {/* Search + plan filter + status */}
                <Card>
                    <CardContent className="p-4">
                        <div className="grid gap-3 sm:grid-cols-4">
                            <div className="relative sm:col-span-2">
                                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={isArabic ? 'اكتب اسم العميل هنا' : 'Type client name here'}
                                    defaultValue={filters.search ?? ''}
                                    onBlur={(e) => apply('search', e.target.value)}
                                    className="ps-10"
                                />
                            </div>
                            <Select value={filters.plan_id ?? 'all'} onValueChange={(v) => apply('plan_id', v === 'all' ? undefined : v)}>
                                <SelectTrigger><SelectValue placeholder={isArabic ? 'الباقة' : 'Plan'} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'كل الباقات' : 'All plans'}</SelectItem>
                                    {plans.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>{isArabic ? p.name_ar : p.name_en}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filters.status ?? 'all'} onValueChange={(v) => apply('status', v === 'all' ? undefined : v)}>
                                <SelectTrigger><SelectValue placeholder={isArabic ? 'الحالة' : 'Status'} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'كل الحالات' : 'All statuses'}</SelectItem>
                                    <SelectItem value="active">{isArabic ? 'نشط' : 'Active'}</SelectItem>
                                    <SelectItem value="frozen">{isArabic ? 'مجمد' : 'Frozen'}</SelectItem>
                                    <SelectItem value="banned">{isArabic ? 'محظور' : 'Banned'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="py-0">
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-muted-foreground text-xs">
                                    <th className="px-3 py-3 text-start">#</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'الشعار' : 'Logo'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'اسم العميل' : 'Client'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'تاريخ التسجيل' : 'Registered'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'البريد' : 'Email'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'اسم الفندق' : 'Hotel'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'الجوال' : 'Phone'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'الطلبات' : 'Requests'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'الباقة' : 'Plan'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'التصنيف' : 'Tier'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'إجراء' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.data.length === 0 && (
                                    <tr><td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">
                                        {isArabic ? 'لا يوجد عملاء' : 'No clients found'}
                                    </td></tr>
                                )}
                                {tenants.data.map((row) => (
                                    <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-3 py-2 font-mono text-xs">#{row.id}</td>
                                        <td className="px-3 py-2">
                                            {row.logo_url ? (
                                                <img src={row.logo_url} alt="" className="h-9 w-9 rounded-full object-cover border" />
                                            ) : (
                                                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                                    {row.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 font-medium">{row.name}</td>
                                        <td className="px-3 py-2 text-xs text-muted-foreground">
                                            {new Date(row.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-3 py-2 text-xs">{row.email ?? '—'}</td>
                                        <td className="px-3 py-2 text-xs">{row.hotel_name ?? row.org_name_ar ?? '—'}</td>
                                        <td className="px-3 py-2 text-xs">{row.phone ?? '—'}</td>
                                        <td className="px-3 py-2 text-center">{row.total_invoices_count ?? 0}</td>
                                        <td className="px-3 py-2 text-xs">{row.plan_model ? (isArabic ? row.plan_model.name_ar : row.plan_model.name_en) : '—'}</td>
                                        <td className="px-3 py-2">{tierBadge(row.tier, isArabic)}</td>
                                        <td className="px-3 py-2">{statusBadge(row.client_status, isArabic)}</td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-0.5">
                                                <TierPicker tenantId={row.id} current={row.tier} onChange={changeTier} isArabic={isArabic} />
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" asChild title={isArabic ? 'عرض' : 'View'}>
                                                    <Link href={`/super-admin/clients/${row.id}`}><Eye className="h-4 w-4" /></Link>
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" asChild title={isArabic ? 'تعديل' : 'Edit'}>
                                                    <Link href={`/super-admin/tenants/${row.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{isArabic ? 'لكل صفحة:' : 'Per page:'}</span>
                        <Select value={String(tenants.per_page)} onValueChange={(v) => apply('per_page', v)}>
                            <SelectTrigger className="h-8 w-[80px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <span>{isArabic ? 'الإجمالي' : 'Total'}: {tenants.total}</span>
                    </div>
                    {tenants.last_page > 1 && (
                        <div className="flex flex-wrap justify-center gap-1">
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
            </div>
        </AppLayout>
    );
}

function TierPicker({ tenantId, current, onChange, isArabic }: { tenantId: number; current: string; onChange: (id: number, tier: string) => void; isArabic: boolean }) {
    return (
        <Select value={current} onValueChange={(v) => onChange(tenantId, v)}>
            <SelectTrigger className="h-7 w-7 border-0 p-0 bg-transparent" title={isArabic ? 'تغيير التصنيف' : 'Change tier'}>
                <Star className="h-4 w-4 text-blue-600" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="auto">{isArabic ? 'تلقائي' : 'Auto'}</SelectItem>
                <SelectItem value="platinum">{isArabic ? 'بلاتينيوم' : 'Platinum'}</SelectItem>
                <SelectItem value="gold">{isArabic ? 'جولد' : 'Gold'}</SelectItem>
                <SelectItem value="silver">{isArabic ? 'سيلفر' : 'Silver'}</SelectItem>
                <SelectItem value="bronze">{isArabic ? 'برونز' : 'Bronze'}</SelectItem>
            </SelectContent>
        </Select>
    );
}
