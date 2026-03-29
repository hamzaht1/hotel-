import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

export default function CreatePlan() {
    const { t } = useT();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'الباقات / Plans', href: '/super-admin/plans' },
        { title: 'إنشاء باقة / Create Plan', href: '/super-admin/plans/create' },
    ];

    const { data, setData, post, processing, errors } = useForm<{
        name_ar: string;
        name_en: string;
        slug: string;
        description_ar: string;
        description_en: string;
        price: number;
        billing_cycle: string;
        features_ar: string[];
        features_en: string[];
        limits: { max_rooms: number | string; max_images: number | string; max_users: number | string };
        icon: string;
        variant: string;
        sort_order: number;
        is_active: boolean;
    }>({
        name_ar: '',
        name_en: '',
        slug: '',
        description_ar: '',
        description_en: '',
        price: 0,
        billing_cycle: 'monthly',
        features_ar: [''],
        features_en: [''],
        limits: { max_rooms: '', max_images: '', max_users: '' },
        icon: '',
        variant: 'solid',
        sort_order: 0,
        is_active: true,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/super-admin/plans');
    }

    function autoSlug(name: string) {
        setData('slug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }

    function addFeatureAr() {
        setData('features_ar', [...data.features_ar, '']);
    }

    function removeFeatureAr(index: number) {
        setData('features_ar', data.features_ar.filter((_, i) => i !== index));
    }

    function updateFeatureAr(index: number, value: string) {
        const updated = [...data.features_ar];
        updated[index] = value;
        setData('features_ar', updated);
    }

    function addFeatureEn() {
        setData('features_en', [...data.features_en, '']);
    }

    function removeFeatureEn(index: number) {
        setData('features_en', data.features_en.filter((_, i) => i !== index));
    }

    function updateFeatureEn(index: number, value: string) {
        const updated = [...data.features_en];
        updated[index] = value;
        setData('features_en', updated);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="إنشاء باقة / Create Plan" />
            <div className="mx-auto max-w-3xl p-6">
                <h1 className="mb-6 text-2xl font-bold">إنشاء باقة / Create Plan</h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>المعلومات الأساسية / Basic Info</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="الاسم (عربي) / Name (AR)" error={errors.name_ar}>
                                    <Input
                                        value={data.name_ar}
                                        onChange={(e) => setData('name_ar', e.target.value)}
                                        required
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label="الاسم (إنجليزي) / Name (EN)" error={errors.name_en}>
                                    <Input
                                        value={data.name_en}
                                        onChange={(e) => { setData('name_en', e.target.value); autoSlug(e.target.value); }}
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
                                <Field label="الأيقونة / Icon" error={errors.icon}>
                                    <Input
                                        value={data.icon}
                                        onChange={(e) => setData('icon', e.target.value)}
                                        placeholder="e.g. building, crown, rocket"
                                        className="vuexy-input"
                                    />
                                </Field>
                                <div className="sm:col-span-2">
                                    <Field label="الوصف (عربي) / Description (AR)" error={errors.description_ar}>
                                        <Input
                                            value={data.description_ar}
                                            onChange={(e) => setData('description_ar', e.target.value)}
                                            className="vuexy-input"
                                        />
                                    </Field>
                                </div>
                                <div className="sm:col-span-2">
                                    <Field label="الوصف (إنجليزي) / Description (EN)" error={errors.description_en}>
                                        <Input
                                            value={data.description_en}
                                            onChange={(e) => setData('description_en', e.target.value)}
                                            className="vuexy-input"
                                        />
                                    </Field>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing & Display */}
                    <Card>
                        <CardHeader>
                            <CardTitle>التسعير والعرض / Pricing & Display</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="السعر / Price (SAR)" error={errors.price}>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={data.price}
                                        onChange={(e) => setData('price', parseFloat(e.target.value) || 0)}
                                        required
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label="دورة الفوترة / Billing Cycle" error={errors.billing_cycle}>
                                    <Select value={data.billing_cycle} onValueChange={(value) => setData('billing_cycle', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">شهري / Monthly</SelectItem>
                                            <SelectItem value="yearly">سنوي / Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="النمط / Variant" error={errors.variant}>
                                    <Select value={data.variant} onValueChange={(value) => setData('variant', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">Light</SelectItem>
                                            <SelectItem value="solid">Solid</SelectItem>
                                            <SelectItem value="soft">Soft</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
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
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked === true)}
                                />
                                <Label htmlFor="is_active">{t('active')}</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Limits */}
                    <Card>
                        <CardHeader>
                            <CardTitle>الحدود / Limits</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field label="الحد الأقصى للغرف / Max Rooms" error={(errors as Record<string, string>)['limits.max_rooms']}>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data.limits.max_rooms}
                                        onChange={(e) => setData('limits', { ...data.limits, max_rooms: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                        placeholder="غير محدود / Unlimited"
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label="الحد الأقصى للصور / Max Images" error={(errors as Record<string, string>)['limits.max_images']}>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data.limits.max_images}
                                        onChange={(e) => setData('limits', { ...data.limits, max_images: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                        placeholder="غير محدود / Unlimited"
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label="الحد الأقصى للمستخدمين / Max Users" error={(errors as Record<string, string>)['limits.max_users']}>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data.limits.max_users}
                                        onChange={(e) => setData('limits', { ...data.limits, max_users: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                        placeholder="غير محدود / Unlimited"
                                        className="vuexy-input"
                                    />
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Features AR */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>المميزات (عربي) / Features (AR)</CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={addFeatureAr}>
                                    <Plus className="h-4 w-4" />
                                    إضافة / Add
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-3">
                                {data.features_ar.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            value={feature}
                                            onChange={(e) => updateFeatureAr(index, e.target.value)}
                                            placeholder={`الميزة ${index + 1}`}
                                            className="vuexy-input"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeFeatureAr(index)}
                                            className="shrink-0 text-red-500 hover:text-red-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {(errors as Record<string, string>)['features_ar'] && (
                                    <p className="text-xs text-destructive">{(errors as Record<string, string>)['features_ar']}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Features EN */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>المميزات (إنجليزي) / Features (EN)</CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={addFeatureEn}>
                                    <Plus className="h-4 w-4" />
                                    إضافة / Add
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-3">
                                {data.features_en.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            value={feature}
                                            onChange={(e) => updateFeatureEn(index, e.target.value)}
                                            placeholder={`Feature ${index + 1}`}
                                            className="vuexy-input"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeFeatureEn(index)}
                                            className="shrink-0 text-red-500 hover:text-red-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {(errors as Record<string, string>)['features_en'] && (
                                    <p className="text-xs text-destructive">{(errors as Record<string, string>)['features_en']}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/super-admin/plans">{t('cancel')}</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'جاري الإنشاء... / Creating...' : 'إنشاء باقة / Create Plan'}
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
