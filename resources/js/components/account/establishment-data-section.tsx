import { useT } from '@/hooks/use-translations';
import { router, useForm, usePage } from '@inertiajs/react';
import { Save, Building2, UserRound, Clock3, CheckCircle2, AlertCircle, FileCheck2, FolderArchive, Upload, Trash2, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import OtpGate from '@/components/account/otp-gate';
import { Button } from '@/components/ui/button';

export interface HotelSettings {
    hotel_name_ar: string;
    hotel_name_en: string;
    first_name: string | null;
    last_name: string | null;
    city: string | null;
    phone: string | null;
    description_ar: string | null;
    description_en: string | null;
    star_rating: number;
    currency: string;
    timezone: string;
    check_in_time: string;
    check_out_time: string;
    primary_color: { light?: string; dark?: string } | null;
    secondary_color: { light?: string; dark?: string } | null;
    commercial_activity: string | null;
    cr_number: string | null;
    cr_expiry: string | null;
    vat_number: string | null;
    license_number: string | null;
    license_expiry: string | null;
}

export interface EstablishmentDocument {
    id: number;
    type: string;
    title: string;
    file_url: string | null;
    expires_at: string | null;
    status: string;
    created_at: string | null;
}

/**
 * Body of the Establishment Data screen. Extracted from
 * `hotel-settings/edit.tsx` so it can also live as a tab inside the
 * unified Establishment Account page without duplicating the form.
 */
export default function EstablishmentDataSection({ settings, documents = [] }: { settings: HotelSettings; documents?: EstablishmentDocument[] }) {
    const { t } = useT();
    const flash = (usePage().props as any).flash as { success?: string } | undefined;
    const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    const [otpOpen, setOtpOpen] = useState(false);

    // primary_color / secondary_color are no longer edited here (the Branding
    // section was removed) but stay in the payload so saving the form keeps the
    // tenant's existing template colors untouched.
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        hotel_name_ar: settings.hotel_name_ar || '',
        hotel_name_en: settings.hotel_name_en || '',
        first_name: settings.first_name || '',
        last_name: settings.last_name || '',
        city: settings.city || '',
        phone: settings.phone || '',
        description_ar: settings.description_ar || '',
        description_en: settings.description_en || '',
        star_rating: String(settings.star_rating || 5),
        currency: settings.currency || 'SAR',
        timezone: settings.timezone || 'Asia/Riyadh',
        check_in_time: settings.check_in_time || '14:00',
        check_out_time: settings.check_out_time || '12:00',
        primary_color: settings.primary_color || { light: '#A67D5F', dark: '#C9A882' },
        secondary_color: settings.secondary_color || { light: '#C9A882', dark: '#A67D5F' },
        commercial_activity: settings.commercial_activity || '',
        cr_number: settings.cr_number || '',
        cr_expiry: settings.cr_expiry || '',
        vat_number: settings.vat_number || '',
        license_number: settings.license_number || '',
        license_expiry: settings.license_expiry || '',
    });

    // Saving the profile is gated by OTP — submit opens the gate, and the actual
    // PUT only fires once the server confirms a verified window.
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setOtpOpen(true);
    }

    function doSave() {
        post('/client-admin/hotel-settings');
    }

    return (
        <div className="mx-auto max-w-3xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 p-3.5 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {Object.keys(errors).length > 0 && (
                    <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                        <p className="flex items-center gap-2 font-medium">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {t('form_has_errors') || 'Please fix the following:'}
                        </p>
                        <ul className="mt-1.5 list-inside list-disc ps-1">
                            {Object.entries(errors).map(([field, msg]) => (
                                <li key={field}>{msg as string}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <Section icon={Building2} title={t('hotel_identity')} description={t('hotel_identity_desc')}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label={t('hotel_name_ar')} error={errors.hotel_name_ar}>
                            <input type="text" value={data.hotel_name_ar} onChange={(e) => setData('hotel_name_ar', e.target.value)} className="vuexy-input" required dir="rtl" />
                        </Field>
                        <Field label={t('hotel_name_en')} error={errors.hotel_name_en}>
                            <input type="text" value={data.hotel_name_en} onChange={(e) => setData('hotel_name_en', e.target.value)} className="vuexy-input" required />
                        </Field>
                        <Field label={t('desc_ar')} error={errors.description_ar}>
                            <textarea value={data.description_ar} onChange={(e) => setData('description_ar', e.target.value)} className="vuexy-input" rows={3} dir="rtl" />
                        </Field>
                        <Field label={t('desc_en')} error={errors.description_en}>
                            <textarea value={data.description_en} onChange={(e) => setData('description_en', e.target.value)} className="vuexy-input" rows={3} />
                        </Field>
                        <Field label={t('star_rating')} error={errors.star_rating}>
                            <select value={data.star_rating} onChange={(e) => setData('star_rating', e.target.value)} className="vuexy-input">
                                {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r} {t('stars')}</option>)}
                            </select>
                        </Field>
                        <Field label={t('currency')} error={errors.currency}>
                            <select value={data.currency} onChange={(e) => setData('currency', e.target.value)} className="vuexy-input">
                                <option value="SAR">SAR - Saudi Riyal</option>
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="AED">AED - UAE Dirham</option>
                            </select>
                        </Field>
                    </div>
                </Section>

                <Section icon={UserRound} title={t('responsible_person')} description={t('responsible_person_desc')}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label={t('first_name')} error={errors.first_name}>
                            <input type="text" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} className="vuexy-input" />
                        </Field>
                        <Field label={t('last_name')} error={errors.last_name}>
                            <input type="text" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} className="vuexy-input" />
                        </Field>
                        <Field label={t('city')} error={errors.city}>
                            <input type="text" value={data.city} onChange={(e) => setData('city', e.target.value)} className="vuexy-input" />
                        </Field>
                        <Field label={t('mobile')} error={errors.phone}>
                            <div className="flex overflow-hidden rounded-md border focus-within:ring-2 focus-within:ring-primary/30" dir="ltr">
                                <span className="flex select-none items-center bg-muted px-3 text-sm font-medium text-muted-foreground">+966</span>
                                <input type="tel" value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="vuexy-input flex-1 rounded-none border-0 focus:ring-0" inputMode="tel" />
                            </div>
                        </Field>
                    </div>
                </Section>

                <Section icon={Clock3} title={t('operations')} description={t('operations_desc')}>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Field label={t('timezone')} error={errors.timezone}>
                            <select value={data.timezone} onChange={(e) => setData('timezone', e.target.value)} className="vuexy-input">
                                <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                                <option value="Asia/Kuwait">Asia/Kuwait (GMT+3)</option>
                                <option value="UTC">UTC</option>
                            </select>
                        </Field>
                        <Field label={t('check_in')} error={errors.check_in_time}>
                            <input type="time" value={data.check_in_time} onChange={(e) => setData('check_in_time', e.target.value)} className="vuexy-input" />
                        </Field>
                        <Field label={t('check_out')} error={errors.check_out_time}>
                            <input type="time" value={data.check_out_time} onChange={(e) => setData('check_out_time', e.target.value)} className="vuexy-input" />
                        </Field>
                    </div>
                </Section>

                <Section icon={FileCheck2} title={isArabic ? 'الامتثال والبيانات النظامية' : 'Compliance & Legal'} description={isArabic ? 'السجل التجاري والرقم الضريبي والتراخيص' : 'Commercial registration, VAT and licenses'}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label={isArabic ? 'النشاط التجاري' : 'Commercial activity'} error={errors.commercial_activity}>
                            <input type="text" value={data.commercial_activity} onChange={(e) => setData('commercial_activity', e.target.value)} className="vuexy-input" />
                        </Field>
                        <Field label={isArabic ? 'الرقم الضريبي (VAT)' : 'VAT number'} error={errors.vat_number}>
                            <input type="text" value={data.vat_number} onChange={(e) => setData('vat_number', e.target.value)} className="vuexy-input" dir="ltr" />
                        </Field>
                        <Field label={isArabic ? 'رقم السجل التجاري' : 'CR number'} error={errors.cr_number}>
                            <input type="text" value={data.cr_number} onChange={(e) => setData('cr_number', e.target.value)} className="vuexy-input" dir="ltr" />
                        </Field>
                        <Field label={isArabic ? 'تاريخ انتهاء السجل' : 'CR expiry'} error={errors.cr_expiry}>
                            <input type="date" value={data.cr_expiry} onChange={(e) => setData('cr_expiry', e.target.value)} className="vuexy-input" />
                        </Field>
                        <Field label={isArabic ? 'رقم الترخيص' : 'License number'} error={errors.license_number}>
                            <input type="text" value={data.license_number} onChange={(e) => setData('license_number', e.target.value)} className="vuexy-input" dir="ltr" />
                        </Field>
                        <Field label={isArabic ? 'تاريخ انتهاء الترخيص' : 'License expiry'} error={errors.license_expiry}>
                            <input type="date" value={data.license_expiry} onChange={(e) => setData('license_expiry', e.target.value)} className="vuexy-input" />
                        </Field>
                    </div>
                </Section>

                <div className="flex items-center justify-end gap-3 border-t pt-4">
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {isArabic ? 'يتطلب الحفظ تحققاً عبر رمز' : 'Saving requires OTP verification'}
                    </span>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? t('saving') : t('save_settings')}
                    </button>
                </div>
            </form>

            <DocumentsManager documents={documents} isArabic={isArabic} />

            <OtpGate
                action="profile_update"
                open={otpOpen}
                onClose={() => setOtpOpen(false)}
                onVerified={doSave}
                title={isArabic ? 'تأكيد تعديل البيانات' : 'Confirm profile edit'}
            />
        </div>
    );
}

function DocumentsManager({ documents, isArabic }: { documents: EstablishmentDocument[]; isArabic: boolean }) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        type: string;
        title: string;
        expires_at: string;
        file: File | null;
    }>({ type: 'cr', title: '', expires_at: '', file: null });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/client-admin/account/documents', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    function remove(id: number) {
        router.delete(`/client-admin/account/documents/${id}`, { preserveScroll: true });
    }

    const typeLabel = (type: string) =>
        isArabic
            ? { cr: 'سجل تجاري', license: 'ترخيص', other: 'أخرى' }[type] ?? type
            : { cr: 'CR', license: 'License', other: 'Other' }[type] ?? type;

    return (
        <div className="mt-6">
            <Section icon={FolderArchive} title={isArabic ? 'المستندات النظامية' : 'Regulatory documents'} description={isArabic ? 'ارفع نسخاً من سجلك التجاري وتراخيصك ومستنداتك' : 'Upload copies of your CR, licenses and documents'}>
                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-1">
                        <label className="mb-1.5 block text-sm font-medium">{isArabic ? 'النوع' : 'Type'}</label>
                        <select value={data.type} onChange={(e) => setData('type', e.target.value)} className="vuexy-input">
                            <option value="cr">{typeLabel('cr')}</option>
                            <option value="license">{typeLabel('license')}</option>
                            <option value="other">{typeLabel('other')}</option>
                        </select>
                    </div>
                    <div className="sm:col-span-1">
                        <label className="mb-1.5 block text-sm font-medium">{isArabic ? 'العنوان' : 'Title'}</label>
                        <input type="text" value={data.title} onChange={(e) => setData('title', e.target.value)} className="vuexy-input" required />
                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                    </div>
                    <div className="sm:col-span-1">
                        <label className="mb-1.5 block text-sm font-medium">{isArabic ? 'تاريخ الانتهاء' : 'Expiry'}</label>
                        <input type="date" value={data.expires_at} onChange={(e) => setData('expires_at', e.target.value)} className="vuexy-input" />
                    </div>
                    <div className="sm:col-span-1">
                        <label className="mb-1.5 block text-sm font-medium">{isArabic ? 'الملف' : 'File'}</label>
                        <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setData('file', e.target.files?.[0] || null)} className="vuexy-input cursor-pointer" required />
                        {errors.file && <p className="mt-1 text-xs text-red-500">{errors.file}</p>}
                    </div>
                    <div className="sm:col-span-4 flex justify-end">
                        <Button type="submit" disabled={processing || !data.file}>
                            <Upload className="h-4 w-4 me-2" />
                            {processing ? (isArabic ? 'جاري الرفع...' : 'Uploading...') : (isArabic ? 'رفع المستند' : 'Upload document')}
                        </Button>
                    </div>
                </form>

                <div className="mt-5 divide-y rounded-lg border">
                    {documents.length === 0 && (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                            {isArabic ? 'لا توجد مستندات بعد' : 'No documents yet'}
                        </p>
                    )}
                    {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-3 p-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{doc.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {typeLabel(doc.type)}
                                    {doc.expires_at && ` · ${isArabic ? 'ينتهي' : 'expires'} ${doc.expires_at}`}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                {doc.file_url && (
                                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                                        {isArabic ? 'عرض' : 'View'}
                                    </a>
                                )}
                                <button type="button" onClick={() => remove(doc.id)} className="text-red-500 hover:text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    );
}

function Section({
    icon: Icon,
    title,
    description,
    children,
}: {
    icon: LucideIcon;
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="vuexy-card overflow-hidden">
            <div className="flex items-start gap-3 border-b bg-muted/30 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-base font-semibold">{title}</h2>
                    {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
                </div>
            </div>
            <div className="p-5 sm:p-6">{children}</div>
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}
