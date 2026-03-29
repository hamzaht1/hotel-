import AppLayout from '@/layouts/app-layout';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Clock } from 'lucide-react';

interface Service {
    id: number;
    name_ar: string;
    name_en: string;
    description_ar: string | null;
    description_en: string | null;
    price: string;
    duration: string | null;
    category_id: number | null;
    category: { id: number; name_ar: string; name_en: string } | null;
    featured_image: string | null;
    video_url: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

interface CategoryOption {
    id: number;
    name_ar: string;
    name_en: string;
}

interface Props {
    services: {
        data: Service[];
        links: { url: string | null; label: string; active: boolean }[];
        last_page: number;
    };
    categories: CategoryOption[];
    filters: { category_id?: string; search?: string };
}

export default function ServicesIndex({ services, categories, filters }: Props) {
    const { t } = useT();
    const flash = (usePage().props as any).flash;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('client_admin'), href: '/client-admin' },
        { title: t('services'), href: '/client-admin/services' },
    ];

    function handleDelete(id: number) {
        if (confirm(t('confirm_delete_service') || 'Are you sure you want to delete this service?')) {
            router.delete(`/client-admin/services/${id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Services" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold">{t('services')}</h1>
                    <Link
                        href="/client-admin/services/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        {t('add_service')}
                    </Link>
                </div>

                {flash?.success && (
                    <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        {flash.success}
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            router.get('/client-admin/services', {
                                search: fd.get('search') as string,
                                category_id: filters.category_id,
                            }, { preserveState: true });
                        }}
                        className="flex-1"
                    >
                        <input
                            name="search"
                            type="text"
                            placeholder={t('search_services') || 'Search services...'}
                            defaultValue={filters.search || ''}
                            className="vuexy-input w-full"
                        />
                    </form>
                    <select
                        value={filters.category_id || ''}
                        onChange={(e) => router.get('/client-admin/services', { ...filters, category_id: e.target.value || undefined }, { preserveState: true })}
                        className="vuexy-input"
                    >
                        <option value="">{t('all_categories')}</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name_en} - {cat.name_ar}</option>
                        ))}
                    </select>
                </div>

                {/* Services Card Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {services.data.map((service) => (
                        <div key={service.id} className="overflow-hidden vuexy-card">
                            <div className="aspect-video bg-muted">
                                {service.featured_image ? (
                                    <img src={`/storage/${service.featured_image}`} alt={service.name_en} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">No Image</div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="mb-1 flex items-center justify-between">
                                    <h3 className="font-semibold">{service.name_ar}</h3>
                                    <span className={`rounded-full px-2 py-0.5 text-xs ${service.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                                        {service.is_active ? t('active') : t('inactive')}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{service.name_en}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    {service.category && (
                                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                            {service.category.name_en}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm">
                                    {service.duration && (
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <Clock className="h-3.5 w-3.5" />
                                            {service.duration}
                                        </span>
                                    )}
                                    <span className="font-semibold">{service.price} {t('sar') || 'SAR'}</span>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Link href={`/client-admin/services/${service.id}/edit`} className="flex-1 rounded-lg border px-3 py-2 text-center text-sm hover:bg-muted">
                                        <Pencil className="mx-auto h-4 w-4" />
                                    </Link>
                                    <button onClick={() => handleDelete(service.id)} className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">
                                        <Trash2 className="mx-auto h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {services.data.length === 0 && (
                    <div className="vuexy-card p-12 text-center text-muted-foreground">
                        {t('no_services_yet') || 'No services yet.'}
                    </div>
                )}

                {/* Pagination */}
                {services.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {services.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-2 text-sm ${link.active ? 'bg-primary text-primary-foreground' : link.url ? 'hover:bg-muted' : 'text-muted-foreground cursor-not-allowed'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveState
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
