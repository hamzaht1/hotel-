import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Power, CheckCircle, XCircle, Clock, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';
import { useState } from 'react';

interface Tenant {
    id: number;
    name: string;
    slug: string;
    domain: string | null;
    subdomain: string | null;
    template: string;
    plan: string | null;
    plan_id: number | null;
    plan_model: { id: number; name_ar: string; name_en: string; slug: string } | null;
    is_active: boolean;
    payment_status: string;
    payment_method: string;
    bank_transfer_receipt: string | null;
    payment_notes: string | null;
    subscription_starts_at: string | null;
    subscription_ends_at: string | null;
    users_count: number;
    created_at: string;
}

interface PaginatedData {
    data: Tenant[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

interface Props {
    tenants: PaginatedData;
    filters: { search?: string; status?: string };
}

export default function TenantsIndex({ tenants, filters }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: t('tenants'), href: '/super-admin/tenants' },
    ];

    function handleSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get('/super-admin/tenants', {
            search: formData.get('search') as string,
            status: filters.status,
        }, { preserveState: true });
    }

    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    function handleToggle(tenantId: number) {
        if (confirm(t('confirm_toggle'))) {
            router.post(`/super-admin/tenants/${tenantId}/toggle`);
        }
    }

    function handleApprove(tenantId: number) {
        if (confirm('هل تريد الموافقة على هذا الدفع وتفعيل المنشأة؟')) {
            router.post(`/super-admin/tenants/${tenantId}/approve`);
        }
    }

    function handleReject(tenantId: number) {
        if (!rejectReason.trim()) return;
        router.post(`/super-admin/tenants/${tenantId}/reject`, {
            rejection_reason: rejectReason,
        }, {
            onSuccess: () => { setRejectingId(null); setRejectReason(''); },
        });
    }

    const paymentStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge className="rounded-full bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="h-3 w-3 me-1" />مقبول</Badge>;
            case 'rejected': return <Badge className="rounded-full bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="h-3 w-3 me-1" />مرفوض</Badge>;
            default: return <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100"><Clock className="h-3 w-3 me-1" />قيد المراجعة</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('manage_tenants')} />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold">{t('tenants')}</h1>
                    <Button asChild>
                        <Link href="/super-admin/tenants/create">
                            <Plus className="h-4 w-4" />
                            {t('add_tenant')}
                        </Link>
                    </Button>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <form onSubmit={handleSearch} className="flex-1">
                        <Input
                            name="search"
                            type="text"
                            placeholder={t('search_tenants')}
                            defaultValue={filters.search || ''}
                            className="vuexy-input"
                        />
                    </form>
                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) =>
                            router.get('/super-admin/tenants', { ...filters, status: value === 'all' ? undefined : value }, { preserveState: true })
                        }
                    >
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder={t('all_status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all_status')}</SelectItem>
                            <SelectItem value="active">{t('active')}</SelectItem>
                            <SelectItem value="inactive">{t('inactive')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card className="py-0">
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-muted-foreground">
                                    <th className="px-4 py-3 text-start font-medium">{t('name')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('domain')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('template')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('plan')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('users')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('subscription')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('status')}</th>
                                    <th className="px-4 py-3 text-start font-medium">الدفع</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.data.map((tenant) => (
                                    <tr key={tenant.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{tenant.name}</div>
                                            <div className="text-xs text-muted-foreground">{tenant.slug}</div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {tenant.subdomain ? `${tenant.subdomain}.*` : tenant.domain || '—'}
                                        </td>
                                        <td className="px-4 py-3 capitalize">{tenant.template}</td>
                                        <td className="px-4 py-3 capitalize">
                                            {tenant.plan_model?.name_ar || tenant.plan || '—'}
                                        </td>
                                        <td className="px-4 py-3">{tenant.users_count}</td>
                                        <td className="px-4 py-3 text-xs">
                                            {tenant.subscription_ends_at ? (
                                                <span>{tenant.subscription_starts_at} → {tenant.subscription_ends_at}</span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={tenant.is_active ? 'default' : 'destructive'} className="rounded-full">
                                                {tenant.is_active ? t('active') : t('inactive')}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                {paymentStatusBadge(tenant.payment_status)}
                                                {tenant.bank_transfer_receipt && (
                                                    <a
                                                        href={`/storage/${tenant.bank_transfer_receipt}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                                    >
                                                        <FileImage className="h-3 w-3" />
                                                        الإيصال
                                                    </a>
                                                )}
                                                {tenant.payment_status === 'pending' && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs text-green-600 border-green-300 hover:bg-green-50"
                                                            onClick={() => handleApprove(tenant.id)}
                                                        >
                                                            <CheckCircle className="h-3 w-3 me-1" />
                                                            قبول
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                                                            onClick={() => setRejectingId(tenant.id)}
                                                        >
                                                            <XCircle className="h-3 w-3 me-1" />
                                                            رفض
                                                        </Button>
                                                    </div>
                                                )}
                                                {rejectingId === tenant.id && (
                                                    <div className="mt-1 flex gap-1">
                                                        <Input
                                                            value={rejectReason}
                                                            onChange={(e) => setRejectReason(e.target.value)}
                                                            placeholder="سبب الرفض..."
                                                            className="h-7 text-xs"
                                                        />
                                                        <Button size="sm" className="h-7 text-xs" onClick={() => handleReject(tenant.id)}>
                                                            إرسال
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/super-admin/tenants/${tenant.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggle(tenant.id)}
                                                    className={tenant.is_active ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}
                                                >
                                                    <Power className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {tenants.data.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                                            {t('no_tenants_found')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {tenants.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {tenants.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'ghost'}
                                size="sm"
                                disabled={!link.url}
                                asChild={!!link.url}
                                className={!link.url ? 'cursor-not-allowed opacity-50' : ''}
                            >
                                {link.url ? (
                                    <Link href={link.url} preserveState dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                )}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
