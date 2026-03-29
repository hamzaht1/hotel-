import AppLayout from '@/layouts/app-layout';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Upload } from 'lucide-react';
import { useState } from 'react';

interface CategoryOption {
    id: number;
    name_ar: string;
    name_en: string;
}

interface Props {
    categories: CategoryOption[];
}

export default function CreateService({ categories }: Props) {
    const { t } = useT();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('client_admin'), href: '/client-admin' },
        { title: t('services'), href: '/client-admin/services' },
        { title: t('create'), href: '#' },
    ];

    const { data, setData, post, processing, errors } = useForm<{
        name_ar: string;
        name_en: string;
        description_ar: string;
        description_en: string;
        category_id: string;
        price: string;
        duration: string;
        video_url: string;
        featured_image: File | null;
        is_active: boolean;
    }>({
        name_ar: '',
        name_en: '',
        description_ar: '',
        description_en: '',
        category_id: '',
        price: '',
        duration: '',
        video_url: '',
        featured_image: null,
        is_active: true,
    });

    const [featuredPreview, setFeaturedPreview] = useState<string | null>(null);

    function handleFeaturedImage(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setData('featured_image', file);
            setFeaturedPreview(URL.createObjectURL(file));
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/client-admin/services', { forceFormData: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Service" />
            <div className="mx-auto max-w-3xl p-6">
                <h1 className="mb-6 text-2xl font-bold">{t('create_service')}</h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Basic Info */}
                    <div className="vuexy-card p-6">
                        <h2 className="mb-4 text-lg font-semibold">{t('service_details')}</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label={t('name_ar')} error={errors.name_ar}>
                                <input type="text" value={data.name_ar} onChange={(e) => setData('name_ar', e.target.value)} className="vuexy-input" required dir="rtl" />
                            </Field>
                            <Field label={t('name_en')} error={errors.name_en}>
                                <input type="text" value={data.name_en} onChange={(e) => setData('name_en', e.target.value)} className="vuexy-input" required />
                            </Field>
                            <Field label={t('category')} error={errors.category_id}>
                                <select value={data.category_id} onChange={(e) => setData('category_id', e.target.value)} className="vuexy-input">
                                    <option value="">{t('select_category')}</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name_en} - {cat.name_ar}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label={t('price_sar')} error={errors.price}>
                                <input type="number" value={data.price} onChange={(e) => setData('price', e.target.value)} className="vuexy-input" required min="0" step="0.01" />
                            </Field>
                            <Field label={t('duration')} error={errors.duration}>
                                <input type="text" value={data.duration} onChange={(e) => setData('duration', e.target.value)} className="vuexy-input" placeholder="e.g. 30 min, 1 hour" />
                            </Field>
                            <Field label={t('video_url')} error={errors.video_url}>
                                <input type="url" value={data.video_url} onChange={(e) => setData('video_url', e.target.value)} className="vuexy-input" placeholder="https://" />
                            </Field>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <Field label={t('desc_ar')} error={errors.description_ar}>
                                <textarea value={data.description_ar} onChange={(e) => setData('description_ar', e.target.value)} className="vuexy-input" rows={3} dir="rtl" />
                            </Field>
                            <Field label={t('desc_en')} error={errors.description_en}>
                                <textarea value={data.description_en} onChange={(e) => setData('description_en', e.target.value)} className="vuexy-input" rows={3} />
                            </Field>
                        </div>
                    </div>

                    {/* Image */}
                    <div className="vuexy-card p-6">
                        <h2 className="mb-4 text-lg font-semibold">{t('featured_image')}</h2>
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition hover:bg-muted">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{t('click_to_upload')}</span>
                            <input type="file" accept="image/*" onChange={handleFeaturedImage} className="hidden" />
                        </label>
                        {featuredPreview && (
                            <div className="mt-2">
                                <img src={featuredPreview} alt="Preview" className="h-32 rounded-lg object-cover" />
                            </div>
                        )}
                    </div>

                    {/* Active */}
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="rounded border-gray-300" />
                        {t('active_visible')}
                    </label>

                    <div className="flex justify-end gap-3">
                        <a href="/client-admin/services" className="rounded-lg border px-6 py-2.5 text-sm hover:bg-muted">{t('cancel')}</a>
                        <button type="submit" disabled={processing} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                            {processing ? t('creating') : t('create_service')}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
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
