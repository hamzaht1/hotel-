import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, useForm } from '@inertiajs/react';
import {
    Building2,
    Palette,
    Type,
    Image as ImageIcon,
    FileText,
    Share2,
    Save,
    RotateCcw,
    RefreshCw,
    ExternalLink,
    Monitor,
    Tablet,
    Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';
import { useStorageUrl } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';

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
    };
    typography: {
        font_family: string;
    };
    hero: {
        hero_title_ar: string;
        hero_title_en: string;
        hero_subtitle_ar: string;
        hero_subtitle_en: string;
        hero_cta_ar: string;
        hero_cta_en: string;
    };
    why_us: { why_us_title_ar: string; why_us_title_en: string };
    how_we_work: { how_we_work_title_ar: string; how_we_work_title_en: string };
    hotels_section: {
        hotels_title_ar: string;
        hotels_title_en: string;
        hotels_subtitle_ar: string;
        hotels_subtitle_en: string;
        hotels_description_ar: string;
        hotels_description_en: string;
    };
    testimonials_section: {
        testimonials_title_ar: string;
        testimonials_title_en: string;
        testimonials_subtitle_ar: string;
        testimonials_subtitle_en: string;
    };
    contact_section: {
        contact_title_ar: string;
        contact_title_en: string;
        contact_subtitle_ar: string;
        contact_subtitle_en: string;
        contact_methods_title_ar: string;
        contact_methods_title_en: string;
        contact_button_text_ar: string;
        contact_button_text_en: string;
    };
    contact_info: {
        contact_address_ar: string;
        contact_address_en: string;
        contact_email: string;
        contact_phone: string;
    };
    footer: {
        footer_text_ar: string;
        footer_text_en: string;
        footer_business_number_ar: string;
        footer_business_number_en: string;
    };
    social: {
        social_twitter: string;
        social_instagram: string;
        social_linkedin: string;
        social_facebook: string;
    };
}

interface Props {
    settings: Settings;
}

const FONT_OPTIONS = [
    { value: 'Cairo', label: 'Cairo' },
    { value: 'Almarai', label: 'Almarai' },
    { value: 'Tajawal', label: 'Tajawal' },
    { value: 'Amiri', label: 'Amiri' },
    { value: 'Public Sans', label: 'Public Sans' },
];

const PREVIEW_MESSAGE_TYPE = 'site-branding-preview';
const PREVIEW_READY_TYPE = 'site-branding-preview-ready';
const PREVIEW_PATH = '/?preview=1';

type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
};

type FormData = {
    site_name_ar: string;
    site_name_en: string;
    site_logo: File | null;
    site_logo_dark: File | null;
    site_favicon: File | null;
    primary_color: string;
    secondary_color: string;
    font_family: string;
    hero_title_ar: string;
    hero_title_en: string;
    hero_subtitle_ar: string;
    hero_subtitle_en: string;
    hero_cta_ar: string;
    hero_cta_en: string;
    why_us_title_ar: string;
    why_us_title_en: string;
    how_we_work_title_ar: string;
    how_we_work_title_en: string;
    hotels_title_ar: string;
    hotels_title_en: string;
    hotels_subtitle_ar: string;
    hotels_subtitle_en: string;
    hotels_description_ar: string;
    hotels_description_en: string;
    testimonials_title_ar: string;
    testimonials_title_en: string;
    testimonials_subtitle_ar: string;
    testimonials_subtitle_en: string;
    contact_title_ar: string;
    contact_title_en: string;
    contact_subtitle_ar: string;
    contact_subtitle_en: string;
    contact_methods_title_ar: string;
    contact_methods_title_en: string;
    contact_button_text_ar: string;
    contact_button_text_en: string;
    contact_address_ar: string;
    contact_address_en: string;
    contact_email: string;
    contact_phone: string;
    footer_text_ar: string;
    footer_text_en: string;
    footer_business_number_ar: string;
    footer_business_number_en: string;
    social_twitter: string;
    social_instagram: string;
    social_linkedin: string;
    social_facebook: string;
    _method: string;
};

function buildInitialData(settings: Settings): FormData {
    return {
        site_name_ar: settings.identity.site_name_ar ?? '',
        site_name_en: settings.identity.site_name_en ?? '',
        site_logo: null,
        site_logo_dark: null,
        site_favicon: null,
        primary_color: settings.colors.primary_color ?? '#01004C',
        secondary_color: settings.colors.secondary_color ?? '#5A5ECD',
        font_family: settings.typography.font_family ?? 'Cairo',
        hero_title_ar: settings.hero.hero_title_ar ?? '',
        hero_title_en: settings.hero.hero_title_en ?? '',
        hero_subtitle_ar: settings.hero.hero_subtitle_ar ?? '',
        hero_subtitle_en: settings.hero.hero_subtitle_en ?? '',
        hero_cta_ar: settings.hero.hero_cta_ar ?? '',
        hero_cta_en: settings.hero.hero_cta_en ?? '',
        why_us_title_ar: settings.why_us?.why_us_title_ar ?? '',
        why_us_title_en: settings.why_us?.why_us_title_en ?? '',
        how_we_work_title_ar: settings.how_we_work?.how_we_work_title_ar ?? '',
        how_we_work_title_en: settings.how_we_work?.how_we_work_title_en ?? '',
        hotels_title_ar: settings.hotels_section?.hotels_title_ar ?? '',
        hotels_title_en: settings.hotels_section?.hotels_title_en ?? '',
        hotels_subtitle_ar: settings.hotels_section?.hotels_subtitle_ar ?? '',
        hotels_subtitle_en: settings.hotels_section?.hotels_subtitle_en ?? '',
        hotels_description_ar: settings.hotels_section?.hotels_description_ar ?? '',
        hotels_description_en: settings.hotels_section?.hotels_description_en ?? '',
        testimonials_title_ar: settings.testimonials_section?.testimonials_title_ar ?? '',
        testimonials_title_en: settings.testimonials_section?.testimonials_title_en ?? '',
        testimonials_subtitle_ar: settings.testimonials_section?.testimonials_subtitle_ar ?? '',
        testimonials_subtitle_en: settings.testimonials_section?.testimonials_subtitle_en ?? '',
        contact_title_ar: settings.contact_section?.contact_title_ar ?? '',
        contact_title_en: settings.contact_section?.contact_title_en ?? '',
        contact_subtitle_ar: settings.contact_section?.contact_subtitle_ar ?? '',
        contact_subtitle_en: settings.contact_section?.contact_subtitle_en ?? '',
        contact_methods_title_ar: settings.contact_section?.contact_methods_title_ar ?? '',
        contact_methods_title_en: settings.contact_section?.contact_methods_title_en ?? '',
        contact_button_text_ar: settings.contact_section?.contact_button_text_ar ?? '',
        contact_button_text_en: settings.contact_section?.contact_button_text_en ?? '',
        contact_address_ar: settings.contact_info?.contact_address_ar ?? '',
        contact_address_en: settings.contact_info?.contact_address_en ?? '',
        contact_email: settings.contact_info?.contact_email ?? '',
        contact_phone: settings.contact_info?.contact_phone ?? '',
        footer_text_ar: settings.footer.footer_text_ar ?? '',
        footer_text_en: settings.footer.footer_text_en ?? '',
        footer_business_number_ar: settings.footer.footer_business_number_ar ?? '',
        footer_business_number_en: settings.footer.footer_business_number_en ?? '',
        social_twitter: settings.social.social_twitter ?? '',
        social_instagram: settings.social.social_instagram ?? '',
        social_linkedin: settings.social.social_linkedin ?? '',
        social_facebook: settings.social.social_facebook ?? '',
        _method: 'PUT',
    };
}

export default function SiteSettingsIndex({ settings }: Props) {
    const { t } = useT();
    const storageUrl = useStorageUrl();
    const pageProps = usePage().props as {
        flash?: { success?: string; error?: string };
        mainAppUrl?: string;
    };
    const flash = pageProps.flash;
    // Public landing-page origin (e.g. http://localhost:8000). Falls back to the
    // current origin so the page still works if MAIN_APP_URL isn't configured.
    const mainAppUrl = (pageProps.mainAppUrl ?? '').replace(/\/+$/, '');
    const previewUrl = `${mainAppUrl || ''}${PREVIEW_PATH}`;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'هوية الموقع / Site Branding', href: '/super-admin/site-settings' },
    ];

    const initialData = useMemo(() => buildInitialData(settings), [settings]);

    const { data, setData, post, processing, errors } = useForm<FormData>(initialData);

    // Data URLs for in-flight logo/favicon previews. We use base64 data URLs
    // (rather than blob: URLs) because the preview iframe loads from a
    // different origin (the public landing page), and blob: URLs are scoped
    // to the creating origin so the iframe can't read them.
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
    const [logoDarkPreviewUrl, setLogoDarkPreviewUrl] = useState<string | null>(null);
    const [faviconPreviewUrl, setFaviconPreviewUrl] = useState<string | null>(null);

    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [viewport, setViewport] = useState<Viewport>('desktop');
    const [iframeNonce, setIframeNonce] = useState(0); // bump to force iframe reload
    // Real origin of the loaded iframe, captured from its READY ping. We trust this
    // over the env-derived previewOrigin because the iframe can land on a different
    // origin (redirect, misconfigured MAIN_APP_URL). Null until READY received —
    // gating postMessage on it avoids the "target origin doesn't match" error that
    // happens on initial mount while the iframe is still on about:blank.
    const [iframeOrigin, setIframeOrigin] = useState<string | null>(null);

    // Compose what we send to the iframe. Logos use blob URLs when a new file is staged,
    // otherwise the saved storage path (the iframe resolves them via its own helper).
    const overrides = useMemo(() => {
        return {
            identity: {
                site_name_ar: data.site_name_ar,
                site_name_en: data.site_name_en,
                site_logo: logoPreviewUrl ?? settings.identity.site_logo ?? null,
                site_logo_dark: logoDarkPreviewUrl ?? settings.identity.site_logo_dark ?? null,
                site_favicon: faviconPreviewUrl ?? settings.identity.site_favicon ?? null,
            },
            colors: {
                primary_color: data.primary_color,
                secondary_color: data.secondary_color,
            },
            typography: { font_family: data.font_family },
            hero: {
                hero_title_ar: data.hero_title_ar,
                hero_title_en: data.hero_title_en,
                hero_subtitle_ar: data.hero_subtitle_ar,
                hero_subtitle_en: data.hero_subtitle_en,
                hero_cta_ar: data.hero_cta_ar,
                hero_cta_en: data.hero_cta_en,
            },
            why_us: {
                why_us_title_ar: data.why_us_title_ar,
                why_us_title_en: data.why_us_title_en,
            },
            how_we_work: {
                how_we_work_title_ar: data.how_we_work_title_ar,
                how_we_work_title_en: data.how_we_work_title_en,
            },
            hotels_section: {
                hotels_title_ar: data.hotels_title_ar,
                hotels_title_en: data.hotels_title_en,
                hotels_subtitle_ar: data.hotels_subtitle_ar,
                hotels_subtitle_en: data.hotels_subtitle_en,
                hotels_description_ar: data.hotels_description_ar,
                hotels_description_en: data.hotels_description_en,
            },
            testimonials_section: {
                testimonials_title_ar: data.testimonials_title_ar,
                testimonials_title_en: data.testimonials_title_en,
                testimonials_subtitle_ar: data.testimonials_subtitle_ar,
                testimonials_subtitle_en: data.testimonials_subtitle_en,
            },
            contact_section: {
                contact_title_ar: data.contact_title_ar,
                contact_title_en: data.contact_title_en,
                contact_subtitle_ar: data.contact_subtitle_ar,
                contact_subtitle_en: data.contact_subtitle_en,
                contact_methods_title_ar: data.contact_methods_title_ar,
                contact_methods_title_en: data.contact_methods_title_en,
                contact_button_text_ar: data.contact_button_text_ar,
                contact_button_text_en: data.contact_button_text_en,
            },
            contact_info: {
                contact_address_ar: data.contact_address_ar,
                contact_address_en: data.contact_address_en,
                contact_email: data.contact_email,
                contact_phone: data.contact_phone,
            },
            footer: {
                footer_text_ar: data.footer_text_ar,
                footer_text_en: data.footer_text_en,
                footer_business_number_ar: data.footer_business_number_ar,
                footer_business_number_en: data.footer_business_number_en,
            },
            social: {
                social_twitter: data.social_twitter,
                social_instagram: data.social_instagram,
                social_linkedin: data.social_linkedin,
                social_facebook: data.social_facebook,
            },
        };
    }, [data, logoPreviewUrl, logoDarkPreviewUrl, faviconPreviewUrl, settings.identity.site_logo, settings.identity.site_logo_dark, settings.identity.site_favicon]);

    // Reset the captured origin whenever the iframe is force-reloaded so we wait
    // for a fresh READY before broadcasting again.
    useEffect(() => {
        setIframeOrigin(null);
    }, [iframeNonce]);

    // Push edits to the iframe — only after it has announced READY (which proves
    // it loaded the public origin and is listening). Sending earlier would error
    // because contentWindow is still on about:blank (parent origin).
    useEffect(() => {
        if (!iframeOrigin) return;
        const win = iframeRef.current?.contentWindow;
        if (!win) return;
        win.postMessage({ type: PREVIEW_MESSAGE_TYPE, overrides }, iframeOrigin);
    }, [overrides, iframeOrigin]);

    // The preview iframe announces it's mounted so we can capture its real origin
    // (via event.origin) and send the initial state — including after a refresh.
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.source !== iframeRef.current?.contentWindow) return;
            const incoming = event.data as { type?: string } | null;
            if (incoming?.type !== PREVIEW_READY_TYPE) return;
            setIframeOrigin(event.origin);
            iframeRef.current?.contentWindow?.postMessage(
                { type: PREVIEW_MESSAGE_TYPE, overrides },
                event.origin,
            );
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [overrides]);

    // Dirty = any text/color field changed OR a file was staged.
    const isDirty = useMemo(() => {
        const keys = Object.keys(initialData) as (keyof FormData)[];
        return keys.some((k) => {
            if (k === 'site_logo' || k === 'site_favicon') return data[k] !== null;
            if (k === '_method') return false;
            return data[k] !== initialData[k];
        });
    }, [data, initialData]);

    const readAsDataUrl = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });

    const handleLogoChange = async (file: File | null) => {
        setData('site_logo', file);
        setLogoPreviewUrl(file ? await readAsDataUrl(file) : null);
    };

    const handleLogoDarkChange = async (file: File | null) => {
        setData('site_logo_dark', file);
        setLogoDarkPreviewUrl(file ? await readAsDataUrl(file) : null);
    };

    const handleFaviconChange = async (file: File | null) => {
        setData('site_favicon', file);
        setFaviconPreviewUrl(file ? await readAsDataUrl(file) : null);
    };

    const handleReset = () => {
        setLogoPreviewUrl(null);
        setFaviconPreviewUrl(null);
        (Object.entries(initialData) as [keyof FormData, FormData[keyof FormData]][]).forEach(([k, v]) => {
            setData(k, v as never);
        });
    };

    const handleRefresh = () => setIframeNonce((n) => n + 1);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/super-admin/site-settings', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setLogoPreviewUrl(null);
                setLogoDarkPreviewUrl(null);
                setFaviconPreviewUrl(null);
            },
        });
    };

    const savedLogoUrl = storageUrl(settings.identity.site_logo) ?? null;
    const savedLogoDarkUrl = storageUrl(settings.identity.site_logo_dark) ?? null;
    const savedFaviconUrl = storageUrl(settings.identity.site_favicon) ?? null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="هوية الموقع / Site Branding" />

            <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
                {/* Live preview pane */}
                <div className="flex w-full flex-col border-b lg:w-1/2 lg:border-b-0 lg:border-e">
                    <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2">
                        <div className="flex items-center gap-1">
                            <ViewportButton current={viewport} value="desktop" onClick={setViewport} icon={<Monitor className="h-4 w-4" />} label="Desktop" />
                            <ViewportButton current={viewport} value="tablet" onClick={setViewport} icon={<Tablet className="h-4 w-4" />} label="Tablet" />
                            <ViewportButton current={viewport} value="mobile" onClick={setViewport} icon={<Smartphone className="h-4 w-4" />} label="Mobile" />
                        </div>
                        <div className="flex items-center gap-1">
                            <Button type="button" variant="ghost" size="sm" onClick={handleRefresh} title="إعادة تحميل / Refresh">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" asChild title="فتح في نافذة جديدة / Open in new tab">
                                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto bg-muted/20 p-2">
                        <div
                            className="mx-auto h-full overflow-hidden rounded border bg-background shadow-sm transition-[width]"
                            style={{ width: VIEWPORT_WIDTHS[viewport], maxWidth: '100%' }}
                        >
                            <iframe
                                key={iframeNonce}
                                ref={iframeRef}
                                src={previewUrl}
                                title="Live preview"
                                className="h-full w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Control panel */}
                <form onSubmit={handleSubmit} className="flex w-full flex-col lg:w-1/2">
                    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold">هوية الموقع</h1>
                            {isDirty && <Badge variant="secondary">غير محفوظ</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={!isDirty || processing}>
                                <RotateCcw className="me-1 h-4 w-4" />
                                استعادة
                            </Button>
                            <Button type="submit" size="sm" disabled={processing || !isDirty}>
                                <Save className="me-1 h-4 w-4" />
                                {processing ? 'جاري الحفظ...' : 'حفظ'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-auto p-4">
                        {flash?.success && (
                            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                                {flash.success}
                            </div>
                        )}
                        {flash?.error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                                {flash.error}
                            </div>
                        )}

                        {/* Identity */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Building2 className="h-4 w-4" />
                                    الهوية / Identity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Field label="اسم الموقع (عربي)" error={errors.site_name_ar}>
                                    <Input
                                        value={data.site_name_ar}
                                        onChange={(e) => setData('site_name_ar', e.target.value)}
                                        dir="rtl"
                                    />
                                </Field>
                                <Field label="Site Name (English)" error={errors.site_name_en}>
                                    <Input
                                        value={data.site_name_en}
                                        onChange={(e) => setData('site_name_en', e.target.value)}
                                        dir="ltr"
                                    />
                                </Field>
                                <Field label="الشعار (فاتح) / Logo (light)" error={errors.site_logo}>
                                    {(logoPreviewUrl || savedLogoUrl) && (
                                        <img
                                            src={logoPreviewUrl ?? savedLogoUrl ?? ''}
                                            alt="Logo"
                                            className="mb-2 h-16 w-auto rounded border bg-white object-contain p-1"
                                        />
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                                    />
                                </Field>
                                <Field label="الشعار (داكن) / Logo (dark)" error={errors.site_logo_dark}>
                                    {(logoDarkPreviewUrl || savedLogoDarkUrl) && (
                                        <img
                                            src={logoDarkPreviewUrl ?? savedLogoDarkUrl ?? ''}
                                            alt="Logo (dark)"
                                            className="mb-2 h-16 w-auto rounded border bg-gray-900 object-contain p-1"
                                        />
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleLogoDarkChange(e.target.files?.[0] ?? null)}
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">يظهر تلقائياً في الوضع الداكن.</p>
                                </Field>
                                <Field label="الأيقونة المفضلة / Favicon" error={errors.site_favicon}>
                                    {(faviconPreviewUrl || savedFaviconUrl) && (
                                        <img
                                            src={faviconPreviewUrl ?? savedFaviconUrl ?? ''}
                                            alt="Favicon"
                                            className="mb-2 h-10 w-auto rounded border bg-white object-contain p-1"
                                        />
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFaviconChange(e.target.files?.[0] ?? null)}
                                    />
                                </Field>
                            </CardContent>
                        </Card>

                        {/* Colors */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Palette className="h-4 w-4" />
                                    الألوان / Colors
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ColorField
                                    label="اللون الأساسي / Primary"
                                    value={data.primary_color}
                                    onChange={(v) => setData('primary_color', v)}
                                    error={errors.primary_color}
                                />
                                <ColorField
                                    label="اللون الثانوي / Secondary"
                                    value={data.secondary_color}
                                    onChange={(v) => setData('secondary_color', v)}
                                    error={errors.secondary_color}
                                />
                            </CardContent>
                        </Card>

                        {/* Typography */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Type className="h-4 w-4" />
                                    الخطوط / Typography
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Field label="عائلة الخط / Font Family" error={errors.font_family}>
                                    <Select
                                        value={data.font_family}
                                        onValueChange={(v) => setData('font_family', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FONT_OPTIONS.map((font) => (
                                                <SelectItem key={font.value} value={font.value}>
                                                    {font.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </CardContent>
                        </Card>

                        {/* Hero */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ImageIcon className="h-4 w-4" />
                                    القسم الرئيسي / Hero
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Field label="العنوان (عربي)" error={errors.hero_title_ar}>
                                    <Textarea
                                        value={data.hero_title_ar}
                                        onChange={(e) => setData('hero_title_ar', e.target.value)}
                                        dir="rtl"
                                        rows={2}
                                    />
                                </Field>
                                <Field label="Title (English)" error={errors.hero_title_en}>
                                    <Textarea
                                        value={data.hero_title_en}
                                        onChange={(e) => setData('hero_title_en', e.target.value)}
                                        dir="ltr"
                                        rows={2}
                                    />
                                </Field>
                                <Field label="العنوان الفرعي (عربي)" error={errors.hero_subtitle_ar}>
                                    <Textarea
                                        value={data.hero_subtitle_ar}
                                        onChange={(e) => setData('hero_subtitle_ar', e.target.value)}
                                        dir="rtl"
                                        rows={2}
                                    />
                                </Field>
                                <Field label="Subtitle (English)" error={errors.hero_subtitle_en}>
                                    <Textarea
                                        value={data.hero_subtitle_en}
                                        onChange={(e) => setData('hero_subtitle_en', e.target.value)}
                                        dir="ltr"
                                        rows={2}
                                    />
                                </Field>
                                <Field label="نص الزر (عربي) / CTA Button (Arabic)" error={errors.hero_cta_ar}>
                                    <Input
                                        value={data.hero_cta_ar}
                                        onChange={(e) => setData('hero_cta_ar', e.target.value)}
                                        dir="rtl"
                                    />
                                </Field>
                                <Field label="CTA Button (English)" error={errors.hero_cta_en}>
                                    <Input
                                        value={data.hero_cta_en}
                                        onChange={(e) => setData('hero_cta_en', e.target.value)}
                                        dir="ltr"
                                    />
                                </Field>
                            </CardContent>
                        </Card>

                        {/* Why Us */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-4 w-4" />
                                    لماذا نحن / Why Us
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Field label="العنوان (عربي)" error={errors.why_us_title_ar}>
                                    <Input value={data.why_us_title_ar} onChange={(e) => setData('why_us_title_ar', e.target.value)} dir="rtl" />
                                </Field>
                                <Field label="Title (English)" error={errors.why_us_title_en}>
                                    <Input value={data.why_us_title_en} onChange={(e) => setData('why_us_title_en', e.target.value)} dir="ltr" />
                                </Field>
                            </CardContent>
                        </Card>

                        {/* How We Work */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-4 w-4" />
                                    كيف نعمل / How We Work
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Field label="العنوان (عربي)" error={errors.how_we_work_title_ar}>
                                    <Input value={data.how_we_work_title_ar} onChange={(e) => setData('how_we_work_title_ar', e.target.value)} dir="rtl" />
                                </Field>
                                <Field label="Title (English)" error={errors.how_we_work_title_en}>
                                    <Input value={data.how_we_work_title_en} onChange={(e) => setData('how_we_work_title_en', e.target.value)} dir="ltr" />
                                </Field>
                            </CardContent>
                        </Card>

                        {/* Hotels */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Building2 className="h-4 w-4" />
                                    فنادق موثوقة / Hotels
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Field label="العنوان (عربي)" error={errors.hotels_title_ar}>
                                    <Input value={data.hotels_title_ar} onChange={(e) => setData('hotels_title_ar', e.target.value)} dir="rtl" />
                                </Field>
                                <Field label="Title (English)" error={errors.hotels_title_en}>
                                    <Input value={data.hotels_title_en} onChange={(e) => setData('hotels_title_en', e.target.value)} dir="ltr" />
                                </Field>
                                <Field label="العنوان الفرعي (عربي)" error={errors.hotels_subtitle_ar}>
                                    <Input value={data.hotels_subtitle_ar} onChange={(e) => setData('hotels_subtitle_ar', e.target.value)} dir="rtl" />
                                </Field>
                                <Field label="Subtitle (English)" error={errors.hotels_subtitle_en}>
                                    <Input value={data.hotels_subtitle_en} onChange={(e) => setData('hotels_subtitle_en', e.target.value)} dir="ltr" />
                                </Field>
                                <Field label="الوصف (عربي)" error={errors.hotels_description_ar}>
                                    <Textarea value={data.hotels_description_ar} onChange={(e) => setData('hotels_description_ar', e.target.value)} dir="rtl" rows={2} />
                                </Field>
                                <Field label="Description (English)" error={errors.hotels_description_en}>
                                    <Textarea value={data.hotels_description_en} onChange={(e) => setData('hotels_description_en', e.target.value)} dir="ltr" rows={2} />
                                </Field>
                            </CardContent>
                        </Card>

                        {/* Testimonials */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-4 w-4" />
                                    الآراء / Testimonials
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Field label="العنوان (عربي)" error={errors.testimonials_title_ar}>
                                    <Input value={data.testimonials_title_ar} onChange={(e) => setData('testimonials_title_ar', e.target.value)} dir="rtl" />
                                </Field>
                                <Field label="Title (English)" error={errors.testimonials_title_en}>
                                    <Input value={data.testimonials_title_en} onChange={(e) => setData('testimonials_title_en', e.target.value)} dir="ltr" />
                                </Field>
                                <Field label="العنوان الفرعي (عربي)" error={errors.testimonials_subtitle_ar}>
                                    <Input value={data.testimonials_subtitle_ar} onChange={(e) => setData('testimonials_subtitle_ar', e.target.value)} dir="rtl" />
                                </Field>
                                <Field label="Subtitle (English)" error={errors.testimonials_subtitle_en}>
                                    <Input value={data.testimonials_subtitle_en} onChange={(e) => setData('testimonials_subtitle_en', e.target.value)} dir="ltr" />
                                </Field>
                            </CardContent>
                        </Card>

                        {/* Contact section titles */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-4 w-4" />
                                    تواصل / Contact
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Field label="العنوان (عربي)" error={errors.contact_title_ar}>
                                    <Input value={data.contact_title_ar} onChange={(e) => setData('contact_title_ar', e.target.value)} dir="rtl" />
                                </Field>
                                <Field label="Title (English)" error={errors.contact_title_en}>
                                    <Input value={data.contact_title_en} onChange={(e) => setData('contact_title_en', e.target.value)} dir="ltr" />
                                </Field>
                                <Field label="العنوان الفرعي (عربي)" error={errors.contact_subtitle_ar}>
                                    <Input value={data.contact_subtitle_ar} onChange={(e) => setData('contact_subtitle_ar', e.target.value)} dir="rtl" />
                                </Field>
                                <Field label="Subtitle (English)" error={errors.contact_subtitle_en}>
                                    <Input value={data.contact_subtitle_en} onChange={(e) => setData('contact_subtitle_en', e.target.value)} dir="ltr" />
                                </Field>
                                <Field label="عنوان وسائل التواصل (عربي)" error={errors.contact_methods_title_ar}>
                                    <Input value={data.contact_methods_title_ar} onChange={(e) => setData('contact_methods_title_ar', e.target.value)} dir="rtl" />
                                </Field>
                                <Field label="Methods Title (English)" error={errors.contact_methods_title_en}>
                                    <Input value={data.contact_methods_title_en} onChange={(e) => setData('contact_methods_title_en', e.target.value)} dir="ltr" />
                                </Field>
                                <Field label="نص زر الإرسال (عربي)" error={errors.contact_button_text_ar}>
                                    <Input value={data.contact_button_text_ar} onChange={(e) => setData('contact_button_text_ar', e.target.value)} dir="rtl" />
                                </Field>
                                <Field label="Send Button Text (English)" error={errors.contact_button_text_en}>
                                    <Input value={data.contact_button_text_en} onChange={(e) => setData('contact_button_text_en', e.target.value)} dir="ltr" />
                                </Field>
                            </CardContent>
                        </Card>

                        {/* Contact info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-4 w-4" />
                                    معلومات التواصل / Contact Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Field label="العنوان (عربي)" error={errors.contact_address_ar}>
                                    <Textarea value={data.contact_address_ar} onChange={(e) => setData('contact_address_ar', e.target.value)} dir="rtl" rows={2} />
                                </Field>
                                <Field label="Address (English)" error={errors.contact_address_en}>
                                    <Textarea value={data.contact_address_en} onChange={(e) => setData('contact_address_en', e.target.value)} dir="ltr" rows={2} />
                                </Field>
                                <Field label="البريد الإلكتروني / Email" error={errors.contact_email}>
                                    <Input type="email" value={data.contact_email} onChange={(e) => setData('contact_email', e.target.value)} dir="ltr" />
                                </Field>
                                <Field label="الهاتف / Phone" error={errors.contact_phone}>
                                    <Input value={data.contact_phone} onChange={(e) => setData('contact_phone', e.target.value)} dir="ltr" />
                                </Field>
                            </CardContent>
                        </Card>

                        {/* Footer */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-4 w-4" />
                                    التذييل / Footer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Field label="نص التذييل (عربي)" error={errors.footer_text_ar}>
                                    <Textarea
                                        value={data.footer_text_ar}
                                        onChange={(e) => setData('footer_text_ar', e.target.value)}
                                        dir="rtl"
                                        rows={2}
                                    />
                                </Field>
                                <Field label="Footer Text (English)" error={errors.footer_text_en}>
                                    <Textarea
                                        value={data.footer_text_en}
                                        onChange={(e) => setData('footer_text_en', e.target.value)}
                                        dir="ltr"
                                        rows={2}
                                    />
                                </Field>
                                <Field label="رقم السجل التجاري (عربي)" error={errors.footer_business_number_ar}>
                                    <Input value={data.footer_business_number_ar} onChange={(e) => setData('footer_business_number_ar', e.target.value)} dir="rtl" />
                                </Field>
                                <Field label="Business Registration Number (English)" error={errors.footer_business_number_en}>
                                    <Input value={data.footer_business_number_en} onChange={(e) => setData('footer_business_number_en', e.target.value)} dir="ltr" />
                                </Field>
                            </CardContent>
                        </Card>

                        {/* Social */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Share2 className="h-4 w-4" />
                                    التواصل / Social Media
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Field label="Twitter / X" error={errors.social_twitter}>
                                    <Input
                                        type="url"
                                        value={data.social_twitter}
                                        onChange={(e) => setData('social_twitter', e.target.value)}
                                        placeholder="https://twitter.com/..."
                                        dir="ltr"
                                    />
                                </Field>
                                <Field label="Instagram" error={errors.social_instagram}>
                                    <Input
                                        type="url"
                                        value={data.social_instagram}
                                        onChange={(e) => setData('social_instagram', e.target.value)}
                                        placeholder="https://instagram.com/..."
                                        dir="ltr"
                                    />
                                </Field>
                                <Field label="LinkedIn" error={errors.social_linkedin}>
                                    <Input
                                        type="url"
                                        value={data.social_linkedin}
                                        onChange={(e) => setData('social_linkedin', e.target.value)}
                                        placeholder="https://linkedin.com/..."
                                        dir="ltr"
                                    />
                                </Field>
                                <Field label="Facebook" error={errors.social_facebook}>
                                    <Input
                                        type="url"
                                        value={data.social_facebook}
                                        onChange={(e) => setData('social_facebook', e.target.value)}
                                        placeholder="https://facebook.com/..."
                                        dir="ltr"
                                    />
                                </Field>
                            </CardContent>
                        </Card>
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
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function ColorField({
    label,
    value,
    onChange,
    error,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <div className="flex items-center gap-3">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border p-1"
                />
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 font-mono"
                    maxLength={7}
                    dir="ltr"
                />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function ViewportButton({
    current,
    value,
    onClick,
    icon,
    label,
}: {
    current: Viewport;
    value: Viewport;
    onClick: (v: Viewport) => void;
    icon: React.ReactNode;
    label: string;
}) {
    const active = current === value;
    return (
        <Button
            type="button"
            variant={active ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onClick(value)}
            className={cn('gap-1.5', active && 'shadow-sm')}
            title={label}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </Button>
    );
}
