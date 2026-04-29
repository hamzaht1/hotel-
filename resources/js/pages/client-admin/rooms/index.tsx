import AppLayout from '@/layouts/app-layout';
import { useT } from '@/hooks/use-translations';
import { useStorageUrl } from '@/lib/storage';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Room {
    id: number;
    name_ar: string;
    name_en: string;
    type: string;
    price: string;
    capacity: number;
    is_active: boolean;
    featured_image: string | null;
    images: { id: number; path: string }[];
}

interface Props {
    rooms: {
        data: Room[];
        links: { url: string | null; label: string; active: boolean }[];
        last_page: number;
    };
    filters: { type?: string; search?: string };
}

const roomTypes = ['standard', 'deluxe', 'suite', 'family'];

export default function RoomsIndex({ rooms, filters }: Props) {
    const { t } = useT();
    const storageUrl = useStorageUrl();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('client_admin'), href: '/client-admin' },
        { title: t('rooms'), href: '/client-admin/rooms' },
    ];

    const roomTypeLabels: Record<string, string> = {
        standard: t('standard'),
        deluxe: t('deluxe'),
        suite: t('suite'),
        family: t('family'),
    };

    function handleDelete(id: number) {
        if (confirm('Are you sure you want to delete this room?')) {
            router.delete(`/client-admin/rooms/${id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rooms" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold">{t('rooms')}</h1>
                    <Link
                        href="/client-admin/rooms/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        {t('add_room')}
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); router.get('/client-admin/rooms', { search: fd.get('search') as string, type: filters.type }, { preserveState: true }); }} className="flex-1">
                        <input name="search" type="text" placeholder={t('search_rooms')} defaultValue={filters.search || ''} className="vuexy-input w-full" />
                    </form>
                    <select
                        value={filters.type || ''}
                        onChange={(e) => router.get('/client-admin/rooms', { ...filters, type: e.target.value || undefined }, { preserveState: true })}
                        className="vuexy-input"
                    >
                        <option value="">{t('all_types')}</option>
                        {roomTypes.map((tp) => <option key={tp} value={tp}>{roomTypeLabels[tp]}</option>)}
                    </select>
                </div>

                {/* Room Cards Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {rooms.data.map((room) => (
                        <div key={room.id} className="overflow-hidden vuexy-card">
                            <div className="aspect-video bg-muted">
                                {room.featured_image ? (
                                    <img src={storageUrl(room.featured_image) ?? ''} alt={room.name_en} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">No Image</div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="mb-1 flex items-center justify-between">
                                    <h3 className="font-semibold">{room.name_ar}</h3>
                                    <span className={`rounded-full px-2 py-0.5 text-xs ${room.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                                        {room.is_active ? t('active') : t('inactive')}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{room.name_en}</p>
                                <div className="mt-2 flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{roomTypeLabels[room.type] || room.type}</span>
                                    <span className="font-semibold">{room.price} ر.س</span>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">{t('capacity')}: {room.capacity} {t('guests')}</div>
                                <div className="mt-4 flex gap-2">
                                    <Link href={`/client-admin/rooms/${room.id}/edit`} className="flex-1 rounded-lg border px-3 py-2 text-center text-sm hover:bg-muted">
                                        <Pencil className="mx-auto h-4 w-4" />
                                    </Link>
                                    <button onClick={() => handleDelete(room.id)} className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">
                                        <Trash2 className="mx-auto h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {rooms.data.length === 0 && (
                    <div className="vuexy-card p-12 text-center text-muted-foreground">
                        {t('no_rooms_yet')}
                    </div>
                )}

                {/* Pagination */}
                {rooms.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {rooms.links.map((link, i) => (
                            <Link key={i} href={link.url || '#'} className={`rounded-lg px-3 py-2 text-sm ${link.active ? 'bg-primary text-primary-foreground' : link.url ? 'hover:bg-muted' : 'text-muted-foreground cursor-not-allowed'}`} dangerouslySetInnerHTML={{ __html: link.label }} preserveState />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
