import { useT } from '@/hooks/use-translations';
import { useForm, usePage } from '@inertiajs/react';
import { Save } from 'lucide-react';

export interface HotelSettings {
    hotel_name_ar: string;
    hotel_name_en: string;
    description_ar: string | null;
    description_en: string | null;
    star_rating: number;
    currency: string;
    timezone: string;
    check_in_time: string;
    check_out_time: string;
    primary_color: { light?: string; dark?: string } | null;
    secondary_color: { light?: string; dark?: string } | null;
}

/**
 * Body of the Establishment Data screen. Extracted from
 * `hotel-settings/edit.tsx` so it can also live as a tab inside the
 * unified Establishment Account page without duplicating the form.
 */
export default function EstablishmentDataSection({ settings }: { settings: HotelSettings }) {
    const { t } = useT();
    const flash = (usePage().props as any).flash as { success?: string } | undefined;

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        hotel_name_ar: settings.hotel_name_ar || '',
        hotel_name_en: settings.hotel_name_en || '',
        description_ar: settings.description_ar || '',
        description_en: settings.description_en || '',
        star_rating: String(settings.star_rating || 5),
        currency: settings.currency || 'SAR',
        timezone: settings.timezone || 'Asia/Riyadh',
        check_in_time: settings.check_in_time || '14:00',
        check_out_time: settings.check_out_time || '12:00',
        primary_color: settings.primary_color || { light: '#A67D5F', dark: '#C9A882' },
        secondary_color: settings.secondary_color || { light: '#C9A882', dark: '#A67D5F' },
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/client-admin/hotel-settings');
    }

    return (
        <div className="mx-auto max-w-3xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {Object.keys(errors).length > 0 && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                        <p className="font-medium">{t('form_has_errors') || 'Please fix the following:'}</p>
                        <ul className="mt-1 list-inside list-disc">
                            {Object.entries(errors).map(([field, msg]) => (
                                <li key={field}>{msg as string}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <Section title={t('hotel_identity')}>
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

                <Section title={t('operations')}>
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

                <Section title={t('branding')}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label={t('primary_light')} error={undefined}>
                            <div className="flex items-center gap-2">
                                <input type="color" value={data.primary_color.light} onChange={(e) => setData('primary_color', { ...data.primary_color, light: e.target.value })} className="h-10 w-10 cursor-pointer rounded border" />
                                <input type="text" value={data.primary_color.light} onChange={(e) => setData('primary_color', { ...data.primary_color, light: e.target.value })} className="vuexy-input flex-1" />
                            </div>
                        </Field>
                        <Field label={t('secondary_light')} error={undefined}>
                            <div className="flex items-center gap-2">
                                <input type="color" value={data.secondary_color.light} onChange={(e) => setData('secondary_color', { ...data.secondary_color, light: e.target.value })} className="h-10 w-10 cursor-pointer rounded border" />
                                <input type="text" value={data.secondary_color.light} onChange={(e) => setData('secondary_color', { ...data.secondary_color, light: e.target.value })} className="vuexy-input flex-1" />
                            </div>
                        </Field>
                        <Field label={t('primary_dark')} error={undefined}>
                            <div className="flex items-center gap-2">
                                <input type="color" value={data.primary_color.dark} onChange={(e) => setData('primary_color', { ...data.primary_color, dark: e.target.value })} className="h-10 w-10 cursor-pointer rounded border" />
                                <input type="text" value={data.primary_color.dark} onChange={(e) => setData('primary_color', { ...data.primary_color, dark: e.target.value })} className="vuexy-input flex-1" />
                            </div>
                        </Field>
                        <Field label={t('secondary_dark')} error={undefined}>
                            <div className="flex items-center gap-2">
                                <input type="color" value={data.secondary_color.dark} onChange={(e) => setData('secondary_color', { ...data.secondary_color, dark: e.target.value })} className="h-10 w-10 cursor-pointer rounded border" />
                                <input type="text" value={data.secondary_color.dark} onChange={(e) => setData('secondary_color', { ...data.secondary_color, dark: e.target.value })} className="vuexy-input flex-1" />
                            </div>
                        </Field>
                    </div>
                </Section>

                <div className="flex justify-end">
                    <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                        <Save className="h-4 w-4" />
                        {processing ? t('saving') : t('save_settings')}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="vuexy-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{title}</h2>
            {children}
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
