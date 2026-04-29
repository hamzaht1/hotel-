import AppLayout from '@/layouts/app-layout';
import { useT } from '@/hooks/use-translations';
import { useStorageUrl } from '@/lib/storage';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Plus, Upload, X } from 'lucide-react';
import { useState } from 'react';

interface Room {
    id: number;
    name_ar: string;
    name_en: string;
    type: string;
    description_ar: string | null;
    description_en: string | null;
    price: string;
    capacity: number;
    amenities: string[] | null;
    is_active: boolean;
    featured_image: string | null;
    images: { id: number; path: string }[];
}

const amenitiesList = ['wifi', 'tv', 'minibar', 'safe', 'air_conditioning', 'balcony', 'sea_view', 'room_service', 'jacuzzi', 'kitchen'];

export default function EditRoom({ room }: { room: Room }) {
    const { t } = useT();
    const storageUrl = useStorageUrl();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('client_admin'), href: '/client-admin' },
        { title: t('rooms'), href: '/client-admin/rooms' },
        { title: t('edit'), href: '#' },
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
        _method: string;
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
        new_images: File[];
        delete_images: number[];
    }>({
        _method: 'PUT',
        name_ar: room.name_ar,
        name_en: room.name_en,
        type: room.type,
        description_ar: room.description_ar || '',
        description_en: room.description_en || '',
        price: room.price,
        capacity: String(room.capacity),
        amenities: room.amenities || [],
        is_active: room.is_active,
        featured_image: null,
        new_images: [],
        delete_images: [],
    });

    const [featuredPreview, setFeaturedPreview] = useState<string | null>(
        storageUrl(room.featured_image)
    );
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

    function handleFeaturedImage(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setData('featured_image', file);
            setFeaturedPreview(URL.createObjectURL(file));
        }
    }

    function toggleAmenity(amenity: string) {
        setData('amenities', data.amenities.includes(amenity)
            ? data.amenities.filter((a) => a !== amenity)
            : [...data.amenities, amenity]
        );
    }

    function handleDeleteImage(imageId: number) {
        if (data.delete_images.includes(imageId)) {
            setData('delete_images', data.delete_images.filter((id) => id !== imageId));
        } else {
            setData('delete_images', [...data.delete_images, imageId]);
        }
    }

    function handleNewImages(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setData('new_images', [...data.new_images, ...files]);
            setNewImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
        }
        e.target.value = '';
    }

    function removeNewImage(index: number) {
        setData('new_images', data.new_images.filter((_, i) => i !== index));
        setNewImagePreviews((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/client-admin/rooms/${room.id}`, { forceFormData: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${room.name_en}`} />
            <div className="mx-auto max-w-3xl p-6">
                <h1 className="mb-6 text-2xl font-bold">{t('edit_room')}</h1>

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

                    <div className="vuexy-card p-6">
                        <h2 className="mb-4 text-lg font-semibold">{t('amenities')}</h2>
                        <div className="flex flex-wrap gap-2">
                            {amenitiesList.map((amenity) => (
                                <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)} className={`rounded-full px-4 py-2 text-sm transition ${data.amenities.includes(amenity) ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}>
                                    {amenityLabels[amenity]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="vuexy-card p-6">
                        <h2 className="mb-4 text-lg font-semibold">{t('featured_image')}</h2>
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition hover:bg-muted">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{t('click_upload_new')}</span>
                            <input type="file" accept="image/*" onChange={handleFeaturedImage} className="hidden" />
                        </label>
                        {featuredPreview && <img src={featuredPreview} alt="Preview" className="mt-2 h-32 rounded-lg object-cover" />}

                        {room.images.length > 0 && (
                            <div className="mt-4">
                                <h3 className="mb-2 text-sm font-medium">{t('existing_images')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {room.images.map((img) => {
                                        const isMarkedForDeletion = data.delete_images.includes(img.id);
                                        return (
                                            <div key={img.id} className="relative">
                                                <img src={storageUrl(img.path) ?? ''} alt="" className={`h-20 w-20 rounded-lg object-cover transition ${isMarkedForDeletion ? 'opacity-30' : ''}`} />
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteImage(img.id)}
                                                    className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white shadow transition ${isMarkedForDeletion ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                                                    title={isMarkedForDeletion ? 'Undo delete' : 'Delete image'}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                                {isMarkedForDeletion && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="rounded bg-red-500/80 px-1.5 py-0.5 text-[10px] font-medium text-white">{t('delete')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="mt-4">
                            <h3 className="mb-2 text-sm font-medium">{t('add_new_images')}</h3>
                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition hover:bg-muted">
                                <Plus className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{t('click_add_images')}</span>
                                <input type="file" accept="image/*" multiple onChange={handleNewImages} className="hidden" />
                            </label>
                            {newImagePreviews.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {newImagePreviews.map((src, index) => (
                                        <div key={index} className="relative">
                                            <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(index)}
                                                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                                                title="Remove image"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="rounded border-gray-300" />
                        {t('active')}
                    </label>

                    <div className="flex justify-end gap-3">
                        <a href="/client-admin/rooms" className="rounded-lg border px-6 py-2.5 text-sm hover:bg-muted">{t('cancel')}</a>
                        <button type="submit" disabled={processing} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                            {processing ? t('saving') : t('save_changes')}
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
