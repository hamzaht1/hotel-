import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Save, ShieldCheck, Mail, Phone, Building2, User, Plus, Trash2, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/hooks/use-translations';

interface FieldConfig {
    key: string;
    step: 'org' | 'account';
    label_ar: string;
    label_en: string;
    enabled: boolean;
    required: boolean;
}

type CustomType = 'text' | 'textarea' | 'number' | 'email' | 'tel' | 'date' | 'select';

interface CustomFieldConfig {
    key: string;
    label_ar: string;
    label_en: string;
    type: CustomType;
    step: 'org' | 'account';
    required: boolean;
    enabled: boolean;
    options: string[];
}

interface Config {
    fields: Record<string, FieldConfig>;
    custom_fields: CustomFieldConfig[];
    require_email_verification: boolean;
    require_phone_verification: boolean;
}

interface Props {
    config: Config;
}

// In the editor, options are edited as a single comma-separated string.
type CustomFieldRow = {
    key: string;
    label_ar: string;
    label_en: string;
    type: CustomType;
    step: 'org' | 'account';
    required: boolean;
    enabled: boolean;
    options: string;
};

type FormShape = {
    require_email_verification: boolean;
    require_phone_verification: boolean;
    fields: Record<string, { enabled: boolean; required: boolean }>;
    custom_fields: CustomFieldRow[];
};

const CUSTOM_TYPES: CustomType[] = ['text', 'textarea', 'number', 'email', 'tel', 'date', 'select'];

export default function RegistrationSettings({ config }: Props) {
    const { isArabic } = useT();
    const flash = usePage().props.flash as { success?: string } | undefined;

    const fieldList = Object.values(config.fields);

    const { data, setData, put, processing } = useForm<FormShape>({
        require_email_verification: config.require_email_verification,
        require_phone_verification: config.require_phone_verification,
        fields: Object.fromEntries(
            fieldList.map((f) => [f.key, { enabled: f.enabled, required: f.required }]),
        ),
        custom_fields: (config.custom_fields ?? []).map((f) => ({
            key: f.key,
            label_ar: f.label_ar,
            label_en: f.label_en,
            type: f.type,
            step: f.step,
            required: f.required,
            enabled: f.enabled,
            options: (f.options ?? []).join(', '),
        })),
    });

    function addCustomField() {
        setData('custom_fields', [
            ...data.custom_fields,
            { key: '', label_ar: '', label_en: '', type: 'text', step: 'account', required: false, enabled: true, options: '' },
        ]);
    }

    function patchCustomField(index: number, patch: Partial<CustomFieldRow>) {
        setData(
            'custom_fields',
            data.custom_fields.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        );
    }

    function removeCustomField(index: number) {
        setData('custom_fields', data.custom_fields.filter((_, i) => i !== index));
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: isArabic ? 'المشرف' : 'Super admin', href: '/super-admin' },
        { title: isArabic ? 'نموذج التسجيل' : 'Registration form', href: '/super-admin/registration-settings' },
    ];

    function patchField(key: string, patch: Partial<{ enabled: boolean; required: boolean }>) {
        const next = { ...data.fields[key], ...patch };
        // A disabled field can't stay required.
        if (patch.enabled === false) next.required = false;
        setData('fields', { ...data.fields, [key]: next });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put('/super-admin/registration-settings', { preserveScroll: true });
    }

    const renderGroup = (step: 'org' | 'account', title: string, Icon: typeof Building2) => {
        const rows = fieldList.filter((f) => f.step === step);
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Icon className="h-4 w-4" /> {title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-y bg-muted/50 text-muted-foreground">
                                <th className="px-4 py-2 text-start font-medium">{isArabic ? 'الحقل' : 'Field'}</th>
                                <th className="px-4 py-2 text-center font-medium w-28">{isArabic ? 'ظاهر' : 'Shown'}</th>
                                <th className="px-4 py-2 text-center font-medium w-28">{isArabic ? 'إلزامي' : 'Required'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((f) => {
                                const state = data.fields[f.key];
                                return (
                                    <tr key={f.key} className="border-b last:border-0">
                                        <td className="px-4 py-2.5">{isArabic ? f.label_ar : f.label_en}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            <Checkbox
                                                checked={state.enabled}
                                                onCheckedChange={(v) => patchField(f.key, { enabled: v === true })}
                                            />
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <Checkbox
                                                checked={state.required}
                                                disabled={!state.enabled}
                                                onCheckedChange={(v) => patchField(f.key, { required: v === true })}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'إعدادات نموذج التسجيل' : 'Registration form settings'} />
            <form onSubmit={submit} className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{isArabic ? 'نموذج التسجيل' : 'Registration form'}</h1>
                        <p className="text-sm text-muted-foreground">
                            {isArabic
                                ? 'تحكّم في الحقول التي تظهر للعميل عند التسجيل وأيها إلزامي، وطلب التحقق من البريد والجوال.'
                                : 'Control which fields the client sees at registration, which are required, and email/phone verification.'}
                        </p>
                    </div>
                    <Button type="submit" disabled={processing}>
                        <Save className="h-4 w-4" /> {isArabic ? 'حفظ' : 'Save'}
                    </Button>
                </div>

                {/* Verification */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {isArabic ? 'التحقق' : 'Verification'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                checked={data.require_email_verification}
                                onCheckedChange={(v) => setData('require_email_verification', v === true)}
                            />
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{isArabic ? 'طلب التحقق من البريد الإلكتروني (رمز OTP)' : 'Require email verification (OTP)'}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                checked={data.require_phone_verification}
                                onCheckedChange={(v) => setData('require_phone_verification', v === true)}
                            />
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{isArabic ? 'طلب التحقق من رقم الجوال (رمز OTP)' : 'Require phone verification (OTP)'}</span>
                        </label>
                        <p className="text-xs text-amber-600">
                            {isArabic
                                ? 'ملاحظة: إرسال رسائل التحقق عبر SMS سيتم تفعيله عند ربط مزوّد الرسائل. حالياً يُسجَّل الرمز في السجل.'
                                : 'Note: sending verification SMS will be enabled once an SMS provider is connected. For now the code is written to the log.'}
                        </p>
                    </CardContent>
                </Card>

                {renderGroup('org', isArabic ? 'بيانات المنشأة' : 'Establishment fields', Building2)}
                {renderGroup('account', isArabic ? 'بيانات الحساب' : 'Account fields', User)}

                {/* Custom fields */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ListPlus className="h-4 w-4" /> {isArabic ? 'حقول مخصّصة' : 'Custom fields'}
                            </CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                                <Plus className="h-4 w-4" /> {isArabic ? 'إضافة حقل' : 'Add field'}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isArabic
                                ? 'أضف حقولاً إضافية تظهر في نموذج التسجيل، وتحكّم في اسم الحقل ونوع الإدخال والخطوة.'
                                : 'Add extra fields shown in the signup form; control the name, input type and step.'}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data.custom_fields.length === 0 && (
                            <p className="text-sm text-muted-foreground">{isArabic ? 'لا توجد حقول مخصّصة بعد.' : 'No custom fields yet.'}</p>
                        )}
                        {data.custom_fields.map((row, i) => (
                            <div key={i} className="rounded-lg border p-3 space-y-3">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">{isArabic ? 'الاسم (عربي)' : 'Name (Arabic)'}</label>
                                        <Input value={row.label_ar} dir="rtl" onChange={(e) => patchCustomField(i, { label_ar: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">{isArabic ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
                                        <Input value={row.label_en} onChange={(e) => patchCustomField(i, { label_en: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">{isArabic ? 'نوع الإدخال' : 'Input type'}</label>
                                        <select
                                            value={row.type}
                                            onChange={(e) => patchCustomField(i, { type: e.target.value as CustomType })}
                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                        >
                                            {CUSTOM_TYPES.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">{isArabic ? 'الخطوة' : 'Step'}</label>
                                        <select
                                            value={row.step}
                                            onChange={(e) => patchCustomField(i, { step: e.target.value as 'org' | 'account' })}
                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                        >
                                            <option value="org">{isArabic ? 'بيانات المنشأة' : 'Establishment'}</option>
                                            <option value="account">{isArabic ? 'بيانات الحساب' : 'Account'}</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end gap-4">
                                        <label className="flex items-center gap-2 text-sm">
                                            <Checkbox checked={row.enabled} onCheckedChange={(v) => patchCustomField(i, { enabled: v === true, ...(v === true ? {} : { required: false }) })} />
                                            {isArabic ? 'ظاهر' : 'Shown'}
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <Checkbox checked={row.required} disabled={!row.enabled} onCheckedChange={(v) => patchCustomField(i, { required: v === true })} />
                                            {isArabic ? 'إلزامي' : 'Required'}
                                        </label>
                                    </div>
                                </div>
                                {row.type === 'select' && (
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">
                                            {isArabic ? 'الخيارات (مفصولة بفواصل)' : 'Options (comma-separated)'}
                                        </label>
                                        <Input value={row.options} onChange={(e) => patchCustomField(i, { options: e.target.value })} placeholder="A, B, C" />
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeCustomField(i)}>
                                        <Trash2 className="h-4 w-4" /> {isArabic ? 'حذف' : 'Remove'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={processing}>
                        <Save className="h-4 w-4" /> {isArabic ? 'حفظ الإعدادات' : 'Save settings'}
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}
