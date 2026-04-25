import { Head } from '@inertiajs/react';
import { Star, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Review {
    id: number;
    rating: number;
    comment: string | null;
    created_at: string;
    tenant: { id: number; name: string; slug: string } | null;
}

export default function ReviewThanks({ review }: { review: Review }) {
    const locale = typeof document !== 'undefined' ? document.documentElement.lang : 'ar';
    const isAr = locale === 'ar';

    return (
        <div className="min-h-screen bg-muted/20 py-10">
            <Head title={isAr ? 'شكراً لتقييمك' : 'Thank you'} />
            <div className="mx-auto max-w-xl px-4">
                <Card>
                    <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        <h1 className="text-2xl font-bold">{isAr ? 'شكراً لتقييمك!' : 'Thank you for your review!'}</h1>
                        <p className="text-muted-foreground">
                            {isAr ? 'تم استلام تقييمك بنجاح.' : 'Your review has been submitted successfully.'}
                        </p>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <Star key={n} className={`h-6 w-6 ${n <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                            ))}
                        </div>
                        {review.comment && <p className="rounded bg-muted/30 p-3 text-sm">{review.comment}</p>}
                        {review.tenant && (
                            <a href={`/hotel/${review.tenant.slug}`} className="text-sm text-primary underline">
                                {isAr ? 'العودة إلى ' : 'Back to '}{review.tenant.name}
                            </a>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
