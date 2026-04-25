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

export default function TemplateCreate() {
    const { t } = useT();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'Templates', href: '/super-admin/templates' },
        { title: 'Create', href: '/super-admin/templates/create' },
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
    }>({
        key: '',
        name_ar: '',
        name_en: '',
        city_ar: '',
        city_en: '',
        description_ar: '',
        description_en: '',
        preview_image: null,
        demo_url: '',
        is_active: true,
        is_coming_soon: false,
        sort_order: 0,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/super-admin/templates', { forceFormData: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create template" />
            <div className="mx-auto max-w-3xl p-6">
                <h1 className="mb-6 text-2xl font-bold">Create template</h1>

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
                            <Field label="Preview image" error={(errors as Record<string, string>).preview_image}>
                                <Input type="file" accept="image/*" onChange={(e) => setData('preview_image', e.target.files?.[0] ?? null)} />
                            </Field>
                            <Field label="Demo URL" error={errors.demo_url}>
                                <Input type="url" value={data.demo_url} onChange={(e) => setData('demo_url', e.target.value)} placeholder="https://demo.diyafah.com/template" />
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
                        <Button type="submit" disabled={processing}>{processing ? 'Creating…' : 'Create template'}</Button>
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
