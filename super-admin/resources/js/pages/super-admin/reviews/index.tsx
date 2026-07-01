import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    MessageSquare, Star, Smile, Frown, Clock, CheckCircle, AlertTriangle,
    Search, RotateCcw, Eye, EyeOff, Mail, Send, User as UserIcon, Phone, Calendar,
    XCircle, ThumbsUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';
import { useState } from 'react';

interface Review {
    id: number;
    guest_name: string;
    guest_email: string | null;
    guest_phone: string | null;
    rating: number;
    comment: string | null;
    status: 'new' | 'in_progress' | 'replied' | 'needs_followup';
    is_published: boolean;
    reply: string | null;
    replied_at: string | null;
    created_at: string;
    tenant: { id: number; name: string; email: string } | null;
}

interface Stats {
    total: number;
    average: number;
    positive: number;
    negative: number;
    positive_percent: number;
    negative_percent: number;
    new: number;
    in_progress: number;
    replied: number;
    needs_followup: number;
}

interface Tenant { id: number; name: string }

interface Props {
    reviews: { data: Review[]; links: { url: string | null; label: string; active: boolean }[]; last_page: number; current_page: number; total: number };
    stats: Stats;
    tenants: Tenant[];
    filters: Record<string, string | undefined>;
}

function classifyType(rating: number): 'positive' | 'negative' | 'neutral' {
    if (rating >= 4) return 'positive';
    if (rating <= 2) return 'negative';
    return 'neutral';
}

function typeBadge(rating: number, isAr: boolean) {
    const t = classifyType(rating);
    const map = {
        positive: { ar: 'إيجابية', en: 'Positive', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        negative: { ar: 'سلبية', en: 'Negative', cls: 'bg-red-100 text-red-700 border-red-200' },
        neutral: { ar: 'محايدة', en: 'Neutral', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    };
    return <Badge variant="outline" className={map[t].cls}>{isAr ? map[t].ar : map[t].en}</Badge>;
}

function statusBadge(status: Review['status'], isAr: boolean) {
    const map = {
        new: { ar: 'جديد', en: 'New', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
        in_progress: { ar: 'قيد المراجعة', en: 'In review', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
        replied: { ar: 'تم الرد', en: 'Replied', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        needs_followup: { ar: 'يحتاج متابعة', en: 'Follow up', cls: 'bg-red-100 text-red-700 border-red-200' },
    };
    return <Badge variant="outline" className={map[status].cls}>{isAr ? map[status].ar : map[status].en}</Badge>;
}

export default function ReviewsIndex({ reviews, stats, tenants, filters }: Props) {
    const { t, locale, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const numLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

    const [replyingTo, setReplyingTo] = useState<Review | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'آراء العملاء' : 'Reviews', href: '/super-admin/reviews' },
    ];

    function apply(key: string, value: string | undefined) {
        router.get('/super-admin/reviews', { ...filters, [key]: value || undefined }, { preserveState: true, preserveScroll: true });
    }

    function reset() {
        router.get('/super-admin/reviews', {}, { preserveScroll: true });
    }

    function togglePublished(id: number) {
        router.post(`/super-admin/reviews/${id}/toggle-published`, {}, { preserveScroll: true });
    }
    function notify(id: number) {
        router.post(`/super-admin/reviews/${id}/notify`, {}, { preserveScroll: true });
    }
    function markInReview(id: number) {
        router.post(`/super-admin/reviews/${id}/status`, { status: 'in_progress' }, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'آراء العملاء' : 'Reviews'} />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                {/* Row 1: Main KPIs */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard icon={MessageSquare} label={isArabic ? 'إجمالي الآراء' : 'Total reviews'} value={stats.total.toLocaleString(numLocale)} color="blue" />
                    <KpiCard
                        icon={Star}
                        label={isArabic ? 'متوسط التقييم' : 'Average rating'}
                        value={<span className="flex items-center gap-1">{stats.average} <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /></span>}
                        color="yellow"
                    />
                    <KpiCard
                        icon={Smile}
                        label={isArabic ? 'إيجابية' : 'Positive'}
                        value={<span>{stats.positive} <span className="text-sm font-normal text-emerald-600">({stats.positive_percent}%)</span></span>}
                        color="emerald"
                    />
                    <KpiCard
                        icon={Frown}
                        label={isArabic ? 'سلبية' : 'Negative'}
                        value={<span>{stats.negative} <span className="text-sm font-normal text-red-600">({stats.negative_percent}%)</span></span>}
                        color="red"
                    />
                </div>

                {/* Row 2: Status cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatusCard
                        icon={MessageSquare}
                        label={isArabic ? 'آراء جديدة' : 'New reviews'}
                        value={stats.new}
                        active={filters.status === 'new'}
                        onClick={() => apply('status', filters.status === 'new' ? undefined : 'new')}
                        color="blue"
                    />
                    <StatusCard
                        icon={Clock}
                        label={isArabic ? 'قيد المراجعة' : 'In review'}
                        value={stats.in_progress}
                        active={filters.status === 'in_progress'}
                        onClick={() => apply('status', filters.status === 'in_progress' ? undefined : 'in_progress')}
                        color="amber"
                    />
                    <StatusCard
                        icon={CheckCircle}
                        label={isArabic ? 'تم الرد' : 'Replied'}
                        value={stats.replied}
                        active={filters.status === 'replied'}
                        onClick={() => apply('status', filters.status === 'replied' ? undefined : 'replied')}
                        color="emerald"
                    />
                    <StatusCard
                        icon={AlertTriangle}
                        label={isArabic ? 'يحتاج متابعة' : 'Follow up'}
                        value={stats.needs_followup}
                        active={filters.status === 'needs_followup'}
                        onClick={() => apply('status', filters.status === 'needs_followup' ? undefined : 'needs_followup')}
                        color="red"
                    />
                </div>

                {/* Section header */}
                <div className="flex items-baseline justify-between">
                    <h1 className="text-2xl font-bold">{isArabic ? 'آراء العملاء' : 'Customer reviews'}</h1>
                    <span className="text-sm text-muted-foreground">
                        {isArabic
                            ? `${reviews.data.length} رأي من أصل ${reviews.total}`
                            : `${reviews.data.length} of ${reviews.total}`}
                    </span>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4 space-y-3">
                        <div className="relative">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={isArabic ? 'ابحث عن اسم أو رأي...' : 'Search by name or comment...'}
                                defaultValue={filters.search ?? ''}
                                onBlur={(e) => apply('search', e.target.value)}
                                className="ps-10"
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-4">
                            <Select value={filters.status ?? 'all'} onValueChange={(v) => apply('status', v === 'all' ? undefined : v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'جميع الحالات' : 'All statuses'}</SelectItem>
                                    <SelectItem value="new">{isArabic ? 'جديدة' : 'New'}</SelectItem>
                                    <SelectItem value="in_progress">{isArabic ? 'قيد المراجعة' : 'In review'}</SelectItem>
                                    <SelectItem value="replied">{isArabic ? 'تم الرد' : 'Replied'}</SelectItem>
                                    <SelectItem value="needs_followup">{isArabic ? 'يحتاج متابعة' : 'Follow up'}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.rating ?? 'all'} onValueChange={(v) => apply('rating', v === 'all' ? undefined : v)}>
                                <SelectTrigger><SelectValue placeholder={isArabic ? 'جميع التقييمات' : 'All ratings'} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'جميع التقييمات' : 'All ratings'}</SelectItem>
                                    {[5, 4, 3, 2, 1].map((n) => (
                                        <SelectItem key={n} value={String(n)}>
                                            {'⭐'.repeat(n)} ({n})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filters.type ?? 'all'} onValueChange={(v) => apply('type', v === 'all' ? undefined : v)}>
                                <SelectTrigger><SelectValue placeholder={isArabic ? 'نوع الرأي' : 'Review type'} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'كل الأنواع' : 'All types'}</SelectItem>
                                    <SelectItem value="positive">{isArabic ? 'إيجابية' : 'Positive'}</SelectItem>
                                    <SelectItem value="neutral">{isArabic ? 'محايدة' : 'Neutral'}</SelectItem>
                                    <SelectItem value="negative">{isArabic ? 'سلبية' : 'Negative'}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.sort ?? 'newest'} onValueChange={(v) => apply('sort', v === 'newest' ? undefined : v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">{isArabic ? 'الأحدث أولًا' : 'Newest first'}</SelectItem>
                                    <SelectItem value="oldest">{isArabic ? 'الأقدم أولًا' : 'Oldest first'}</SelectItem>
                                    <SelectItem value="highest">{isArabic ? 'الأعلى تقييمًا' : 'Highest rated'}</SelectItem>
                                    <SelectItem value="lowest">{isArabic ? 'الأدنى تقييمًا' : 'Lowest rated'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={reset}>
                                <RotateCcw className="h-4 w-4" /> {isArabic ? 'إعادة تعيين' : 'Reset'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Review cards */}
                <div className="flex flex-col gap-3">
                    {reviews.data.length === 0 && (
                        <Card><CardContent className="p-10 text-center text-muted-foreground">
                            {isArabic ? 'لا توجد آراء' : 'No reviews'}
                        </CardContent></Card>
                    )}
                    {reviews.data.map((rev) => (
                        <Card key={rev.id}>
                            <CardContent className="p-5">
                                <div className="grid gap-4 lg:grid-cols-[260px_1fr_auto]">
                                    {/* Left: client info */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                <UserIcon className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div className="font-semibold">{rev.guest_name}</div>
                                        </div>
                                        {rev.guest_email && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Mail className="h-3 w-3" />
                                                <a href={`mailto:${rev.guest_email}`} className="hover:text-primary truncate">{rev.guest_email}</a>
                                            </div>
                                        )}
                                        {rev.guest_phone && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Phone className="h-3 w-3" />
                                                <span>{rev.guest_phone}</span>
                                            </div>
                                        )}
                                        {rev.tenant && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>{rev.tenant.name}</span>
                                            </div>
                                        )}
                                        <Button variant="outline" size="sm" asChild className="w-full mt-2">
                                            <Link href={`/super-admin/reviews/${rev.id}`}>
                                                {isArabic ? 'المزيد' : 'More'}
                                            </Link>
                                        </Button>
                                    </div>

                                    {/* Center: review content */}
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <Star key={n} className={`h-4 w-4 ${n <= rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                                                ))}
                                            </span>
                                            {typeBadge(rev.rating, isArabic)}
                                            {statusBadge(rev.status, isArabic)}
                                            {rev.is_published && (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                                                    <CheckCircle className="h-3 w-3" /> {isArabic ? 'منشور' : 'Published'}
                                                </Badge>
                                            )}
                                        </div>
                                        {rev.comment && (
                                            <p className="text-sm whitespace-pre-wrap rounded bg-muted/30 p-3">{rev.comment}</p>
                                        )}
                                        {rev.reply && (
                                            <div className="text-sm rounded border-s-4 border-primary bg-primary/5 p-3">
                                                <div className="text-xs text-muted-foreground mb-1">
                                                    {isArabic ? 'الرد' : 'Reply'} · {rev.replied_at && new Date(rev.replied_at).toLocaleString(numLocale)}
                                                </div>
                                                <p className="whitespace-pre-wrap">{rev.reply}</p>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                                            <Button variant="outline" size="sm" onClick={() => markInReview(rev.id)}>
                                                <Eye className="h-3.5 w-3.5" /> {isArabic ? 'مراجعة' : 'Review'}
                                            </Button>
                                            {rev.is_published ? (
                                                <Button variant="outline" size="sm" onClick={() => togglePublished(rev.id)} className="border-amber-200 text-amber-700 hover:bg-amber-50">
                                                    <EyeOff className="h-3.5 w-3.5" /> {isArabic ? 'إلغاء النشر' : 'Unpublish'}
                                                </Button>
                                            ) : (
                                                <Button variant="outline" size="sm" onClick={() => togglePublished(rev.id)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                                    <ThumbsUp className="h-3.5 w-3.5" /> {isArabic ? 'نشر' : 'Publish'}
                                                </Button>
                                            )}
                                            <Button variant="outline" size="sm" onClick={() => notify(rev.id)}>
                                                <Mail className="h-3.5 w-3.5" /> {isArabic ? 'إعلام' : 'Notify'}
                                            </Button>
                                            <Button size="sm" onClick={() => setReplyingTo(rev)}>
                                                <Send className="h-3.5 w-3.5" /> {isArabic ? 'الرد' : 'Reply'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Right: date */}
                                    <div className="text-end text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(rev.created_at).toLocaleDateString(numLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Pagination */}
                {reviews.last_page > 1 && (
                    <div className="flex flex-wrap justify-center gap-1">
                        {reviews.links.map((link, i) => (
                            <Button key={i} variant={link.active ? 'default' : 'ghost'} size="sm" disabled={!link.url} asChild={!!link.url}>
                                {link.url
                                    ? <Link href={link.url} preserveState dangerouslySetInnerHTML={{ __html: link.label }} />
                                    : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {replyingTo && <ReplyModal review={replyingTo} onClose={() => setReplyingTo(null)} isArabic={isArabic} />}
        </AppLayout>
    );
}

function KpiCard({ icon: Icon, label, value, color }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: React.ReactNode;
    color: 'blue' | 'yellow' | 'emerald' | 'red';
}) {
    const bg: Record<string, string> = {
        blue: 'bg-blue-50 dark:bg-blue-950',
        yellow: 'bg-yellow-50 dark:bg-yellow-950',
        emerald: 'bg-emerald-50 dark:bg-emerald-950',
        red: 'bg-red-50 dark:bg-red-950',
    };
    const text: Record<string, string> = {
        blue: 'text-blue-600',
        yellow: 'text-yellow-600',
        emerald: 'text-emerald-600',
        red: 'text-red-600',
    };
    return (
        <Card>
            <CardContent className="flex items-center gap-3 p-4">
                <div className={`rounded-lg p-2.5 ${bg[color]}`}>
                    <Icon className={`h-5 w-5 ${text[color]}`} />
                </div>
                <div className="min-w-0">
                    <div className="text-xs text-muted-foreground truncate">{label}</div>
                    <div className="text-2xl font-bold truncate">{value}</div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusCard({ icon: Icon, label, value, active, onClick, color }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    active: boolean;
    onClick: () => void;
    color: 'blue' | 'amber' | 'emerald' | 'red';
}) {
    const ring: Record<string, string> = {
        blue: 'ring-blue-300',
        amber: 'ring-amber-300',
        emerald: 'ring-emerald-300',
        red: 'ring-red-300',
    };
    const bg: Record<string, string> = {
        blue: 'bg-blue-50 dark:bg-blue-950',
        amber: 'bg-amber-50 dark:bg-amber-950',
        emerald: 'bg-emerald-50 dark:bg-emerald-950',
        red: 'bg-red-50 dark:bg-red-950',
    };
    const text: Record<string, string> = {
        blue: 'text-blue-600',
        amber: 'text-amber-600',
        emerald: 'text-emerald-600',
        red: 'text-red-600',
    };
    return (
        <button
            onClick={onClick}
            className={`text-start rounded-lg border p-4 transition hover:shadow ${active ? `ring-2 ${ring[color]} ring-offset-1` : ''}`}
        >
            <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${bg[color]}`}>
                    <Icon className={`h-5 w-5 ${text[color]}`} />
                </div>
                <div className={`text-2xl font-bold ${text[color]}`}>{value}</div>
            </div>
            <div className="text-sm text-muted-foreground mt-2">{label}</div>
        </button>
    );
}

function ReplyModal({ review, onClose, isArabic }: { review: Review; onClose: () => void; isArabic: boolean }) {
    const { data, setData, post, processing, errors } = useForm({ reply: review.reply ?? '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/super-admin/reviews/${review.id}/reply`, { preserveScroll: true, onSuccess: () => onClose() });
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
            <div className="w-full max-w-md bg-background rounded-lg shadow-xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-bold">{isArabic ? 'الرد على المراجعة' : 'Reply to review'}</h2>
                    <button type="button" onClick={onClose}><XCircle className="h-5 w-5 text-muted-foreground" /></button>
                </div>
                <form onSubmit={submit} className="p-6 space-y-4">
                    <div className="rounded bg-muted/30 p-3 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{review.guest_name}</span>
                            <span className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <Star key={n} className={`h-3 w-3 ${n <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                                ))}
                            </span>
                        </div>
                        {review.comment && <p className="text-xs">{review.comment}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label>{isArabic ? 'ردك' : 'Your reply'}</Label>
                        <Textarea value={data.reply} onChange={(e) => setData('reply', e.target.value)} rows={5} required />
                        {errors.reply && <p className="text-xs text-destructive">{errors.reply}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>{isArabic ? 'إلغاء' : 'Cancel'}</Button>
                        <Button type="submit" disabled={processing}>{isArabic ? 'إرسال' : 'Send'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
