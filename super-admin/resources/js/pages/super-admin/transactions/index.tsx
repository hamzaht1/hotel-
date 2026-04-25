import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Search, Download, Eye, Trash2, Pause, CreditCard, XCircle,
    Clock, Wallet, Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface Transaction {
    id: number;
    invoice_number: string;
    status: string;
    derived_status: 'successful' | 'pending' | 'failed' | 'refunded';
    has_commission: boolean;
    client_name: string;
    plan_name: string;
    issue_date: string;
    payment_method: string | null;
    total: string;
    tenant: { id: number; name: string } | null;
}

interface Stats {
    successful: number;
    failed: number;
    pending: number;
    refunded: number;
    total_revenue: number;
    total_commission: number;
    net_profit: number;
}

interface Plan { id: number; slug: string; name_ar: string; name_en: string }

interface Props {
    transactions: {
        data: Transaction[];
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
}

function statusBadge(status: string, isAr: boolean) {
    const map: Record<string, { ar: string; en: string; cls: string }> = {
        successful: { ar: 'ناجحة', en: 'Successful', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        pending: { ar: 'معلقة', en: 'Pending', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
        failed: { ar: 'فاشلة', en: 'Failed', cls: 'bg-red-100 text-red-700 border-red-200' },
        refunded: { ar: 'تم استرجاعها', en: 'Refunded', cls: 'bg-violet-100 text-violet-700 border-violet-200' },
    };
    const s = map[status] ?? map.pending;
    return <Badge variant="outline" className={s.cls}>{isAr ? s.ar : s.en}</Badge>;
}

export default function TransactionsIndex({ transactions, stats, range, filters, plans }: Props) {
    const { t, locale, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const numLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'المالية' : 'Finance', href: '#' },
        { title: isArabic ? 'العمليات' : 'Operations', href: '/super-admin/transactions' },
    ];

    function apply(key: string, value: string | undefined) {
        router.get('/super-admin/transactions', { ...filters, [key]: value || undefined }, { preserveState: true, preserveScroll: true });
    }

    function doExport(format: 'csv' | 'excel' | 'pdf') {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
        params.append('export', format);
        window.location.href = `/super-admin/transactions?${params.toString()}`;
    }

    function pauseOp(id: number) {
        router.post(`/super-admin/transactions/${id}/pause`, {}, { preserveScroll: true });
    }

    function deleteOp(id: number) {
        if (!confirm(isArabic ? 'حذف العملية؟' : 'Delete operation?')) return;
        router.delete(`/super-admin/transactions/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'العمليات' : 'Operations'} />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold">{isArabic ? 'العمليات' : 'Operations'}</h1>
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
                        <Button variant="outline" size="sm" onClick={() => doExport('pdf')}><Download className="h-4 w-4" /> PDF</Button>
                        <Button variant="outline" size="sm" onClick={() => doExport('excel')}><Download className="h-4 w-4" /> Excel</Button>
                    </div>
                </div>

                {/* 5 KPI cards */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <Card><CardContent className="p-4 flex items-center gap-3">
                        <div className="rounded-lg p-2.5 bg-emerald-50 dark:bg-emerald-950"><CreditCard className="h-5 w-5 text-emerald-600" /></div>
                        <div><div className="text-xs text-muted-foreground">{isArabic ? 'العمليات الناجحة' : 'Successful'}</div><div className="text-2xl font-bold">{stats.successful.toLocaleString(numLocale)}</div></div>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 flex items-center gap-3">
                        <div className="rounded-lg p-2.5 bg-red-50 dark:bg-red-950"><XCircle className="h-5 w-5 text-red-600" /></div>
                        <div><div className="text-xs text-muted-foreground">{isArabic ? 'العمليات الفاشلة' : 'Failed'}</div><div className="text-2xl font-bold">{stats.failed.toLocaleString(numLocale)}</div></div>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 flex items-center gap-3">
                        <div className="rounded-lg p-2.5 bg-amber-50 dark:bg-amber-950"><Clock className="h-5 w-5 text-amber-600" /></div>
                        <div><div className="text-xs text-muted-foreground">{isArabic ? 'العمليات المعلقة' : 'Pending'}</div><div className="text-2xl font-bold">{stats.pending.toLocaleString(numLocale)}</div></div>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 flex items-center gap-3">
                        <div className="rounded-lg p-2.5 bg-blue-50 dark:bg-blue-950"><Wallet className="h-5 w-5 text-blue-600" /></div>
                        <div><div className="text-xs text-muted-foreground">{isArabic ? 'إجمالي الإيرادات' : 'Total revenue'}</div><div className="text-2xl font-bold">{stats.total_revenue.toLocaleString(numLocale, { maximumFractionDigits: 0 })} {isArabic ? 'ر.س' : 'SAR'}</div></div>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 flex items-center gap-3">
                        <div className="rounded-lg p-2.5 bg-emerald-50 dark:bg-emerald-950"><Banknote className="h-5 w-5 text-emerald-700" /></div>
                        <div><div className="text-xs text-muted-foreground">{isArabic ? 'صافي الربح' : 'Net profit'}</div><div className="text-2xl font-bold">{stats.net_profit.toLocaleString(numLocale, { maximumFractionDigits: 0 })} {isArabic ? 'ر.س' : 'SAR'}</div></div>
                    </CardContent></Card>
                </div>

                {/* Status chips */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: undefined, ar: 'الكل', en: 'All' },
                        { key: 'successful', ar: 'الناجحة', en: 'Successful' },
                        { key: 'pending', ar: 'المعلقة', en: 'Pending' },
                        { key: 'failed', ar: 'الفاشلة', en: 'Failed' },
                        { key: 'refunded', ar: 'المرجعة', en: 'Refunded' },
                    ].map((chip) => {
                        const active = filters.status === chip.key || (!filters.status && !chip.key);
                        return (
                            <button
                                key={chip.key ?? 'all'}
                                onClick={() => apply('status', chip.key)}
                                className={`rounded-full px-4 py-1.5 text-sm border transition ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                            >
                                {isArabic ? chip.ar : chip.en}
                            </button>
                        );
                    })}
                </div>

                {/* Search + plan + method */}
                <Card>
                    <CardContent className="p-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="relative">
                                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={isArabic ? 'أكتب رقم العملية هنا' : 'Enter operation number'}
                                    defaultValue={filters.search ?? ''}
                                    onBlur={(e) => apply('search', e.target.value)}
                                    className="ps-10"
                                />
                            </div>
                            <Select value={filters.plan_id ?? 'all'} onValueChange={(v) => apply('plan_id', v === 'all' ? undefined : v)}>
                                <SelectTrigger><SelectValue placeholder={isArabic ? 'كل الباقات' : 'All plans'} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'كل الباقات' : 'All plans'}</SelectItem>
                                    {plans.map((p) => <SelectItem key={p.id} value={String(p.id)}>{isArabic ? p.name_ar : p.name_en}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filters.payment_method ?? 'all'} onValueChange={(v) => apply('payment_method', v === 'all' ? undefined : v)}>
                                <SelectTrigger><SelectValue placeholder={isArabic ? 'كل طرق الدفع' : 'All methods'} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'كل طرق الدفع' : 'All methods'}</SelectItem>
                                    <SelectItem value="tap">Tap</SelectItem>
                                    <SelectItem value="credit_card">Credit Card</SelectItem>
                                    <SelectItem value="mada">مدى</SelectItem>
                                    <SelectItem value="apple_pay">Apple Pay</SelectItem>
                                    <SelectItem value="bank_transfer">{isArabic ? 'تحويل بنكي' : 'Bank transfer'}</SelectItem>
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
                                    <th className="px-3 py-3 text-start">{isArabic ? 'العملية' : 'Operation'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'الباقة' : 'Plan'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'التاريخ' : 'Date'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'اسم العميل' : 'Client'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'حالة الدفع' : 'Status'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'عمولة' : 'Commission'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'وسيلة الدفع' : 'Method'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'المبلغ' : 'Amount'}</th>
                                    <th className="px-3 py-3 text-start">{isArabic ? 'إجراء' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.data.length === 0 && (
                                    <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">{isArabic ? 'لا توجد عمليات' : 'No operations'}</td></tr>
                                )}
                                {transactions.data.map((tx) => (
                                    <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-3 py-2">
                                            <Link href={`/super-admin/invoices/${tx.id}`} className="font-mono text-xs text-blue-600 hover:underline">
                                                #{tx.invoice_number}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-2 text-xs">{tx.plan_name}</td>
                                        <td className="px-3 py-2 text-xs text-muted-foreground">
                                            {new Date(tx.issue_date).toLocaleDateString(numLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-3 py-2 font-medium">{tx.client_name}</td>
                                        <td className="px-3 py-2">{statusBadge(tx.derived_status, isArabic)}</td>
                                        <td className="px-3 py-2 text-xs">{tx.has_commission ? (isArabic ? 'نعم' : 'Yes') : (isArabic ? 'لا' : 'No')}</td>
                                        <td className="px-3 py-2 text-xs">{tx.payment_method ?? '—'}</td>
                                        <td className="px-3 py-2 font-medium">{Number(tx.total).toLocaleString(numLocale)} {isArabic ? 'ر.س' : 'SAR'}</td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-0.5">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" asChild title={isArabic ? 'عرض' : 'View'}>
                                                    <Link href={`/super-admin/invoices/${tx.id}`}><Eye className="h-4 w-4" /></Link>
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" asChild title={isArabic ? 'تحميل' : 'Download'}>
                                                    <a href={`/super-admin/transactions/${tx.id}/receipt`}><Download className="h-4 w-4" /></a>
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => pauseOp(tx.id)} title={isArabic ? 'إيقاف' : 'Pause'}>
                                                    <Pause className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => deleteOp(tx.id)} title={isArabic ? 'حذف' : 'Delete'}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {transactions.last_page > 1 && (
                    <div className="flex justify-center gap-1 flex-wrap">
                        {transactions.links.map((link, i) => (
                            <Button key={i} variant={link.active ? 'default' : 'ghost'} size="sm" disabled={!link.url} asChild={!!link.url}>
                                {link.url
                                    ? <Link href={link.url} preserveState dangerouslySetInnerHTML={{ __html: link.label }} />
                                    : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
