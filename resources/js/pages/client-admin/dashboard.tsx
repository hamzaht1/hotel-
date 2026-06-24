import AppLayout from '@/layouts/app-layout';
import { useT } from '@/hooks/use-translations';
import { useStorageUrl } from '@/lib/storage';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    BedDouble, CalendarDays, Ticket, Sun, XCircle, Plus, Image as ImageIcon, Tag,
    ChevronLeft, ChevronRight, Star, MessageSquare, Eye, ConciergeBell, Handshake, Images,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Kpi {
    rooms: number;
    services: number;
    partners: number;
    other_services: number;
    gallery: number;
}

interface RoomItem {
    id: number;
    name_ar: string;
    name_en: string;
    capacity: number;
    price: string;
    featured_image: string | null;
}

interface Review {
    id: number;
    guest_name: string;
    rating: number;
    comment: string | null;
    status: string;
    created_at: string;
}

interface CalendarDay {
    day: number;
    iso: string;
    state: 'available' | 'partial' | 'full' | 'special';
}

interface Props {
    kpis: Kpi;
    visitorSeries: { date: string; visitors: number }[];
    rooms: RoomItem[];
    reviews: Review[];
    calendar: { month: string; first_weekday: number; days: CalendarDay[] };
    tenant: {
        id: number; name: string; slug: string; template: string;
        hotel_settings?: { hotel_name_ar: string; hotel_name_en: string } | null;
    };
}

export default function ClientDashboard({ kpis, visitorSeries, rooms, reviews, calendar, tenant }: Props) {
    const { t } = useT();
    const storageUrl = useStorageUrl();
    const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: '/client-admin' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-6">
                <Header tenant={tenant} isArabic={isArabic} />
                <KpiRow kpis={kpis} isArabic={isArabic} />
                <QuickActions isArabic={isArabic} />
                <VisitorChart series={visitorSeries} isArabic={isArabic} />

                <div className="grid gap-6 lg:grid-cols-2">
                    <RoomsPanel rooms={rooms} storageUrl={storageUrl} isArabic={isArabic} />
                    <CalendarPanel calendar={calendar} isArabic={isArabic} />
                </div>

                <ReviewsPanel reviews={reviews} isArabic={isArabic} />
            </div>
        </AppLayout>
    );
}

// ─── Header ──────────────────────────────────────────────────────────────

function Header({ tenant, isArabic }: { tenant: Props['tenant']; isArabic: boolean }) {
    return (
        <div className="vuexy-card flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold">
                    {tenant.hotel_settings?.hotel_name_ar || tenant.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {isArabic ? 'القالب' : 'Template'}: <span className="capitalize">{tenant.template}</span>
                </p>
            </div>
            <Link
                href={`/hotel/${tenant.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted"
            >
                <Eye className="h-4 w-4" />
                {isArabic ? 'عرض الموقع' : 'View Site'}
            </Link>
        </div>
    );
}

// ─── KPI cards ───────────────────────────────────────────────────────────

const KPI_DEFS = [
    { key: 'rooms', label_ar: 'عدد الغرف', label_en: 'Rooms', icon: BedDouble, tone: 'blue' },
    { key: 'services', label_ar: 'الخدمات المضافة', label_en: 'Added Services', icon: ConciergeBell, tone: 'green' },
    { key: 'partners', label_ar: 'عدد الشركاء', label_en: 'Partners', icon: Handshake, tone: 'violet' },
    { key: 'other_services', label_ar: 'الخدمات الأخرى', label_en: 'Other Services', icon: Plus, tone: 'amber' },
    { key: 'gallery', label_ar: 'معرض الصور', label_en: 'Photo Gallery', icon: Images, tone: 'red' },
] as const;

const TONE_CLASSES: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

function KpiRow({ kpis, isArabic }: { kpis: Kpi; isArabic: boolean }) {
    return (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {KPI_DEFS.map((def) => {
                const Icon = def.icon;
                return (
                    <div key={def.key} className="vuexy-card p-4">
                        <div className="flex items-center gap-3">
                            <div className={`rounded-lg p-2.5 ${TONE_CLASSES[def.tone]}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    {isArabic ? def.label_ar : def.label_en}
                                </p>
                                <p className="text-2xl font-bold leading-tight">{kpis[def.key as keyof Kpi]}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Quick actions ───────────────────────────────────────────────────────

function QuickActions({ isArabic }: { isArabic: boolean }) {
    const actions = [
        { href: '/client-admin/rooms/create', label_ar: 'إضافة غرفة', label_en: 'Add Room', icon: BedDouble },
        { href: '/client-admin/services/create', label_ar: 'إضافة عرض', label_en: 'Add Promotion', icon: Tag },
        { href: '/client-admin/gallery', label_ar: 'رفع صورة', label_en: 'Upload Photo', icon: ImageIcon },
        { href: '/client-admin/services', label_ar: 'إضافة قائمة', label_en: 'Add Menu', icon: Plus },
    ];

    return (
        <div className="vuexy-card p-5">
            <h2 className="mb-4 text-base font-semibold">
                {isArabic ? 'إجراءات سريعة' : 'Quick Actions'}
            </h2>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {actions.map((a) => {
                    const Icon = a.icon;
                    return (
                        <Link
                            key={a.label_en}
                            href={a.href}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 px-3 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/5"
                        >
                            <Icon className="h-4 w-4" />
                            <span>+ {isArabic ? a.label_ar : a.label_en}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Visitor chart ───────────────────────────────────────────────────────

const PERIODS = ['today', 'week', 'month', 'year', 'custom'] as const;
type Period = typeof PERIODS[number];

function VisitorChart({ series, isArabic }: { series: Props['visitorSeries']; isArabic: boolean }) {
    const [period, setPeriod] = useState<Period>('month');
    const periodLabels: Record<Period, { ar: string; en: string }> = {
        today: { ar: 'اليوم', en: 'Today' },
        week: { ar: 'هذا الأسبوع', en: 'This Week' },
        month: { ar: 'هذا الشهر', en: 'This Month' },
        year: { ar: 'هذه السنة', en: 'This Year' },
        custom: { ar: 'مخصص', en: 'Custom' },
    };

    const allZero = useMemo(() => series.every((p) => p.visitors === 0), [series]);

    return (
        <div className="vuexy-card p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold">
                    {isArabic ? 'إحصائيات الزوار' : 'Visitor Statistics'}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                    {PERIODS.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPeriod(p)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                period === p
                                    ? 'bg-primary text-primary-foreground'
                                    : 'border border-muted-foreground/20 text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            {isArabic ? periodLabels[p].ar : periodLabels[p].en}
                        </button>
                    ))}
                </div>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
                        <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
                            cursor={{ stroke: 'currentColor', strokeOpacity: 0.1 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="visitors"
                            stroke="hsl(220 70% 55%)"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            {allZero && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                    {isArabic ? (
                        <>
                            لا توجد بيانات زوار بعد — قم بتفعيل{' '}
                            <Link href="/client-admin/integrations" className="text-primary underline">
                                Google Analytics
                            </Link>{' '}
                            لعرض الإحصائيات
                        </>
                    ) : (
                        <>
                            No visitor data yet — enable{' '}
                            <Link href="/client-admin/integrations" className="text-primary underline">
                                Google Analytics
                            </Link>{' '}
                            to see statistics
                        </>
                    )}
                </p>
            )}
        </div>
    );
}

// ─── Rooms panel ─────────────────────────────────────────────────────────

function RoomsPanel({
    rooms, storageUrl, isArabic,
}: {
    rooms: RoomItem[];
    storageUrl: (path: string | null | undefined) => string | null;
    isArabic: boolean;
}) {
    return (
        <div className="vuexy-card p-5">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">{isArabic ? 'الغرف' : 'Rooms'}</h2>
                <Link href="/client-admin/rooms" className="text-xs font-medium text-primary hover:underline">
                    {isArabic ? 'عرض الكل' : 'View all'} →
                </Link>
            </div>
            <div className="flex flex-col gap-3">
                {rooms.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        {isArabic ? 'لا توجد غرف بعد' : 'No rooms yet'}
                    </p>
                ) : (
                    rooms.slice(0, 4).map((r) => (
                        <Link
                            key={r.id}
                            href={`/client-admin/rooms/${r.id}/edit`}
                            className="flex items-center gap-3 rounded-xl border p-2 transition hover:bg-muted"
                        >
                            <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                                {r.featured_image ? (
                                    <img
                                        src={storageUrl(r.featured_image) ?? ''}
                                        alt={r.name_en}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                        <BedDouble className="h-5 w-5" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-semibold">
                                    {isArabic ? r.name_ar : r.name_en}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {isArabic ? `السعة ${r.capacity}` : `Capacity ${r.capacity}`}
                                </p>
                            </div>
                            <span className="shrink-0 text-sm font-bold text-primary">
                                {Number(r.price).toLocaleString()} {isArabic ? 'ر.س' : 'SAR'}
                            </span>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Calendar panel ──────────────────────────────────────────────────────

const STATE_DOTS: Record<CalendarDay['state'], string> = {
    available: 'bg-green-400',
    partial: 'bg-amber-400',
    full: 'bg-red-400',
    special: 'bg-violet-400',
};

const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAYS_AR = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

function CalendarPanel({ calendar, isArabic }: { calendar: Props['calendar']; isArabic: boolean }) {
    const today = new Date().toISOString().slice(0, 10);
    const weekdays = isArabic ? WEEKDAYS_AR : WEEKDAYS_EN;

    // Pad the start of the grid with empty cells so day 1 lines up under its weekday.
    const cells: (CalendarDay | null)[] = [
        ...Array.from({ length: calendar.first_weekday }, () => null),
        ...calendar.days,
    ];

    return (
        <div className="vuexy-card p-5">
            <div className="mb-4 flex items-center justify-between">
                <button className="rounded-lg p-1 text-muted-foreground hover:bg-muted" aria-label="prev month">
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="text-base font-semibold">{calendar.month}</h2>
                <button className="rounded-lg p-1 text-muted-foreground hover:bg-muted" aria-label="next month">
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
                {weekdays.map((d) => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {cells.map((c, i) => {
                    if (!c) return <div key={i} className="aspect-square" />;
                    const isToday = c.iso === today;
                    return (
                        <div
                            key={i}
                            className={`aspect-square rounded-lg border text-xs flex flex-col items-center justify-center gap-1 transition hover:bg-muted ${
                                isToday ? 'border-primary border-2' : 'border-transparent'
                            }`}
                        >
                            <span className={isToday ? 'font-bold text-primary' : ''}>{c.day}</span>
                            <span className={`h-1 w-1 rounded-full ${STATE_DOTS[c.state]}`} />
                        </div>
                    );
                })}
            </div>
            <Legend isArabic={isArabic} />
        </div>
    );
}

function Legend({ isArabic }: { isArabic: boolean }) {
    const items = [
        { color: 'bg-green-400', ar: 'متاح', en: 'Available' },
        { color: 'bg-amber-400', ar: 'حجز جزئي', en: 'Partial' },
        { color: 'bg-red-400', ar: 'مكتمل', en: 'Full' },
        { color: 'bg-violet-400', ar: 'خاص', en: 'Special' },
    ];
    return (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            {items.map((it) => (
                <span key={it.en} className="inline-flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${it.color}`} />
                    {isArabic ? it.ar : it.en}
                </span>
            ))}
        </div>
    );
}

// ─── Reviews panel ───────────────────────────────────────────────────────

function ReviewsPanel({ reviews, isArabic }: { reviews: Review[]; isArabic: boolean }) {
    return (
        <div className="vuexy-card p-5">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">
                    {isArabic ? 'أحدث التقييمات' : 'Latest Reviews'}
                </h2>
                <Link href="/client-admin/reviews" className="text-xs font-medium text-primary hover:underline">
                    {isArabic ? 'عرض الكل' : 'View all'} →
                </Link>
            </div>
            {reviews.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                    {isArabic ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
                </p>
            ) : (
                <div className="divide-y">
                    {reviews.map((r) => (
                        <div key={r.id} className="flex items-center gap-4 py-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {(r.guest_name ?? '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold">{r.guest_name}</p>
                                    <Stars rating={r.rating} />
                                </div>
                                <p className="line-clamp-1 text-xs text-muted-foreground">{r.comment ?? '—'}</p>
                            </div>
                            <Link
                                href={`/client-admin/reviews/${r.id}`}
                                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted"
                            >
                                <MessageSquare className="h-3.5 w-3.5" />
                                {isArabic ? 'الرد' : 'Reply'}
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Stars({ rating }: { rating: number }) {
    return (
        <span className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`}
                />
            ))}
        </span>
    );
}
