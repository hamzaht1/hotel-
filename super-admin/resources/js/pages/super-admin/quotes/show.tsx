import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Send, CheckCircle, XCircle, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/hooks/use-translations';

interface QuoteItem {
    id?: number;
    description_ar: string;
    description_en: string;
    quantity: number;
    unit_price: number;
    total: number;
}

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
    refused_at: string | null;
    payment_method: string | null;
    notes_ar: string | null;
    notes_en: string | null;
    external_client_name?: string | null;
    external_client_email?: string | null;
    items: QuoteItem[];
    tenant?: { id: number; name: string; email: string; phone?: string; org_name_ar?: string; org_name_en?: string };
    created_at: string;
}

interface Props {
    quote: Quote;
}

export default function ShowQuote({ quote }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: t('quotes', 'Quotes'), href: '/super-admin/quotes' },
        { title: `#${quote.quote_number}`, href: `/super-admin/quotes/${quote.id}` },
    ];

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

    function handleSend() {
        if (confirm(t('confirm_send_quote', 'Send this quote to the client?'))) {
            router.post(`/super-admin/quotes/${quote.id}/send`);
        }
    }

    function handleMarkAccepted() {
        if (confirm(t('confirm_mark_accepted', 'Mark this quote as accepted?'))) {
            router.post(`/super-admin/quotes/${quote.id}/mark-accepted`);
        }
    }

    function handleMarkRefused() {
        if (confirm(t('confirm_mark_refused', 'Mark this quote as refused?'))) {
            router.post(`/super-admin/quotes/${quote.id}/mark-refused`);
        }
    }

    const subtotal = quote.items.reduce((sum, item) => sum + Number(item.total), 0);

    const clientName = quote.tenant?.name || quote.external_client_name || '—';
    const clientEmail = quote.tenant?.email || quote.external_client_email || '—';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('quote', 'Quote')} #${quote.quote_number}`} />
            <div className="mx-auto max-w-4xl p-6">
                {flash?.success && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                        {flash.error}
                    </div>
                )}

                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-xl">{t('quote', 'Quote')} #{quote.quote_number}</CardTitle>
                                {statusBadge(quote.status)}
                            </div>
                            <Badge className="w-fit rounded-full bg-blue-100 text-blue-700 hover:bg-blue-100">{quote.type}</Badge>
                        </div>
                    </CardHeader>
                </Card>

                <div className="mb-6 grid gap-6 sm:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t('client_info', 'Client Information')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">{t('name', 'Name')}: </span>
                                    <span className="font-medium">{clientName}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{t('email', 'Email')}: </span>
                                    <span className="font-medium">{clientEmail}</span>
                                </div>
                                {quote.tenant?.org_name_ar && (
                                    <div>
                                        <span className="text-muted-foreground">{t('organization', 'Organization')}: </span>
                                        <span className="font-medium">{quote.tenant.org_name_ar}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t('dates', 'Dates')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">{t('issue_date', 'Issue Date')}: </span>
                                    <span className="font-medium">{quote.issue_date}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{t('valid_until', 'Valid Until')}: </span>
                                    <span className="font-medium">{quote.valid_until}</span>
                                </div>
                                {quote.accepted_at && (
                                    <div>
                                        <span className="text-muted-foreground">{t('accepted_at', 'Accepted At')}: </span>
                                        <span className="font-medium text-green-600">{quote.accepted_at}</span>
                                    </div>
                                )}
                                {quote.refused_at && (
                                    <div>
                                        <span className="text-muted-foreground">{t('refused_at', 'Refused At')}: </span>
                                        <span className="font-medium text-red-600">{quote.refused_at}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-6 py-0">
                    <CardHeader>
                        <CardTitle className="text-base">{t('quote_items', 'Quote Items')}</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-muted-foreground">
                                    <th className="px-4 py-3 text-start font-medium">{t('description_ar', 'Description (AR)')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('description_en', 'Description (EN)')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('quantity', 'Qty')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('unit_price', 'Unit Price')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('total', 'Total')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quote.items.map((item, index) => (
                                    <tr key={index} className="border-b last:border-0">
                                        <td className="px-4 py-3" dir="rtl">{item.description_ar}</td>
                                        <td className="px-4 py-3">{item.description_en}</td>
                                        <td className="px-4 py-3">{item.quantity}</td>
                                        <td className="px-4 py-3">{Number(item.unit_price).toLocaleString()} SAR</td>
                                        <td className="px-4 py-3 font-medium">{Number(item.total).toLocaleString()} SAR</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="ms-auto max-w-xs space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('subtotal', 'Subtotal')}</span>
                                <span className="font-medium">{subtotal.toLocaleString()} SAR</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('discount', 'Discount')}</span>
                                <span className="font-medium text-red-600">-{Number(quote.discount).toLocaleString()} SAR</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('tax', 'Tax')} ({quote.tax_rate}%)</span>
                                <span className="font-medium">{Number(quote.tax_amount).toLocaleString()} SAR</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 text-base font-bold">
                                <span>{t('grand_total', 'Grand Total')}</span>
                                <span>{Number(quote.total).toLocaleString()} SAR</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {(quote.notes_ar || quote.notes_en) && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-base">{t('notes', 'Notes')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {quote.notes_ar && (
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-muted-foreground">{t('notes_ar', 'Notes (AR)')}</p>
                                        <p className="text-sm" dir="rtl">{quote.notes_ar}</p>
                                    </div>
                                )}
                                {quote.notes_en && (
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-muted-foreground">{t('notes_en', 'Notes (EN)')}</p>
                                        <p className="text-sm">{quote.notes_en}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex flex-wrap gap-3">
                    {quote.status === 'draft' && (
                        <>
                            <Button variant="outline" asChild>
                                <Link href={`/super-admin/quotes/${quote.id}/edit`}>
                                    <Pencil className="h-4 w-4" />
                                    {t('edit', 'Edit')}
                                </Link>
                            </Button>
                            <Button onClick={handleSend}>
                                <Send className="h-4 w-4" />
                                {t('send_quote', 'Send Quote')}
                            </Button>
                        </>
                    )}
                    {quote.status === 'sent' && (
                        <>
                            <Button onClick={handleMarkAccepted} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4" />
                                {t('mark_as_accepted', 'Mark as Accepted')}
                            </Button>
                            <Button onClick={handleMarkRefused} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                                <XCircle className="h-4 w-4" />
                                {t('mark_as_refused', 'Mark as Refused')}
                            </Button>
                        </>
                    )}
                    <Button variant="outline" asChild>
                        <a href={`/super-admin/quotes/${quote.id}/pdf`} target="_blank" rel="noreferrer">
                            <FileDown className="h-4 w-4" />
                            {t('download_pdf', 'Download PDF')}
                        </a>
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link href="/super-admin/quotes">
                            {t('back_to_list', 'Back to List')}
                        </Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
