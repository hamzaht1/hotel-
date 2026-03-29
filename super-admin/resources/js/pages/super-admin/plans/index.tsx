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

interface Plan {
    id: number;
    slug: string;
    name_ar: string;
    name_en: string;
    description_ar: string | null;
    description_en: string | null;
    price: number;
    billing_cycle: string;
    features_ar: string[];
    features_en: string[];
    limits: { max_rooms?: number; max_images?: number; max_users?: number };
    icon: string | null;
    variant: string;
    sort_order: number;
    is_active: boolean;
    tenants_count: number;
    created_at: string;
}

interface PaginatedData {
    data: Plan[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

interface Props {
    plans: PaginatedData;
    filters: { search?: string; status?: string };
}

export default function PlansIndex({ plans, filters }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'الباقات / Plans', href: '/super-admin/plans' },
    ];

    function handleSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get('/super-admin/plans', {
            search: formData.get('search') as string,
            status: filters.status,
        }, { preserveState: true });
    }

    function handleToggle(planId: number) {
        if (confirm('هل تريد تغيير حالة هذه الباقة؟ / Toggle this plan?')) {
            router.post(`/super-admin/plans/${planId}/toggle`);
        }
    }

    const billingLabel = (cycle: string) => {
        switch (cycle) {
            case 'monthly': return 'شهري / Monthly';
            case 'yearly': return 'سنوي / Yearly';
            default: return cycle;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="الباقات / Plans" />
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
                    <h1 className="text-2xl font-bold">الباقات / Plans</h1>
                    <Button asChild>
                        <Link href="/super-admin/plans/create">
                            <Plus className="h-4 w-4" />
                            إضافة باقة / Add Plan
                        </Link>
                    </Button>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <form onSubmit={handleSearch} className="flex-1">
                        <Input
                            name="search"
                            type="text"
                            placeholder="بحث في الباقات... / Search plans..."
                            defaultValue={filters.search || ''}
                            className="vuexy-input"
                        />
                    </form>
                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) =>
                            router.get('/super-admin/plans', { ...filters, status: value === 'all' ? undefined : value }, { preserveState: true })
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
                                    <th className="px-4 py-3 text-start font-medium">الاسم (عربي)</th>
                                    <th className="px-4 py-3 text-start font-medium">Name (EN)</th>
                                    <th className="px-4 py-3 text-start font-medium">Slug</th>
                                    <th className="px-4 py-3 text-start font-medium">السعر / Price</th>
                                    <th className="px-4 py-3 text-start font-medium">المنشآت / Tenants</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('status')}</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.data.map((plan) => (
                                    <tr key={plan.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{plan.name_ar}</td>
                                        <td className="px-4 py-3">{plan.name_en}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{plan.slug}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{plan.price} SAR</div>
                                            <div className="text-xs text-muted-foreground">{billingLabel(plan.billing_cycle)}</div>
                                        </td>
                                        <td className="px-4 py-3">{plan.tenants_count}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={plan.is_active ? 'default' : 'destructive'} className="rounded-full">
                                                {plan.is_active ? t('active') : t('inactive')}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/super-admin/plans/${plan.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggle(plan.id)}
                                                    className={plan.is_active ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}
                                                >
                                                    <Power className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {plans.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                            لا توجد باقات / No plans found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {plans.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {plans.links.map((link, i) => (
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
