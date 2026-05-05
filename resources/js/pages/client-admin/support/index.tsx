import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    MessageSquare, AlertCircle, HelpCircle, Wrench, Plus, Sparkles,
    Inbox, Clock, CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-translations';

type Status = 'new' | 'in_progress' | 'closed';
type Category = 'support' | 'complaint' | 'inquiry' | 'technical';

interface Conversation {
    id: number;
    subject: string;
    category: Category;
    status: Status;
    source: 'support' | 'contact' | 'broadcast';
    last_message_at: string | null;
    tenant_unread_count: number;
    messages_count: number;
    latest_message: { body: string; sender_type: string } | null;
}

interface Stats {
    open: number;
    resolved: number;
    avg_response_seconds: number | null;
    tabs: { all: number; mine: number };
}

interface Props {
    conversations: { data: Conversation[] };
    stats: Stats;
    filters: { category?: string; tab?: string };
}

const CATEGORY_META: Record<Category, { ar: string; en: string; color: string; bg: string }> = {
    support: { ar: 'الدعم', en: 'Support', color: 'text-blue-600', bg: 'bg-blue-500' },
    complaint: { ar: 'شكوى', en: 'Complaint', color: 'text-red-600', bg: 'bg-red-500' },
    inquiry: { ar: 'استفسار', en: 'Inquiry', color: 'text-emerald-600', bg: 'bg-emerald-500' },
    technical: { ar: 'تقني', en: 'Technical', color: 'text-orange-600', bg: 'bg-orange-500' },
};

const STATUS_META: Record<Status, { ar: string; en: string; cls: string }> = {
    new: { ar: 'جديد', en: 'New', cls: 'bg-amber-100 text-amber-700' },
    in_progress: { ar: 'قيد المراجعة', en: 'In progress', cls: 'bg-blue-100 text-blue-700' },
    closed: { ar: 'مغلق', en: 'Closed', cls: 'bg-emerald-100 text-emerald-700' },
};

function formatRelative(iso: string | null, isArabic: boolean): string {
    if (!iso) return '';
    const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diffSec < 60) return isArabic ? 'الآن' : 'now';
    const min = Math.floor(diffSec / 60);
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
}

function formatResponseTime(seconds: number | null): string {
    if (seconds == null) return '—';
    const m = Math.floor(seconds / 60);
    return m > 0 ? `${m}m` : `${seconds}s`;
}

export default function ClientSupportIndex({ conversations, stats, filters }: Props) {
    const { t, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string } | undefined;

    const [activeCategory, setActiveCategory] = useState<string>(filters.category || 'all');
    const [activeTab, setActiveTab] = useState<string>(filters.tab || 'all');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: '/client-admin' },
        { title: isArabic ? 'الرسائل والدعم' : 'Messages & support', href: '/client-admin/support' },
    ];

    function applyFilter(overrides: Record<string, string | undefined> = {}) {
        router.get('/client-admin/support', {
            category: overrides.category ?? (activeCategory === 'all' ? undefined : activeCategory),
            tab: overrides.tab ?? (activeTab === 'all' ? undefined : activeTab),
        }, { preserveState: true });
    }

    const myRequests = conversations.data.filter((c) => c.source === 'support');
    const fromDiyafah = conversations.data.filter((c) => c.source === 'contact' || c.source === 'broadcast');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'الرسائل والدعم' : 'Messages & support'} />

            <div className="p-4 lg:p-6 space-y-4">
                {flash?.success && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">{isArabic ? 'الرسائل والدعم' : 'Messages & support'}</h1>
                        <p className="text-sm text-muted-foreground">{isArabic ? 'تواصلك المباشر مع دعم ضيافة' : 'Your direct line to Diyafah support'}</p>
                    </div>
                    <Button asChild>
                        <Link href="/client-admin/support/create">
                            <Plus className="h-4 w-4" /> {isArabic ? 'طلب جديد' : 'New request'}
                        </Link>
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <KpiCard icon={Inbox} color="bg-blue-100 text-blue-600"
                        label={isArabic ? 'مفتوحة' : 'Open'} value={stats.open} />
                    <KpiCard icon={CheckCircle} color="bg-emerald-100 text-emerald-600"
                        label={isArabic ? 'تم حلها' : 'Resolved'} value={stats.resolved} />
                    <KpiCard icon={Clock} color="bg-amber-100 text-amber-600"
                        label={isArabic ? 'متوسط زمن الرد' : 'Avg. response'} value={formatResponseTime(stats.avg_response_seconds)} />
                </div>

                {/* Tabs source */}
                <div className="flex gap-1 flex-wrap">
                    {(['all', 'mine'] as const).map((tab) => (
                        <button key={tab} type="button"
                            onClick={() => { setActiveTab(tab); applyFilter({ tab: tab === 'all' ? undefined : tab }); }}
                            className={`text-sm rounded-md px-3 py-1.5 transition ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
                            {tab === 'all' ? (isArabic ? 'الكل' : 'All') : (isArabic ? 'طلباتي' : 'My requests')}
                            <span className="ms-1 opacity-70">({stats.tabs[tab]})</span>
                        </button>
                    ))}
                </div>

                {/* Categories chips */}
                <div className="flex gap-1.5 flex-wrap">
                    <CategoryChip k="all" label={isArabic ? 'كل التصنيفات' : 'All categories'} active={activeCategory === 'all'} onClick={() => { setActiveCategory('all'); applyFilter({ category: undefined }); }} />
                    {(['support', 'complaint', 'inquiry', 'technical'] as Category[]).map((c) => (
                        <CategoryChip key={c} k={c}
                            label={CATEGORY_META[c][isArabic ? 'ar' : 'en']}
                            color={CATEGORY_META[c].bg}
                            active={activeCategory === c}
                            onClick={() => { setActiveCategory(c); applyFilter({ category: c }); }} />
                    ))}
                </div>

                {/* My requests */}
                <section className="space-y-2">
                    <h2 className="text-sm font-semibold text-muted-foreground">{isArabic ? 'طلباتي' : 'My requests'}</h2>
                    {myRequests.length === 0 && (
                        <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                            {isArabic ? 'لا توجد طلبات بعد' : 'No requests yet'}
                        </div>
                    )}
                    <div className="rounded-lg border bg-card divide-y">
                        {myRequests.map((c) => {
                            const cat = CATEGORY_META[c.category];
                            const st = STATUS_META[c.status];
                            return (
                                <Link key={c.id} href={`/client-admin/support/${c.id}`}
                                    className="flex items-center gap-3 p-3 hover:bg-muted/50 transition">
                                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                        <MessageSquare className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold truncate">{c.subject}</div>
                                        <div className="text-[11px] text-muted-foreground font-mono">#{c.id}</div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <span className={`h-2 w-2 rounded-full ${cat.bg}`} />
                                        <Badge variant="outline" className="text-[10px]">{cat[isArabic ? 'ar' : 'en']}</Badge>
                                        <span className={`text-[10px] rounded px-1.5 py-0.5 ${st.cls}`}>{st[isArabic ? 'ar' : 'en']}</span>
                                        {c.tenant_unread_count > 0 && (
                                            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground text-background text-[10px] px-1">
                                                {c.tenant_unread_count}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground ms-1">{formatRelative(c.last_message_at, isArabic)}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* From Diyafah (contact source / future broadcasts) */}
                {fromDiyafah.length > 0 && (
                    <section className="space-y-2">
                        <h2 className="text-sm font-semibold text-muted-foreground">{isArabic ? 'من ضيافة' : 'From Diyafah'}</h2>
                        <div className="space-y-2">
                            {fromDiyafah.map((c) => (
                                <Link key={c.id} href={`/client-admin/support/${c.id}`}
                                    className="block rounded-lg bg-slate-900 text-white p-4 hover:bg-slate-800 transition">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                                        <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">{isArabic ? 'من ضيافة' : 'From Diyafah'}</span>
                                        <span className="text-[10px] text-slate-400 ms-auto">{formatRelative(c.last_message_at, isArabic)}</span>
                                    </div>
                                    <div className="text-sm font-semibold">{c.subject}</div>
                                    {c.latest_message && (
                                        <div className="text-xs text-slate-300 mt-1 line-clamp-2">{c.latest_message.body}</div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}

function CategoryChip({ k, label, color, active, onClick }: { k: string; label: string; color?: string; active: boolean; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'}`}>
            {color && <span className={`h-1.5 w-1.5 rounded-full ${color}`} />}
            {label}
        </button>
    );
}

function KpiCard({ icon: Icon, color, label, value }: { icon: typeof MessageSquare; color: string; label: string; value: string | number }) {
    return (
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-xl font-bold">{value}</div>
            </div>
        </div>
    );
}
