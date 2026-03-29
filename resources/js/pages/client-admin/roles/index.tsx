import AppLayout from '@/layouts/app-layout';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Shield, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

interface Permission {
    id: number;
    key: string;
    name_ar: string;
    name_en: string;
    group: string;
}

interface Role {
    id: number;
    key: string;
    name_ar: string;
    name_en: string;
    is_system: boolean;
    users_count: number;
    permissions: { id: number; key: string }[];
}

interface Props {
    roles: Role[];
    permissions: Permission[];
}

export default function RolesIndex({ roles, permissions }: Props) {
    const { t, locale } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('client_admin'), href: '/client-admin' },
        { title: t('roles_permissions', 'Roles & Permissions'), href: '/client-admin/roles' },
    ];

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);
    const [expandedRole, setExpandedRole] = useState<number | null>(null);

    // Group permissions by group field
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        permissions.forEach((p) => {
            if (!groups[p.group]) groups[p.group] = [];
            groups[p.group].push(p);
        });
        return groups;
    }, [permissions]);

    const groupNames = Object.keys(groupedPermissions);

    // --- Add Role Form ---
    const addForm = useForm({
        name_ar: '',
        name_en: '',
        key: '',
        permissions: [] as number[],
    });

    function slugify(text: string) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    function handleAddNameEnChange(value: string) {
        addForm.setData((prev) => ({
            ...prev,
            name_en: value,
            key: slugify(value),
        }));
    }

    function toggleAddPermission(permId: number) {
        addForm.setData('permissions',
            addForm.data.permissions.includes(permId)
                ? addForm.data.permissions.filter((id) => id !== permId)
                : [...addForm.data.permissions, permId]
        );
    }

    function toggleAddGroup(group: string) {
        const groupPermIds = groupedPermissions[group].map((p) => p.id);
        const allSelected = groupPermIds.every((id) => addForm.data.permissions.includes(id));
        if (allSelected) {
            addForm.setData('permissions', addForm.data.permissions.filter((id) => !groupPermIds.includes(id)));
        } else {
            const merged = new Set([...addForm.data.permissions, ...groupPermIds]);
            addForm.setData('permissions', Array.from(merged));
        }
    }

    function submitAdd(e: React.FormEvent) {
        e.preventDefault();
        addForm.post('/client-admin/roles', {
            onSuccess: () => {
                addForm.reset();
                setShowAddDialog(false);
            },
        });
    }

    // --- Edit Role Form ---
    const editForm = useForm({
        name_ar: '',
        name_en: '',
        key: '',
        permissions: [] as number[],
    });

    function openEditDialog(role: Role) {
        editForm.setData({
            name_ar: role.name_ar,
            name_en: role.name_en,
            key: role.key,
            permissions: role.permissions.map((p) => p.id),
        });
        setEditingRole(role);
    }

    function handleEditNameEnChange(value: string) {
        editForm.setData((prev) => ({
            ...prev,
            name_en: value,
            key: slugify(value),
        }));
    }

    function toggleEditPermission(permId: number) {
        editForm.setData('permissions',
            editForm.data.permissions.includes(permId)
                ? editForm.data.permissions.filter((id) => id !== permId)
                : [...editForm.data.permissions, permId]
        );
    }

    function toggleEditGroup(group: string) {
        const groupPermIds = groupedPermissions[group].map((p) => p.id);
        const allSelected = groupPermIds.every((id) => editForm.data.permissions.includes(id));
        if (allSelected) {
            editForm.setData('permissions', editForm.data.permissions.filter((id) => !groupPermIds.includes(id)));
        } else {
            const merged = new Set([...editForm.data.permissions, ...groupPermIds]);
            editForm.setData('permissions', Array.from(merged));
        }
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingRole) return;
        editForm.put(`/client-admin/roles/${editingRole.id}`, {
            onSuccess: () => {
                editForm.reset();
                setEditingRole(null);
            },
        });
    }

    // --- Delete ---
    function confirmDelete() {
        if (!deletingRole) return;
        router.delete(`/client-admin/roles/${deletingRole.id}`, {
            onSuccess: () => setDeletingRole(null),
        });
    }

    // --- Permission matrix for viewing a role ---
    function toggleRoleExpand(roleId: number) {
        setExpandedRole(expandedRole === roleId ? null : roleId);
    }

    function permissionName(p: Permission) {
        return locale === 'ar' ? p.name_ar : p.name_en;
    }

    function groupLabel(group: string) {
        return t(`perm_group_${group}`, group.charAt(0).toUpperCase() + group.slice(1));
    }

    // --- Render permission checkboxes for a form ---
    function renderPermissionMatrix(
        selectedPerms: number[],
        onToggle: (id: number) => void,
        onToggleGroup: (group: string) => void,
    ) {
        return (
            <div className="space-y-4">
                {groupNames.map((group) => {
                    const perms = groupedPermissions[group];
                    const allChecked = perms.every((p) => selectedPerms.includes(p.id));
                    const someChecked = perms.some((p) => selectedPerms.includes(p.id));

                    return (
                        <div key={group} className="rounded-lg border p-3">
                            <div className="mb-2 flex items-center gap-2">
                                <Checkbox
                                    checked={allChecked ? true : someChecked ? 'indeterminate' : false}
                                    onCheckedChange={() => onToggleGroup(group)}
                                />
                                <span className="text-sm font-semibold">{groupLabel(group)}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {perms.map((perm) => (
                                    <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                            checked={selectedPerms.includes(perm.id)}
                                            onCheckedChange={() => onToggle(perm.id)}
                                        />
                                        <span className="text-sm">{permissionName(perm)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // --- Read-only permission matrix for expanded role view ---
    function renderReadOnlyMatrix(role: Role) {
        const rolePermIds = new Set(role.permissions.map((p) => p.id));
        return (
            <div className="mt-4 space-y-3">
                {groupNames.map((group) => {
                    const perms = groupedPermissions[group];
                    const hasAny = perms.some((p) => rolePermIds.has(p.id));
                    if (!hasAny) return null;

                    return (
                        <div key={group}>
                            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {groupLabel(group)}
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {perms.filter((p) => rolePermIds.has(p.id)).map((perm) => (
                                    <Badge key={perm.id} variant="secondary" className="text-xs">
                                        {permissionName(perm)}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {role.permissions.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t('no_permissions', 'No permissions assigned')}</p>
                )}
            </div>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('roles_permissions', 'Roles & Permissions')} />
            <div className="flex flex-col gap-6 p-6">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="vuexy-card border-l-4 border-l-[#28c76f] px-4 py-3 text-sm text-[#28c76f]">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="vuexy-card border-l-4 border-l-[#ea5455] px-4 py-3 text-sm text-[#ea5455]">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('roles_permissions', 'Roles & Permissions')}</h1>
                        <p className="text-sm text-muted-foreground">
                            {t('roles_permissions_desc', 'Manage roles and assign permissions to control access')}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        {t('add_role', 'Add Role')}
                    </button>
                </div>

                {/* Roles List */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {roles.map((role) => (
                        <div key={role.id} className="vuexy-card flex flex-col">
                            <div className="flex items-start justify-between p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">
                                            {locale === 'ar' ? role.name_ar : role.name_en}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {locale === 'ar' ? role.name_en : role.name_ar}
                                        </p>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                            {role.is_system && (
                                                <Badge variant="outline" className="text-xs">
                                                    {t('system_role', 'System')}
                                                </Badge>
                                            )}
                                            <Badge variant="secondary" className="text-xs">
                                                <Users className="mr-1 h-3 w-3" />
                                                {role.users_count} {t('users', 'users')}
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                                {role.permissions.length} {t('permissions_count', 'permissions')}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {!role.is_system && (
                                        <>
                                            <button
                                                onClick={() => openEditDialog(role)}
                                                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                title={t('edit')}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeletingRole(role)}
                                                disabled={role.users_count > 0}
                                                className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                                                title={role.users_count > 0 ? t('role_has_users', 'Cannot delete: role has users') : t('delete')}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Expand/Collapse permissions */}
                            <div className="border-t px-4 py-2">
                                <button
                                    onClick={() => toggleRoleExpand(role.id)}
                                    className="w-full text-left text-xs font-medium text-primary hover:underline"
                                >
                                    {expandedRole === role.id
                                        ? t('hide_permissions', 'Hide Permissions')
                                        : t('view_permissions', 'View Permissions')}
                                </button>
                                {expandedRole === role.id && renderReadOnlyMatrix(role)}
                            </div>
                        </div>
                    ))}
                </div>

                {roles.length === 0 && (
                    <div className="vuexy-card p-12 text-center text-muted-foreground">
                        {t('no_roles_yet', 'No roles yet. Click "Add Role" to create your first role.')}
                    </div>
                )}

                {/* ==================== Add Role Dialog ==================== */}
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{t('add_role', 'Add Role')}</DialogTitle>
                            <DialogDescription>
                                {t('add_role_desc', 'Create a new role and assign permissions')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitAdd} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">{t('name_ar')}</label>
                                    <input
                                        type="text"
                                        value={addForm.data.name_ar}
                                        onChange={(e) => addForm.setData('name_ar', e.target.value)}
                                        className="vuexy-input w-full"
                                        dir="rtl"
                                        required
                                    />
                                    {addForm.errors.name_ar && (
                                        <p className="mt-1 text-xs text-red-500">{addForm.errors.name_ar}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">{t('name_en')}</label>
                                    <input
                                        type="text"
                                        value={addForm.data.name_en}
                                        onChange={(e) => handleAddNameEnChange(e.target.value)}
                                        className="vuexy-input w-full"
                                        required
                                    />
                                    {addForm.errors.name_en && (
                                        <p className="mt-1 text-xs text-red-500">{addForm.errors.name_en}</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">{t('key', 'Key')}</label>
                                <input
                                    type="text"
                                    value={addForm.data.key}
                                    onChange={(e) => addForm.setData('key', e.target.value)}
                                    className="vuexy-input w-full font-mono text-sm"
                                    required
                                />
                                {addForm.errors.key && (
                                    <p className="mt-1 text-xs text-red-500">{addForm.errors.key}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    {t('permissions_count', 'Permissions')}
                                </label>
                                {renderPermissionMatrix(
                                    addForm.data.permissions,
                                    toggleAddPermission,
                                    toggleAddGroup,
                                )}
                                {addForm.errors.permissions && (
                                    <p className="mt-1 text-xs text-red-500">{addForm.errors.permissions}</p>
                                )}
                            </div>

                            <DialogFooter>
                                <button
                                    type="button"
                                    onClick={() => setShowAddDialog(false)}
                                    className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={addForm.processing}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                                >
                                    {addForm.processing ? t('creating') : t('create')}
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ==================== Edit Role Dialog ==================== */}
                <Dialog open={!!editingRole} onOpenChange={(open) => { if (!open) setEditingRole(null); }}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{t('edit_role', 'Edit Role')}</DialogTitle>
                            <DialogDescription>
                                {t('edit_role_desc', 'Update role details and permissions')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">{t('name_ar')}</label>
                                    <input
                                        type="text"
                                        value={editForm.data.name_ar}
                                        onChange={(e) => editForm.setData('name_ar', e.target.value)}
                                        className="vuexy-input w-full"
                                        dir="rtl"
                                        required
                                    />
                                    {editForm.errors.name_ar && (
                                        <p className="mt-1 text-xs text-red-500">{editForm.errors.name_ar}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">{t('name_en')}</label>
                                    <input
                                        type="text"
                                        value={editForm.data.name_en}
                                        onChange={(e) => handleEditNameEnChange(e.target.value)}
                                        className="vuexy-input w-full"
                                        required
                                    />
                                    {editForm.errors.name_en && (
                                        <p className="mt-1 text-xs text-red-500">{editForm.errors.name_en}</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">{t('key', 'Key')}</label>
                                <input
                                    type="text"
                                    value={editForm.data.key}
                                    onChange={(e) => editForm.setData('key', e.target.value)}
                                    className="vuexy-input w-full font-mono text-sm"
                                    required
                                />
                                {editForm.errors.key && (
                                    <p className="mt-1 text-xs text-red-500">{editForm.errors.key}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    {t('permissions_count', 'Permissions')}
                                </label>
                                {renderPermissionMatrix(
                                    editForm.data.permissions,
                                    toggleEditPermission,
                                    toggleEditGroup,
                                )}
                                {editForm.errors.permissions && (
                                    <p className="mt-1 text-xs text-red-500">{editForm.errors.permissions}</p>
                                )}
                            </div>

                            <DialogFooter>
                                <button
                                    type="button"
                                    onClick={() => setEditingRole(null)}
                                    className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                                >
                                    {editForm.processing ? t('saving') : t('save_changes')}
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ==================== Delete Confirm Dialog ==================== */}
                <Dialog open={!!deletingRole} onOpenChange={(open) => { if (!open) setDeletingRole(null); }}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('delete_role', 'Delete Role')}</DialogTitle>
                            <DialogDescription>
                                {t('delete_role_confirm', 'Are you sure you want to delete this role? This action cannot be undone.')}
                            </DialogDescription>
                        </DialogHeader>
                        {deletingRole && (
                            <div className="rounded-lg bg-muted/50 p-3">
                                <p className="font-medium">
                                    {locale === 'ar' ? deletingRole.name_ar : deletingRole.name_en}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {locale === 'ar' ? deletingRole.name_en : deletingRole.name_ar}
                                </p>
                            </div>
                        )}
                        <DialogFooter>
                            <button
                                type="button"
                                onClick={() => setDeletingRole(null)}
                                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                            >
                                {t('delete')}
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
