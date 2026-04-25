import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Users,
    Globe2,
    Wallet,
    MessageSquare,
    Star,
    LayoutTemplate,
    ChevronLeft,
    TrendingUp,
    MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useT } from '@/hooks/use-translations';

interface Stats {
    total_clients: number;
    total_sites: number;
    total_revenue: number;
    total_messages: number;
    satisfaction: number;
    total_templates: number;
}

interface Range {
    key: 'this_week' | 'this_month' | 'last_month' | 'this_year';
    from: string;
    to: string;
}

interface RecentRequest {
    id: number;
    status: string;
    created_at: string;
    tenant: { id: number; name: string } | null;
}

interface RecentPayment {
    id: number;
    invoice_number: string;
    total: string;
    paid_at: string | null;
    payment_method: string | null;
    tenant: { id: number; name: string } | null;
}

interface NewClient {
    id: number;
    name: string;
    template: string;
    created_at: string;
}

interface RevenuePoint { date: string; total: number }

interface TopTemplate {
    id: number;
    key: string;
    name_ar: string;
    name_en: string;
    preview_image: string | null;
    tenants_count: number;
}

interface PaymentMethod { method: string; count: number; total: number }

interface RegionSlice { key: string; count: number }

interface Props {
    stats: Stats;
    range: Range;
    recentRequests?: RecentRequest[];
    recentPayments?: RecentPayment[];
    newClients?: NewClient[];
    revenueSeries?: RevenuePoint[];
    topTemplates?: TopTemplate[];
    topPaymentMethods?: PaymentMethod[];
    byRegion?: RegionSlice[];
    quickLinks?: { requests: string; invoices: string; clients: string };
}

const DONUT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const MEDALS = ['🥇', '🥈', '🥉'];

function formatCurrency(value: number, locale: string): string {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', { maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | null, locale: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' });
}

export default function SuperAdminDashboard({
    stats,
    range,
    recentRequests = [],
    recentPayments = [],
    newClients = [],
    revenueSeries = [],
    topTemplates = [],
    topPaymentMethods = [],
    byRegion = [],
    quickLinks = { requests: '/super-admin', invoices: '/super-admin', clients: '/super-admin' },
}: Props) {
    const { t, locale } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const numLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: t('dash_title'), href: '/super-admin' },
    ];

    const totalClientsForDonut = (byRegion ?? []).reduce((sum, r) => sum + r.count, 0);

    const kpis = [
        { label: t('kpi_clients'), value: stats.total_clients.toLocaleString(numLocale), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950' },
        { label: t('kpi_sites'), value: stats.total_sites.toLocaleString(numLocale), icon: Globe2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
        { label: t('kpi_revenue'), value: `${formatCurrency(stats.total_revenue, locale)} ${t('currency_sar')}`, icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
        { label: t('kpi_messages'), value: stats.total_messages.toLocaleString(numLocale), icon: MessageSquare, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950' },
        { label: t('kpi_satisfaction'), value: `${stats.satisfaction}/5`, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950' },
        { label: t('kpi_templates'), value: stats.total_templates.toLocaleString(numLocale), icon: LayoutTemplate, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950' },
    ];

    function changeRange(value: string) {
        router.get('/super-admin', { range: value }, { preserveState: true, preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('dash_title')} />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                {/* Header + filter */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold">{t('dash_title')}</h1>
                    <Select value={range.key} onValueChange={changeRange}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="this_week">{t('range_this_week')}</SelectItem>
                            <SelectItem value="this_month">{t('range_this_month')}</SelectItem>
                            <SelectItem value="last_month">{t('range_last_month')}</SelectItem>
                            <SelectItem value="this_year">{t('range_this_year')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* KPI cards */}
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                    {kpis.map(({ label, value, icon: Icon, color, bg }) => (
                        <Card key={label} className="overflow-hidden">
                            <CardContent className="flex items-center gap-3 p-4">
                                <div className={`${bg} rounded-lg p-2.5`}>
                                    <Icon className={`h-5 w-5 ${color}`} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs text-muted-foreground truncate">{label}</div>
                                    <div className="text-lg font-bold truncate">{value}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Row 2: Recent requests + payments + new clients */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-base">{t('section_recent_requests')}</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={quickLinks.requests}>{t('see_more')} <ChevronLeft className="h-3 w-3" /></Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {recentRequests.length === 0 && <p className="text-sm text-muted-foreground">{t('empty_requests')}</p>}
                            {recentRequests.map((r) => (
                                <div key={r.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                                    <span className="font-medium">{r.tenant?.name ?? `#${r.id}`}</span>
                                    <span className="text-xs text-muted-foreground">{formatDate(r.created_at, locale)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-base">{t('section_recent_payments')}</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={quickLinks.invoices}>{t('see_more')} <ChevronLeft className="h-3 w-3" /></Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {recentPayments.length === 0 && <p className="text-sm text-muted-foreground">{t('empty_payments')}</p>}
                            {recentPayments.map((p) => (
                                <div key={p.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{p.tenant?.name ?? p.invoice_number}</span>
                                        <span className="text-xs text-muted-foreground">{formatCurrency(Number(p.total), locale)} {t('currency_sar')}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{formatDate(p.paid_at, locale)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-base">{t('section_new_clients')}</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={quickLinks.clients}>{t('see_more')} <ChevronLeft className="h-3 w-3" /></Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {newClients.length === 0 && <p className="text-sm text-muted-foreground">{t('empty_clients')}</p>}
                            {newClients.map((c) => (
                                <div key={c.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{c.name}</span>
                                        <span className="text-xs text-muted-foreground">{t(`city_${c.template}`, c.template)}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{formatDate(c.created_at, locale)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Row 3: Revenue chart + top templates */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> {t('section_revenue_over_time')}</CardTitle>
                            <span className="text-xs text-muted-foreground">{t(`range_${range.key}`)}</span>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[260px]">
                                {revenueSeries.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                                        <TrendingUp className="h-10 w-10 mb-2 opacity-40" />
                                        <p className="text-sm">{t('empty_chart')}</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                                                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 10 }} />
                                            <Tooltip
                                                formatter={(value: number) => [`${formatCurrency(value, locale)} ${t('currency_sar')}`, t('tooltip_revenue')]}
                                                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="total"
                                                stroke="#6366f1"
                                                strokeWidth={2}
                                                fill="url(#revenueFill)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">{t('section_top_templates')}</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {topTemplates.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                    <LayoutTemplate className="h-8 w-8 mb-2 opacity-40" />
                                    <p className="text-sm">{t('empty_templates')}</p>
                                </div>
                            )}
                            {topTemplates.map((tpl, i) => (
                                <div key={tpl.id} className="flex items-center gap-3 rounded border p-2">
                                    <span className="text-2xl w-8 text-center">{MEDALS[i] ?? '•'}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{locale === 'ar' ? tpl.name_ar : tpl.name_en}</div>
                                        <div className="text-xs text-muted-foreground">{tpl.tenants_count} {t('client_unit')}</div>
                                    </div>
                                    {tpl.preview_image && (
                                        <img
                                            src={`/storage/${tpl.preview_image}`}
                                            alt=""
                                            className="h-10 w-10 rounded object-cover"
                                        />
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Row 4: Payment methods + city donut + map */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">{t('section_top_payments')}</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {topPaymentMethods.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                    <Wallet className="h-8 w-8 mb-2 opacity-40" />
                                    <p className="text-sm">{t('empty_payment_methods')}</p>
                                </div>
                            )}
                            {topPaymentMethods.map((pm, i) => (
                                <div key={pm.method} className="flex items-center gap-3 rounded border p-2">
                                    <span className="text-2xl w-8 text-center">{MEDALS[i] ?? '•'}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium">{t(`pm_${pm.method}`, pm.method)}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {pm.count} {t('ops_unit')} · {formatCurrency(pm.total, locale)} {t('currency_sar')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">{t('section_regions_donut')}</CardTitle></CardHeader>
                        <CardContent>
                            <div className="relative h-[220px]">
                                {byRegion.length === 0 || totalClientsForDonut === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                                        <Users className="h-8 w-8 mb-2 opacity-40" />
                                        <p className="text-sm">{t('empty_regions')}</p>
                                    </div>
                                ) : (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Tooltip
                                                    formatter={(value: number, _name, props) => [`${value} ${t('client_unit')}`, t(`city_${props.payload.key}`, props.payload.key)]}
                                                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                                                />
                                                <Pie
                                                    data={byRegion}
                                                    dataKey="count"
                                                    nameKey="key"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={85}
                                                    paddingAngle={2}
                                                >
                                                    {byRegion.map((_, i) => (
                                                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <div className="text-2xl font-bold">{totalClientsForDonut.toLocaleString(numLocale)}</div>
                                            <div className="text-xs text-muted-foreground">{t('client_unit')}</div>
                                        </div>
                                    </>
                                )}
                            </div>
                            {byRegion.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {byRegion.map((r, i) => (
                                        <Badge key={r.key} variant="outline" className="gap-1.5">
                                            <span className="h-2 w-2 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                                            {t(`city_${r.key}`, r.key)} · {r.count}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> {t('section_map')}</CardTitle></CardHeader>
                        <CardContent>
                            {byRegion.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                    <MapPin className="h-8 w-8 mb-2 opacity-40" />
                                    <p className="text-sm">{t('empty_regions')}</p>
                                </div>
                            ) : (
                                <MiddleEastMap regions={byRegion} t={t} />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

// ─── Simplified Middle East heat-map ─────────────────────────────
// A stylized representation of key Saudi/Gulf regions with density-based
// coloring. Not a real cartographic projection — the goal is visual density
// per city rather than geographic accuracy.
function MiddleEastMap({ regions, t }: { regions: RegionSlice[]; t: (k: string, fallback?: string) => string }) {
    const countByKey = Object.fromEntries(regions.map((r) => [r.key, r.count]));
    const maxCount = Math.max(1, ...regions.map((r) => r.count));
    const intensity = (key: string): number => (countByKey[key] ?? 0) / maxCount;

    const cities: Array<{ key: string; shortKey: string; cx: number; cy: number }> = [
        { key: 'riyadh', shortKey: 'city_riyadh', cx: 180, cy: 130 },
        { key: 'jeddah', shortKey: 'city_jeddah', cx: 95, cy: 150 },
        { key: 'mecca', shortKey: 'city_short_mecca', cx: 105, cy: 160 },
        { key: 'madina', shortKey: 'city_short_madina', cx: 100, cy: 115 },
    ];

    return (
        <svg viewBox="0 0 320 220" className="w-full h-[220px]">
            {/* Arabian Peninsula silhouette (very rough) */}
            <path
                d="M 40 60 L 80 40 L 150 30 L 230 45 L 280 80 L 295 130 L 280 175 L 240 200 L 180 210 L 120 200 L 70 180 L 45 145 L 35 100 Z"
                fill="#f1f5f9"
                stroke="#cbd5e1"
                strokeWidth="1.5"
            />
            {cities.map((c) => {
                const i = intensity(c.key);
                const radius = 8 + i * 18;
                const opacity = 0.25 + i * 0.65;
                return (
                    <g key={c.key}>
                        <circle cx={c.cx} cy={c.cy} r={radius} fill="#6366f1" opacity={opacity} />
                        <circle cx={c.cx} cy={c.cy} r={3} fill="#4338ca" />
                        <text x={c.cx} y={c.cy - radius - 5} textAnchor="middle" className="fill-current text-[10px]" fontSize="10">
                            {t(c.shortKey, c.key)} ({countByKey[c.key] ?? 0})
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}
