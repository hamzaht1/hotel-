import { Link, usePage } from '@inertiajs/react';
import { FileDown, CreditCard, Landmark, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useT } from '@/hooks/use-translations';

export interface Invoice {
    id: number;
    invoice_number: string;
    type: string;
    status: string;
    total: string;
    issue_date: string;
    due_date: string;
    payment_method: string | null;
}

export interface PaginatedInvoices {
    data: Invoice[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

/**
 * Body of the Invoices screen. Extracted from `invoices/index.tsx` so
 * it can also live as a tab inside the unified Establishment Account
 * page.
 */
export default function InvoicesSection({ invoices }: { invoices: PaginatedInvoices }) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

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

    const paymentMethodLabel = (method: string | null) => {
        if (method === 'moyasar' || method === 'tap') {
            const label = method === 'moyasar' ? 'Moyasar' : 'Tap';
            return (
                <span className="inline-flex items-center gap-1 text-blue-600">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{label}</span>
                </span>
            );
        }
        if (method === 'bank_transfer') {
            return (
                <span className="inline-flex items-center gap-1 text-slate-600">
                    <Landmark className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{t('bank_transfer', 'Bank Transfer')}</span>
                </span>
            );
        }
        return <span className="text-xs text-muted-foreground">—</span>;
    };

    return (
        <div className="flex flex-col gap-6">
            {flash?.success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                    {flash.success}
                </div>
            )}

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
                                <th className="px-4 py-3 text-start font-medium">{t('payment_method', 'Payment')}</th>
                                <th className="px-4 py-3 text-start font-medium">{t('actions', 'Actions')}</th>
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
                                    <td className="px-4 py-3">{paymentMethodLabel(invoice.payment_method)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" asChild title={t('preview', 'Preview')}>
                                                <a href={`/client-admin/invoices/${invoice.id}/preview`} target="_blank" rel="noreferrer">
                                                    <Eye className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button variant="ghost" size="icon" asChild title={t('download', 'Download')}>
                                                <a href={`/client-admin/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
                                                    <FileDown className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {invoices.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                        {t('no_invoices_found', 'No invoices found')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

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
    );
}
