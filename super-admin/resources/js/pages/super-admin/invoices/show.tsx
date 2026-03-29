import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Send, CheckCircle, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/hooks/use-translations';

interface InvoiceItem {
    id?: number;
    description_ar: string;
    description_en: string;
    quantity: number;
    unit_price: number;
    total: number;
}

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
    items: InvoiceItem[];
    tenant?: { id: number; name: string; email: string; phone?: string; org_name_ar?: string; org_name_en?: string };
    created_at: string;
}

interface Props {
    invoice: Invoice;
}

export default function ShowInvoice({ invoice }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: t('invoices', 'Invoices'), href: '/super-admin/invoices' },
        { title: `#${invoice.invoice_number}`, href: `/super-admin/invoices/${invoice.id}` },
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

    function handleSend() {
        if (confirm(t('confirm_send_invoice', 'Send this invoice to the tenant?'))) {
            router.post(`/super-admin/invoices/${invoice.id}/send`);
        }
    }

    function handleMarkPaid() {
        if (confirm(t('confirm_mark_paid', 'Mark this invoice as paid?'))) {
            router.post(`/super-admin/invoices/${invoice.id}/mark-paid`);
        }
    }

    const subtotal = invoice.items.reduce((sum, item) => sum + Number(item.total), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('invoice', 'Invoice')} #${invoice.invoice_number}`} />
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

                {/* Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-xl">{t('invoice', 'Invoice')} #{invoice.invoice_number}</CardTitle>
                                {statusBadge(invoice.status)}
                            </div>
                            <Badge className="w-fit rounded-full bg-blue-100 text-blue-700 hover:bg-blue-100">{invoice.type}</Badge>
                        </div>
                    </CardHeader>
                </Card>

                {/* Tenant Info & Dates */}
                <div className="mb-6 grid gap-6 sm:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t('tenant_info', 'Tenant Information')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">{t('name', 'Name')}: </span>
                                    <span className="font-medium">{invoice.tenant?.name || '—'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{t('email', 'Email')}: </span>
                                    <span className="font-medium">{invoice.tenant?.email || '—'}</span>
                                </div>
                                {invoice.tenant?.org_name_ar && (
                                    <div>
                                        <span className="text-muted-foreground">{t('organization', 'Organization')}: </span>
                                        <span className="font-medium">{invoice.tenant.org_name_ar}</span>
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
                                    <span className="font-medium">{invoice.issue_date}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{t('due_date', 'Due Date')}: </span>
                                    <span className="font-medium">{invoice.due_date}</span>
                                </div>
                                {invoice.paid_at && (
                                    <div>
                                        <span className="text-muted-foreground">{t('paid_at', 'Paid At')}: </span>
                                        <span className="font-medium text-green-600">{invoice.paid_at}</span>
                                    </div>
                                )}
                                {invoice.payment_method && (
                                    <div>
                                        <span className="text-muted-foreground">{t('payment_method', 'Payment Method')}: </span>
                                        <span className="font-medium">{invoice.payment_method}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Items Table */}
                <Card className="mb-6 py-0">
                    <CardHeader>
                        <CardTitle className="text-base">{t('invoice_items', 'Invoice Items')}</CardTitle>
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
                                {invoice.items.map((item, index) => (
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

                {/* Totals */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="ms-auto max-w-xs space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('subtotal', 'Subtotal')}</span>
                                <span className="font-medium">{subtotal.toLocaleString()} SAR</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('discount', 'Discount')}</span>
                                <span className="font-medium text-red-600">-{Number(invoice.discount).toLocaleString()} SAR</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('tax', 'Tax')} ({invoice.tax_rate}%)</span>
                                <span className="font-medium">{Number(invoice.tax_amount).toLocaleString()} SAR</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 text-base font-bold">
                                <span>{t('grand_total', 'Grand Total')}</span>
                                <span>{Number(invoice.total).toLocaleString()} SAR</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                {(invoice.notes_ar || invoice.notes_en) && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-base">{t('notes', 'Notes')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {invoice.notes_ar && (
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-muted-foreground">{t('notes_ar', 'Notes (AR)')}</p>
                                        <p className="text-sm" dir="rtl">{invoice.notes_ar}</p>
                                    </div>
                                )}
                                {invoice.notes_en && (
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-muted-foreground">{t('notes_en', 'Notes (EN)')}</p>
                                        <p className="text-sm">{invoice.notes_en}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    {invoice.status === 'draft' && (
                        <>
                            <Button variant="outline" asChild>
                                <Link href={`/super-admin/invoices/${invoice.id}/edit`}>
                                    <Pencil className="h-4 w-4" />
                                    {t('edit', 'Edit')}
                                </Link>
                            </Button>
                            <Button onClick={handleSend}>
                                <Send className="h-4 w-4" />
                                {t('send_invoice', 'Send Invoice')}
                            </Button>
                        </>
                    )}
                    {invoice.status === 'sent' && (
                        <Button onClick={handleMarkPaid} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4" />
                            {t('mark_as_paid', 'Mark as Paid')}
                        </Button>
                    )}
                    <Button variant="outline" asChild>
                        <a href={`/super-admin/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
                            <FileDown className="h-4 w-4" />
                            {t('download_pdf', 'Download PDF')}
                        </a>
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link href="/super-admin/invoices">
                            {t('back_to_list', 'Back to List')}
                        </Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
