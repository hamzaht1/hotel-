import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    payment_method: string | null;
    notes_ar: string | null;
    notes_en: string | null;
    items: QuoteItem[];
    tenant?: { id: number; name: string; email: string };
    created_at: string;
}

interface TenantOption {
    id: number;
    name: string;
    email: string;
}

interface Props {
    quote: Quote;
    tenants: TenantOption[];
}

export default function EditQuote({ quote, tenants }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: t('quotes', 'Quotes'), href: '/super-admin/quotes' },
        { title: t('edit', 'Edit'), href: '#' },
    ];

    const { data, setData, put, processing, errors } = useForm<{
        tenant_id: string | number;
        type: string;
        issue_date: string;
        valid_until: string;
        tax_rate: number;
        discount: number;
        notes_ar: string;
        notes_en: string;
        items: QuoteItem[];
    }>({
        tenant_id: quote.tenant_id ?? '',
        type: quote.type,
        issue_date: quote.issue_date,
        valid_until: quote.valid_until,
        tax_rate: Number(quote.tax_rate),
        discount: Number(quote.discount),
        notes_ar: quote.notes_ar || '',
        notes_en: quote.notes_en || '',
        items: quote.items.map((item) => ({
            id: item.id,
            description_ar: item.description_ar,
            description_en: item.description_en,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            total: Number(item.total),
        })),
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/super-admin/quotes/${quote.id}`);
    }

    function addItem() {
        setData('items', [...data.items, { description_ar: '', description_en: '', quantity: 1, unit_price: 0, total: 0 }]);
    }

    function removeItem(index: number) {
        if (data.items.length <= 1) return;
        setData('items', data.items.filter((_, i) => i !== index));
    }

    function updateItem(index: number, field: keyof QuoteItem, value: string | number) {
        const updated = [...data.items];
        (updated[index] as unknown as Record<string, string | number | undefined>)[field] = value;
        updated[index].total = updated[index].quantity * updated[index].unit_price;
        setData('items', updated);
    }

    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const discountAmount = Number(data.discount) || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * ((Number(data.tax_rate) || 0) / 100);
    const grandTotal = taxableAmount + taxAmount;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit', 'Edit')} ${t('quote', 'Quote')} #${quote.quote_number}`} />
            <div className="mx-auto max-w-4xl p-6">
                <h1 className="mb-6 text-2xl font-bold">{t('edit_quote', 'Edit Quote')}: #{quote.quote_number}</h1>

                {flash?.success && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('quote_details', 'Quote Details')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label={t('quote_number', 'Quote Number')}>
                                    <Input value={quote.quote_number} readOnly disabled className="vuexy-input bg-muted" />
                                </Field>
                                <Field label={t('tenant', 'Tenant')} error={(errors as Record<string, string>).tenant_id}>
                                    <Select value={String(data.tenant_id)} onValueChange={(value) => setData('tenant_id', Number(value))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('select_tenant', 'Select tenant...')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tenants.map((tenant) => (
                                                <SelectItem key={tenant.id} value={String(tenant.id)}>
                                                    {tenant.name} ({tenant.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label={t('type', 'Type')} error={errors.type}>
                                    <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="subscription">{t('subscription', 'Subscription')}</SelectItem>
                                            <SelectItem value="setup">{t('setup', 'Setup')}</SelectItem>
                                            <SelectItem value="addon">{t('addon', 'Add-on')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label={t('issue_date', 'Issue Date')} error={errors.issue_date}>
                                    <Input
                                        type="date"
                                        value={data.issue_date}
                                        onChange={(e) => setData('issue_date', e.target.value)}
                                        required
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('valid_until', 'Valid Until')} error={errors.valid_until}>
                                    <Input
                                        type="date"
                                        value={data.valid_until}
                                        onChange={(e) => setData('valid_until', e.target.value)}
                                        required
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('tax_rate', 'Tax Rate %')} error={(errors as Record<string, string>).tax_rate}>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.tax_rate}
                                        onChange={(e) => setData('tax_rate', Number(e.target.value))}
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('discount', 'Discount (SAR)')} error={errors.discount}>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.discount}
                                        onChange={(e) => setData('discount', Number(e.target.value))}
                                        className="vuexy-input"
                                    />
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{t('quote_items', 'Quote Items')}</CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                    <Plus className="h-4 w-4" />
                                    {t('add_item', 'Add Item')}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.items.map((item, index) => (
                                    <div key={index} className="rounded-lg border p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="text-sm font-medium">{t('item', 'Item')} #{index + 1}</span>
                                            {data.items.length > 1 && (
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => removeItem(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <Field label={t('description_ar', 'Description (AR)')} error={(errors as Record<string, string>)[`items.${index}.description_ar`]}>
                                                <Input
                                                    value={item.description_ar}
                                                    onChange={(e) => updateItem(index, 'description_ar', e.target.value)}
                                                    required
                                                    className="vuexy-input"
                                                    dir="rtl"
                                                />
                                            </Field>
                                            <Field label={t('description_en', 'Description (EN)')} error={(errors as Record<string, string>)[`items.${index}.description_en`]}>
                                                <Input
                                                    value={item.description_en}
                                                    onChange={(e) => updateItem(index, 'description_en', e.target.value)}
                                                    required
                                                    className="vuexy-input"
                                                />
                                            </Field>
                                            <Field label={t('quantity', 'Quantity')} error={(errors as Record<string, string>)[`items.${index}.quantity`]}>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                                    required
                                                    className="vuexy-input"
                                                />
                                            </Field>
                                            <Field label={t('unit_price', 'Unit Price (SAR)')} error={(errors as Record<string, string>)[`items.${index}.unit_price`]}>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                                                    required
                                                    className="vuexy-input"
                                                />
                                            </Field>
                                        </div>
                                        <div className="mt-2 text-end text-sm font-medium text-muted-foreground">
                                            {t('item_total', 'Total')}: {(item.quantity * item.unit_price).toLocaleString()} SAR
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 space-y-2 border-t pt-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('subtotal', 'Subtotal')}</span>
                                    <span className="font-medium">{subtotal.toLocaleString()} SAR</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('discount', 'Discount')}</span>
                                    <span className="font-medium text-red-600">-{discountAmount.toLocaleString()} SAR</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('tax', 'Tax')} ({data.tax_rate}%)</span>
                                    <span className="font-medium">{taxAmount.toLocaleString()} SAR</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 text-base font-bold">
                                    <span>{t('grand_total', 'Grand Total')}</span>
                                    <span>{grandTotal.toLocaleString()} SAR</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('notes', 'Notes')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label={t('notes_ar', 'Notes (AR)')} error={(errors as Record<string, string>).notes_ar}>
                                    <textarea
                                        value={data.notes_ar}
                                        onChange={(e) => setData('notes_ar', e.target.value)}
                                        rows={3}
                                        className="vuexy-input w-full rounded-md border px-3 py-2 text-sm"
                                        dir="rtl"
                                    />
                                </Field>
                                <Field label={t('notes_en', 'Notes (EN)')} error={(errors as Record<string, string>).notes_en}>
                                    <textarea
                                        value={data.notes_en}
                                        onChange={(e) => setData('notes_en', e.target.value)}
                                        rows={3}
                                        className="vuexy-input w-full rounded-md border px-3 py-2 text-sm"
                                    />
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/super-admin/quotes">{t('cancel', 'Cancel')}</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('saving', 'Saving...') : t('save_changes', 'Save Changes')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
