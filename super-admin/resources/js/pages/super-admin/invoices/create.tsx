import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Trash2, Save, Eye, Send, UserPlus, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';
import { useState, useMemo } from 'react';

interface TenantOption { id: number; name: string; email: string | null; phone: string | null; org_name_ar: string | null; plan_id: number | null }
interface Plan { id: number; slug: string; name_ar: string; name_en: string }
interface SalesRep { id: number; name: string }

interface Item {
    description_ar: string;
    description_en: string;
    quantity: number;
    unit_price: number;
}

interface Props {
    tenants: TenantOption[];
    plans: Plan[];
    salesReps: SalesRep[];
    nextNumber: string;
}

export default function CreateInvoice({ tenants, plans, salesReps, nextNumber }: Props) {
    const { t, isArabic } = useT();
    const [clientMode, setClientMode] = useState<'existing' | 'external'>('existing');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'الفواتير' : 'Invoices', href: '/super-admin/invoices' },
        { title: isArabic ? 'إضافة فاتورة' : 'Add invoice', href: '/super-admin/invoices/create' },
    ];

    const { data, setData, post, processing, errors } = useForm<{
        tenant_id: string;
        external_client_name: string;
        external_client_email: string;
        external_client_phone: string;
        external_client_address: string;
        bank_name: string;
        bank_country: string;
        bank_iban: string;
        type: string;
        issue_date: string;
        due_date: string;
        tax_rate: number;
        tax_rate_2: number;
        discount: number;
        discount_percent: number;
        notes_ar: string;
        client_notes: string;
        payment_terms: string;
        payment_method: string;
        sales_rep_id: string;
        commission_rate: number;
        requires_receipt: boolean;
        has_receipt_toggle: boolean;
        pdf_template: string;
        items: Item[];
    }>({
        tenant_id: '',
        external_client_name: '',
        external_client_email: '',
        external_client_phone: '',
        external_client_address: '',
        bank_name: '',
        bank_country: '',
        bank_iban: '',
        type: 'subscription',
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        tax_rate: 15,
        tax_rate_2: 0,
        discount: 0,
        discount_percent: 0,
        notes_ar: '',
        client_notes: '',
        payment_terms: '',
        payment_method: 'bank_transfer',
        sales_rep_id: '',
        commission_rate: 0,
        requires_receipt: false,
        has_receipt_toggle: false,
        pdf_template: 'default',
        items: [{ description_ar: '', description_en: '', quantity: 1, unit_price: 0 }],
    });

    // Sync: if an existing tenant is picked, clear external client fields (and vice versa).
    function selectTenant(id: string) {
        setData('tenant_id', id);
        if (id) {
            setData('external_client_name', '');
            setData('external_client_email', '');
            setData('external_client_phone', '');
            setData('external_client_address', '');
        }
    }

    function addItem() {
        setData('items', [...data.items, { description_ar: '', description_en: '', quantity: 1, unit_price: 0 }]);
    }
    function removeItem(i: number) {
        setData('items', data.items.filter((_, idx) => idx !== i));
    }
    function updateItem(i: number, patch: Partial<Item>) {
        const next = [...data.items];
        next[i] = { ...next[i], ...patch };
        setData('items', next);
    }

    const totals = useMemo(() => {
        const subtotal = data.items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unit_price || 0), 0);
        const discount = (data.discount || 0) + (subtotal * (data.discount_percent || 0)) / 100;
        const afterDiscount = Math.max(0, subtotal - discount);
        const tax1 = (afterDiscount * (data.tax_rate || 0)) / 100;
        const tax2 = (afterDiscount * (data.tax_rate_2 || 0)) / 100;
        const total = afterDiscount + tax1 + tax2;
        const commission = (total * (data.commission_rate || 0)) / 100;
        return { subtotal, discount, tax1, tax2, total, commission };
    }, [data.items, data.discount, data.discount_percent, data.tax_rate, data.tax_rate_2, data.commission_rate]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const payload = { ...data };
        if (clientMode === 'external') payload.tenant_id = '';
        post('/super-admin/invoices');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'إضافة فاتورة' : 'Add invoice'} />
            <div className="mx-auto max-w-6xl p-6">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                    <div>
                        <h1 className="text-2xl font-bold">{isArabic ? 'إضافة فاتورة' : 'Add invoice'}</h1>
                        <p className="text-xs text-muted-foreground">{isArabic ? 'رقم الفاتورة' : 'Invoice #'} {nextNumber}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm"><Save className="h-4 w-4" /> {isArabic ? 'حفظ' : 'Save'}</Button>
                        <Button type="button" variant="outline" size="sm"><Eye className="h-4 w-4" /> {isArabic ? 'معاينة' : 'Preview'}</Button>
                        <Button type="submit" form="invoice-form" size="sm" disabled={processing}>
                            <Send className="h-4 w-4" /> {isArabic ? 'إرسال الفاتورة' : 'Send invoice'}
                        </Button>
                    </div>
                </div>

                <form id="invoice-form" onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-4">
                        {/* Dates */}
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">{isArabic ? 'معلومات الفاتورة' : 'Invoice info'}</CardTitle></CardHeader>
                            <CardContent className="grid gap-3 sm:grid-cols-2">
                                <Field label={isArabic ? 'تاريخ الإصدار' : 'Issue date'} error={errors.issue_date}>
                                    <Input type="date" value={data.issue_date} onChange={(e) => setData('issue_date', e.target.value)} />
                                </Field>
                                <Field label={isArabic ? 'تاريخ الاستحقاق' : 'Due date'} error={errors.due_date}>
                                    <Input type="date" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} />
                                </Field>
                                <Field label={isArabic ? 'النوع' : 'Type'} error={errors.type}>
                                    <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="subscription">{isArabic ? 'اشتراك' : 'Subscription'}</SelectItem>
                                            <SelectItem value="setup">{isArabic ? 'إعداد' : 'Setup'}</SelectItem>
                                            <SelectItem value="addon">{isArabic ? 'إضافي' : 'Add-on'}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label={isArabic ? 'قالب PDF' : 'PDF template'} error={(errors as Record<string, string>).pdf_template}>
                                    <Select value={data.pdf_template} onValueChange={(v) => setData('pdf_template', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default">Default</SelectItem>
                                            <SelectItem value="modern">Modern</SelectItem>
                                            <SelectItem value="classic">Classic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </CardContent>
                        </Card>

                        {/* Client */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">{isArabic ? 'الفاتورة إلى' : 'Bill to'}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={clientMode === 'existing' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setClientMode('existing')}
                                    >
                                        <Building2 className="h-4 w-4" /> {isArabic ? 'عميل مسجّل' : 'Existing tenant'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={clientMode === 'external' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => { setClientMode('external'); selectTenant(''); }}
                                    >
                                        <UserPlus className="h-4 w-4" /> {isArabic ? 'عميل خارجي' : 'External client'}
                                    </Button>
                                </div>

                                {clientMode === 'existing' ? (
                                    <Field label={isArabic ? 'اختر العميل' : 'Select tenant'} error={(errors as Record<string, string>).tenant_id}>
                                        <Select value={data.tenant_id} onValueChange={selectTenant}>
                                            <SelectTrigger><SelectValue placeholder={isArabic ? 'اختر' : 'Select'} /></SelectTrigger>
                                            <SelectContent>
                                                {tenants.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name} {t.email && `· ${t.email}`}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Field label={isArabic ? 'اسم العميل' : 'Client name'} error={errors.external_client_name}>
                                            <Input value={data.external_client_name} onChange={(e) => setData('external_client_name', e.target.value)} />
                                        </Field>
                                        <Field label={isArabic ? 'البريد' : 'Email'} error={errors.external_client_email}>
                                            <Input type="email" value={data.external_client_email} onChange={(e) => setData('external_client_email', e.target.value)} />
                                        </Field>
                                        <Field label={isArabic ? 'الهاتف' : 'Phone'} error={errors.external_client_phone}>
                                            <Input value={data.external_client_phone} onChange={(e) => setData('external_client_phone', e.target.value)} />
                                        </Field>
                                        <Field label={isArabic ? 'العنوان' : 'Address'} error={errors.external_client_address}>
                                            <Input value={data.external_client_address} onChange={(e) => setData('external_client_address', e.target.value)} />
                                        </Field>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Bank */}
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">{isArabic ? 'المعلومات البنكية' : 'Bank information'}</CardTitle></CardHeader>
                            <CardContent className="grid gap-3 sm:grid-cols-3">
                                <Field label={isArabic ? 'اسم البنك' : 'Bank name'} error={errors.bank_name}>
                                    <Input value={data.bank_name} onChange={(e) => setData('bank_name', e.target.value)} />
                                </Field>
                                <Field label={isArabic ? 'الدولة' : 'Country'} error={errors.bank_country}>
                                    <Input value={data.bank_country} onChange={(e) => setData('bank_country', e.target.value)} />
                                </Field>
                                <Field label="IBAN" error={errors.bank_iban}>
                                    <Input value={data.bank_iban} onChange={(e) => setData('bank_iban', e.target.value)} />
                                </Field>
                            </CardContent>
                        </Card>

                        {/* Items */}
                        <Card>
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-base">{isArabic ? 'عناصر الفاتورة' : 'Line items'}</CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4" /> {isArabic ? 'إضافة عنصر' : 'Add item'}</Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {data.items.map((item, i) => (
                                    <div key={i} className="grid gap-2 sm:grid-cols-[1fr_120px_120px_120px_40px] items-end border-b pb-3">
                                        <div>
                                            <Label className="text-xs">{isArabic ? 'الوصف (عربي)' : 'Description (AR)'}</Label>
                                            <Input value={item.description_ar} onChange={(e) => updateItem(i, { description_ar: e.target.value })} required />
                                            <Input className="mt-1" placeholder={isArabic ? 'وصف (EN)' : 'Description (EN)'} value={item.description_en} onChange={(e) => updateItem(i, { description_en: e.target.value })} required />
                                        </div>
                                        <div>
                                            <Label className="text-xs">{isArabic ? 'الكمية' : 'Qty'}</Label>
                                            <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, { quantity: parseInt(e.target.value) || 1 })} />
                                        </div>
                                        <div>
                                            <Label className="text-xs">{isArabic ? 'السعر' : 'Price'}</Label>
                                            <Input type="number" step="0.01" min={0} value={item.unit_price} onChange={(e) => updateItem(i, { unit_price: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                        <div>
                                            <Label className="text-xs">{isArabic ? 'الإجمالي' : 'Total'}</Label>
                                            <Input value={(item.quantity * item.unit_price).toFixed(2)} readOnly className="bg-muted" />
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => removeItem(i)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Sales rep + commission */}
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">{isArabic ? 'مندوب المبيعات' : 'Sales rep'}</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    {isArabic
                                        ? 'لا تظهر هذه البيانات للعميل — فقط في الفاتورة الداخلية وفي تقارير الربح والعمولة.'
                                        : 'These fields are NOT visible to the client — shown only on the internal invoice and in profit/commission reports.'}
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Field label={isArabic ? 'المندوب' : 'Representative'}>
                                        <Select value={data.sales_rep_id} onValueChange={(v) => setData('sales_rep_id', v === 'none' ? '' : v)}>
                                            <SelectTrigger><SelectValue placeholder={isArabic ? 'لا يوجد' : 'None'} /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">{isArabic ? 'لا يوجد' : 'None'}</SelectItem>
                                                {salesReps.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label={isArabic ? 'نسبة العمولة (%)' : 'Commission rate (%)'}>
                                        <Input type="number" min={0} max={100} step="0.1" value={data.commission_rate} onChange={(e) => setData('commission_rate', parseFloat(e.target.value) || 0)} />
                                    </Field>
                                </div>
                                {data.commission_rate > 0 && (
                                    <p className="text-xs text-emerald-600">
                                        {isArabic ? 'عمولة محسوبة: ' : 'Computed commission: '}
                                        <strong>{totals.commission.toFixed(2)} {isArabic ? 'ر.س' : 'SAR'}</strong>
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Toggles */}
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">{isArabic ? 'إعدادات إضافية' : 'Additional options'}</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <ToggleRow
                                    label={isArabic ? 'طلب إيصال من العميل' : 'Request receipt from client'}
                                    checked={data.requires_receipt}
                                    onChange={(v) => setData('requires_receipt', v)}
                                />
                                <ToggleRow
                                    label={isArabic ? 'إيصال الدفع' : 'Payment receipt'}
                                    checked={data.has_receipt_toggle}
                                    onChange={(v) => setData('has_receipt_toggle', v)}
                                />
                                <div>
                                    <Label className="text-xs">{isArabic ? 'ملاحظات العميل' : 'Client notes'}</Label>
                                    <Textarea value={data.client_notes} onChange={(e) => setData('client_notes', e.target.value)} rows={2} />
                                </div>
                                <div>
                                    <Label className="text-xs">{isArabic ? 'شروط الدفع' : 'Payment terms'}</Label>
                                    <Textarea value={data.payment_terms} onChange={(e) => setData('payment_terms', e.target.value)} rows={2} />
                                </div>
                                <Field label={isArabic ? 'قبول المدفوعات عبر' : 'Accept payments via'}>
                                    <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bank_transfer">{isArabic ? 'الحساب المصرفي' : 'Bank account'}</SelectItem>
                                            <SelectItem value="tap">Tap</SelectItem>
                                            <SelectItem value="credit_card">{isArabic ? 'بطاقة ائتمان' : 'Credit card'}</SelectItem>
                                            <SelectItem value="mada">مدى</SelectItem>
                                            <SelectItem value="apple_pay">Apple Pay</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Totals sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">{isArabic ? 'الحسابات' : 'Totals'}</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <Row label={isArabic ? 'المجموع الفرعي' : 'Subtotal'} value={`${totals.subtotal.toFixed(2)}`} />
                                <div className="space-y-1.5">
                                    <Label className="text-xs">{isArabic ? 'الضريبة 1 (%)' : 'Tax 1 (%)'}</Label>
                                    <Input type="number" min={0} max={100} step="0.1" value={data.tax_rate} onChange={(e) => setData('tax_rate', parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">{isArabic ? 'الضريبة 2 (%)' : 'Tax 2 (%)'}</Label>
                                    <Input type="number" min={0} max={100} step="0.1" value={data.tax_rate_2} onChange={(e) => setData('tax_rate_2', parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">{isArabic ? 'خصم ثابت' : 'Flat discount'}</Label>
                                    <Input type="number" min={0} step="0.01" value={data.discount} onChange={(e) => setData('discount', parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">{isArabic ? 'خصم (%)' : 'Discount (%)'}</Label>
                                    <Input type="number" min={0} max={100} step="0.1" value={data.discount_percent} onChange={(e) => setData('discount_percent', parseFloat(e.target.value) || 0)} />
                                </div>
                                <Row label={isArabic ? 'الضريبة 1' : 'Tax 1'} value={totals.tax1.toFixed(2)} />
                                {data.tax_rate_2 > 0 && <Row label={isArabic ? 'الضريبة 2' : 'Tax 2'} value={totals.tax2.toFixed(2)} />}
                                <Row label={isArabic ? 'الخصم' : 'Discount'} value={`-${totals.discount.toFixed(2)}`} />
                                <div className="border-t pt-2">
                                    <Row label={isArabic ? 'الإجمالي' : 'Total'} value={`${totals.total.toFixed(2)} ${isArabic ? 'ر.س' : 'SAR'}`} bold />
                                </div>
                            </CardContent>
                        </Card>

                        <Button type="button" variant="outline" asChild className="w-full">
                            <Link href="/super-admin/invoices">{isArabic ? 'إلغاء' : 'Cancel'}</Link>
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
            <Label className="text-xs">{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className={`flex items-center justify-between text-sm ${bold ? 'font-bold' : ''}`}>
            <span className="text-muted-foreground">{label}</span>
            <span>{value}</span>
        </div>
    );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
            <span className="text-sm">{label}</span>
        </label>
    );
}
