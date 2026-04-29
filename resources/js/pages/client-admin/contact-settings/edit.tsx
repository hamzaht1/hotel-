import AppLayout from '@/layouts/app-layout';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Save } from 'lucide-react';

interface ContactSettings {
    whatsapp: string | null;
    phone: string | null;
    email: string | null;
    address_ar: string | null;
    address_en: string | null;
    google_maps_url: string | null;
    facebook: string | null;
    instagram: string | null;
    twitter: string | null;
    tiktok: string | null;
    snapchat: string | null;
}

export default function ContactSettingsEdit({ settings }: { settings: ContactSettings }) {
    const { t } = useT();
    const flash = (usePage().props as any).flash as { success?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('client_admin'), href: '/client-admin' },
        { title: t('contact_settings'), href: '/client-admin/contact-settings' },
    ];

    const { data, setData, put, processing, errors } = useForm({
        whatsapp: settings.whatsapp || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address_ar: settings.address_ar || '',
        address_en: settings.address_en || '',
        google_maps_url: settings.google_maps_url || '',
        facebook: settings.facebook || '',
        instagram: settings.instagram || '',
        twitter: settings.twitter || '',
        tiktok: settings.tiktok || '',
        snapchat: settings.snapchat || '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put('/client-admin/contact-settings');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contact Settings" />
            <div className="mx-auto max-w-3xl p-6">
                <h1 className="mb-6 text-2xl font-bold">{t('contact_settings')}</h1>

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
                    <Section title={t('communication')}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label={t('whatsapp')} error={errors.whatsapp}>
                                <input type="text" value={data.whatsapp} onChange={(e) => setData('whatsapp', e.target.value)} className="vuexy-input" placeholder="+966500000000" />
                            </Field>
                            <Field label={t('phone')} error={errors.phone}>
                                <input type="text" value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="vuexy-input" placeholder="+966500000000" />
                            </Field>
                            <Field label={t('email')} error={errors.email}>
                                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="vuexy-input" placeholder="info@hotel.com" />
                            </Field>
                        </div>
                    </Section>

                    <Section title={t('address')}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label={t('address_ar')} error={errors.address_ar}>
                                <textarea value={data.address_ar} onChange={(e) => setData('address_ar', e.target.value)} className="vuexy-input" rows={2} dir="rtl" />
                            </Field>
                            <Field label={t('address_en')} error={errors.address_en}>
                                <textarea value={data.address_en} onChange={(e) => setData('address_en', e.target.value)} className="vuexy-input" rows={2} />
                            </Field>
                            <Field label={t('google_maps')} error={errors.google_maps_url}>
                                <input type="url" value={data.google_maps_url} onChange={(e) => setData('google_maps_url', e.target.value)} className="vuexy-input" placeholder="https://maps.google.com/..." />
                            </Field>
                        </div>
                    </Section>

                    <Section title={t('social_media')}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Facebook" error={errors.facebook}>
                                <input type="text" value={data.facebook} onChange={(e) => setData('facebook', e.target.value)} className="vuexy-input" placeholder="facebook.com/hotel" />
                            </Field>
                            <Field label="Instagram" error={errors.instagram}>
                                <input type="text" value={data.instagram} onChange={(e) => setData('instagram', e.target.value)} className="vuexy-input" placeholder="@hotel" />
                            </Field>
                            <Field label="Twitter / X" error={errors.twitter}>
                                <input type="text" value={data.twitter} onChange={(e) => setData('twitter', e.target.value)} className="vuexy-input" placeholder="@hotel" />
                            </Field>
                            <Field label="TikTok" error={errors.tiktok}>
                                <input type="text" value={data.tiktok} onChange={(e) => setData('tiktok', e.target.value)} className="vuexy-input" placeholder="@hotel" />
                            </Field>
                            <Field label="Snapchat" error={errors.snapchat}>
                                <input type="text" value={data.snapchat} onChange={(e) => setData('snapchat', e.target.value)} className="vuexy-input" placeholder="@hotel" />
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
        </AppLayout>
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
