import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Save, ShieldCheck, Mail, Phone, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

interface Config {
    fields: Record<string, FieldConfig>;
    require_email_verification: boolean;
    require_phone_verification: boolean;
}

interface Props {
    config: Config;
}

type FormShape = {
    require_email_verification: boolean;
    require_phone_verification: boolean;
    fields: Record<string, { enabled: boolean; required: boolean }>;
};

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
    });

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

                <div className="flex justify-end">
                    <Button type="submit" disabled={processing}>
                        <Save className="h-4 w-4" /> {isArabic ? 'حفظ الإعدادات' : 'Save settings'}
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}
