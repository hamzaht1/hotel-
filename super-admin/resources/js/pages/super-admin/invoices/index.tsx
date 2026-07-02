import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Eye, FileDown, Download, FileCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface Invoice {
    id: number;
    tenant_id: number;
    invoice_number: string;
    type: string;
    status: string;
    amount: string;
    tax_rate: string;
    tax_amount: string;
    discount: string;
    total: string;
    issue_date: string;
    due_date: string;
    paid_at: string | null;
    payment_method: string | null;
    notes_ar: string | null;
    notes_en: string | null;
    items: { id?: number; description_ar: string; description_en: string; quantity: number; unit_price: number; total: number }[];
    tenant?: { id: number; name: string; email: string; phone?: string; org_name_ar?: string; org_name_en?: string };
    created_at: string;
}

interface PaginatedData {
    data: Invoice[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

interface Props {
    invoices: PaginatedData;
    stats: {
        total_invoices: number;
        total_paid: number;
        total_pending: number;
        total_overdue: number;
    };
    filters: { search?: string; status?: string };
}

const PAYMENT_METHOD_LABELS: Record<string, { ar: string; en: string }> = {
    bank_transfer: { ar: 'تحويل بنكي', en: 'Bank transfer' },
    moyasar: { ar: 'ميسر', en: 'Moyasar' },
    tap: { ar: 'تاب', en: 'Tap' },
    credit_card: { ar: 'بطاقة ائتمان', en: 'Credit card' },
    mada: { ar: 'مدى', en: 'Mada' },
    apple_pay: { ar: 'Apple Pay', en: 'Apple Pay' },
    manual: { ar: 'يدوي', en: 'Manual' },
};

function paymentMethodLabel(method: string | null, isArabic: boolean): string {
    if (!method) return '—';
    const m = PAYMENT_METHOD_LABELS[method];
    return m ? (isArabic ? m.ar : m.en) : method;
}

export default function InvoicesIndex({ invoices, stats, filters }: Props) {
    const { t, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: t('invoices', 'Invoices'), href: '/super-admin/invoices' },
    ];

    function handleSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get('/super-admin/invoices', {
            search: formData.get('search') as string,
            status: filters.status,
        }, { preserveState: true });
    }

    const statusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="rounded-full bg-green-100 text-green-700 hover:bg-green-100">{t('paid', 'Paid')}</Badge>;
            case 'sent':
                return <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100">{t('sent', 'Sent')}</Badge>;
            case 'overdue':
                return <Badge className="rounded-full bg-red-100 text-red-700 hover:bg-red-100">{t('overdue', 'Overdue')}</Badge>;
            case 'cancelled':
                return <Badge className="rounded-full bg-gray-100 text-gray-700 hover:bg-gray-100">{t('cancelled', 'Cancelled')}</Badge>;
            default:
                return <Badge className="rounded-full bg-gray-100 text-gray-500 hover:bg-gray-100">{t('draft', 'Draft')}</Badge>;
        }
    };

    const typeBadge = (type: string) => {
        const colors: Record<string, string> = {
            subscription: 'bg-blue-100 text-blue-700',
            setup: 'bg-purple-100 text-purple-700',
            addon: 'bg-indigo-100 text-indigo-700',
        };
        return <Badge className={`rounded-full ${colors[type] || 'bg-gray-100 text-gray-700'} hover:bg-transparent`}>{type}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('invoices', 'Invoices')} />
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

                {/* Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">{t('total_invoices', 'Total Invoices')}</p>
                            <p className="mt-1 text-2xl font-bold">{stats.total_invoices}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">{t('paid', 'Paid')} (SAR)</p>
                            <p className="mt-1 text-2xl font-bold text-green-600">{Number(stats.total_paid).toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">{t('pending', 'Pending')} (SAR)</p>
                            <p className="mt-1 text-2xl font-bold text-amber-600">{Number(stats.total_pending).toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">{t('overdue', 'Overdue')} (SAR)</p>
                            <p className="mt-1 text-2xl font-bold text-red-600">{Number(stats.total_overdue).toLocaleString()}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold">{t('invoices', 'Invoices')}</h1>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/super-admin/invoice-templates">
                                <FileCog className="h-4 w-4" />
                                {t('manage_templates', 'Manage templates')}
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <a
                                href={`/super-admin/invoices/export.csv?${new URLSearchParams(
                                    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '') as [string, string][]
                                ).toString()}`}
                            >
                                <Download className="h-4 w-4" />
                                {t('export_csv', 'Export CSV')}
                            </a>
                        </Button>
                        <Button asChild>
                            <Link href="/super-admin/invoices/create">
                                <Plus className="h-4 w-4" />
                                {t('create_invoice', 'Create Invoice')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <form onSubmit={handleSearch} className="flex-1">
                        <Input
                            name="search"
                            type="text"
                            placeholder={t('search_invoices', 'Search invoices...')}
                            defaultValue={filters.search || ''}
                            className="vuexy-input"
                        />
                    </form>
                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) =>
                            router.get('/super-admin/invoices', { ...filters, status: value === 'all' ? undefined : value }, { preserveState: true })
                        }
                    >
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder={t('all_status', 'All Status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all_status', 'All Status')}</SelectItem>
                            <SelectItem value="draft">{t('draft', 'Draft')}</SelectItem>
                            <SelectItem value="sent">{t('sent', 'Sent')}</SelectItem>
                            <SelectItem value="paid">{t('paid', 'Paid')}</SelectItem>
                            <SelectItem value="overdue">{t('overdue', 'Overdue')}</SelectItem>
                            <SelectItem value="cancelled">{t('cancelled', 'Cancelled')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card className="py-0">
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-muted-foreground">
                                    <th className="px-4 py-3 text-start font-medium">{t('invoice_number', 'Invoice #')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('tenant', 'Tenant')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('type', 'Type')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('amount', 'Amount')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('status', 'Status')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('payment_method', 'Payment method')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('issue_date', 'Issue Date')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('due_date', 'Due Date')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.data.map((invoice) => (
                                    <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{invoice.invoice_number}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{invoice.tenant?.name || '—'}</div>
                                            <div className="text-xs text-muted-foreground">{invoice.tenant?.email}</div>
                                        </td>
                                        <td className="px-4 py-3">{typeBadge(invoice.type)}</td>
                                        <td className="px-4 py-3 font-medium">{Number(invoice.total).toLocaleString()} SAR</td>
                                        <td className="px-4 py-3">{statusBadge(invoice.status)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{paymentMethodLabel(invoice.payment_method, isArabic)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{invoice.issue_date}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{invoice.due_date}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/super-admin/invoices/${invoice.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/super-admin/invoices/${invoice.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" asChild>
                                                    <a href={`/super-admin/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
                                                        <FileDown className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.data.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                                            {t('no_invoices_found', 'No invoices found')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {invoices.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {invoices.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'ghost'}
                                size="sm"
                                disabled={!link.url}
                                asChild={!!link.url}
                                className={!link.url ? 'cursor-not-allowed opacity-50' : ''}
                            >
                                {link.url ? (
                                    <Link href={link.url} preserveState dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                )}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
