import { useT } from '@/hooks/use-translations';
import { router, useForm, usePage } from '@inertiajs/react';
import {
    Save, Building2, UserRound, Clock3, CheckCircle2, AlertCircle, FileCheck2, FolderArchive,
    Upload, Trash2, ShieldCheck, Pencil, Layers, Store, Phone, Mail, MapPin, Hash, BookText,
    Landmark, CalendarClock, FileText,
} from 'lucide-react';
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
    branches_count: number | null;
    manager_type: string | null;
    responsible_position: string | null;
    cr_number: string | null;
    cr_expiry: string | null;
    vat_number: string | null;
    license_number: string | null;
    license_expiry: string | null;
    municipality_license_number: string | null;
    municipality_license_expiry: string | null;
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
 * "Establishment data & documentation" tab. Defaults to a polished read-only
 * view (official data + uploaded documents); the "Edit" button reveals the
 * OTP-gated edit form. Used inside the unified Establishment Account page.
 */
export default function EstablishmentDataSection({
    settings,
    documents = [],
    contactEmail,
}: {
    settings: HotelSettings;
    documents?: EstablishmentDocument[];
    contactEmail?: string | null;
}) {
    const [editing, setEditing] = useState(false);

    if (editing) {
        return <EstablishmentEditForm settings={settings} documents={documents} onDone={() => setEditing(false)} />;
    }
    return <OfficialDataView settings={settings} documents={documents} contactEmail={contactEmail} onEdit={() => setEditing(true)} />;
}

// ─────────────────────────────── Read-only view ───────────────────────────────

const DOC_TYPES: { key: string; label_ar: string; label_en: string }[] = [
    { key: 'cr', label_ar: 'السجل التجاري', label_en: 'Commercial Registration' },
    { key: 'tourism_license', label_ar: 'ترخيص وزارة السياحة', label_en: 'Tourism License' },
    { key: 'zatca', label_ar: 'شهادة الزكاة والضريبة ZATCA', label_en: 'ZATCA Certificate' },
    { key: 'municipality_license', label_ar: 'رخصة البلدية', label_en: 'Municipality License' },
    { key: 'other', label_ar: 'أخرى', label_en: 'Other' },
];

function formatDate(value: string | null, isArabic: boolean): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString(isArabic ? 'ar' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function OfficialDataView({
    settings,
    documents,
    contactEmail,
    onEdit,
}: {
    settings: HotelSettings;
    documents: EstablishmentDocument[];
    contactEmail?: string | null;
    onEdit: () => void;
}) {
    const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

    const managerLabel = settings.manager_type === 'owner'
        ? (isArabic ? 'مالك' : 'Owner')
        : settings.manager_type === 'manager'
            ? (isArabic ? 'مدير' : 'Manager')
            : '—';

    const cells: { label: string; value: string; icon: LucideIcon }[] = [
        { label: isArabic ? 'اسم المنشأة' : 'Establishment name', value: (isArabic ? settings.hotel_name_ar : settings.hotel_name_en) || '—', icon: Building2 },
        { label: isArabic ? 'نوع النشاط' : 'Activity type', value: settings.commercial_activity || '—', icon: Store },
        { label: isArabic ? 'عدد الفروع' : 'Branches', value: settings.branches_count != null ? `${settings.branches_count} ${isArabic ? 'فرع' : 'branch(es)'}` : '—', icon: Layers },
        { label: isArabic ? 'من يدير المنشأة' : 'Managed by', value: managerLabel, icon: UserRound },
        { label: isArabic ? 'منصب المسؤول' : 'Responsible position', value: settings.responsible_position || '—', icon: UserRound },
        { label: isArabic ? 'رقم الهاتف المسجل' : 'Registered phone', value: settings.phone || '—', icon: Phone },
        { label: isArabic ? 'البريد الإلكتروني' : 'Email', value: contactEmail || '—', icon: Mail },
        { label: isArabic ? 'المدينة' : 'City', value: settings.city || '—', icon: MapPin },
        { label: isArabic ? 'رقم السجل التجاري' : 'CR number', value: settings.cr_number || '—', icon: Hash },
        { label: isArabic ? 'ترخيص وزارة السياحة' : 'Tourism license', value: settings.license_number || '—', icon: ShieldCheck },
        { label: isArabic ? 'انتهاء الترخيص السياحي' : 'Tourism license expiry', value: formatDate(settings.license_expiry, isArabic), icon: CalendarClock },
        { label: isArabic ? 'رقم رخصة البلدية (بلدي)' : 'Municipality license (Balady)', value: settings.municipality_license_number || '—', icon: BookText },
        { label: isArabic ? 'انتهاء رخصة البلدية' : 'Municipality license expiry', value: formatDate(settings.municipality_license_expiry, isArabic), icon: Landmark },
    ];

    const shownDocTypes = DOC_TYPES.filter((dt) => dt.key !== 'other' || documents.some((d) => d.type === 'other'));

    return (
        <div className="flex flex-col gap-6">
            {/* Section heading */}
            <div>
                <h2 className="text-xl font-bold">{isArabic ? 'بيانات المنشأة والتوثيق' : 'Establishment data & documentation'}</h2>
                <p className="text-sm text-muted-foreground">
                    {isArabic ? 'المعلومات الرسمية المستخدمة في التذييل القانوني لموقعك' : 'Official information used in your site’s legal footer'}
                </p>
            </div>

            <div className="vuexy-card overflow-hidden">
                {/* Dark header bar with edit button */}
                <div className="flex items-center justify-between gap-3 bg-[#01004C] px-5 py-4 text-white">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium transition hover:bg-white/20"
                    >
                        <Pencil className="h-4 w-4" />
                        {isArabic ? 'تعديل البيانات' : 'Edit data'}
                    </button>
                    <h3 className="text-base font-semibold">{isArabic ? 'بيانات المنشأة الرسمية' : 'Official establishment data'}</h3>
                </div>

                {/* Info cells */}
                <div className="grid gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-3">
                    {cells.map((c) => (
                        <div key={c.label} className="flex items-start justify-between gap-3 bg-background p-4">
                            <div className="min-w-0 text-end">
                                <p className="text-xs text-muted-foreground">{c.label}</p>
                                <p className="mt-1 truncate font-semibold" title={c.value} dir="auto">{c.value}</p>
                            </div>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <c.icon className="h-4 w-4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Uploaded documents */}
            <div>
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{isArabic ? 'المرفقات الرسمية المرفوعة' : 'Uploaded official attachments'}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {shownDocTypes.map((dt) => {
                        const doc = documents.find((d) => d.type === dt.key);
                        return (
                            <div key={dt.key} className="vuexy-card flex items-center justify-between gap-3 p-4">
                                <span className="text-sm font-medium">{isArabic ? dt.label_ar : dt.label_en}</span>
                                {doc?.file_url ? (
                                    <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                                    >
                                        <FileText className="h-3.5 w-3.5" /> PDF
                                    </a>
                                ) : (
                                    <span className="text-xs text-muted-foreground">{isArabic ? 'غير مرفوع' : 'Not uploaded'}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────── Edit form ───────────────────────────────

function EstablishmentEditForm({
    settings,
    documents,
    onDone,
}: {
    settings: HotelSettings;
    documents: EstablishmentDocument[];
    onDone: () => void;
}) {
    const { t } = useT();
    const flash = (usePage().props as any).flash as { success?: string } | undefined;
    const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    const [otpOpen, setOtpOpen] = useState(false);

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
        branches_count: settings.branches_count != null ? String(settings.branches_count) : '',
        manager_type: settings.manager_type || '',
        responsible_position: settings.responsible_position || '',
        cr_number: settings.cr_number || '',
        cr_expiry: settings.cr_expiry || '',
        vat_number: settings.vat_number || '',
        license_number: settings.license_number || '',
        license_expiry: settings.license_expiry || '',
        municipality_license_number: settings.municipality_license_number || '',
        municipality_license_expiry: settings.municipality_license_expiry || '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setOtpOpen(true);
    }

    function doSave() {
        post('/client-admin/hotel-settings', { onSuccess: () => onDone() });
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex items-center justify-between">
                <button type="button" onClick={onDone} className="text-sm text-muted-foreground hover:text-foreground">
                    ← {isArabic ? 'رجوع للعرض' : 'Back to view'}
                </button>
                <h2 className="text-lg font-bold">{isArabic ? 'تعديل بيانات المنشأة' : 'Edit establishment data'}</h2>
            </div>

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
                        <Field label={isArabic ? 'نوع النشاط' : 'Activity type'} error={errors.commercial_activity}>
                            <input type="text" value={data.commercial_activity} onChange={(e) => setData('commercial_activity', e.target.value)} className="vuexy-input" placeholder={isArabic ? 'فندق' : 'Hotel'} />
                        </Field>
                        <Field label={isArabic ? 'عدد الفروع' : 'Branches count'} error={errors.branches_count}>
                            <input type="number" min={0} value={data.branches_count} onChange={(e) => setData('branches_count', e.target.value)} className="vuexy-input" />
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
                        <Field label={isArabic ? 'من يدير المنشأة' : 'Managed by'} error={errors.manager_type}>
                            <select value={data.manager_type} onChange={(e) => setData('manager_type', e.target.value)} className="vuexy-input">
                                <option value="">{isArabic ? 'اختر' : 'Select'}</option>
                                <option value="owner">{isArabic ? 'مالك' : 'Owner'}</option>
                                <option value="manager">{isArabic ? 'مدير' : 'Manager'}</option>
                            </select>
                        </Field>
                        <Field label={isArabic ? 'منصب المسؤول' : 'Responsible position'} error={errors.responsible_position}>
                            <input type="text" value={data.responsible_position} onChange={(e) => setData('responsible_position', e.target.value)} className="vuexy-input" placeholder={isArabic ? 'مدير عام' : 'General Manager'} />
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

                <Section icon={FileCheck2} title={isArabic ? 'التراخيص والبيانات النظامية' : 'Licenses & legal'} description={isArabic ? 'السجل التجاري، الترخيص السياحي، رخصة البلدية والرقم الضريبي' : 'CR, tourism license, municipality license and VAT'}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label={isArabic ? 'رقم السجل التجاري' : 'CR number'} error={errors.cr_number}>
                            <input type="text" value={data.cr_number} onChange={(e) => setData('cr_number', e.target.value)} className="vuexy-input" dir="ltr" />
                        </Field>
                        <Field label={isArabic ? 'الرقم الضريبي (VAT)' : 'VAT number'} error={errors.vat_number}>
                            <input type="text" value={data.vat_number} onChange={(e) => setData('vat_number', e.target.value)} className="vuexy-input" dir="ltr" />
                        </Field>
                        <Field label={isArabic ? 'رقم ترخيص وزارة السياحة' : 'Tourism license number'} error={errors.license_number}>
                            <input type="text" value={data.license_number} onChange={(e) => setData('license_number', e.target.value)} className="vuexy-input" dir="ltr" />
                        </Field>
                        <Field label={isArabic ? 'انتهاء الترخيص السياحي' : 'Tourism license expiry'} error={errors.license_expiry}>
                            <input type="date" value={data.license_expiry} onChange={(e) => setData('license_expiry', e.target.value)} className="vuexy-input" />
                        </Field>
                        <Field label={isArabic ? 'رقم رخصة البلدية (بلدي)' : 'Municipality license (Balady)'} error={errors.municipality_license_number}>
                            <input type="text" value={data.municipality_license_number} onChange={(e) => setData('municipality_license_number', e.target.value)} className="vuexy-input" dir="ltr" />
                        </Field>
                        <Field label={isArabic ? 'انتهاء رخصة البلدية' : 'Municipality license expiry'} error={errors.municipality_license_expiry}>
                            <input type="date" value={data.municipality_license_expiry} onChange={(e) => setData('municipality_license_expiry', e.target.value)} className="vuexy-input" />
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

                <div className="flex items-center justify-end gap-3 border-t pt-4">
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {isArabic ? 'يتطلب الحفظ تحققاً عبر رمز' : 'Saving requires OTP verification'}
                    </span>
                    <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50">
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

function Section({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description?: string; children: React.ReactNode }) {
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

    const typeLabel = (type: string) => {
        const dt = DOC_TYPES.find((d) => d.key === type);
        return dt ? (isArabic ? dt.label_ar : dt.label_en) : type;
    };

    return (
        <div className="mt-6">
            <Section icon={FolderArchive} title={isArabic ? 'المرفقات الرسمية' : 'Official documents'} description={isArabic ? 'ارفع السجل التجاري، التراخيص وشهادة الزكاة والضريبة' : 'Upload CR, licenses and the ZATCA certificate'}>
                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-1">
                        <label className="mb-1.5 block text-sm font-medium">{isArabic ? 'النوع' : 'Type'}</label>
                        <select value={data.type} onChange={(e) => setData('type', e.target.value)} className="vuexy-input">
                            {DOC_TYPES.map((dt) => (
                                <option key={dt.key} value={dt.key}>{isArabic ? dt.label_ar : dt.label_en}</option>
                            ))}
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
                        <p className="p-4 text-center text-sm text-muted-foreground">{isArabic ? 'لا توجد مستندات بعد' : 'No documents yet'}</p>
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
                                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">{isArabic ? 'عرض' : 'View'}</a>
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
