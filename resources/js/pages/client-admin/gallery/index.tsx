import AppLayout from '@/layouts/app-layout';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Upload, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState } from 'react';
import { useStorageUrl } from '@/lib/storage';

interface GalleryImage {
    id: number;
    title_ar: string | null;
    title_en: string | null;
    path: string;
    url: string | null;
    category: string;
    is_active: boolean;
    sort_order: number;
}

interface Props {
    images: {
        data: GalleryImage[];
        links: { url: string | null; label: string; active: boolean }[];
        last_page: number;
    };
    filters: { category?: string };
    categories: string[];
}

export default function GalleryIndex({ images, filters, categories }: Props) {
    const { t } = useT();
    const storageUrl = useStorageUrl();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('client_admin'), href: '/client-admin' },
        { title: t('gallery'), href: '/client-admin/gallery' },
    ];

    const catLabel = (c: string) => t(`cat_${c}`, c);

    const [showUpload, setShowUpload] = useState(false);
    const [reorderMode, setReorderMode] = useState(false);
    const [orderedImages, setOrderedImages] = useState<GalleryImage[]>([]);
    const [savingOrder, setSavingOrder] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        title_ar: '',
        title_en: '',
        category: 'general',
        images: [] as File[],
    });

    function enterReorderMode() {
        setOrderedImages([...images.data]);
        setReorderMode(true);
    }

    function cancelReorder() {
        setReorderMode(false);
        setOrderedImages([]);
    }

    function swapImages(index: number, direction: 'up' | 'down') {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= orderedImages.length) return;
        const updated = [...orderedImages];
        [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
        setOrderedImages(updated);
    }

    function saveOrder() {
        setSavingOrder(true);
        router.post('/client-admin/gallery/reorder', {
            items: orderedImages.map((img, i) => ({ id: img.id, sort_order: i })),
        }, {
            onFinish: () => {
                setSavingOrder(false);
                setReorderMode(false);
                setOrderedImages([]);
            },
        });
    }

    function handleUpload(e: React.FormEvent) {
        e.preventDefault();
        post('/client-admin/gallery', {
            forceFormData: true,
            onSuccess: () => { reset(); setShowUpload(false); },
        });
    }

    function handleDelete(id: number) {
        if (confirm(t('delete_image_confirm'))) {
            router.delete(`/client-admin/gallery/${id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gallery" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold">{t('gallery')}</h1>
                    <div className="flex items-center gap-2">
                        {reorderMode ? (
                            <>
                                <button onClick={saveOrder} disabled={savingOrder} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                                    {savingOrder ? t('saving') : t('save_order')}
                                </button>
                                <button onClick={cancelReorder} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted">
                                    {t('cancel')}
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={enterReorderMode} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted">
                                    <ArrowUpDown className="h-4 w-4" />
                                    {t('reorder')}
                                </button>
                                <button onClick={() => setShowUpload(!showUpload)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                    <Upload className="h-4 w-4" />
                                    {t('upload_images')}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Upload Form */}
                {showUpload && (
                    <form onSubmit={handleUpload} className="vuexy-card p-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">{t('title_ar')}</label>
                                <input type="text" value={data.title_ar} onChange={(e) => setData('title_ar', e.target.value)} className="vuexy-input w-full" dir="rtl" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">{t('title_en')}</label>
                                <input type="text" value={data.title_en} onChange={(e) => setData('title_en', e.target.value)} className="vuexy-input w-full" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">{t('category')}</label>
                                <select value={data.category} onChange={(e) => setData('category', e.target.value)} className="vuexy-input w-full">
                                    {categories.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition hover:bg-muted">
                                <Upload className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {data.images.length > 0 ? `${data.images.length} ${t('files_selected')}` : t('click_select_images')}
                                </span>
                                <input type="file" accept="image/*" multiple onChange={(e) => setData('images', Array.from(e.target.files || []))} className="hidden" />
                            </label>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setShowUpload(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">{t('cancel')}</button>
                            <button type="submit" disabled={processing || data.images.length === 0} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
                                {processing ? t('uploading') : t('upload')}
                            </button>
                        </div>
                    </form>
                )}

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto">
                    <button onClick={() => router.get('/client-admin/gallery', {}, { preserveState: true })} className={`rounded-full px-4 py-2 text-sm ${!filters.category ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}>
                        {t('all')}
                    </button>
                    {categories.map((c) => (
                        <button key={c} onClick={() => router.get('/client-admin/gallery', { category: c }, { preserveState: true })} className={`rounded-full px-4 py-2 text-sm ${filters.category === c ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}>
                            {catLabel(c)}
                        </button>
                    ))}
                </div>

                {/* Image Grid */}
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {(reorderMode ? orderedImages : images.data).map((img, index) => (
                        <div key={img.id} className="group relative overflow-hidden rounded-xl border">
                            <img src={img.url ?? storageUrl(img.path) ?? ''} alt={img.title_en || ''} className="aspect-square w-full object-cover" />
                            {reorderMode ? (
                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40">
                                    <button onClick={() => swapImages(index, 'up')} disabled={index === 0} className="rounded-full bg-white p-2 text-gray-800 shadow hover:bg-gray-100 disabled:opacity-30">
                                        <ArrowUp className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => swapImages(index, 'down')} disabled={index === orderedImages.length - 1} className="rounded-full bg-white p-2 text-gray-800 shadow hover:bg-gray-100 disabled:opacity-30">
                                        <ArrowDown className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                                    <div className="flex w-full items-center justify-between">
                                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">{catLabel(img.category)}</span>
                                        <button onClick={() => handleDelete(img.id)} className="rounded-full bg-red-500 p-1.5 text-white">
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {images.data.length === 0 && (
                    <div className="vuexy-card p-12 text-center text-muted-foreground">
                        {t('no_images_yet')}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
