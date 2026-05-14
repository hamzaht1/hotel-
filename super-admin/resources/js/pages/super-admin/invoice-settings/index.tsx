import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Building2, Landmark, FileText, Palette, Type, Image as ImageIcon, Hotel, Package, Eye, Save, Star, Trash2, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useStorageUrl } from '@/lib/storage';
import { useState, FormEventHandler } from 'react';

interface InvoiceSettings {
    id: number;
    company_name_ar: string | null;
    company_name_en: string | null;
    cr: string | null;
    vat: string | null;
    address_ar: string | null;
    address_en: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    footer_line: string | null;
    pdf_show_logo: boolean;
    pdf_show_company_info: boolean;
    pdf_show_bank_info: boolean;
    pdf_show_vat: boolean;
    pdf_show_customer_info: boolean;
    pdf_show_cr: boolean;
    pdf_show_terms: boolean;
    pdf_show_notes: boolean;
    pdf_show_discount_column: boolean;
    pdf_show_footer: boolean;
}

interface Branding {
    site_logo: string | null;
    primary_color: string;
    secondary_color: string;
    font_family: string;
}

interface BankAccount {
    id: number;
    bank_name_ar: string | null;
    bank_name_en: string | null;
    account_holder: string | null;
    account_number: string | null;
    iban: string | null;
    swift: string | null;
    is_default: boolean;
}

interface TermsTemplate {
    id: number;
    name: string;
    content_ar: string | null;
    content_en: string | null;
    is_default: boolean;
}

interface Props {
    settings: InvoiceSettings;
    branding: Branding;
    bankAccounts: BankAccount[];
    termsTemplates: TermsTemplate[];
    counters: { hotels: number; packages: number };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'إعدادات الفواتير', href: '/super-admin/invoice-settings' },
];

const VISIBILITY_FIELDS: Array<{ key: keyof InvoiceSettings; label: string }> = [
    { key: 'pdf_show_logo', label: 'الشعار' },
    { key: 'pdf_show_company_info', label: 'بيانات الشركة' },
    { key: 'pdf_show_bank_info', label: 'البيانات البنكية' },
    { key: 'pdf_show_customer_info', label: 'بيانات العميل' },
    { key: 'pdf_show_vat', label: 'الرقم الضريبي' },
    { key: 'pdf_show_cr', label: 'السجل التجاري' },
    { key: 'pdf_show_terms', label: 'الشروط والأحكام' },
    { key: 'pdf_show_notes', label: 'الملاحظات' },
    { key: 'pdf_show_discount_column', label: 'عمود الخصم' },
    { key: 'pdf_show_footer', label: 'تذييل الصفحة' },
];

export default function InvoiceSettings() {
    const { settings, branding, bankAccounts, termsTemplates, counters } = usePage().props as unknown as Props;
    const storageUrl = useStorageUrl();

    const { data, setData, post, processing } = useForm({
        company_name_ar: settings.company_name_ar ?? '',
        company_name_en: settings.company_name_en ?? '',
        cr: settings.cr ?? '',
        vat: settings.vat ?? '',
        address_ar: settings.address_ar ?? '',
        address_en: settings.address_en ?? '',
        phone: settings.phone ?? '',
        email: settings.email ?? '',
        website: settings.website ?? '',
        footer_line: settings.footer_line ?? '',
        pdf_show_logo: settings.pdf_show_logo,
        pdf_show_company_info: settings.pdf_show_company_info,
        pdf_show_bank_info: settings.pdf_show_bank_info,
        pdf_show_vat: settings.pdf_show_vat,
        pdf_show_customer_info: settings.pdf_show_customer_info,
        pdf_show_cr: settings.pdf_show_cr,
        pdf_show_terms: settings.pdf_show_terms,
        pdf_show_notes: settings.pdf_show_notes,
        pdf_show_discount_column: settings.pdf_show_discount_column,
        pdf_show_footer: settings.pdf_show_footer,
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color,
        font_family: branding.font_family,
        site_logo: null as File | null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('super-admin.invoice-settings.update'), { forceFormData: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="إعدادات الفواتير" />

            <form onSubmit={submit} className="space-y-4 p-4 pb-24" dir="rtl">
                <header className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">إعدادات الفواتير وعروض الأسعار</h1>
                </header>

                {/* Logo */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> الشعار · Logo</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] items-center">
                        <p className="text-sm text-muted-foreground">
                            ارفع شعار شركتك (JPG / PNG، حد أقصى 2MB). يظهر تلقائياً في جميع الفواتير وعروض الأسعار.
                        </p>
                        <div className="flex items-center gap-3">
                            {branding.site_logo ? (
                                <img src={storageUrl(branding.site_logo) ?? ''} alt="Logo" className="h-16 w-16 rounded border object-contain bg-white" />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">لا يوجد</div>
                            )}
                            <Input
                                type="file"
                                accept="image/png,image/jpeg"
                                onChange={(e) => setData('site_logo', e.target.files?.[0] ?? null)}
                                className="max-w-[200px]"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Company Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> بيانات الشركة · Company Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-3">
                        <Field label="اسم الشركة (عربي)" value={data.company_name_ar} onChange={(v) => setData('company_name_ar', v)} />
                        <Field label="Company Name (EN)" value={data.company_name_en} onChange={(v) => setData('company_name_en', v)} />
                        <Field label="السجل التجاري · CR" value={data.cr} onChange={(v) => setData('cr', v)} />
                        <Field label="الرقم الضريبي · VAT" value={data.vat} onChange={(v) => setData('vat', v)} />
                        <Field label="العنوان (عربي)" value={data.address_ar} onChange={(v) => setData('address_ar', v)} />
                        <Field label="Address (EN)" value={data.address_en} onChange={(v) => setData('address_en', v)} />
                        <Field label="الهاتف · Phone" value={data.phone} onChange={(v) => setData('phone', v)} />
                        <Field label="البريد · Email" type="email" value={data.email} onChange={(v) => setData('email', v)} />
                        <Field label="الموقع · Website" value={data.website} onChange={(v) => setData('website', v)} />
                    </CardContent>
                </Card>

                {/* Hotels (link out) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Hotel className="h-5 w-5" /> الفنادق (العملاء) · Hotels</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{counters.hotels} فندق مسجل في النظام</p>
                        <Link href={route('super-admin.clients.index')} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent">
                            إدارة الفنادق <ExternalLink className="h-4 w-4" />
                        </Link>
                    </CardContent>
                </Card>

                {/* Bank Accounts */}
                <BankAccountsCard accounts={bankAccounts} />

                {/* Footer line */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> تذييل الصفحة · Footer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input
                            value={data.footer_line}
                            onChange={(e) => setData('footer_line', e.target.value)}
                            placeholder="www.diafa.sa | info@diafa.sa | +966 50 000 0000"
                            dir="ltr"
                            className="text-left"
                        />
                    </CardContent>
                </Card>

                {/* Colors & Font */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> الألوان والخط</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-3">
                        <ColorField label="اللون الرئيسي" value={data.primary_color} onChange={(v) => setData('primary_color', v)} />
                        <ColorField label="اللون الفرعي" value={data.secondary_color} onChange={(v) => setData('secondary_color', v)} />
                        <Field label="الخط · Font" value={data.font_family} onChange={(v) => setData('font_family', v)} />
                    </CardContent>
                </Card>

                {/* Packages (link out) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> الباقات · Packages</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{counters.packages} باقة معرّفة</p>
                        <Link href={route('super-admin.plans.index')} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent">
                            إدارة الباقات <ExternalLink className="h-4 w-4" />
                        </Link>
                    </CardContent>
                </Card>

                {/* Terms Templates */}
                <TermsTemplatesCard templates={termsTemplates} />

                {/* PDF Element Visibility */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> التحكم في عرض العناصر</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-3">
                        {VISIBILITY_FIELDS.map(({ key, label }) => {
                            const k = key as 'pdf_show_logo';
                            return (
                                <label key={String(key)} className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                                    <Checkbox
                                        checked={Boolean(data[k])}
                                        onCheckedChange={(v) => setData(k, Boolean(v))}
                                    />
                                    <span className="text-sm">{label}</span>
                                </label>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Sticky save bar */}
                <div className="sticky bottom-0 -mx-4 -mb-4 border-t bg-background/95 backdrop-blur px-4 py-3 flex justify-end gap-2">
                    <Button type="submit" disabled={processing} className="gap-2">
                        <Save className="h-4 w-4" /> حفظ الإعدادات
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-9 w-12 rounded border cursor-pointer"
                />
                <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" dir="ltr" />
            </div>
        </div>
    );
}

// ─── Bank Accounts ─────────────────────────────────────────────────────────

function BankAccountsCard({ accounts }: { accounts: BankAccount[] }) {
    const [showAdd, setShowAdd] = useState(false);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" /> الحسابات البنكية · Bank Accounts</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> إضافة حساب
                </Button>
            </CardHeader>
            <CardContent className="space-y-3">
                {accounts.length === 0 && !showAdd && (
                    <p className="text-sm text-muted-foreground">لا توجد حسابات بنكية بعد</p>
                )}
                {accounts.map((acc) => (
                    <BankAccountRow key={acc.id} account={acc} />
                ))}
                {showAdd && <BankAccountRow account={null} onClose={() => setShowAdd(false)} />}
            </CardContent>
        </Card>
    );
}

function BankAccountRow({ account, onClose }: { account: BankAccount | null; onClose?: () => void }) {
    const isNew = account === null;
    const [data, setLocal] = useState({
        bank_name_ar: account?.bank_name_ar ?? '',
        bank_name_en: account?.bank_name_en ?? '',
        account_holder: account?.account_holder ?? '',
        account_number: account?.account_number ?? '',
        iban: account?.iban ?? '',
        swift: account?.swift ?? '',
    });

    const save = () => {
        if (isNew) {
            router.post(route('super-admin.invoice-settings.banks.store'), data, { onSuccess: () => onClose?.() });
        } else {
            router.put(route('super-admin.invoice-settings.banks.update', { bank: account!.id }), data);
        }
    };

    const remove = () => {
        if (!account) return onClose?.();
        if (!confirm('حذف الحساب؟')) return;
        router.delete(route('super-admin.invoice-settings.banks.destroy', { bank: account.id }));
    };

    const makeDefault = () => {
        if (!account) return;
        router.post(route('super-admin.invoice-settings.banks.default', { bank: account.id }));
    };

    return (
        <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {!isNew && (
                        <button type="button" onClick={makeDefault} title="تعيين كافتراضي">
                            <Star className={`h-5 w-5 ${account!.is_default ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </button>
                    )}
                    {!isNew && account!.is_default && <Badge variant="secondary">افتراضي</Badge>}
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={remove}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
                <Input placeholder="اسم البنك (عربي)" value={data.bank_name_ar} onChange={(e) => setLocal({ ...data, bank_name_ar: e.target.value })} />
                <Input placeholder="Bank name (EN)" value={data.bank_name_en} onChange={(e) => setLocal({ ...data, bank_name_en: e.target.value })} />
                <Input placeholder="صاحب الحساب" value={data.account_holder} onChange={(e) => setLocal({ ...data, account_holder: e.target.value })} />
                <Input placeholder="رقم الحساب" value={data.account_number} onChange={(e) => setLocal({ ...data, account_number: e.target.value })} dir="ltr" />
                <Input placeholder="IBAN" value={data.iban} onChange={(e) => setLocal({ ...data, iban: e.target.value })} dir="ltr" />
                <Input placeholder="SWIFT" value={data.swift} onChange={(e) => setLocal({ ...data, swift: e.target.value })} dir="ltr" />
            </div>
            <div className="flex justify-end">
                <Button type="button" size="sm" onClick={save}>{isNew ? 'إضافة' : 'حفظ'}</Button>
            </div>
        </div>
    );
}

// ─── Terms Templates ───────────────────────────────────────────────────────

function TermsTemplatesCard({ templates }: { templates: TermsTemplate[] }) {
    const [showAdd, setShowAdd] = useState(false);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> قوالب الشروط والأحكام · Terms Templates</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> إضافة قالب
                </Button>
            </CardHeader>
            <CardContent className="space-y-3">
                {templates.length === 0 && !showAdd && (
                    <p className="text-sm text-muted-foreground">لا توجد قوالب بعد</p>
                )}
                {templates.map((t) => (
                    <TermsTemplateRow key={t.id} template={t} />
                ))}
                {showAdd && <TermsTemplateRow template={null} onClose={() => setShowAdd(false)} />}
            </CardContent>
        </Card>
    );
}

function TermsTemplateRow({ template, onClose }: { template: TermsTemplate | null; onClose?: () => void }) {
    const isNew = template === null;
    const [data, setLocal] = useState({
        name: template?.name ?? '',
        content_ar: template?.content_ar ?? '',
        content_en: template?.content_en ?? '',
    });

    const save = () => {
        if (isNew) {
            router.post(route('super-admin.invoice-settings.terms.store'), data, { onSuccess: () => onClose?.() });
        } else {
            router.put(route('super-admin.invoice-settings.terms.update', { terms: template!.id }), data);
        }
    };

    const remove = () => {
        if (!template) return onClose?.();
        if (!confirm('حذف القالب؟')) return;
        router.delete(route('super-admin.invoice-settings.terms.destroy', { terms: template.id }));
    };

    const makeDefault = () => {
        if (!template) return;
        router.post(route('super-admin.invoice-settings.terms.default', { terms: template.id }));
    };

    return (
        <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {!isNew && (
                        <button type="button" onClick={makeDefault} title="تعيين كافتراضي">
                            <Star className={`h-5 w-5 ${template!.is_default ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </button>
                    )}
                    {!isNew && template!.is_default && <Badge variant="secondary">افتراضي</Badge>}
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={remove}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
            </div>
            <Input placeholder="اسم القالب" value={data.name} onChange={(e) => setLocal({ ...data, name: e.target.value })} />
            <div className="grid gap-2 sm:grid-cols-2">
                <Textarea placeholder="المحتوى (عربي)" value={data.content_ar} onChange={(e) => setLocal({ ...data, content_ar: e.target.value })} rows={5} />
                <Textarea placeholder="Content (EN)" value={data.content_en} onChange={(e) => setLocal({ ...data, content_en: e.target.value })} rows={5} dir="ltr" />
            </div>
            <div className="flex justify-end">
                <Button type="button" size="sm" onClick={save}>{isNew ? 'إضافة' : 'حفظ'}</Button>
            </div>
        </div>
    );
}
