import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle, XCircle, Clock, FileImage, CreditCard, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';
import { useLocale } from '@/hooks/use-locale';
import { useState } from 'react';

interface Plan {
    id: number;
    name_ar: string;
    name_en: string;
    price: string;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
}

interface RenewalRequest {
    id: number;
    tenant_id: number;
    plan_id: number | null;
    status: string;
    payment_method: string | null;
    receipt_path: string | null;
    receipt_url: string | null;
    notes: string | null;
    requested_at: string;
    processed_at: string | null;
    tenant: Tenant;
    plan: Plan | null;
}

interface PaginatedData {
    data: RenewalRequest[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

interface Props {
    renewals: PaginatedData;
    filters: { status?: string; payment_method?: string };
}

export default function RenewalsIndex({ renewals, filters }: Props) {
    const { t } = useT();
    const { isArabic } = useLocale();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin', 'Super Admin'), href: '/super-admin' },
        { title: isArabic ? 'طلبات التجديد' : 'Renewals', href: '/super-admin/renewals' },
    ];

    function handleApprove(renewalId: number) {
        if (confirm(isArabic ? 'هل تريد الموافقة على هذا الطلب وتمديد الاشتراك؟' : 'Approve this renewal and extend subscription?')) {
            router.post(`/super-admin/renewals/${renewalId}/approve`);
        }
    }

    function handleReject(renewalId: number) {
        if (!rejectReason.trim()) return;
        router.post(`/super-admin/renewals/${renewalId}/reject`, {
            reason: rejectReason,
        }, {
            onSuccess: () => { setRejectingId(null); setRejectReason(''); },
        });
    }

    const paymentMethodBadge = (method: string | null) => {
        if (method === 'tap') {
            return (
                <Badge variant="outline" className="rounded-full text-xs">
                    <CreditCard className="h-3 w-3 me-1" />
                    Tap
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="rounded-full text-xs">
                <Landmark className="h-3 w-3 me-1" />
                {isArabic ? 'تحويل بنكي' : 'Bank'}
            </Badge>
        );
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="rounded-full bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 me-1" />
                        {isArabic ? 'مقبول' : 'Approved'}
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="rounded-full bg-red-100 text-red-700 hover:bg-red-100">
                        <XCircle className="h-3 w-3 me-1" />
                        {isArabic ? 'مرفوض' : 'Rejected'}
                    </Badge>
                );
            default:
                return (
                    <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100">
                        <Clock className="h-3 w-3 me-1" />
                        {isArabic ? 'قيد المراجعة' : 'Pending'}
                    </Badge>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'طلبات التجديد' : 'Renewals'} />
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
                    <h1 className="text-2xl font-bold">{isArabic ? 'طلبات التجديد' : 'Renewal Requests'}</h1>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) =>
                            router.get('/super-admin/renewals', { ...filters, status: value === 'all' ? undefined : value }, { preserveState: true })
                        }
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder={isArabic ? 'جميع الحالات' : 'All Statuses'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{isArabic ? 'جميع الحالات' : 'All'}</SelectItem>
                            <SelectItem value="pending">{isArabic ? 'قيد المراجعة' : 'Pending'}</SelectItem>
                            <SelectItem value="approved">{isArabic ? 'مقبول' : 'Approved'}</SelectItem>
                            <SelectItem value="rejected">{isArabic ? 'مرفوض' : 'Rejected'}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.payment_method || 'all'}
                        onValueChange={(value) =>
                            router.get('/super-admin/renewals', { ...filters, payment_method: value === 'all' ? undefined : value }, { preserveState: true })
                        }
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder={isArabic ? 'طريقة الدفع' : 'Payment method'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{isArabic ? 'كل الطرق' : 'All methods'}</SelectItem>
                            <SelectItem value="tap">Tap</SelectItem>
                            <SelectItem value="bank_transfer">{isArabic ? 'تحويل بنكي' : 'Bank transfer'}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card className="py-0">
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-muted-foreground">
                                    <th className="px-4 py-3 text-start font-medium">{isArabic ? 'المنشأة' : 'Tenant'}</th>
                                    <th className="px-4 py-3 text-start font-medium">{isArabic ? 'الباقة' : 'Plan'}</th>
                                    <th className="px-4 py-3 text-start font-medium">{isArabic ? 'تاريخ الطلب' : 'Requested'}</th>
                                    <th className="px-4 py-3 text-start font-medium">{isArabic ? 'طريقة الدفع' : 'Method'}</th>
                                    <th className="px-4 py-3 text-start font-medium">{isArabic ? 'الحالة' : 'Status'}</th>
                                    <th className="px-4 py-3 text-start font-medium">{isArabic ? 'الإيصال' : 'Receipt'}</th>
                                    <th className="px-4 py-3 text-start font-medium">{isArabic ? 'ملاحظات' : 'Notes'}</th>
                                    <th className="px-4 py-3 text-start font-medium">{isArabic ? 'الإجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renewals.data.map((renewal) => (
                                    <tr key={renewal.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{renewal.tenant?.name || '—'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {renewal.plan
                                                ? (isArabic ? renewal.plan.name_ar : renewal.plan.name_en)
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(renewal.requested_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                                        </td>
                                        <td className="px-4 py-3">{paymentMethodBadge(renewal.payment_method)}</td>
                                        <td className="px-4 py-3">{statusBadge(renewal.status)}</td>
                                        <td className="px-4 py-3">
                                            {renewal.receipt_url ? (
                                                <a
                                                    href={renewal.receipt_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                                >
                                                    <FileImage className="h-3 w-3" />
                                                    {isArabic ? 'عرض' : 'View'}
                                                </a>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                                            {renewal.notes || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {renewal.status === 'pending' && (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs text-green-600 border-green-300 hover:bg-green-50"
                                                            onClick={() => handleApprove(renewal.id)}
                                                        >
                                                            <CheckCircle className="h-3 w-3 me-1" />
                                                            {isArabic ? 'قبول' : 'Approve'}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                                                            onClick={() => setRejectingId(renewal.id)}
                                                        >
                                                            <XCircle className="h-3 w-3 me-1" />
                                                            {isArabic ? 'رفض' : 'Reject'}
                                                        </Button>
                                                    </div>
                                                    {rejectingId === renewal.id && (
                                                        <div className="mt-1 flex gap-1">
                                                            <Input
                                                                value={rejectReason}
                                                                onChange={(e) => setRejectReason(e.target.value)}
                                                                placeholder={isArabic ? 'سبب الرفض...' : 'Rejection reason...'}
                                                                className="h-7 text-xs"
                                                            />
                                                            <Button size="sm" className="h-7 text-xs" onClick={() => handleReject(renewal.id)}>
                                                                {isArabic ? 'إرسال' : 'Send'}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {renewal.status !== 'pending' && (
                                                <span className="text-xs text-muted-foreground">
                                                    {renewal.processed_at
                                                        ? new Date(renewal.processed_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')
                                                        : '—'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {renewals.data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                            {isArabic ? 'لا توجد طلبات تجديد' : 'No renewal requests found'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {renewals.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {renewals.links.map((link, i) => (
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
