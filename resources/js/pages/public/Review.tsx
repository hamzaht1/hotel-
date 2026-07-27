import { Head, useForm, usePage } from '@inertiajs/react';
import { Star, User, Mail, Phone, MessageSquare, Building2, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useStorageUrl } from '@/lib/storage';

interface Tenant {
    id: number;
    name: string;
    slug: string;
    org_name_ar: string | null;
    org_name_en: string | null;
    logo: string | null;
}

interface FormField {
    id: number;
    key: string;
    label_ar: string;
    label_en: string;
    type: 'text' | 'textarea' | 'rating' | 'select' | 'checkbox';
    options: string[] | null;
    is_required: boolean;
}

interface ReviewFormModel {
    id: number;
    title_ar: string;
    title_en: string;
    intro_ar: string | null;
    intro_en: string | null;
    fields: FormField[];
}

interface Props {
    tenant: Tenant;
    form: ReviewFormModel | null;
}

const RATING_LABELS: Record<number, { ar: string; en: string }> = {
    1: { ar: 'سيئ', en: 'Poor' },
    2: { ar: 'مقبول', en: 'Fair' },
    3: { ar: 'جيد', en: 'Good' },
    4: { ar: 'جيد جدًا', en: 'Very good' },
    5: { ar: 'ممتاز', en: 'Excellent' },
};

export default function Review({ tenant, form }: Props) {
    const locale = typeof document !== 'undefined' ? document.documentElement.lang : 'ar';
    const isAr = locale === 'ar';

    const storageUrl = useStorageUrl();
    const siteSettings = (usePage().props as any).siteSettings;
    const logoUrl = storageUrl(siteSettings?.identity?.site_logo) ?? storageUrl(tenant.logo);
    const hotelName = (isAr ? tenant.org_name_ar : tenant.org_name_en) || tenant.name;
    const primaryColor = siteSettings?.colors?.primary_color || '#01004C';
    const secondaryColor = siteSettings?.colors?.secondary_color || '#2b2470';

    const title = form ? (isAr ? form.title_ar : form.title_en) : (isAr ? 'قيّم إقامتك' : 'Rate your stay');
    const intro = form ? (isAr ? form.intro_ar : form.intro_en) : '';

    const [answers, setAnswers] = useState<Record<string, unknown>>({});

    const { data, setData, post, processing, errors, transform } = useForm({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        rating: 5,
        comment: '',
        answers: {} as Record<string, unknown>,
    });

    const extraFields = form?.fields?.filter((f) => !['rating', 'comment'].includes(f.key)) ?? [];

    function submit(e: React.FormEvent) {
        e.preventDefault();
        // setData is async, so merge the custom-field answers at submit time via
        // transform — otherwise the first submit would post stale (empty) answers.
        transform((d) => ({ ...d, answers }));
        post(`/hotel/${tenant.slug}/review`);
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-background to-background py-10 dark:from-amber-950/10 dark:via-background dark:to-background">
            <Head title={title} />

            {/* Decorative soft glow */}
            <div aria-hidden className="pointer-events-none absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-500/10" />

            <div className="relative mx-auto max-w-2xl px-4">
                <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
                    {/* Brand header band, tinted with the hotel's own colors when available */}
                    <div
                        className="relative px-6 pb-14 pt-8 text-center text-white"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                    >
                        <p className="text-sm font-medium text-white/70">{isAr ? 'استطلاع رأي النزيل' : 'Guest feedback'}</p>
                        <h2 className="mt-1 text-lg font-bold">{hotelName}</h2>
                    </div>

                    {/* Logo, overlapping the band */}
                    <div className="relative -mt-10 flex justify-center">
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-white shadow-md">
                            {logoUrl ? (
                                <img src={logoUrl} alt={hotelName} className="h-full w-full object-contain p-1.5" />
                            ) : (
                                <Building2 className="h-9 w-9 text-muted-foreground" />
                            )}
                        </div>
                    </div>

                    <div className="px-6 pb-6 pt-4 text-center">
                        <h1 className="text-2xl font-bold">{title}</h1>
                        {intro && <p className="mt-2 text-sm text-muted-foreground">{intro}</p>}
                    </div>

                    <form onSubmit={submit} className="flex flex-col gap-5 px-6 pb-8">
                        {/* Personal info */}
                        <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="guest_name" className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" /> {isAr ? 'الاسم' : 'Your name'} *
                                </Label>
                                <Input id="guest_name" value={data.guest_name} onChange={(e) => setData('guest_name', e.target.value)} required />
                                {errors.guest_name && <p className="text-xs text-destructive">{errors.guest_name}</p>}
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="guest_email" className="flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {isAr ? 'البريد الإلكتروني' : 'Email'}
                                    </Label>
                                    <Input id="guest_email" type="email" value={data.guest_email} onChange={(e) => setData('guest_email', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="guest_phone" className="flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {isAr ? 'الهاتف' : 'Phone'}
                                    </Label>
                                    <Input id="guest_phone" value={data.guest_phone} onChange={(e) => setData('guest_phone', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Rating + comment */}
                        <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                            <div className="space-y-2 text-center">
                                <Label className="justify-center">{isAr ? 'تقييمك' : 'Your rating'} *</Label>
                                <div className="flex justify-center gap-1">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setData('rating', n)}
                                            className="p-0.5 transition-transform hover:scale-110"
                                            aria-label={`${n} ${isAr ? 'نجوم' : 'stars'}`}
                                        >
                                            <Star className={`h-9 w-9 ${n <= data.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                    {isAr ? RATING_LABELS[data.rating]?.ar : RATING_LABELS[data.rating]?.en}
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="comment" className="flex items-center gap-1.5">
                                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" /> {isAr ? 'تعليقك' : 'Your comment'}
                                </Label>
                                <Textarea
                                    id="comment"
                                    value={data.comment}
                                    onChange={(e) => setData('comment', e.target.value)}
                                    rows={4}
                                    placeholder={isAr ? 'شاركنا تجربتك...' : 'Share your experience...'}
                                />
                            </div>
                        </div>

                        {/* Admin-defined custom fields */}
                        {extraFields.length > 0 && (
                            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                                {extraFields.map((field) => (
                                    <div key={field.id} className="space-y-1.5">
                                        <Label htmlFor={`field_${field.id}`}>
                                            {isAr ? field.label_ar : field.label_en}{field.is_required ? ' *' : ''}
                                        </Label>
                                        {field.type === 'text' && (
                                            <Input
                                                id={`field_${field.id}`}
                                                value={(answers[field.key] as string) ?? ''}
                                                onChange={(e) => setAnswers({ ...answers, [field.key]: e.target.value })}
                                                required={field.is_required}
                                            />
                                        )}
                                        {field.type === 'textarea' && (
                                            <Textarea
                                                id={`field_${field.id}`}
                                                value={(answers[field.key] as string) ?? ''}
                                                onChange={(e) => setAnswers({ ...answers, [field.key]: e.target.value })}
                                                required={field.is_required}
                                            />
                                        )}
                                        {field.type === 'select' && (
                                            <select
                                                id={`field_${field.id}`}
                                                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs"
                                                value={(answers[field.key] as string) ?? ''}
                                                onChange={(e) => setAnswers({ ...answers, [field.key]: e.target.value })}
                                                required={field.is_required}
                                            >
                                                <option value="">—</option>
                                                {(field.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        )}
                                        {field.type === 'checkbox' && (
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    id={`field_${field.id}`}
                                                    type="checkbox"
                                                    checked={!!answers[field.key]}
                                                    onChange={(e) => setAnswers({ ...answers, [field.key]: e.target.checked })}
                                                />
                                                {isAr ? field.label_ar : field.label_en}
                                            </label>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button type="submit" disabled={processing} size="lg" className="w-full gap-2 text-base">
                            <Send className="h-4 w-4" />
                            {processing ? (isAr ? 'جاري الإرسال…' : 'Submitting…') : (isAr ? 'أرسل التقييم' : 'Submit review')}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
