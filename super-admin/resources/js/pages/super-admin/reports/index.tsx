import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Plus, Download, Pencil, Search, Users, CreditCard, TrendingUp,
    Printer, Settings2, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';
import { useState, useEffect } from 'react';

type Tab = 'clients' | 'invoices' | 'requests';

interface KPIs {
    total_clients: number;
    active_subscriptions: number;
    total_revenue: number;
}

interface Column { key: string; label_ar: string; label_en: string }

interface Paginated<T = Record<string, unknown>> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
    current_page: number;
    per_page: number;
    total: number;
}

interface Plan { id: number; slug: string; name_ar: string; name_en: string }

interface Props {
    tab: Tab;
    kpis: KPIs;
    rows: Paginated;
    available_columns: Column[];
    filters: Record<string, string | undefined>;
    plans: Plan[];
}

function statusBadge(status: string | null | undefined, isAr: boolean) {
    if (!status) return <span className="text-muted-foreground">—</span>;
    const map: Record<string, { ar: string; en: string; cls: string }> = {
        active: { ar: 'نشط', en: 'Active', cls: 'bg-violet-100 text-violet-700 border-violet-200' },
        frozen: { ar: 'معلق', en: 'Frozen', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
        banned: { ar: 'محظور', en: 'Banned', cls: 'bg-red-100 text-red-700 border-red-200' },
        paid: { ar: 'مدفوعة', en: 'Paid', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        sent: { ar: 'مرسلة', en: 'Sent', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
        draft: { ar: 'مسودة', en: 'Draft', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
        overdue: { ar: 'متأخر', en: 'Overdue', cls: 'bg-red-100 text-red-700 border-red-200' },
        cancelled: { ar: 'ملغاة', en: 'Cancelled', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
    };
    const s = map[status] ?? { ar: status, en: status, cls: 'bg-gray-100 text-gray-700 border-gray-200' };
    return <Badge variant="outline" className={s.cls}>{isAr ? s.ar : s.en}</Badge>;
}

function paymentBadge(status: string | null | undefined, isAr: boolean) {
    if (!status) return <span className="text-muted-foreground">—</span>;
    const map: Record<string, { ar: string; en: string; cls: string }> = {
        approved: { ar: 'مقبول', en: 'Accepted', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        rejected: { ar: 'مرفوض', en: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-200' },
        pending: { ar: 'معلق', en: 'Pending', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    };
    const s = map[status] ?? { ar: status, en: status, cls: 'bg-gray-100 text-gray-700 border-gray-200' };
    return <Badge variant="outline" className={s.cls}>{isAr ? s.ar : s.en}</Badge>;
}

const PLAN_COLORS: Record<string, string> = {
    aziz: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    premium: 'bg-violet-100 text-violet-700 border-violet-200',
    starter: 'bg-orange-100 text-orange-700 border-orange-200',
    basic: 'bg-blue-100 text-blue-700 border-blue-200',
};

function planBadge(slug: string | null, label: string | null) {
    if (!label) return <span className="text-muted-foreground">—</span>;
    const cls = PLAN_COLORS[slug ?? ''] ?? 'bg-slate-100 text-slate-700 border-slate-200';
    return <Badge variant="outline" className={cls}>{label}</Badge>;
}

export default function ReportsIndex({ tab, kpis, rows, available_columns, filters, plans }: Props) {
    const { t, locale, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const numLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'التقارير' : 'Reports', href: '/super-admin/reports' },
    ];

    // Column preferences persisted per tab in localStorage
    const storageKey = `reports-cols-${tab}`;
    const [visibleCols, setVisibleCols] = useState<string[]>(() => {
        if (typeof window === 'undefined') return available_columns.map((c) => c.key);
        const stored = window.localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : available_columns.map((c) => c.key);
    });

    useEffect(() => {
        window.localStorage.setItem(storageKey, JSON.stringify(visibleCols));
    }, [visibleCols, storageKey]);

    function toggleCol(key: string) {
        setVisibleCols((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
    }

    function apply(key: string, value: string | undefined) {
        router.get('/super-admin/reports', { ...filters, tab, [key]: value || undefined }, { preserveState: true, preserveScroll: true });
    }

    function switchTab(newTab: Tab) {
        router.get('/super-admin/reports', { tab: newTab }, { preserveState: true });
    }

    function doExport(format: 'csv' | 'excel' | 'pdf') {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
        params.append('tab', tab);
        params.append('export', format);
        window.location.href = `/super-admin/reports?${params.toString()}`;
    }

    function renderCell(row: Record<string, unknown>, col: Column): React.ReactNode {
        const key = col.key;
        if (key === 'plan_name') {
            const plan = (row.plan_model || row.tenant?.['plan_model']) as { slug?: string; name_ar?: string; name_en?: string } | null;
            const tenantPlan = (row.tenant as Record<string, unknown> | null)?.['plan_model'] as { slug?: string; name_ar?: string; name_en?: string } | null;
            const p = plan ?? tenantPlan;
            if (!p) return <span className="text-muted-foreground">—</span>;
            return planBadge(p.slug ?? null, isArabic ? (p.name_ar ?? '') : (p.name_en ?? ''));
        }
        if (key === 'client_name') {
            const tenantName = (row.tenant as Record<string, unknown> | null)?.['name'];
            return (tenantName as string) || (row.external_client_name as string) || '—';
        }
        if (key === 'status' || key === 'client_status') {
            return statusBadge(row[key] as string, isArabic);
        }
        if (key === 'payment_status') {
            return paymentBadge(row[key] as string, isArabic);
        }
        if (key === 'total' || key === 'total_paid') {
            const v = Number(row[key] ?? 0);
            return `${v.toLocaleString(numLocale, { maximumFractionDigits: 2 })} ${isArabic ? 'ر.س' : 'SAR'}`;
        }
        if (key === 'created_at' || key === 'issue_date' || key === 'due_date') {
            const v = row[key] as string | null;
            if (!v) return '—';
            return new Date(v).toLocaleDateString(numLocale, { day: 'numeric', month: 'short', year: 'numeric' });
        }
        if (key === 'id' || key === 'invoice_number') {
            return <span className="font-mono text-xs">{row[key] as string | number}</span>;
        }
        const val = row[key];
        return val !== null && val !== undefined && val !== '' ? String(val) : <span className="text-muted-foreground">—</span>;
    }

    function editHref(row: Record<string, unknown>): string {
        if (tab === 'invoices') return `/super-admin/invoices/${row.id}/edit`;
        return `/super-admin/tenants/${row.id}/edit`;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'التقارير' : 'Reports'} />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold">{isArabic ? 'التقارير' : 'Reports'}</h1>
                    <div className="flex gap-2">
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                            <Link href="/super-admin/invoices/create"><Plus className="h-4 w-4" /> {isArabic ? 'إضافة فاتورة' : 'Add invoice'}</Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="bg-emerald-600 hover:bg-emerald-700"><Download className="h-4 w-4" /> {isArabic ? 'التصدير' : 'Export'}</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => doExport('pdf')}><FileText className="h-4 w-4 me-2" /> PDF</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => doExport('excel')}><Download className="h-4 w-4 me-2" /> Excel</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => doExport('csv')}><Download className="h-4 w-4 me-2" /> CSV</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.print()}><Printer className="h-4 w-4 me-2" /> {isArabic ? 'طباعة' : 'Print'}</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* 3 KPI cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <KpiCard icon={Users} label={isArabic ? 'إجمالي العملاء' : 'Total clients'} value={kpis.total_clients} numLocale={numLocale} />
                    <KpiCard icon={CreditCard} label={isArabic ? 'إجمالي الاشتراكات الفعّالة' : 'Active subscriptions'} value={kpis.active_subscriptions} numLocale={numLocale} />
                    <KpiCard icon={TrendingUp} label={isArabic ? 'إجمالي الإيرادات' : 'Total revenue'} value={kpis.total_revenue} numLocale={numLocale} isCurrency isAr={isArabic} />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b">
                    {(['requests', 'invoices', 'clients'] as Tab[]).map((tb) => (
                        <button
                            key={tb}
                            onClick={() => switchTab(tb)}
                            className={`px-6 py-2.5 text-sm font-medium -mb-px border-b-2 ${
                                tab === tb
                                    ? 'border-primary text-primary bg-primary/5'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tb === 'requests' ? (isArabic ? 'الطلبات' : 'Requests') : tb === 'invoices' ? (isArabic ? 'الفواتير' : 'Invoices') : (isArabic ? 'العملاء' : 'Clients')}
                        </button>
                    ))}
                </div>

                {/* Filters + column selector — aligned single row */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[240px]">
                                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={isArabic ? 'بحث...' : 'Search...'}
                                    defaultValue={filters.search ?? ''}
                                    onBlur={(e) => apply('search', e.target.value)}
                                    className="ps-10 h-10"
                                />
                            </div>

                            {/* Status */}
                            {tab !== 'invoices' && (
                                <Select value={filters.status ?? 'all'} onValueChange={(v) => apply('status', v === 'all' ? undefined : v)}>
                                    <SelectTrigger className="h-10 w-[170px]"><SelectValue placeholder={isArabic ? 'الحالة' : 'Status'} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{isArabic ? 'كل الحالات' : 'All statuses'}</SelectItem>
                                        <SelectItem value="active">{isArabic ? 'نشط' : 'Active'}</SelectItem>
                                        <SelectItem value="frozen">{isArabic ? 'معلق' : 'Frozen'}</SelectItem>
                                        <SelectItem value="banned">{isArabic ? 'محظور' : 'Banned'}</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                            {tab === 'invoices' && (
                                <Select value={filters.status ?? 'all'} onValueChange={(v) => apply('status', v === 'all' ? undefined : v)}>
                                    <SelectTrigger className="h-10 w-[170px]"><SelectValue placeholder={isArabic ? 'الحالة' : 'Status'} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{isArabic ? 'كل الحالات' : 'All statuses'}</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="sent">Sent</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Plan (not on invoices tab) */}
                            {tab !== 'invoices' && (
                                <Select value={filters.plan_id ?? 'all'} onValueChange={(v) => apply('plan_id', v === 'all' ? undefined : v)}>
                                    <SelectTrigger className="h-10 w-[170px]"><SelectValue placeholder={isArabic ? 'الباقة' : 'Plan'} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{isArabic ? 'كل الباقات' : 'All plans'}</SelectItem>
                                        {plans.map((p) => <SelectItem key={p.id} value={String(p.id)}>{isArabic ? p.name_ar : p.name_en}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* From date (inline label) */}
                            <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap m-0">{isArabic ? 'من' : 'From'}</Label>
                                <Input
                                    type="date"
                                    defaultValue={filters.date_from ?? ''}
                                    onChange={(e) => apply('date_from', e.target.value)}
                                    className="h-10 w-[150px]"
                                />
                            </div>

                            {/* To date (inline label) */}
                            <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap m-0">{isArabic ? 'إلى' : 'To'}</Label>
                                <Input
                                    type="date"
                                    defaultValue={filters.date_to ?? ''}
                                    onChange={(e) => apply('date_to', e.target.value)}
                                    className="h-10 w-[150px]"
                                />
                            </div>

                            {/* Columns button pushed to the end of the row */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-10 ms-auto"><Settings2 className="h-4 w-4" /> {isArabic ? 'الأعمدة' : 'Columns'}</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 max-h-[300px] overflow-y-auto">
                                    <DropdownMenuLabel>{isArabic ? 'الأعمدة المعروضة' : 'Visible columns'}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {available_columns.map((col) => (
                                        <DropdownMenuCheckboxItem
                                            key={col.key}
                                            checked={visibleCols.includes(col.key)}
                                            onCheckedChange={() => toggleCol(col.key)}
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            {isArabic ? col.label_ar : col.label_en}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="py-0">
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-muted-foreground text-xs">
                                    {available_columns.filter((c) => visibleCols.includes(c.key)).map((col) => (
                                        <th key={col.key} className="px-3 py-3 text-start">{isArabic ? col.label_ar : col.label_en}</th>
                                    ))}
                                    <th className="px-3 py-3 text-start">{isArabic ? 'إجراء' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.data.length === 0 && (
                                    <tr><td colSpan={visibleCols.length + 1} className="px-4 py-10 text-center text-muted-foreground">{isArabic ? 'لا توجد بيانات' : 'No data'}</td></tr>
                                )}
                                {rows.data.map((row) => (
                                    <tr key={row.id as number} className="border-b last:border-0 hover:bg-muted/30">
                                        {available_columns.filter((c) => visibleCols.includes(c.key)).map((col) => (
                                            <td key={col.key} className="px-3 py-2">
                                                {renderCell(row, col)}
                                            </td>
                                        ))}
                                        <td className="px-3 py-2">
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={editHref(row)}><Pencil className="h-3 w-3" /> {isArabic ? 'تعديل' : 'Edit'}</Link>
                                            </Button>
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
                        <Select value={String(rows.per_page)} onValueChange={(v) => apply('per_page', v)}>
                            <SelectTrigger className="h-8 w-[80px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <span>{isArabic ? 'الإجمالي' : 'Total'}: {rows.total}</span>
                    </div>
                    {rows.last_page > 1 && (
                        <div className="flex flex-wrap justify-center gap-1">
                            {rows.links.map((link, i) => (
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

function KpiCard({ icon: Icon, label, value, numLocale, isCurrency = false, isAr = false }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    numLocale: string;
    isCurrency?: boolean;
    isAr?: boolean;
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-3 p-5">
                <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950">
                    <Icon className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                    <div className="text-2xl font-bold">
                        {value.toLocaleString(numLocale, { maximumFractionDigits: isCurrency ? 0 : undefined })}
                        {isCurrency && ` ${isAr ? 'ر.س' : 'SAR'}`}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
