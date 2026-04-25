import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Star, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface Review {
    id: number;
    guest_name: string;
    rating: number;
    comment: string | null;
    status: string;
    is_published: boolean;
    created_at: string;
}

interface Stats {
    total: number;
    average: number;
    published: number;
    positive: number;
    negative: number;
}

interface Props {
    reviews: { data: Review[]; links: { url: string | null; label: string; active: boolean }[]; last_page: number };
    stats: Stats;
    filters: { search?: string; status?: string; published?: string };
}

export default function ReviewsIndex({ reviews, stats, filters }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: '/client-admin' },
        { title: 'آراء العملاء / Reviews', href: '/client-admin/reviews' },
    ];

    function apply(key: string, value: string | undefined) {
        router.get('/client-admin/reviews', { ...filters, [key]: value || undefined }, { preserveState: true });
    }

    function togglePublish(id: number) {
        router.post(`/client-admin/reviews/${id}/publish`, {}, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="آراء العملاء" />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">آراء العملاء / Reviews</h1>
                    <Button asChild variant="outline">
                        <Link href="/client-admin/reviews/form"><Settings className="h-4 w-4" /> Form builder</Link>
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-5">
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Average</div><div className="flex items-center gap-1 text-2xl font-bold">{stats.average}<Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /></div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Published</div><div className="text-2xl font-bold">{stats.published}</div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Positive</div><div className="text-2xl font-bold text-green-600">{stats.positive}</div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Negative</div><div className="text-2xl font-bold text-red-600">{stats.negative}</div></CardContent></Card>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                        placeholder="Search..."
                        defaultValue={filters.search || ''}
                        onBlur={(e) => apply('search', e.target.value)}
                        className="vuexy-input flex-1"
                    />
                    <Select value={filters.status || 'all'} onValueChange={(v) => apply('status', v === 'all' ? undefined : v)}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="new">جديد / New</SelectItem>
                            <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                            <SelectItem value="replied">تم الرد</SelectItem>
                            <SelectItem value="needs_followup">متابعة</SelectItem>
                            <SelectItem value="positive">إيجابي / Positive</SelectItem>
                            <SelectItem value="negative">سلبي / Negative</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.published ?? 'all'} onValueChange={(v) => apply('published', v === 'all' ? undefined : v)}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="1">Published</SelectItem>
                            <SelectItem value="0">Hidden</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card className="py-0">
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-muted-foreground">
                                    <th className="px-4 py-3 text-start">Guest</th>
                                    <th className="px-4 py-3 text-start">Rating</th>
                                    <th className="px-4 py-3 text-start">Comment</th>
                                    <th className="px-4 py-3 text-start">Status</th>
                                    <th className="px-4 py-3 text-start">Published</th>
                                    <th className="px-4 py-3 text-start">Date</th>
                                    <th className="px-4 py-3 text-start">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.data.map((r) => (
                                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{r.guest_name}</td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <Star key={n} className={`h-4 w-4 ${n <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                                                ))}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 max-w-[300px] truncate">{r.comment ?? '—'}</td>
                                        <td className="px-4 py-3"><Badge variant="secondary">{r.status}</Badge></td>
                                        <td className="px-4 py-3">
                                            <Button size="sm" variant={r.is_published ? 'default' : 'outline'} onClick={() => togglePublish(r.id)}>
                                                {r.is_published ? 'Published' : 'Hidden'}
                                            </Button>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/client-admin/reviews/${r.id}`}>View</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {reviews.data.length === 0 && (
                                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No reviews yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {reviews.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {reviews.links.map((link, i) => (
                            <Button key={i} variant={link.active ? 'default' : 'ghost'} size="sm" disabled={!link.url} asChild={!!link.url}>
                                {link.url ? <Link href={link.url} preserveState dangerouslySetInnerHTML={{ __html: link.label }} /> : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
