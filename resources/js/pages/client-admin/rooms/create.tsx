import AppLayout from '@/layouts/app-layout';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Upload, X } from 'lucide-react';
import { useState } from 'react';

const amenitiesList = ['wifi', 'tv', 'minibar', 'safe', 'air_conditioning', 'balcony', 'sea_view', 'room_service', 'jacuzzi', 'kitchen'];

export default function CreateRoom() {
    const { t } = useT();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('client_admin'), href: '/client-admin' },
        { title: t('rooms'), href: '/client-admin/rooms' },
        { title: t('create'), href: '#' },
    ];

    const amenityLabels: Record<string, string> = {
        wifi: t('wifi'),
        tv: t('tv'),
        minibar: t('minibar'),
        safe: t('safe'),
        air_conditioning: t('air_conditioning'),
        balcony: t('balcony'),
        sea_view: t('sea_view'),
        room_service: t('room_service'),
        jacuzzi: t('jacuzzi'),
        kitchen: t('kitchen'),
    };

    const { data, setData, post, processing, errors } = useForm<{
        name_ar: string;
        name_en: string;
        type: string;
        description_ar: string;
        description_en: string;
        price: string;
        capacity: string;
        amenities: string[];
        is_active: boolean;
        featured_image: File | null;
        images: File[];
    }>({
        name_ar: '',
        name_en: '',
        type: 'standard',
        description_ar: '',
        description_en: '',
        price: '',
        capacity: '2',
        amenities: [],
        is_active: true,
        featured_image: null,
        images: [],
    });

    const [featuredPreview, setFeaturedPreview] = useState<string | null>(null);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    function handleFeaturedImage(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setData('featured_image', file);
            setFeaturedPreview(URL.createObjectURL(file));
        }
    }

    function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        setData('images', [...data.images, ...files]);
        setImagePreviews([...imagePreviews, ...files.map((f) => URL.createObjectURL(f))]);
    }

    function removeImage(index: number) {
        setData('images', data.images.filter((_, i) => i !== index));
        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    }

    function toggleAmenity(amenity: string) {
        setData('amenities', data.amenities.includes(amenity)
            ? data.amenities.filter((a) => a !== amenity)
            : [...data.amenities, amenity]
        );
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/client-admin/rooms', { forceFormData: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Room" />
            <div className="mx-auto max-w-3xl p-6">
                <h1 className="mb-6 text-2xl font-bold">{t('create_room')}</h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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

                    {/* Basic Info */}
                    <div className="vuexy-card p-6">
                        <h2 className="mb-4 text-lg font-semibold">{t('room_details')}</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label={t('name_ar')} error={errors.name_ar}>
                                <input type="text" value={data.name_ar} onChange={(e) => setData('name_ar', e.target.value)} className="vuexy-input" required dir="rtl" />
                            </Field>
                            <Field label={t('name_en')} error={errors.name_en}>
                                <input type="text" value={data.name_en} onChange={(e) => setData('name_en', e.target.value)} className="vuexy-input" required />
                            </Field>
                            <Field label={t('type')} error={errors.type}>
                                <select value={data.type} onChange={(e) => setData('type', e.target.value)} className="vuexy-input">
                                    <option value="standard">{t('standard')}</option>
                                    <option value="deluxe">{t('deluxe')}</option>
                                    <option value="suite">{t('suite')}</option>
                                    <option value="family">{t('family')}</option>
                                </select>
                            </Field>
                            <Field label={t('price_sar')} error={errors.price}>
                                <input type="number" value={data.price} onChange={(e) => setData('price', e.target.value)} className="vuexy-input" required min="0" step="0.01" />
                            </Field>
                            <Field label={t('capacity')} error={errors.capacity}>
                                <input type="number" value={data.capacity} onChange={(e) => setData('capacity', e.target.value)} className="vuexy-input" required min="1" />
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

                    {/* Amenities */}
                    <div className="vuexy-card p-6">
                        <h2 className="mb-4 text-lg font-semibold">{t('amenities')}</h2>
                        <div className="flex flex-wrap gap-2">
                            {amenitiesList.map((amenity) => (
                                <button
                                    key={amenity}
                                    type="button"
                                    onClick={() => toggleAmenity(amenity)}
                                    className={`rounded-full px-4 py-2 text-sm transition ${
                                        data.amenities.includes(amenity)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'border hover:bg-muted'
                                    }`}
                                >
                                    {amenityLabels[amenity]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Images */}
                    <div className="vuexy-card p-6">
                        <h2 className="mb-4 text-lg font-semibold">{t('images')}</h2>

                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium">{t('featured_image')}</label>
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

                        <div>
                            <label className="mb-2 block text-sm font-medium">{t('additional_images')}</label>
                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition hover:bg-muted">
                                <Upload className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{t('click_upload_multiple')}</span>
                                <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
                            </label>
                            {imagePreviews.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {imagePreviews.map((src, i) => (
                                        <div key={i} className="group relative">
                                            <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover" />
                                            <button type="button" onClick={() => removeImage(i)} className="absolute -end-1 -top-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition group-hover:opacity-100">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active */}
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="rounded border-gray-300" />
                        {t('active_visible')}
                    </label>

                    <div className="flex justify-end gap-3">
                        <a href="/client-admin/rooms" className="rounded-lg border px-6 py-2.5 text-sm hover:bg-muted">{t('cancel')}</a>
                        <button type="submit" disabled={processing} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                            {processing ? t('creating') : t('create_room')}
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
