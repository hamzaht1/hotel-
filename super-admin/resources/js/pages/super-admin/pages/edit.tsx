import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface PageData {
    id: number;
    slug: string;
    title_ar: string;
    title_en: string;
    content_ar: string;
    content_en: string;
    meta_description_ar: string | null;
    meta_description_en: string | null;
    is_published: boolean;
    sort_order: number;
    layout: string;
}

interface Props {
    page: PageData;
}

export default function EditPage({ page }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'الصفحات / Pages', href: '/super-admin/pages' },
        { title: 'تعديل / Edit', href: '#' },
    ];

    const { data, setData, put, processing, errors } = useForm({
        title_ar: page.title_ar,
        title_en: page.title_en,
        slug: page.slug,
        content_ar: page.content_ar,
        content_en: page.content_en,
        meta_description_ar: page.meta_description_ar || '',
        meta_description_en: page.meta_description_en || '',
        layout: page.layout,
        is_published: page.is_published,
        sort_order: page.sort_order,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/super-admin/pages/${page.id}`);
    }

    function autoSlug(name: string) {
        setData('slug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`تعديل / Edit: ${page.title_en}`} />
            <div className="mx-auto max-w-3xl p-6">
                <h1 className="mb-6 text-2xl font-bold">تعديل صفحة / Edit Page: {page.title_en}</h1>

                {flash?.success && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                        {flash.error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>المعلومات الأساسية / Basic Info</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="العنوان (عربي) / Title (AR)" error={errors.title_ar}>
                                    <Input
                                        value={data.title_ar}
                                        onChange={(e) => setData('title_ar', e.target.value)}
                                        required
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label="العنوان (إنجليزي) / Title (EN)" error={errors.title_en}>
                                    <Input
                                        value={data.title_en}
                                        onChange={(e) => { setData('title_en', e.target.value); autoSlug(e.target.value); }}
                                        required
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label="Slug" error={errors.slug}>
                                    <Input
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        required
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label="التخطيط / Layout" error={errors.layout}>
                                    <Select value={data.layout} onValueChange={(value) => setData('layout', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default">افتراضي / Default</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>المحتوى / Content</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                <Field label="المحتوى (عربي) / Content (AR)" error={errors.content_ar}>
                                    <Textarea
                                        value={data.content_ar}
                                        onChange={(e) => setData('content_ar', e.target.value)}
                                        required
                                        rows={8}
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label="المحتوى (إنجليزي) / Content (EN)" error={errors.content_en}>
                                    <Textarea
                                        value={data.content_en}
                                        onChange={(e) => setData('content_en', e.target.value)}
                                        required
                                        rows={8}
                                        className="vuexy-input"
                                    />
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SEO */}
                    <Card>
                        <CardHeader>
                            <CardTitle>تحسين محركات البحث / SEO</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                <Field label="وصف ميتا (عربي) / Meta Description (AR)" error={errors.meta_description_ar}>
                                    <Textarea
                                        value={data.meta_description_ar}
                                        onChange={(e) => setData('meta_description_ar', e.target.value)}
                                        rows={3}
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label="وصف ميتا (إنجليزي) / Meta Description (EN)" error={errors.meta_description_en}>
                                    <Textarea
                                        value={data.meta_description_en}
                                        onChange={(e) => setData('meta_description_en', e.target.value)}
                                        rows={3}
                                        className="vuexy-input"
                                    />
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>الإعدادات / Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="ترتيب العرض / Sort Order" error={errors.sort_order}>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                        className="vuexy-input"
                                    />
                                </Field>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <Checkbox
                                    id="is_published"
                                    checked={data.is_published}
                                    onCheckedChange={(checked) => setData('is_published', checked === true)}
                                />
                                <Label htmlFor="is_published">منشور / Published</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/super-admin/pages">{t('cancel')}</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('saving') : t('save_changes')}
                        </Button>
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
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
