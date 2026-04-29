import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, useForm } from '@inertiajs/react';
import { Building2, Palette, Type, Image, FileText, Share2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';
import { useStorageUrl } from '@/lib/storage';
import { FormEventHandler, useRef } from 'react';

interface Settings {
    identity: {
        site_name_ar: string;
        site_name_en: string;
        site_logo: string | null;
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
    };
    footer: {
        footer_text_ar: string;
        footer_text_en: string;
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

export default function SiteSettingsIndex({ settings }: Props) {
    const { t } = useT();
    const storageUrl = useStorageUrl();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'هوية الموقع / Site Branding', href: '/super-admin/site-settings' },
    ];

    const { data, setData, post, processing, errors } = useForm<{
        site_name_ar: string;
        site_name_en: string;
        site_logo: File | null;
        site_favicon: File | null;
        primary_color: string;
        secondary_color: string;
        font_family: string;
        hero_title_ar: string;
        hero_title_en: string;
        hero_subtitle_ar: string;
        hero_subtitle_en: string;
        footer_text_ar: string;
        footer_text_en: string;
        social_twitter: string;
        social_instagram: string;
        social_linkedin: string;
        social_facebook: string;
        _method: string;
    }>({
        site_name_ar: settings.identity.site_name_ar ?? '',
        site_name_en: settings.identity.site_name_en ?? '',
        site_logo: null,
        site_favicon: null,
        primary_color: settings.colors.primary_color ?? '#4f46e5',
        secondary_color: settings.colors.secondary_color ?? '#0ea5e9',
        font_family: settings.typography.font_family ?? 'Cairo',
        hero_title_ar: settings.hero.hero_title_ar ?? '',
        hero_title_en: settings.hero.hero_title_en ?? '',
        hero_subtitle_ar: settings.hero.hero_subtitle_ar ?? '',
        hero_subtitle_en: settings.hero.hero_subtitle_en ?? '',
        footer_text_ar: settings.footer.footer_text_ar ?? '',
        footer_text_en: settings.footer.footer_text_en ?? '',
        social_twitter: settings.social.social_twitter ?? '',
        social_instagram: settings.social.social_instagram ?? '',
        social_linkedin: settings.social.social_linkedin ?? '',
        social_facebook: settings.social.social_facebook ?? '',
        _method: 'PUT',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/super-admin/site-settings', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="هوية الموقع / Site Branding" />
            <div className="flex flex-col gap-6 p-6">
                {/* Flash Messages */}
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

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">هوية الموقع / Site Branding</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        تخصيص مظهر وهوية الموقع العامة / Customize the public site appearance and identity
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Identity Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                الهوية / Identity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="site_name_ar">اسم الموقع (عربي) / Site Name (Arabic)</Label>
                                    <Input
                                        id="site_name_ar"
                                        value={data.site_name_ar}
                                        onChange={(e) => setData('site_name_ar', e.target.value)}
                                        dir="rtl"
                                    />
                                    {errors.site_name_ar && (
                                        <p className="text-sm text-destructive">{errors.site_name_ar}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="site_name_en">اسم الموقع (إنجليزي) / Site Name (English)</Label>
                                    <Input
                                        id="site_name_en"
                                        value={data.site_name_en}
                                        onChange={(e) => setData('site_name_en', e.target.value)}
                                        dir="ltr"
                                    />
                                    {errors.site_name_en && (
                                        <p className="text-sm text-destructive">{errors.site_name_en}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="site_logo">الشعار / Logo</Label>
                                    {settings.identity.site_logo && (
                                        <div className="mb-2">
                                            <img
                                                src={storageUrl(settings.identity.site_logo) ?? ''}
                                                alt="Site Logo"
                                                className="h-16 w-auto rounded border object-contain bg-white p-1"
                                            />
                                        </div>
                                    )}
                                    <Input
                                        id="site_logo"
                                        type="file"
                                        accept="image/*"
                                        ref={logoInputRef}
                                        onChange={(e) => setData('site_logo', e.target.files?.[0] ?? null)}
                                    />
                                    {errors.site_logo && (
                                        <p className="text-sm text-destructive">{errors.site_logo}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="site_favicon">الأيقونة المفضلة / Favicon</Label>
                                    {settings.identity.site_favicon && (
                                        <div className="mb-2">
                                            <img
                                                src={storageUrl(settings.identity.site_favicon) ?? ''}
                                                alt="Site Favicon"
                                                className="h-10 w-auto rounded border object-contain bg-white p-1"
                                            />
                                        </div>
                                    )}
                                    <Input
                                        id="site_favicon"
                                        type="file"
                                        accept="image/*"
                                        ref={faviconInputRef}
                                        onChange={(e) => setData('site_favicon', e.target.files?.[0] ?? null)}
                                    />
                                    {errors.site_favicon && (
                                        <p className="text-sm text-destructive">{errors.site_favicon}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Colors Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                الألوان / Colors
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="primary_color">اللون الرئيسي / Primary Color</Label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            id="primary_color"
                                            type="color"
                                            value={data.primary_color}
                                            onChange={(e) => setData('primary_color', e.target.value)}
                                            className="h-10 w-14 cursor-pointer rounded border p-1"
                                        />
                                        <Input
                                            value={data.primary_color}
                                            onChange={(e) => setData('primary_color', e.target.value)}
                                            className="flex-1 font-mono"
                                            maxLength={7}
                                            dir="ltr"
                                        />
                                    </div>
                                    {errors.primary_color && (
                                        <p className="text-sm text-destructive">{errors.primary_color}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="secondary_color">اللون الثانوي / Secondary Color</Label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            id="secondary_color"
                                            type="color"
                                            value={data.secondary_color}
                                            onChange={(e) => setData('secondary_color', e.target.value)}
                                            className="h-10 w-14 cursor-pointer rounded border p-1"
                                        />
                                        <Input
                                            value={data.secondary_color}
                                            onChange={(e) => setData('secondary_color', e.target.value)}
                                            className="flex-1 font-mono"
                                            maxLength={7}
                                            dir="ltr"
                                        />
                                    </div>
                                    {errors.secondary_color && (
                                        <p className="text-sm text-destructive">{errors.secondary_color}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Typography Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Type className="h-5 w-5" />
                                الخطوط / Typography
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-sm space-y-2">
                                <Label htmlFor="font_family">عائلة الخط / Font Family</Label>
                                <Select
                                    value={data.font_family}
                                    onValueChange={(value) => setData('font_family', value)}
                                >
                                    <SelectTrigger id="font_family">
                                        <SelectValue placeholder="اختر الخط / Select font" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FONT_OPTIONS.map((font) => (
                                            <SelectItem key={font.value} value={font.value}>
                                                {font.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.font_family && (
                                    <p className="text-sm text-destructive">{errors.font_family}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hero Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Image className="h-5 w-5" />
                                القسم الرئيسي / Hero Section
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="hero_title_ar">العنوان (عربي) / Title (Arabic)</Label>
                                    <textarea
                                        id="hero_title_ar"
                                        value={data.hero_title_ar}
                                        onChange={(e) => setData('hero_title_ar', e.target.value)}
                                        dir="rtl"
                                        rows={3}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {errors.hero_title_ar && (
                                        <p className="text-sm text-destructive">{errors.hero_title_ar}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hero_title_en">العنوان (إنجليزي) / Title (English)</Label>
                                    <textarea
                                        id="hero_title_en"
                                        value={data.hero_title_en}
                                        onChange={(e) => setData('hero_title_en', e.target.value)}
                                        dir="ltr"
                                        rows={3}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {errors.hero_title_en && (
                                        <p className="text-sm text-destructive">{errors.hero_title_en}</p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="hero_subtitle_ar">العنوان الفرعي (عربي) / Subtitle (Arabic)</Label>
                                    <textarea
                                        id="hero_subtitle_ar"
                                        value={data.hero_subtitle_ar}
                                        onChange={(e) => setData('hero_subtitle_ar', e.target.value)}
                                        dir="rtl"
                                        rows={3}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {errors.hero_subtitle_ar && (
                                        <p className="text-sm text-destructive">{errors.hero_subtitle_ar}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hero_subtitle_en">العنوان الفرعي (إنجليزي) / Subtitle (English)</Label>
                                    <textarea
                                        id="hero_subtitle_en"
                                        value={data.hero_subtitle_en}
                                        onChange={(e) => setData('hero_subtitle_en', e.target.value)}
                                        dir="ltr"
                                        rows={3}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {errors.hero_subtitle_en && (
                                        <p className="text-sm text-destructive">{errors.hero_subtitle_en}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                التذييل / Footer
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="footer_text_ar">نص التذييل (عربي) / Footer Text (Arabic)</Label>
                                    <textarea
                                        id="footer_text_ar"
                                        value={data.footer_text_ar}
                                        onChange={(e) => setData('footer_text_ar', e.target.value)}
                                        dir="rtl"
                                        rows={3}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {errors.footer_text_ar && (
                                        <p className="text-sm text-destructive">{errors.footer_text_ar}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="footer_text_en">نص التذييل (إنجليزي) / Footer Text (English)</Label>
                                    <textarea
                                        id="footer_text_en"
                                        value={data.footer_text_en}
                                        onChange={(e) => setData('footer_text_en', e.target.value)}
                                        dir="ltr"
                                        rows={3}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {errors.footer_text_en && (
                                        <p className="text-sm text-destructive">{errors.footer_text_en}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Social Media Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Share2 className="h-5 w-5" />
                                التواصل الاجتماعي / Social Media
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="social_twitter">Twitter / X</Label>
                                    <Input
                                        id="social_twitter"
                                        type="url"
                                        value={data.social_twitter}
                                        onChange={(e) => setData('social_twitter', e.target.value)}
                                        placeholder="https://twitter.com/..."
                                        dir="ltr"
                                    />
                                    {errors.social_twitter && (
                                        <p className="text-sm text-destructive">{errors.social_twitter}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social_instagram">Instagram</Label>
                                    <Input
                                        id="social_instagram"
                                        type="url"
                                        value={data.social_instagram}
                                        onChange={(e) => setData('social_instagram', e.target.value)}
                                        placeholder="https://instagram.com/..."
                                        dir="ltr"
                                    />
                                    {errors.social_instagram && (
                                        <p className="text-sm text-destructive">{errors.social_instagram}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social_linkedin">LinkedIn</Label>
                                    <Input
                                        id="social_linkedin"
                                        type="url"
                                        value={data.social_linkedin}
                                        onChange={(e) => setData('social_linkedin', e.target.value)}
                                        placeholder="https://linkedin.com/..."
                                        dir="ltr"
                                    />
                                    {errors.social_linkedin && (
                                        <p className="text-sm text-destructive">{errors.social_linkedin}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social_facebook">Facebook</Label>
                                    <Input
                                        id="social_facebook"
                                        type="url"
                                        value={data.social_facebook}
                                        onChange={(e) => setData('social_facebook', e.target.value)}
                                        placeholder="https://facebook.com/..."
                                        dir="ltr"
                                    />
                                    {errors.social_facebook && (
                                        <p className="text-sm text-destructive">{errors.social_facebook}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing} className="min-w-[140px]">
                            <Save className="h-4 w-4 me-2" />
                            {processing ? 'جاري الحفظ... / Saving...' : 'حفظ / Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
