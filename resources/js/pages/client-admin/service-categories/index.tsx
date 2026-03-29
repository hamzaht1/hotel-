import AppLayout from '@/layouts/app-layout';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface Category {
    id: number;
    name_ar: string;
    name_en: string;
    type: string;
    icon: string | null;
    is_active: boolean;
    sort_order: number;
    services_count: number;
}

interface Props {
    categories: Category[];
}

const categoryTypes = ['room', 'hall', 'spa', 'restaurant', 'custom'];

export default function ServiceCategoriesIndex({ categories }: Props) {
    const { t } = useT();
    const flash = (usePage().props as any).flash;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('client_admin'), href: '/client-admin' },
        { title: t('service_categories'), href: '/client-admin/service-categories' },
    ];

    const typeLabels: Record<string, string> = {
        room: t('room'),
        hall: t('hall'),
        spa: t('spa'),
        restaurant: t('restaurant'),
        custom: t('custom'),
    };

    const typeBadgeColors: Record<string, string> = {
        room: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        hall: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        spa: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
        restaurant: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        custom: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name_ar: '',
        name_en: '',
        type: 'custom',
        icon: '',
    });

    function openCreate() {
        setEditingCategory(null);
        reset();
        clearErrors();
        setDialogOpen(true);
    }

    function openEdit(category: Category) {
        setEditingCategory(category);
        clearErrors();
        setData({
            name_ar: category.name_ar,
            name_en: category.name_en,
            type: category.type,
            icon: category.icon || '',
        });
        setDialogOpen(true);
    }

    function closeDialog() {
        setDialogOpen(false);
        setEditingCategory(null);
        reset();
        clearErrors();
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingCategory) {
            put(`/client-admin/service-categories/${editingCategory.id}`, {
                onSuccess: () => closeDialog(),
            });
        } else {
            post('/client-admin/service-categories', {
                onSuccess: () => closeDialog(),
            });
        }
    }

    function handleDelete(category: Category) {
        if (category.services_count > 0) return;
        if (confirm(t('confirm_delete_category') || 'Are you sure you want to delete this category?')) {
            router.delete(`/client-admin/service-categories/${category.id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Service Categories" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold">{t('service_categories')}</h1>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        {t('add_category')}
                    </button>
                </div>

                {flash?.success && (
                    <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        {flash.success}
                    </div>
                )}

                {/* Categories Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <div key={category.id} className="vuexy-card p-5">
                            <div className="mb-3 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {category.icon && (
                                        <span className="text-2xl">{category.icon}</span>
                                    )}
                                    <div>
                                        <h3 className="font-semibold">{category.name_ar}</h3>
                                        <p className="text-sm text-muted-foreground">{category.name_en}</p>
                                    </div>
                                </div>
                                <span className={`rounded-full px-2 py-0.5 text-xs ${category.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                                    {category.is_active ? t('active') : t('inactive')}
                                </span>
                            </div>
                            <div className="mb-4 flex items-center gap-2">
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeColors[category.type] || typeBadgeColors.custom}`}>
                                    {typeLabels[category.type] || category.type}
                                </span>
                                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                                    {category.services_count} {t('services')}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEdit(category)}
                                    className="flex-1 rounded-lg border px-3 py-2 text-center text-sm hover:bg-muted"
                                >
                                    <Pencil className="mx-auto h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(category)}
                                    disabled={category.services_count > 0}
                                    className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:hover:bg-red-950"
                                    title={category.services_count > 0 ? t('cannot_delete_has_services') || 'Cannot delete: category has services' : ''}
                                >
                                    <Trash2 className="mx-auto h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {categories.length === 0 && (
                    <div className="vuexy-card p-12 text-center text-muted-foreground">
                        {t('no_categories_yet') || 'No service categories yet.'}
                    </div>
                )}
            </div>

            {/* Dialog Modal */}
            {dialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50" onClick={closeDialog} />
                    <div className="relative z-50 w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {editingCategory ? t('edit_category') : t('add_category')}
                            </h2>
                            <button onClick={closeDialog} className="rounded-lg p-1 hover:bg-muted">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <Field label={t('name_ar')} error={errors.name_ar}>
                                <input
                                    type="text"
                                    value={data.name_ar}
                                    onChange={(e) => setData('name_ar', e.target.value)}
                                    className="vuexy-input"
                                    required
                                    dir="rtl"
                                />
                            </Field>
                            <Field label={t('name_en')} error={errors.name_en}>
                                <input
                                    type="text"
                                    value={data.name_en}
                                    onChange={(e) => setData('name_en', e.target.value)}
                                    className="vuexy-input"
                                    required
                                />
                            </Field>
                            <Field label={t('type')} error={errors.type}>
                                <select
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    className="vuexy-input"
                                >
                                    {categoryTypes.map((tp) => (
                                        <option key={tp} value={tp}>{typeLabels[tp]}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label={t('icon')} error={errors.icon}>
                                <input
                                    type="text"
                                    value={data.icon}
                                    onChange={(e) => setData('icon', e.target.value)}
                                    className="vuexy-input"
                                    placeholder="e.g. a CSS class or emoji"
                                />
                            </Field>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {processing
                                        ? t('saving')
                                        : editingCategory
                                            ? t('save_changes')
                                            : t('create')
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
