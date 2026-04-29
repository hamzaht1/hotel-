import AppLayout from '@/layouts/app-layout';
import { useT } from '@/hooks/use-translations';
import { useStorageUrl } from '@/lib/storage';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Save, Upload } from 'lucide-react';
import { useState } from 'react';

interface Settings {
    identity: {
        site_name_ar: string;
        site_name_en: string;
        site_logo: string | null;
        site_logo_dark: string | null;
        site_favicon: string | null;
    };
    colors: {
        primary_color: string;
        secondary_color: string;
        accent_color: string;
        dark_primary_color: string;
        dark_secondary_color: string;
        dark_accent_color: string;
    };
    typography: { font_family: string };
    hero: {
        hero_title_ar: string;
        hero_title_en: string;
        hero_subtitle_ar: string;
        hero_subtitle_en: string;
    };
    texts: { site_text_ar: string; site_text_en: string };
    footer: { footer_text_ar: string; footer_text_en: string };
    social: {
        social_twitter: string;
        social_instagram: string;
        social_linkedin: string;
        social_facebook: string;
    };
}

const FONT_OPTIONS = ['Cairo', 'Almarai', 'Tajawal', 'Amiri', 'Public Sans'];

export default function SystemSettingsEdit({ settings }: { settings: Settings }) {
    const { t } = useT();
    const storageUrl = useStorageUrl();
    const flash = (usePage().props as any).flash as { success?: string } | undefined;

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        site_name_ar: settings.identity.site_name_ar,
        site_name_en: settings.identity.site_name_en,
        site_logo: null as File | null,
        site_logo_dark: null as File | null,
        site_favicon: null as File | null,
        primary_color: settings.colors.primary_color || '#4f46e5',
        secondary_color: settings.colors.secondary_color || '#0ea5e9',
        accent_color: settings.colors.accent_color || '#f59e0b',
        dark_primary_color: settings.colors.dark_primary_color || '#818cf8',
        dark_secondary_color: settings.colors.dark_secondary_color || '#38bdf8',
        dark_accent_color: settings.colors.dark_accent_color || '#fbbf24',
        font_family: settings.typography.font_family || 'Cairo',
        hero_title_ar: settings.hero.hero_title_ar,
        hero_title_en: settings.hero.hero_title_en,
        hero_subtitle_ar: settings.hero.hero_subtitle_ar,
        hero_subtitle_en: settings.hero.hero_subtitle_en,
        site_text_ar: settings.texts.site_text_ar,
        site_text_en: settings.texts.site_text_en,
        footer_text_ar: settings.footer.footer_text_ar,
        footer_text_en: settings.footer.footer_text_en,
        social_twitter: settings.social.social_twitter,
        social_instagram: settings.social.social_instagram,
        social_linkedin: settings.social.social_linkedin,
        social_facebook: settings.social.social_facebook,
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(
        storageUrl(settings.identity.site_logo)
    );
    const [logoDarkPreview, setLogoDarkPreview] = useState<string | null>(
        storageUrl(settings.identity.site_logo_dark)
    );
    const [faviconPreview, setFaviconPreview] = useState<string | null>(
        storageUrl(settings.identity.site_favicon)
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('client_admin'), href: '/client-admin' },
        { title: 'إعدادات النظام', href: '/client-admin/system-settings' },
    ];

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/client-admin/system-settings', { forceFormData: true });
    }

    function handleFile(field: 'site_logo' | 'site_logo_dark' | 'site_favicon', setPreview: (s: string | null) => void) {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) {
                setData(field, f);
                setPreview(URL.createObjectURL(f));
            }
        };
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Settings" />
            <div className="mx-auto max-w-4xl p-6">
                <h1 className="mb-6 text-2xl font-bold">إعدادات النظام</h1>

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

                    <Section title="هوية الموقع / Site Identity">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="اسم الموقع (AR)" error={errors.site_name_ar}>
                                <input type="text" value={data.site_name_ar} onChange={(e) => setData('site_name_ar', e.target.value)} className="vuexy-input" dir="rtl" />
                            </Field>
                            <Field label="Site Name (EN)" error={errors.site_name_en}>
                                <input type="text" value={data.site_name_en} onChange={(e) => setData('site_name_en', e.target.value)} className="vuexy-input" />
                            </Field>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            <FileSlot label="الشعار (فاتح)" preview={logoPreview} onChange={handleFile('site_logo', setLogoPreview)} />
                            <FileSlot label="الشعار (داكن)" preview={logoDarkPreview} onChange={handleFile('site_logo_dark', setLogoDarkPreview)} />
                            <FileSlot label="Favicon" preview={faviconPreview} onChange={handleFile('site_favicon', setFaviconPreview)} small />
                        </div>
                    </Section>

                    <Section title="الألوان / Colors">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <ColorField label="Primary" value={data.primary_color} onChange={(v) => setData('primary_color', v)} />
                            <ColorField label="Secondary" value={data.secondary_color} onChange={(v) => setData('secondary_color', v)} />
                            <ColorField label="Accent" value={data.accent_color} onChange={(v) => setData('accent_color', v)} />
                        </div>
                        <p className="mt-4 text-sm font-medium text-muted-foreground">Dark Mode</p>
                        <div className="mt-2 grid gap-4 sm:grid-cols-3">
                            <ColorField label="Primary (Dark)" value={data.dark_primary_color} onChange={(v) => setData('dark_primary_color', v)} />
                            <ColorField label="Secondary (Dark)" value={data.dark_secondary_color} onChange={(v) => setData('dark_secondary_color', v)} />
                            <ColorField label="Accent (Dark)" value={data.dark_accent_color} onChange={(v) => setData('dark_accent_color', v)} />
                        </div>
                    </Section>

                    <Section title="الخط / Typography">
                        <Field label="Font Family">
                            <select value={data.font_family} onChange={(e) => setData('font_family', e.target.value)} className="vuexy-input">
                                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </Field>
                    </Section>

                    <Section title="القسم الرئيسي / Hero">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Hero Title (AR)" error={errors.hero_title_ar}>
                                <input type="text" value={data.hero_title_ar} onChange={(e) => setData('hero_title_ar', e.target.value)} className="vuexy-input" dir="rtl" />
                            </Field>
                            <Field label="Hero Title (EN)" error={errors.hero_title_en}>
                                <input type="text" value={data.hero_title_en} onChange={(e) => setData('hero_title_en', e.target.value)} className="vuexy-input" />
                            </Field>
                            <Field label="Hero Subtitle (AR)" error={errors.hero_subtitle_ar}>
                                <textarea value={data.hero_subtitle_ar} onChange={(e) => setData('hero_subtitle_ar', e.target.value)} className="vuexy-input" rows={2} dir="rtl" />
                            </Field>
                            <Field label="Hero Subtitle (EN)" error={errors.hero_subtitle_en}>
                                <textarea value={data.hero_subtitle_en} onChange={(e) => setData('hero_subtitle_en', e.target.value)} className="vuexy-input" rows={2} />
                            </Field>
                        </div>
                    </Section>

                    <Section title="نصوص الموقع / Site Texts">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Site Text (AR)" error={errors.site_text_ar}>
                                <textarea value={data.site_text_ar} onChange={(e) => setData('site_text_ar', e.target.value)} className="vuexy-input" rows={4} dir="rtl" />
                            </Field>
                            <Field label="Site Text (EN)" error={errors.site_text_en}>
                                <textarea value={data.site_text_en} onChange={(e) => setData('site_text_en', e.target.value)} className="vuexy-input" rows={4} />
                            </Field>
                            <Field label="Footer Text (AR)" error={errors.footer_text_ar}>
                                <input type="text" value={data.footer_text_ar} onChange={(e) => setData('footer_text_ar', e.target.value)} className="vuexy-input" dir="rtl" />
                            </Field>
                            <Field label="Footer Text (EN)" error={errors.footer_text_en}>
                                <input type="text" value={data.footer_text_en} onChange={(e) => setData('footer_text_en', e.target.value)} className="vuexy-input" />
                            </Field>
                        </div>
                    </Section>

                    <Section title="الشبكات الاجتماعية / Social Links">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Twitter / X"><input type="text" value={data.social_twitter} onChange={(e) => setData('social_twitter', e.target.value)} className="vuexy-input" placeholder="@hotel" /></Field>
                            <Field label="Instagram"><input type="text" value={data.social_instagram} onChange={(e) => setData('social_instagram', e.target.value)} className="vuexy-input" placeholder="@hotel" /></Field>
                            <Field label="LinkedIn"><input type="text" value={data.social_linkedin} onChange={(e) => setData('social_linkedin', e.target.value)} className="vuexy-input" placeholder="/company/hotel" /></Field>
                            <Field label="Facebook"><input type="text" value={data.social_facebook} onChange={(e) => setData('social_facebook', e.target.value)} className="vuexy-input" placeholder="/hotel" /></Field>
                        </div>
                    </Section>

                    <div className="flex justify-end">
                        <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                            <Save className="h-4 w-4" />
                            {processing ? t('saving') : 'حفظ الإعدادات'}
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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <Field label={label}>
            <div className="flex items-center gap-2">
                <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="h-10 w-10 cursor-pointer rounded border" />
                <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="vuexy-input flex-1 font-mono" placeholder="#000000" />
            </div>
        </Field>
    );
}

function FileSlot({ label, preview, onChange, small }: { label: string; preview: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; small?: boolean }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium">{label}</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition hover:bg-muted">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{preview ? 'استبدال' : 'تحميل'}</span>
                <input type="file" accept="image/*" onChange={onChange} className="hidden" />
            </label>
            {preview && (
                <img
                    src={preview}
                    alt={label}
                    className={`mt-2 ${small ? 'h-10 w-10' : 'h-16'} rounded object-contain`}
                />
            )}
        </div>
    );
}
