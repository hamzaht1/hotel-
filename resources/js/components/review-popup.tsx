import { router, usePage } from '@inertiajs/react';
import { Star, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ReviewPopup() {
    const { showReviewPopup } = usePage().props as unknown as { showReviewPopup: boolean };
    const [open, setOpen] = useState(showReviewPopup);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!open) return null;

    const isAr = typeof document !== 'undefined' && document.documentElement.lang === 'ar';

    function submit() {
        if (!rating) return;
        setSubmitting(true);
        router.post(
            '/client-admin/review-popup',
            { rating, comment, reason },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSubmitting(false);
                    setOpen(false);
                },
            },
        );
    }

    function dismiss() {
        router.post('/client-admin/review-popup/dismiss', {}, { preserveScroll: true, onFinish: () => setOpen(false) });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
                <button onClick={dismiss} className="absolute end-3 top-3 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                </button>

                <h2 className="mb-2 text-xl font-bold">
                    {isAr ? 'كيف تقيّم تجربتك معنا حتى الآن؟' : 'How would you rate your experience so far?'}
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                    {isAr ? 'رأيك يساعدنا على التحسين.' : 'Your feedback helps us improve.'}
                </p>

                <div className="mb-4 flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setRating(n)} className="p-1">
                            <Star className={`h-8 w-8 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </button>
                    ))}
                </div>

                {rating > 0 && rating < 2 && (
                    <div className="mb-4">
                        <label className="mb-1 block text-sm font-medium">
                            {isAr ? 'ما سبب تقييمك المنخفض؟' : 'What went wrong?'}
                        </label>
                        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
                    </div>
                )}

                {rating >= 2 && (
                    <div className="mb-4">
                        <label className="mb-1 block text-sm font-medium">
                            {isAr ? 'تعليق (اختياري)' : 'Comment (optional)'}
                        </label>
                        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={dismiss}>
                        {isAr ? 'لاحقاً' : 'Later'}
                    </Button>
                    <Button onClick={submit} disabled={!rating || submitting}>
                        {submitting ? (isAr ? 'جاري الإرسال…' : 'Submitting…') : (isAr ? 'إرسال' : 'Submit')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
