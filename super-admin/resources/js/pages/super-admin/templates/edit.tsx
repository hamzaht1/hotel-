import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/hooks/use-translations';
import { useStorageUrl } from '@/lib/storage';

interface Template {
    id: number;
    key: string;
    name_ar: string;
    name_en: string;
    city_ar: string | null;
    city_en: string | null;
    description_ar: string | null;
    description_en: string | null;
    preview_image: string | null;
    demo_url: string | null;
    is_active: boolean;
    is_coming_soon: boolean;
    sort_order: number;
}

export default function TemplateEdit({ template }: { template: Template }) {
    const { t } = useT();
    const storageUrl = useStorageUrl();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'Templates', href: '/super-admin/templates' },
        { title: template.name_en, href: `/super-admin/templates/${template.id}/edit` },
    ];

    const { data, setData, post, processing, errors } = useForm<{
        key: string;
        name_ar: string;
        name_en: string;
        city_ar: string;
        city_en: string;
        description_ar: string;
        description_en: string;
        preview_image: File | null;
        demo_url: string;
        is_active: boolean;
        is_coming_soon: boolean;
        sort_order: number;
        _method: string;
    }>({
        key: template.key,
        name_ar: template.name_ar,
        name_en: template.name_en,
        city_ar: template.city_ar ?? '',
        city_en: template.city_en ?? '',
        description_ar: template.description_ar ?? '',
        description_en: template.description_en ?? '',
        preview_image: null,
        demo_url: template.demo_url ?? '',
        is_active: template.is_active,
        is_coming_soon: template.is_coming_soon,
        sort_order: template.sort_order,
        _method: 'POST',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/super-admin/templates/${template.id}`, { forceFormData: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${template.name_en}`} />
            <div className="mx-auto max-w-3xl p-6">
                <h1 className="mb-6 text-2xl font-bold">Edit template</h1>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader><CardTitle>Basic info</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Field label="Key (slug)" error={errors.key}>
                                <Input value={data.key} onChange={(e) => setData('key', e.target.value)} required />
                            </Field>
                            <Field label="Sort order" error={errors.sort_order}>
                                <Input type="number" value={data.sort_order} onChange={(e) => setData('sort_order', Number(e.target.value))} />
                            </Field>
                            <Field label="Name (AR)" error={errors.name_ar}>
                                <Input value={data.name_ar} onChange={(e) => setData('name_ar', e.target.value)} required />
                            </Field>
                            <Field label="Name (EN)" error={errors.name_en}>
                                <Input value={data.name_en} onChange={(e) => setData('name_en', e.target.value)} required />
                            </Field>
                            <Field label="City (AR)" error={errors.city_ar}>
                                <Input value={data.city_ar} onChange={(e) => setData('city_ar', e.target.value)} />
                            </Field>
                            <Field label="City (EN)" error={errors.city_en}>
                                <Input value={data.city_en} onChange={(e) => setData('city_en', e.target.value)} />
                            </Field>
                            <Field label="Description (AR)" error={errors.description_ar}>
                                <Textarea value={data.description_ar} onChange={(e) => setData('description_ar', e.target.value)} rows={3} />
                            </Field>
                            <Field label="Description (EN)" error={errors.description_en}>
                                <Textarea value={data.description_en} onChange={(e) => setData('description_en', e.target.value)} rows={3} />
                            </Field>
                            <div className="sm:col-span-2">
                                {template.preview_image && (
                                    <img src={storageUrl(template.preview_image) ?? ''} alt="preview" className="mb-2 h-40 rounded border object-cover" />
                                )}
                                <Field label="Replace preview image" error={(errors as Record<string, string>).preview_image}>
                                    <Input type="file" accept="image/*" onChange={(e) => setData('preview_image', e.target.files?.[0] ?? null)} />
                                </Field>
                            </div>
                            <Field label="Demo URL" error={errors.demo_url}>
                                <Input type="url" value={data.demo_url} onChange={(e) => setData('demo_url', e.target.value)} />
                            </Field>
                            <div className="flex items-center gap-2 sm:col-span-2">
                                <Checkbox checked={data.is_active} onCheckedChange={(v) => setData('is_active', v === true)} id="active" />
                                <Label htmlFor="active">Active</Label>
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                                <Checkbox checked={data.is_coming_soon} onCheckedChange={(v) => setData('is_coming_soon', v === true)} id="coming" />
                                <Label htmlFor="coming">Coming soon</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild><Link href="/super-admin/templates">Cancel</Link></Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Saving…' : 'Save template'}</Button>
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
