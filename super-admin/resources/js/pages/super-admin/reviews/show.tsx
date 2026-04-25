import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface Review {
    id: number;
    guest_name: string;
    guest_email: string | null;
    guest_phone: string | null;
    rating: number;
    comment: string | null;
    answers: Record<string, unknown> | null;
    status: string;
    reply: string | null;
    replied_at: string | null;
    is_published: boolean;
    created_at: string;
    tenant: { id: number; name: string; email: string; phone: string | null } | null;
}

export default function ReviewShow({ review }: { review: Review }) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'Reviews', href: '/super-admin/reviews' },
        { title: `#${review.id}`, href: `/super-admin/reviews/${review.id}` },
    ];

    function updateStatus(status: string) {
        router.post(`/super-admin/reviews/${review.id}/status`, { status }, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Review #${review.id}`} />
            <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
                <Button variant="ghost" size="sm" asChild className="self-start">
                    <Link href="/super-admin/reviews"><ArrowLeft className="h-4 w-4" /> Back</Link>
                </Button>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                <Card>
                    <CardHeader><CardTitle>Guest</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <div><strong>Name:</strong> {review.guest_name}</div>
                        {review.guest_email && <div><strong>Email:</strong> {review.guest_email}</div>}
                        {review.guest_phone && <div><strong>Phone:</strong> {review.guest_phone}</div>}
                        <div className="flex items-center gap-2">
                            <strong>Rating:</strong>
                            <span className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <Star key={n} className={`h-5 w-5 ${n <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                                ))}
                            </span>
                            <span>({review.rating}/5)</span>
                        </div>
                        {review.comment && (
                            <div>
                                <strong>Comment:</strong>
                                <p className="mt-1 whitespace-pre-wrap rounded bg-muted/30 p-3">{review.comment}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Tenant</CardTitle></CardHeader>
                    <CardContent>
                        {review.tenant ? (
                            <div className="space-y-1">
                                <div>{review.tenant.name}</div>
                                <div className="text-sm text-muted-foreground">{review.tenant.email}</div>
                                {review.tenant.phone && <div className="text-sm text-muted-foreground">{review.tenant.phone}</div>}
                            </div>
                        ) : <div className="text-muted-foreground">—</div>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Status</CardTitle></CardHeader>
                    <CardContent>
                        <Select value={review.status} onValueChange={updateStatus}>
                            <SelectTrigger className="w-full sm:w-[300px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">جديد / New</SelectItem>
                                <SelectItem value="in_progress">قيد المعالجة / In progress</SelectItem>
                                <SelectItem value="replied">تم الرد / Replied</SelectItem>
                                <SelectItem value="needs_followup">متابعة / Follow up</SelectItem>
                            </SelectContent>
                        </Select>
                        {review.reply && (
                            <div className="mt-4">
                                <strong>Reply:</strong>
                                <p className="mt-1 whitespace-pre-wrap rounded bg-muted/30 p-3">{review.reply}</p>
                                {review.replied_at && <p className="mt-1 text-xs text-muted-foreground">{new Date(review.replied_at).toLocaleString()}</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
