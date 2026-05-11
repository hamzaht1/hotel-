import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Eye, FileDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface Quote {
    id: number;
    tenant_id: number | null;
    quote_number: string;
    type: string;
    status: string;
    amount: string;
    tax_rate: string;
    tax_amount: string;
    discount: string;
    total: string;
    issue_date: string;
    valid_until: string;
    accepted_at: string | null;
    payment_method: string | null;
    notes_ar: string | null;
    notes_en: string | null;
    external_client_name?: string | null;
    external_client_email?: string | null;
    tenant?: { id: number; name: string; email: string };
    created_at: string;
}

interface PaginatedData {
    data: Quote[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

interface Props {
    quotes: PaginatedData;
    stats: {
        total_quotes: number;
        total_accepted: number;
        total_pending: number;
        total_expired: number;
    };
    filters: { search?: string; status?: string };
}

export default function QuotesIndex({ quotes, stats, filters }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: t('quotes', 'Quotes'), href: '/super-admin/quotes' },
    ];

    function handleSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get('/super-admin/quotes', {
            search: formData.get('search') as string,
            status: filters.status,
        }, { preserveState: true });
    }

    const statusBadge = (status: string) => {
        switch (status) {
            case 'accepted':
                return <Badge className="rounded-full bg-green-100 text-green-700 hover:bg-green-100">{t('accepted', 'Accepted')}</Badge>;
            case 'sent':
                return <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100">{t('sent', 'Sent')}</Badge>;
            case 'refused':
                return <Badge className="rounded-full bg-red-100 text-red-700 hover:bg-red-100">{t('refused', 'Refused')}</Badge>;
            case 'expired':
                return <Badge className="rounded-full bg-red-50 text-red-600 hover:bg-red-50">{t('expired', 'Expired')}</Badge>;
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
            <Head title={t('quotes', 'Quotes')} />
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
                            <p className="text-sm text-muted-foreground">{t('total_quotes', 'Total Quotes')}</p>
                            <p className="mt-1 text-2xl font-bold">{stats.total_quotes}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">{t('accepted', 'Accepted')} (SAR)</p>
                            <p className="mt-1 text-2xl font-bold text-green-600">{Number(stats.total_accepted).toLocaleString()}</p>
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
                            <p className="text-sm text-muted-foreground">{t('expired', 'Expired')} (SAR)</p>
                            <p className="mt-1 text-2xl font-bold text-red-600">{Number(stats.total_expired).toLocaleString()}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold">{t('quotes', 'Quotes')}</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <a
                                href={`/super-admin/quotes/export.csv?${new URLSearchParams(
                                    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '') as [string, string][]
                                ).toString()}`}
                            >
                                <Download className="h-4 w-4" />
                                {t('export_csv', 'Export CSV')}
                            </a>
                        </Button>
                        <Button asChild>
                            <Link href="/super-admin/quotes/create">
                                <Plus className="h-4 w-4" />
                                {t('create_quote', 'Create Quote')}
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
                            placeholder={t('search_quotes', 'Search quotes...')}
                            defaultValue={filters.search || ''}
                            className="vuexy-input"
                        />
                    </form>
                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) =>
                            router.get('/super-admin/quotes', { ...filters, status: value === 'all' ? undefined : value }, { preserveState: true })
                        }
                    >
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder={t('all_status', 'All Status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all_status', 'All Status')}</SelectItem>
                            <SelectItem value="draft">{t('draft', 'Draft')}</SelectItem>
                            <SelectItem value="sent">{t('sent', 'Sent')}</SelectItem>
                            <SelectItem value="accepted">{t('accepted', 'Accepted')}</SelectItem>
                            <SelectItem value="refused">{t('refused', 'Refused')}</SelectItem>
                            <SelectItem value="expired">{t('expired', 'Expired')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card className="py-0">
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-muted-foreground">
                                    <th className="px-4 py-3 text-start font-medium">{t('quote_number', 'Quote #')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('client', 'Client')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('type', 'Type')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('amount', 'Amount')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('status', 'Status')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('issue_date', 'Issue Date')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('valid_until', 'Valid Until')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotes.data.map((quote) => (
                                    <tr key={quote.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{quote.quote_number}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{quote.tenant?.name || quote.external_client_name || '—'}</div>
                                            <div className="text-xs text-muted-foreground">{quote.tenant?.email || quote.external_client_email}</div>
                                        </td>
                                        <td className="px-4 py-3">{typeBadge(quote.type)}</td>
                                        <td className="px-4 py-3 font-medium">{Number(quote.total).toLocaleString()} SAR</td>
                                        <td className="px-4 py-3">{statusBadge(quote.status)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{quote.issue_date}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{quote.valid_until}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/super-admin/quotes/${quote.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/super-admin/quotes/${quote.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" asChild>
                                                    <a href={`/super-admin/quotes/${quote.id}/pdf`} target="_blank" rel="noreferrer">
                                                        <FileDown className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {quotes.data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                            {t('no_quotes_found', 'No quotes found')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {quotes.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {quotes.links.map((link, i) => (
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
