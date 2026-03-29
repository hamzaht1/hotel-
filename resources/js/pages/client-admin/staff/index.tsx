import AppLayout from '@/layouts/app-layout';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface RoleModel {
    id: number;
    name_ar: string;
    name_en: string;
    key: string;
}

interface StaffMember {
    id: number;
    name: string;
    email: string;
    role: string;
    role_id: number | null;
    role_model: RoleModel | null;
    created_at: string;
}

interface RoleOption {
    id: number;
    name_ar: string;
    name_en: string;
    key: string;
    is_system: boolean;
}

interface PaginatedData {
    data: StaffMember[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
}

interface Props {
    staff: PaginatedData;
    roles: RoleOption[];
    filters: { search?: string; role_id?: string };
}

export default function StaffIndex({ staff, roles, filters }: Props) {
    const { t } = useT();
    const { flash } = usePage().props as any;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('client_admin'), href: '/client-admin' },
        { title: t('staff'), href: '/client-admin/staff' },
    ];

    function handleDelete(id: number) {
        if (confirm(t('confirm_delete_staff') || 'Are you sure you want to delete this staff member?')) {
            router.delete(`/client-admin/staff/${id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('staff')} />
            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold">{t('staff')}</h1>
                    <Link
                        href="/client-admin/staff/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        {t('add_staff')}
                    </Link>
                </div>

                {/* Flash message */}
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/50 dark:text-green-400">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
                        {flash.error}
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            router.get('/client-admin/staff', {
                                search: fd.get('search') as string,
                                role_id: filters.role_id,
                            }, { preserveState: true });
                        }}
                        className="flex-1"
                    >
                        <input
                            name="search"
                            type="text"
                            placeholder={t('search_staff') || 'Search staff...'}
                            defaultValue={filters.search || ''}
                            className="vuexy-input w-full"
                        />
                    </form>
                    <select
                        value={filters.role_id || ''}
                        onChange={(e) =>
                            router.get('/client-admin/staff', {
                                ...filters,
                                role_id: e.target.value || undefined,
                            }, { preserveState: true })
                        }
                        className="vuexy-input"
                    >
                        <option value="">{t('all_roles') || 'All Roles'}</option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.name_ar}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div className="vuexy-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-3 text-start font-medium">{t('name')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('email')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('role')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('created_at')}</th>
                                    <th className="px-4 py-3 text-end font-medium">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.data.map((member) => (
                                    <tr key={member.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{member.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                                        <td className="px-4 py-3">
                                            {member.role_model ? (
                                                <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                                    {member.role_model.name_ar}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(member.created_at).toLocaleDateString('ar-SA')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/client-admin/staff/${member.id}/edit`}
                                                    className="rounded-lg border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(member.id)}
                                                    className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {staff.data.length === 0 && (
                    <div className="vuexy-card p-12 text-center text-muted-foreground">
                        {t('no_staff_yet') || 'No staff members yet.'}
                    </div>
                )}

                {/* Pagination */}
                {staff.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {staff.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : link.url
                                          ? 'hover:bg-muted'
                                          : 'cursor-not-allowed text-muted-foreground'
                                }`}
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
