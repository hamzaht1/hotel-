import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Check, X, FileDown, Eye, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface QuoteItem {
    id: number;
    description_ar: string;
    description_en: string;
    quantity: number;
    unit_price: string;
    total: string;
}

interface Quote {
    id: number;
    quote_number: string;
    type: string;
    status: string;
    effective_status: string;
    is_actionable: boolean;
    amount: string;
    tax_rate: string;
    tax_amount: string;
    discount: string;
    total: string;
    issue_date: string;
    valid_until: string;
    notes_ar: string | null;
    notes_en: string | null;
    client_notes: string | null;
    payment_terms: string | null;
    items: QuoteItem[];
}

export default function ClientQuoteShow({ quote }: { quote: Quote }) {
    const { t, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [processing, setProcessing] = useState(false);

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

    const act = (action: 'accept' | 'refuse') => {
        const message = action === 'accept' ? t('accept_quote_confirm', 'Accept this quote?') : t('refuse_quote_confirm', 'Refuse this quote?');
        if (!window.confirm(message)) return;
        router.post(
            `/client-admin/quotes/${quote.id}/${action}`,
            {},
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const desc = (item: QuoteItem) => (isArabic ? item.description_ar || item.description_en : item.description_en || item.description_ar);
    const money = (v: string) => `${Number(v).toLocaleString()} SAR`;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard', 'Dashboard'), href: '/client-admin' },
        { title: t('quotes', 'Quotes'), href: '/client-admin/quotes' },
        { title: quote.quote_number, href: `/client-admin/quotes/${quote.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={quote.quote_number} />
            <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
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

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild title={t('back', 'Back')}>
                            <a href="/client-admin/quotes">
                                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                            </a>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{quote.quote_number}</h1>
                            <div className="mt-1">{statusBadge(quote.effective_status)}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <a href={`/client-admin/quotes/${quote.id}/preview`} target="_blank" rel="noreferrer">
                                <Eye className="me-1 h-4 w-4" /> {t('preview', 'Preview')}
                            </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <a href={`/client-admin/quotes/${quote.id}/pdf`} target="_blank" rel="noreferrer">
                                <FileDown className="me-1 h-4 w-4" /> {t('download', 'Download')}
                            </a>
                        </Button>
                    </div>
                </div>

                {quote.is_actionable && (
                    <Card className="border-[#7367f0]/30 bg-[#7367f0]/5">
                        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                            <p className="text-sm text-muted-foreground">
                                {t('quote_decision_prompt', 'This quote is awaiting your decision.')}{' '}
                                <span className="font-medium text-foreground">
                                    {t('valid_until', 'Valid Until')}: {quote.valid_until}
                                </span>
                            </p>
                            <div className="flex items-center gap-2">
                                <Button size="sm" disabled={processing} onClick={() => act('accept')} className="bg-green-600 hover:bg-green-700">
                                    <Check className="me-1 h-4 w-4" /> {t('accept', 'Accept')}
                                </Button>
                                <Button size="sm" variant="destructive" disabled={processing} onClick={() => act('refuse')}>
                                    <X className="me-1 h-4 w-4" /> {t('refuse', 'Refuse')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{t('quote_details', 'Quote Details')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">{t('type', 'Type')}</span>
                            <span className="font-medium">{quote.type}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">{t('status', 'Status')}</span>
                            <span>{statusBadge(quote.effective_status)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">{t('issue_date', 'Issue Date')}</span>
                            <span className="font-medium">{quote.issue_date}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">{t('valid_until', 'Valid Until')}</span>
                            <span className="font-medium">{quote.valid_until}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="py-0">
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-muted-foreground">
                                    <th className="px-4 py-3 text-start font-medium">#</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('description', 'Description')}</th>
                                    <th className="px-4 py-3 text-center font-medium">{t('quantity', 'Qty')}</th>
                                    <th className="px-4 py-3 text-end font-medium">{t('unit_price', 'Unit Price')}</th>
                                    <th className="px-4 py-3 text-end font-medium">{t('total', 'Total')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quote.items.map((item, i) => (
                                    <tr key={item.id} className="border-b last:border-0">
                                        <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                                        <td className="px-4 py-3">{desc(item)}</td>
                                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                                        <td className="px-4 py-3 text-end">{money(item.unit_price)}</td>
                                        <td className="px-4 py-3 text-end font-medium">{money(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="ms-auto w-full max-w-xs space-y-2 py-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('subtotal', 'Subtotal')}</span>
                            <span>{money(quote.amount)}</span>
                        </div>
                        {Number(quote.discount) > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('discount', 'Discount')}</span>
                                <span>-{money(quote.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                {t('vat', 'VAT')} ({quote.tax_rate}%)
                            </span>
                            <span>{money(quote.tax_amount)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 text-base font-bold">
                            <span>{t('grand_total', 'Grand Total')}</span>
                            <span>{money(quote.total)}</span>
                        </div>
                    </CardContent>
                </Card>

                {(quote.client_notes || quote.notes_ar || quote.notes_en || quote.payment_terms) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t('notes', 'Notes')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            {quote.client_notes && <p className="whitespace-pre-wrap">{quote.client_notes}</p>}
                            {(isArabic ? quote.notes_ar : quote.notes_en) && (
                                <p className="whitespace-pre-wrap">{isArabic ? quote.notes_ar : quote.notes_en}</p>
                            )}
                            {quote.payment_terms && (
                                <div>
                                    <p className="mb-1 font-medium text-foreground">{t('payment_terms', 'Payment Terms')}</p>
                                    <p className="whitespace-pre-wrap">{quote.payment_terms}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
