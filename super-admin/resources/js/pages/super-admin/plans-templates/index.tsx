import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Plus, Search, Download, Pencil, Power, Trash2, ExternalLink,
    Monitor, Snowflake, Layers, Star, Hexagon, Gem, Hotel,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';
import { useStorageUrl } from '@/lib/storage';
import { useState } from 'react';

interface Plan {
    id: number;
    slug: string;
    name_ar: string;
    name_en: string;
    price: string;
    billing_cycle: string;
    features_ar: string[] | null;
    features_en: string[] | null;
    is_active: boolean;
    is_coming_soon: boolean;
    sort_order: number;
    tenants_count: number;
}

interface Template {
    id: number;
    key: string;
    name_ar: string;
    name_en: string;
    city_ar: string | null;
    city_en: string | null;
    description_ar: string | null;
    description_en: string | null;
    preview_image: string | null;
    demo_url: string | null;
    is_active: boolean;
    is_coming_soon: boolean;
    tenants_count: number;
    created_at: string;
}

interface Stats {
    active_plans: number;
    inactive_plans: number;
    total_plans: number;
    by_plan: Array<{ id: number; slug: string; name_ar: string; name_en: string; tenants_count: number }>;
    total_tenants: number;
    active_templates: number;
    inactive_templates: number;
    coming_soon_templates: number;
    total_templates: number;
}

interface Props {
    plans: Plan[];
    templates: Template[];
    stats: Stats;
    filters: { search?: string; status?: string; plan_filter?: string; tab?: string };
}

const PLAN_KPI_ICONS: Record<string, { Icon: React.ComponentType<{ className?: string }>; cls: string }> = {
    0: { Icon: Star, cls: 'text-sky-500' },
    1: { Icon: Hexagon, cls: 'text-amber-500' },
    2: { Icon: Gem, cls: 'text-violet-600' },
};

export default function PlansTemplatesIndex({ plans, templates, stats, filters }: Props) {
    const { t, locale, isArabic } = useT();
    const storageUrl = useStorageUrl();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [tab, setTab] = useState<'plans' | 'templates'>(filters.tab === 'templates' ? 'templates' : 'plans');
    const numLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'الباقات والقوالب' : 'Plans & Templates', href: '/super-admin/plans-templates' },
    ];

    function apply(key: string, value: string | undefined) {
        router.get('/super-admin/plans-templates', { ...filters, [key]: value || undefined, tab }, { preserveState: true, preserveScroll: true });
    }

    function togglePlan(id: number) {
        router.post(`/super-admin/plans/${id}/toggle`, {}, { preserveScroll: true });
    }

    function toggleTemplate(id: number) {
        router.post(`/super-admin/templates/${id}/toggle`, {}, { preserveScroll: true });
    }

    function deleteTemplate(id: number) {
        if (!confirm(isArabic ? 'حذف القالب؟' : 'Delete template?')) return;
        router.delete(`/super-admin/templates/${id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'الباقات والقوالب' : 'Plans & Templates'} />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold">{isArabic ? 'الباقات والقوالب' : 'Plans & Templates'}</h1>
                    <div className="flex gap-2">
                        {tab === 'plans' ? (
                            <Button asChild><Link href="/super-admin/plans/create"><Plus className="h-4 w-4" /> {isArabic ? 'إضافة باقة' : 'Add plan'}</Link></Button>
                        ) : (
                            <Button asChild><Link href="/super-admin/templates/create"><Plus className="h-4 w-4" /> {isArabic ? 'إضافة قالب' : 'Add template'}</Link></Button>
                        )}
                    </div>
                </div>

                {/* 6 KPI cards - row 1: plans summary, row 2: per-plan tenant counts */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                    <KpiCard
                        label={isArabic ? 'الباقات النشطة' : 'Active plans'}
                        value={stats.active_plans}
                        icon={Monitor}
                        cls="text-blue-600 bg-blue-50 dark:bg-blue-950"
                        numLocale={numLocale}
                    />
                    <KpiCard
                        label={isArabic ? 'الباقات غير نشطة' : 'Inactive plans'}
                        value={stats.inactive_plans}
                        icon={Snowflake}
                        cls="text-slate-500 bg-slate-100 dark:bg-slate-800"
                        numLocale={numLocale}
                    />
                    <KpiCard
                        label={isArabic ? 'إجمالي الباقات' : 'Total plans'}
                        value={stats.total_plans}
                        icon={Layers}
                        cls="text-indigo-700 bg-indigo-50 dark:bg-indigo-950"
                        numLocale={numLocale}
                    />
                    {stats.by_plan.slice(0, 3).map((bp, i) => {
                        const meta = PLAN_KPI_ICONS[i] ?? PLAN_KPI_ICONS[0];
                        return (
                            <KpiCard
                                key={bp.id}
                                label={`${isArabic ? 'باقة' : 'Plan'} ${isArabic ? bp.name_ar : bp.name_en}`}
                                value={bp.tenants_count}
                                icon={meta.Icon}
                                cls={`${meta.cls} bg-background`}
                                numLocale={numLocale}
                            />
                        );
                    })}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b">
                    <TabButton active={tab === 'plans'} onClick={() => setTab('plans')}>
                        {isArabic ? 'الباقات' : 'Plans'}
                    </TabButton>
                    <TabButton active={tab === 'templates'} onClick={() => setTab('templates')}>
                        {isArabic ? 'القوالب' : 'Templates'}
                    </TabButton>
                </div>

                {/* Filters row (status chips + plan dropdown + search) */}
                {tab === 'plans' && (
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { key: undefined, ar: 'الكل', en: 'All' },
                            { key: 'active', ar: 'نشط', en: 'Active' },
                            { key: 'inactive', ar: 'غير نشط', en: 'Inactive' },
                            { key: 'coming_soon', ar: 'قريباً', en: 'Coming soon' },
                        ].map((chip) => {
                            const active = filters.status === chip.key || (!filters.status && !chip.key);
                            return (
                                <button
                                    key={chip.key ?? 'all'}
                                    onClick={() => apply('status', chip.key)}
                                    className={`rounded-full px-4 py-1.5 text-sm border transition ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                                >
                                    {isArabic ? chip.ar : chip.en}
                                </button>
                            );
                        })}

                        <div className="ms-auto flex gap-2">
                            <div className="relative">
                                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={isArabic ? 'أكتب رقم او اسم الباقة هنا' : 'Search plan name or slug'}
                                    defaultValue={filters.search ?? ''}
                                    onBlur={(e) => apply('search', e.target.value)}
                                    className="ps-10 w-[280px]"
                                />
                            </div>
                            <Select value={filters.plan_filter ?? 'all'} onValueChange={(v) => apply('plan_filter', v === 'all' ? undefined : v)}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder={isArabic ? 'كل الباقات' : 'All plans'} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'كل الباقات' : 'All plans'}</SelectItem>
                                    {plans.map((p) => <SelectItem key={p.id} value={p.slug}>{isArabic ? p.name_ar : p.name_en}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {/* PLANS TABLE */}
                {tab === 'plans' && (
                    <Card className="py-0">
                        <CardContent className="overflow-x-auto p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50 text-muted-foreground text-xs">
                                        <th className="px-3 py-3 text-start">{isArabic ? 'الاسم (عربي)' : 'Name (AR)'}</th>
                                        <th className="px-3 py-3 text-start">{isArabic ? 'Name (EN)' : 'Name (EN)'}</th>
                                        <th className="px-3 py-3 text-start">Slug</th>
                                        <th className="px-3 py-3 text-start">{isArabic ? 'السعر' : 'Price'}</th>
                                        <th className="px-3 py-3 text-start">{isArabic ? 'المنشآت' : 'Tenants'}</th>
                                        <th className="px-3 py-3 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                                        <th className="px-3 py-3 text-start">{isArabic ? 'الإجراءات' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plans.length === 0 && (
                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{isArabic ? 'لا توجد باقات' : 'No plans'}</td></tr>
                                    )}
                                    {plans.map((plan) => (
                                        <tr key={plan.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="px-3 py-2 font-medium">{plan.name_ar}</td>
                                            <td className="px-3 py-2">{plan.name_en}</td>
                                            <td className="px-3 py-2 text-xs text-muted-foreground font-mono">{plan.slug}</td>
                                            <td className="px-3 py-2 font-medium">
                                                {Number(plan.price).toLocaleString(numLocale)} {isArabic ? 'ر.س' : 'SAR'}
                                                <span className="text-xs text-muted-foreground"> / {plan.billing_cycle === 'yearly' ? (isArabic ? 'سنوي' : 'yearly') : (isArabic ? 'شهري' : 'monthly')}</span>
                                            </td>
                                            <td className="px-3 py-2 text-center">{plan.tenants_count}</td>
                                            <td className="px-3 py-2">
                                                {plan.is_coming_soon ? (
                                                    <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">{isArabic ? 'قريباً' : 'Coming soon'}</Badge>
                                                ) : plan.is_active ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{isArabic ? 'نشط' : 'Active'}</Badge>
                                                ) : (
                                                    <Badge variant="destructive">{isArabic ? 'غير نشط' : 'Inactive'}</Badge>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-1">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" asChild title={isArabic ? 'تعديل' : 'Edit'}>
                                                        <Link href={`/super-admin/plans/${plan.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7"
                                                        onClick={() => togglePlan(plan.id)}
                                                        title={plan.is_active ? (isArabic ? 'تعطيل' : 'Disable') : (isArabic ? 'تفعيل' : 'Enable')}
                                                    >
                                                        <Power className={`h-4 w-4 ${plan.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {/* TEMPLATES CARDS */}
                {tab === 'templates' && (
                    <>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="gap-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" /> {isArabic ? 'نشطة' : 'Active'}: {stats.active_templates}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                                <span className="h-2 w-2 rounded-full bg-red-500" /> {isArabic ? 'غير نشطة' : 'Inactive'}: {stats.inactive_templates}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                                <span className="h-2 w-2 rounded-full bg-amber-500" /> {isArabic ? 'قريباً' : 'Coming soon'}: {stats.coming_soon_templates}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                                {isArabic ? 'الإجمالي' : 'Total'}: {stats.total_templates}
                            </Badge>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {templates.map((tpl) => (
                                <Card key={tpl.id} className="overflow-hidden py-0 gap-0">
                                    {tpl.preview_image ? (
                                        <div className="relative h-40">
                                            <img src={storageUrl(tpl.preview_image) ?? ''} alt={tpl.name_en} className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                            <div className="absolute bottom-3 start-4">
                                                <Badge className="rounded-full bg-white/20 text-white backdrop-blur-sm border-white/30">{tpl.key.toUpperCase()}</Badge>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative h-40 bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center">
                                            <span className="text-3xl font-bold text-white/90 uppercase tracking-wider">{tpl.key}</span>
                                        </div>
                                    )}

                                    <CardHeader className="pb-3 pt-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg">{tpl.name_ar}</CardTitle>
                                                <CardDescription className="mt-1">{tpl.name_en}{tpl.city_ar && ` · ${isArabic ? tpl.city_ar : tpl.city_en}`}</CardDescription>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                {tpl.is_coming_soon ? (
                                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">{isArabic ? 'قريباً' : 'Coming soon'}</Badge>
                                                ) : tpl.is_active ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{isArabic ? 'نشطة' : 'Active'}</Badge>
                                                ) : (
                                                    <Badge variant="destructive">{isArabic ? 'غير نشطة' : 'Inactive'}</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pb-3 pt-0 space-y-2">
                                        {(tpl.description_ar || tpl.description_en) && (
                                            <p className="text-sm text-muted-foreground">{isArabic ? tpl.description_ar : tpl.description_en}</p>
                                        )}
                                        <div className="flex items-center gap-2 text-xs">
                                            <Hotel className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>{tpl.tenants_count} {isArabic ? 'فندق يستخدم هذا القالب' : 'hotel(s) using this template'}</span>
                                        </div>
                                        {tpl.demo_url && (
                                            <a href={tpl.demo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                                <ExternalLink className="h-3 w-3" /> {isArabic ? 'معاينة' : 'Preview'}
                                            </a>
                                        )}
                                    </CardContent>

                                    <CardFooter className="border-t px-6 py-3 flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(tpl.created_at).toLocaleDateString(numLocale, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" asChild title={isArabic ? 'إعدادات' : 'Settings'}>
                                                <Link href={`/super-admin/templates/${tpl.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 text-red-500"
                                                onClick={() => deleteTemplate(tpl.id)}
                                                disabled={tpl.tenants_count > 0}
                                                title={isArabic ? 'حذف' : 'Delete'}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => toggleTemplate(tpl.id)}
                                                className={tpl.is_active ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'}
                                            >
                                                <Power className="h-3.5 w-3.5" />
                                                {tpl.is_active ? (isArabic ? 'تعطيل' : 'Deactivate') : (isArabic ? 'تفعيل' : 'Activate')}
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                            {templates.length === 0 && (
                                <Card className="col-span-full"><CardContent className="p-10 text-center text-muted-foreground">{isArabic ? 'لا توجد قوالب' : 'No templates'}</CardContent></Card>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}

function KpiCard({ label, value, icon: Icon, cls, numLocale }: {
    label: string; value: number; icon: React.ComponentType<{ className?: string }>; cls: string; numLocale: string
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-3 p-4">
                <div className={`rounded-lg p-2.5 ${cls.split(' ').filter((c) => c.startsWith('bg-')).join(' ')}`}>
                    <Icon className={`h-5 w-5 ${cls.split(' ').filter((c) => c.startsWith('text-')).join(' ')}`} />
                </div>
                <div className="min-w-0">
                    <div className="text-xs text-muted-foreground truncate">{label}</div>
                    <div className="text-2xl font-bold truncate">{value.toLocaleString(numLocale)}</div>
                </div>
            </CardContent>
        </Card>
    );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-2.5 text-sm font-medium -mb-px border-b-2 ${
                active
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
            {children}
        </button>
    );
}
