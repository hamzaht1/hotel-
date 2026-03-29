import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

export default function CreatePage() {
    const { t } = useT();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'الصفحات / Pages', href: '/super-admin/pages' },
        { title: 'إنشاء صفحة / Create Page', href: '/super-admin/pages/create' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        title_ar: '',
        title_en: '',
        slug: '',
        content_ar: '',
        content_en: '',
        meta_description_ar: '',
        meta_description_en: '',
        layout: 'default',
        is_published: false,
        sort_order: 0,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/super-admin/pages');
    }

    function autoSlug(name: string) {
        setData('slug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="إنشاء صفحة / Create Page" />
            <div className="mx-auto max-w-3xl p-6">
                <h1 className="mb-6 text-2xl font-bold">إنشاء صفحة / Create Page</h1>

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
                            {processing ? 'جاري الإنشاء... / Creating...' : 'إنشاء صفحة / Create Page'}
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
