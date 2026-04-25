import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/hooks/use-translations';

interface Review {
    id: number;
    guest_name: string;
    guest_email: string | null;
    guest_phone: string | null;
    rating: number;
    comment: string | null;
    status: string;
    reply: string | null;
    replied_at: string | null;
    is_published: boolean;
    created_at: string;
}

export default function ReviewShow({ review }: { review: Review }) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: '/client-admin' },
        { title: 'Reviews', href: '/client-admin/reviews' },
        { title: `#${review.id}`, href: `/client-admin/reviews/${review.id}` },
    ];

    const { data, setData, post, processing, errors } = useForm({ reply: review.reply ?? '' });

    function submitReply(e: React.FormEvent) {
        e.preventDefault();
        post(`/client-admin/reviews/${review.id}/reply`, { preserveScroll: true });
    }

    function togglePublish() {
        router.post(`/client-admin/reviews/${review.id}/publish`, {}, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Review #${review.id}`} />
            <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
                <Button variant="ghost" size="sm" asChild className="self-start">
                    <Link href="/client-admin/reviews"><ArrowLeft className="h-4 w-4" /> Back</Link>
                </Button>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                <Card>
                    <CardHeader><CardTitle>{review.guest_name}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {review.guest_email && <div className="text-sm text-muted-foreground">{review.guest_email}</div>}
                        {review.guest_phone && <div className="text-sm text-muted-foreground">{review.guest_phone}</div>}
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <Star key={n} className={`h-5 w-5 ${n <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                            ))}
                            <span className="ml-2 text-sm">({review.rating}/5)</span>
                        </div>
                        {review.comment && <p className="whitespace-pre-wrap rounded bg-muted/30 p-3">{review.comment}</p>}
                        <div className="flex gap-2 pt-2">
                            <Button size="sm" variant={review.is_published ? 'default' : 'outline'} onClick={togglePublish}>
                                {review.is_published ? 'Published' : 'Publish'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Reply</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submitReply} className="space-y-3">
                            <Textarea
                                value={data.reply}
                                onChange={(e) => setData('reply', e.target.value)}
                                placeholder="Write a public reply..."
                                rows={5}
                            />
                            {errors.reply && <p className="text-xs text-destructive">{errors.reply}</p>}
                            <Button type="submit" disabled={processing}>
                                {review.reply ? 'Update reply' : 'Send reply'}
                            </Button>
                            {review.replied_at && (
                                <p className="text-xs text-muted-foreground">Last updated: {new Date(review.replied_at).toLocaleString()}</p>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
