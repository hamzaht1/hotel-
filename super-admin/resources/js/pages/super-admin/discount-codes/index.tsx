import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface DiscountCode {
    id: number;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    plan_id: number | null;
    plan: { id: number; name_ar: string; name_en: string } | null;
    max_uses: number | null;
    current_uses: number;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
    created_at: string;
}

interface PlanOption {
    id: number;
    name_ar: string;
    name_en: string;
}

interface PaginatedData {
    data: DiscountCode[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

interface Props {
    codes: PaginatedData;
    plans: PlanOption[];
    filters: { search?: string; status?: string; plan_id?: string };
}

export default function DiscountCodesIndex({ codes, plans, filters }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: t('discount_codes', 'Discount Codes'), href: '/super-admin/discount-codes' },
    ];

    function handleSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get('/super-admin/discount-codes', {
            search: formData.get('search') as string,
            status: filters.status,
            plan_id: filters.plan_id,
        }, { preserveState: true });
    }

    function handleToggle(codeId: number) {
        if (confirm(t('confirm_toggle', 'Are you sure you want to toggle this discount code?'))) {
            router.post(`/super-admin/discount-codes/${codeId}/toggle`);
        }
    }

    function formatValue(code: DiscountCode): string {
        return code.type === 'percentage' ? `${code.value}%` : `${code.value} SAR`;
    }

    function formatDate(dateStr: string): string {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleDateString('en-CA');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('discount_codes', 'Discount Codes')} />
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
                    <h1 className="text-2xl font-bold">{t('discount_codes', 'Discount Codes')}</h1>
                    <Button asChild>
                        <Link href="/super-admin/discount-codes/create">
                            <Plus className="h-4 w-4" />
                            {t('add_code', 'Add Code')}
                        </Link>
                    </Button>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <form onSubmit={handleSearch} className="flex-1">
                        <Input
                            name="search"
                            type="text"
                            placeholder={t('search_codes', 'Search codes...')}
                            defaultValue={filters.search || ''}
                            className="vuexy-input"
                        />
                    </form>
                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) =>
                            router.get('/super-admin/discount-codes', { ...filters, status: value === 'all' ? undefined : value }, { preserveState: true })
                        }
                    >
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder={t('all_status', 'All Status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all_status', 'All Status')}</SelectItem>
                            <SelectItem value="active">{t('active', 'Active')}</SelectItem>
                            <SelectItem value="inactive">{t('inactive', 'Inactive')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.plan_id || 'all'}
                        onValueChange={(value) =>
                            router.get('/super-admin/discount-codes', { ...filters, plan_id: value === 'all' ? undefined : value }, { preserveState: true })
                        }
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder={t('all_plans', 'All Plans')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all_plans', 'All Plans')}</SelectItem>
                            {plans.map((plan) => (
                                <SelectItem key={plan.id} value={String(plan.id)}>
                                    {plan.name_ar} / {plan.name_en}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card className="py-0">
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-muted-foreground">
                                    <th className="px-4 py-3 text-start font-medium">{t('code', 'Code')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('type_value', 'Type / Value')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('plan', 'Plan')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('usage', 'Usage')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('validity', 'Validity')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('status', 'Status')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {codes.data.map((code) => (
                                    <tr key={code.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <span className="font-mono font-semibold">{code.code}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="rounded-full">
                                                {formatValue(code)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {code.plan ? `${code.plan.name_ar} / ${code.plan.name_en}` : t('all_plans', 'All Plans')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span>{code.current_uses}</span>
                                            <span className="text-muted-foreground"> / {code.max_uses ?? '\u221E'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            <div>{formatDate(code.valid_from)}</div>
                                            <div className="text-muted-foreground">{formatDate(code.valid_until)}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={code.is_active ? 'default' : 'destructive'} className="rounded-full">
                                                {code.is_active ? t('active', 'Active') : t('inactive', 'Inactive')}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/super-admin/discount-codes/${code.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggle(code.id)}
                                                    className={code.is_active ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}
                                                >
                                                    <Power className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {codes.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                            {t('no_discount_codes_found', 'No discount codes found.')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {codes.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {codes.links.map((link, i) => (
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
