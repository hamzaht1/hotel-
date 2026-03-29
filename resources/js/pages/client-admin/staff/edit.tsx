import AppLayout from '@/layouts/app-layout';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';

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

interface Props {
    staffMember: StaffMember;
    roles: RoleOption[];
}

export default function EditStaff({ staffMember, roles }: Props) {
    const { t } = useT();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('client_admin'), href: '/client-admin' },
        { title: t('staff'), href: '/client-admin/staff' },
        { title: t('edit'), href: '#' },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: staffMember.name,
        email: staffMember.email,
        role_id: staffMember.role_id ? String(staffMember.role_id) : '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/client-admin/staff/${staffMember.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_staff') || 'Edit Staff'} - ${staffMember.name}`} />
            <div className="mx-auto max-w-3xl p-6">
                <h1 className="mb-6 text-2xl font-bold">{t('edit_staff') || 'Edit Staff'}</h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="vuexy-card p-6">
                        <h2 className="mb-4 text-lg font-semibold">{t('staff_details') || 'Staff Details'}</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label={t('name')} error={errors.name}>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="vuexy-input"
                                    required
                                />
                            </Field>
                            <Field label={t('email')} error={errors.email}>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="vuexy-input"
                                    required
                                />
                            </Field>
                            <Field label={t('role')} error={errors.role_id}>
                                <select
                                    value={data.role_id}
                                    onChange={(e) => setData('role_id', e.target.value)}
                                    className="vuexy-input"
                                    required
                                >
                                    <option value="">{t('select_role') || 'Select Role'}</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name_ar}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <a
                            href="/client-admin/staff"
                            className="rounded-lg border px-6 py-2.5 text-sm hover:bg-muted"
                        >
                            {t('cancel')}
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
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
