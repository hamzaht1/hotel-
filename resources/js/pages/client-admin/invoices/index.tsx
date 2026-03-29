import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useT } from '@/hooks/use-translations';

interface Invoice {
    id: number;
    invoice_number: string;
    type: string;
    status: string;
    total: string;
    issue_date: string;
    due_date: string;
}

interface PaginatedData {
    data: Invoice[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

interface Props {
    invoices: PaginatedData;
}

export default function ClientInvoicesIndex({ invoices }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard', 'Dashboard'), href: '/client-admin' },
        { title: t('invoices', 'Invoices'), href: '/client-admin/invoices' },
    ];

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

                <h1 className="text-2xl font-bold">{t('invoices', 'Invoices')}</h1>

                {/* Table */}
                <Card className="py-0">
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-muted-foreground">
                                    <th className="px-4 py-3 text-start font-medium">{t('invoice_number', 'Invoice #')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('type', 'Type')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('total', 'Total')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('status', 'Status')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('issue_date', 'Issue Date')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('due_date', 'Due Date')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('pdf', 'PDF')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.data.map((invoice) => (
                                    <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{invoice.invoice_number}</td>
                                        <td className="px-4 py-3">{typeBadge(invoice.type)}</td>
                                        <td className="px-4 py-3 font-medium">{Number(invoice.total).toLocaleString()} SAR</td>
                                        <td className="px-4 py-3">{statusBadge(invoice.status)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{invoice.issue_date}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{invoice.due_date}</td>
                                        <td className="px-4 py-3">
                                            <Button variant="ghost" size="icon" asChild>
                                                <a href={`/client-admin/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
                                                    <FileDown className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
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
