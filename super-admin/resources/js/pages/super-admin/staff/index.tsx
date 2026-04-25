import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Plus, Search, Download, Pencil, Power, Trash2, KeyRound,
    Shield, Users as UsersIcon, XCircle, User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    photo: string | null;
    photo_url: string | null;
    role: string;
    is_active: boolean;
    created_at: string;
    role_model: { id: number; key: string; name_ar: string; name_en: string; is_system: boolean } | null;
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

interface Permission { id: number; key: string; name_ar: string; name_en: string; group: string }

interface Props {
    tab: 'staff' | 'permissions';
    users: {
        data: User[];
        links: { url: string | null; label: string; active: boolean }[];
        last_page: number;
        current_page: number;
        total: number;
    };
    roles: Role[];
    permissions: Permission[];
    filters: Record<string, string | undefined>;
}

export default function StaffIndex({ tab: initialTab, users, roles, permissions, filters }: Props) {
    const { t, locale, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string; new_password?: string } | undefined;
    const [tab, setTab] = useState<'staff' | 'permissions'>(initialTab);
    const [addStaffOpen, setAddStaffOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [addRoleOpen, setAddRoleOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'الموظفون' : 'Staff', href: '/super-admin/staff' },
    ];

    function apply(key: string, value: string | undefined) {
        router.get('/super-admin/staff', { ...filters, tab, [key]: value || undefined }, { preserveState: true, preserveScroll: true });
    }

    function toggleStaff(id: number) {
        router.post(`/super-admin/staff/${id}/toggle`, {}, { preserveScroll: true });
    }

    function deleteStaff(id: number) {
        if (!confirm(isArabic ? 'حذف الموظف؟' : 'Delete employee?')) return;
        router.delete(`/super-admin/staff/${id}`, { preserveScroll: true });
    }

    function resetPassword(id: number) {
        if (!confirm(isArabic ? 'إعادة تعيين كلمة المرور؟' : 'Reset password?')) return;
        router.post(`/super-admin/staff/${id}/reset-password`, { send_by_email: true }, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'الموظفون' : 'Staff'} />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {flash.success}
                        {flash.new_password && (
                            <div className="mt-1 font-mono text-xs">{isArabic ? 'كلمة المرور الجديدة: ' : 'New password: '}<strong>{flash.new_password}</strong></div>
                        )}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold">{isArabic ? 'الموظفون' : 'Staff'}</h1>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => setAddStaffOpen(true)} className="bg-violet-600 hover:bg-violet-700">
                            <Plus className="h-4 w-4" /> {isArabic ? 'إضافة موظف' : 'Add employee'}
                        </Button>
                        <Button variant="outline" asChild>
                            <a href="/super-admin/staff-export"><Download className="h-4 w-4" /> {isArabic ? 'تصدير' : 'Export'}</a>
                        </Button>
                        <Button variant="outline" onClick={() => { setTab('permissions'); setAddRoleOpen(true); }}>
                            <Shield className="h-4 w-4" /> {isArabic ? 'إضافة دور' : 'Add role'}
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b">
                    <TabButton active={tab === 'staff'} onClick={() => setTab('staff')}>
                        <UsersIcon className="h-4 w-4" /> {isArabic ? 'الموظفين' : 'Employees'}
                    </TabButton>
                    <TabButton active={tab === 'permissions'} onClick={() => setTab('permissions')}>
                        <Shield className="h-4 w-4" /> {isArabic ? 'الصلاحيات' : 'Permissions'}
                    </TabButton>
                </div>

                {tab === 'staff' && (
                    <>
                        {/* Filters */}
                        <Card>
                            <CardContent className="p-4 grid gap-3 md:grid-cols-[1fr_220px]">
                                <div className="relative">
                                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={isArabic ? 'بحث بالاسم أو ID' : 'Search by name or ID'}
                                        defaultValue={filters.search ?? ''}
                                        onBlur={(e) => apply('search', e.target.value)}
                                        className="ps-10"
                                    />
                                </div>
                                <Select value={filters.role_id ?? 'all'} onValueChange={(v) => apply('role_id', v === 'all' ? undefined : v)}>
                                    <SelectTrigger><SelectValue placeholder={isArabic ? 'جميع الأدوار' : 'All roles'} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{isArabic ? 'جميع الأدوار' : 'All roles'}</SelectItem>
                                        {roles.map((r) => <SelectItem key={r.id} value={String(r.id)}>{isArabic ? r.name_ar : r.name_en}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        {/* Table */}
                        <Card className="py-0">
                            <CardContent className="overflow-x-auto p-0">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50 text-muted-foreground text-xs">
                                            <th className="px-3 py-3 text-start">id</th>
                                            <th className="px-3 py-3 text-start">{isArabic ? 'الاسم' : 'Name'}</th>
                                            <th className="px-3 py-3 text-start">{isArabic ? 'البريد الإلكتروني' : 'Email'}</th>
                                            <th className="px-3 py-3 text-start">{isArabic ? 'الدور' : 'Role'}</th>
                                            <th className="px-3 py-3 text-start">{isArabic ? 'رقم الجوال' : 'Phone'}</th>
                                            <th className="px-3 py-3 text-start">{isArabic ? 'تاريخ الإنشاء' : 'Created'}</th>
                                            <th className="px-3 py-3 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                                            <th className="px-3 py-3 text-start">{isArabic ? 'الإجراءات' : 'Actions'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.data.length === 0 && (
                                            <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">{isArabic ? 'لا يوجد موظفون' : 'No employees'}</td></tr>
                                        )}
                                        {users.data.map((u) => (
                                            <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="px-3 py-2 font-mono text-xs">{u.id}</td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        {u.photo_url ? (
                                                            <img src={u.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <span className="font-medium">{u.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-xs">{u.email}</td>
                                                <td className="px-3 py-2">
                                                    <Badge variant="outline">{u.role_model ? (isArabic ? u.role_model.name_ar : u.role_model.name_en) : u.role}</Badge>
                                                </td>
                                                <td className="px-3 py-2 text-xs">{u.phone ?? '—'}</td>
                                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                                    {new Date(u.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {u.is_active ? (
                                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{isArabic ? 'نشط' : 'Active'}</Badge>
                                                    ) : (
                                                        <Badge variant="destructive">{isArabic ? 'معطل' : 'Inactive'}</Badge>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-0.5">
                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditUser(u)} title={isArabic ? 'تعديل' : 'Edit'}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => resetPassword(u.id)} title={isArabic ? 'كلمة المرور' : 'Password'}>
                                                            <KeyRound className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleStaff(u.id)} title={u.is_active ? (isArabic ? 'تعطيل' : 'Disable') : (isArabic ? 'تفعيل' : 'Enable')}>
                                                            <Power className={`h-4 w-4 ${u.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => deleteStaff(u.id)} title={isArabic ? 'حذف' : 'Delete'}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        {users.last_page > 1 && (
                            <div className="flex justify-center gap-1">
                                {users.links.map((link, i) => (
                                    <Button key={i} variant={link.active ? 'default' : 'ghost'} size="sm" disabled={!link.url} asChild={!!link.url}>
                                        {link.url
                                            ? <Link href={link.url} preserveState dangerouslySetInnerHTML={{ __html: link.label }} />
                                            : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {tab === 'permissions' && (
                    <PermissionsMatrix roles={roles} permissions={permissions} isArabic={isArabic} onAddRole={() => setAddRoleOpen(true)} />
                )}
            </div>

            {addStaffOpen && <AddStaffModal roles={roles} onClose={() => setAddStaffOpen(false)} isArabic={isArabic} />}
            {editUser && <EditStaffModal user={editUser} roles={roles} onClose={() => setEditUser(null)} isArabic={isArabic} />}
            {addRoleOpen && <AddRoleModal permissions={permissions} onClose={() => setAddRoleOpen(false)} isArabic={isArabic} />}
        </AppLayout>
    );
}

// ─── Tab button ────────────────────────────────────────────
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-2.5 text-sm font-medium -mb-px border-b-2 flex items-center gap-2 ${
                active ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
            {children}
        </button>
    );
}

// ─── Permissions matrix ─────────────────────────────────────
function PermissionsMatrix({ roles, permissions, isArabic, onAddRole }: {
    roles: Role[]; permissions: Permission[]; isArabic: boolean; onAddRole: () => void
}) {
    // Group permissions by `group` field
    const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
        const g = p.group || 'general';
        acc[g] ||= [];
        acc[g].push(p);
        return acc;
    }, {});

    function toggle(roleId: number, permissionId: number, currentlyHas: boolean) {
        const role = roles.find((r) => r.id === roleId)!;
        const nextPerms = currentlyHas
            ? role.permissions.filter((p) => p.id !== permissionId).map((p) => p.id)
            : [...role.permissions.map((p) => p.id), permissionId];
        router.post(`/super-admin/roles/${roleId}`, { permissions: nextPerms }, { preserveScroll: true });
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{isArabic ? `${roles.length} دور · ${permissions.length} صلاحية` : `${roles.length} roles · ${permissions.length} permissions`}</div>
                <Button onClick={onAddRole} variant="outline"><Plus className="h-4 w-4" /> {isArabic ? 'إضافة دور' : 'Add role'}</Button>
            </div>

            <Card className="py-0">
                <CardContent className="overflow-x-auto p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50 text-muted-foreground text-xs">
                                <th className="px-3 py-3 text-start sticky start-0 bg-muted/50">{isArabic ? 'الصلاحية' : 'Permission'}</th>
                                {roles.map((r) => (
                                    <th key={r.id} className="px-3 py-3 text-center min-w-[120px]">
                                        <div>{isArabic ? r.name_ar : r.name_en}</div>
                                        {r.is_system && <Badge variant="outline" className="mt-1 text-[10px]">{isArabic ? 'نظامي' : 'System'}</Badge>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(grouped).map(([group, perms]) => (
                                <>
                                    <tr key={`h-${group}`} className="border-b bg-muted/20">
                                        <td colSpan={roles.length + 1} className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">{group}</td>
                                    </tr>
                                    {perms.map((p) => (
                                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                                            <td className="px-3 py-2 sticky start-0 bg-background">
                                                <div className="font-medium text-xs">{isArabic ? p.name_ar : p.name_en}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono">{p.key}</div>
                                            </td>
                                            {roles.map((r) => {
                                                const has = r.permissions.some((rp) => rp.id === p.id);
                                                return (
                                                    <td key={r.id} className="px-3 py-2 text-center">
                                                        <Checkbox checked={has} onCheckedChange={() => toggle(r.id, p.id, has)} />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Add staff modal ────────────────────────────────────────
function AddStaffModal({ roles, onClose, isArabic }: { roles: Role[]; onClose: () => void; isArabic: boolean }) {
    const { data, setData, post, processing, errors } = useForm<{
        name: string; email: string; phone: string; role_id: string;
        password: string; password_confirmation: string;
        photo: File | null; send_password_by_email: boolean;
    }>({
        name: '', email: '', phone: '', role_id: '',
        password: '', password_confirmation: '', photo: null,
        send_password_by_email: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/super-admin/staff', { forceFormData: true, preserveScroll: true, onSuccess: () => onClose() });
    }

    return (
        <Modal title={isArabic ? 'إضافة موظف' : 'Add employee'} onClose={onClose}>
            <form onSubmit={submit} className="space-y-3">
                <Field label={isArabic ? 'الاسم *' : 'Name *'} error={errors.name}>
                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                </Field>
                <Field label={isArabic ? 'البريد *' : 'Email *'} error={errors.email}>
                    <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                </Field>
                <Field label={isArabic ? 'رقم الجوال *' : 'Phone *'} error={errors.phone}>
                    <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                </Field>
                <Field label={isArabic ? 'تحديد الصلاحية *' : 'Role *'} error={(errors as Record<string, string>).role_id}>
                    <Select value={data.role_id} onValueChange={(v) => setData('role_id', v)}>
                        <SelectTrigger><SelectValue placeholder={isArabic ? 'اختر دور' : 'Select role'} /></SelectTrigger>
                        <SelectContent>
                            {roles.map((r) => <SelectItem key={r.id} value={String(r.id)}>{isArabic ? r.name_ar : r.name_en}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label={isArabic ? 'الصورة (اختياري)' : 'Photo (optional)'} error={(errors as Record<string, string>).photo}>
                    <Input type="file" accept="image/*" onChange={(e) => setData('photo', e.target.files?.[0] ?? null)} />
                </Field>
                <Field label={isArabic ? 'كلمة المرور *' : 'Password *'} error={errors.password}>
                    <Input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} minLength={8} required />
                </Field>
                <Field label={isArabic ? 'تأكيد كلمة المرور *' : 'Confirm password *'}>
                    <Input type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} minLength={8} required />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={data.send_password_by_email} onCheckedChange={(v) => setData('send_password_by_email', v === true)} />
                    <span>{isArabic ? 'إرسال كلمة المرور بالبريد' : 'Send password by email'}</span>
                </label>
                <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button type="button" variant="outline" onClick={onClose}>{isArabic ? 'إلغاء' : 'Cancel'}</Button>
                    <Button type="submit" disabled={processing}>{isArabic ? 'إضافة' : 'Create'}</Button>
                </div>
            </form>
        </Modal>
    );
}

function EditStaffModal({ user, roles, onClose, isArabic }: { user: User; roles: Role[]; onClose: () => void; isArabic: boolean }) {
    const { data, setData, post, processing, errors } = useForm<{
        name: string; email: string; phone: string; role_id: string; photo: File | null;
    }>({
        name: user.name, email: user.email, phone: user.phone ?? '',
        role_id: user.role_model ? String(user.role_model.id) : '',
        photo: null,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/super-admin/staff/${user.id}`, { forceFormData: true, preserveScroll: true, onSuccess: () => onClose() });
    }

    return (
        <Modal title={`${isArabic ? 'تعديل' : 'Edit'} — ${user.name}`} onClose={onClose}>
            <form onSubmit={submit} className="space-y-3">
                <Field label={isArabic ? 'الاسم' : 'Name'} error={errors.name}>
                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                </Field>
                <Field label={isArabic ? 'البريد' : 'Email'} error={errors.email}>
                    <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                </Field>
                <Field label={isArabic ? 'الجوال' : 'Phone'} error={errors.phone}>
                    <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                </Field>
                <Field label={isArabic ? 'الدور' : 'Role'}>
                    <Select value={data.role_id} onValueChange={(v) => setData('role_id', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {roles.map((r) => <SelectItem key={r.id} value={String(r.id)}>{isArabic ? r.name_ar : r.name_en}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label={isArabic ? 'تغيير الصورة' : 'Change photo'}>
                    <Input type="file" accept="image/*" onChange={(e) => setData('photo', e.target.files?.[0] ?? null)} />
                </Field>
                <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button type="button" variant="outline" onClick={onClose}>{isArabic ? 'إلغاء' : 'Cancel'}</Button>
                    <Button type="submit" disabled={processing}>{isArabic ? 'حفظ' : 'Save'}</Button>
                </div>
            </form>
        </Modal>
    );
}

function AddRoleModal({ permissions, onClose, isArabic }: { permissions: Permission[]; onClose: () => void; isArabic: boolean }) {
    const { data, setData, post, processing, errors } = useForm<{
        name_ar: string; name_en: string; key: string; permissions: number[];
    }>({
        name_ar: '', name_en: '', key: '', permissions: [],
    });

    function togglePerm(id: number) {
        setData('permissions', data.permissions.includes(id) ? data.permissions.filter((x) => x !== id) : [...data.permissions, id]);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/super-admin/roles', { preserveScroll: true, onSuccess: () => onClose() });
    }

    return (
        <Modal title={isArabic ? 'إضافة دور جديد' : 'Add new role'} onClose={onClose}>
            <form onSubmit={submit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={isArabic ? 'الاسم (عربي)' : 'Name (AR)'} error={errors.name_ar}>
                        <Input value={data.name_ar} onChange={(e) => setData('name_ar', e.target.value)} required />
                    </Field>
                    <Field label={isArabic ? 'الاسم (إنجليزي)' : 'Name (EN)'} error={errors.name_en}>
                        <Input value={data.name_en} onChange={(e) => setData('name_en', e.target.value)} required />
                    </Field>
                    <Field label="Key (optional)" error={errors.key}>
                        <Input value={data.key} onChange={(e) => setData('key', e.target.value)} placeholder="auto-slug" />
                    </Field>
                </div>
                <div>
                    <Label className="text-xs mb-2 block">{isArabic ? 'الصلاحيات' : 'Permissions'}</Label>
                    <div className="max-h-60 overflow-y-auto border rounded p-3 space-y-1">
                        {permissions.map((p) => (
                            <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox checked={data.permissions.includes(p.id)} onCheckedChange={() => togglePerm(p.id)} />
                                <span>{isArabic ? p.name_ar : p.name_en}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">{p.key}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button type="button" variant="outline" onClick={onClose}>{isArabic ? 'إلغاء' : 'Cancel'}</Button>
                    <Button type="submit" disabled={processing}>{isArabic ? 'إضافة' : 'Create'}</Button>
                </div>
            </form>
        </Modal>
    );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto flex items-start justify-center">
            <div className="w-full max-w-xl bg-background rounded-lg shadow-xl my-8">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-bold">{title}</h2>
                    <button type="button" onClick={onClose}><XCircle className="h-5 w-5 text-muted-foreground hover:text-foreground" /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
