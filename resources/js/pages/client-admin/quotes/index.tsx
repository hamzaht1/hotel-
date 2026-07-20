import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Eye } from 'lucide-react';

interface Quote {
    id: number;
    quote_number: string;
    type: string;
    effective_status: string;
    total: string;
    issue_date: string;
    valid_until: string;
}

interface PaginatedQuotes {
    data: Quote[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

export default function ClientQuotesIndex({ quotes }: { quotes: PaginatedQuotes }) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const statusBadge = (status: string) => {
        switch (status) {
            case 'accepted':
                return <Badge className="rounded-full bg-green-100 text-green-700 hover:bg-green-100">{t('accepted', 'Accepted')}</Badge>;
            case 'sent':
                return <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100">{t('quote_sent', 'Awaiting response')}</Badge>;
            case 'refused':
                return <Badge className="rounded-full bg-red-100 text-red-700 hover:bg-red-100">{t('refused', 'Refused')}</Badge>;
            case 'expired':
                return <Badge className="rounded-full bg-gray-100 text-gray-600 hover:bg-gray-100">{t('expired', 'Expired')}</Badge>;
            default:
                return <Badge className="rounded-full bg-gray-100 text-gray-500 hover:bg-gray-100">{status}</Badge>;
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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard', 'Dashboard'), href: '/client-admin' },
        { title: t('quotes', 'Quotes'), href: '/client-admin/quotes' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('quotes', 'Quotes')} />
            <div className="p-6">
                <h1 className="mb-6 text-2xl font-bold">{t('my_quotes', 'My Quotes')}</h1>

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

                    <Card className="py-0">
                        <CardContent className="overflow-x-auto p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50 text-muted-foreground">
                                        <th className="px-4 py-3 text-start font-medium">{t('quote_number', 'Quote #')}</th>
                                        <th className="px-4 py-3 text-start font-medium">{t('type', 'Type')}</th>
                                        <th className="px-4 py-3 text-start font-medium">{t('total', 'Total')}</th>
                                        <th className="px-4 py-3 text-start font-medium">{t('status', 'Status')}</th>
                                        <th className="px-4 py-3 text-start font-medium">{t('issue_date', 'Issue Date')}</th>
                                        <th className="px-4 py-3 text-start font-medium">{t('valid_until', 'Valid Until')}</th>
                                        <th className="px-4 py-3 text-start font-medium">{t('actions', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotes.data.map((quote) => (
                                        <tr key={quote.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">
                                                <Link href={`/client-admin/quotes/${quote.id}`} className="text-[#7367f0] hover:underline">
                                                    {quote.quote_number}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">{typeBadge(quote.type)}</td>
                                            <td className="px-4 py-3 font-medium">{Number(quote.total).toLocaleString()} SAR</td>
                                            <td className="px-4 py-3">{statusBadge(quote.effective_status)}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{quote.issue_date}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{quote.valid_until}</td>
                                            <td className="px-4 py-3">
                                                <Button variant="ghost" size="icon" asChild title={t('view', 'View')}>
                                                    <Link href={`/client-admin/quotes/${quote.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {quotes.data.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                                {t('no_quotes_found', 'No quotes found')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

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
            </div>
        </AppLayout>
    );
}
