import { Head, useForm } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

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

export default function Review({ tenant, form }: Props) {
    const locale = typeof document !== 'undefined' ? document.documentElement.lang : 'ar';
    const isAr = locale === 'ar';

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

    function submit(e: React.FormEvent) {
        e.preventDefault();
        // setData is async, so merge the custom-field answers at submit time via
        // transform — otherwise the first submit would post stale (empty) answers.
        transform((d) => ({ ...d, answers }));
        post(`/hotel/${tenant.slug}/review`);
    }

    return (
        <div className="min-h-screen bg-muted/20 py-10">
            <Head title={title} />
            <div className="mx-auto max-w-2xl px-4">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">{title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{tenant.org_name_ar ?? tenant.name}</p>
                        {intro && <p className="mt-2 text-sm">{intro}</p>}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <div className="space-y-1.5">
                                <Label>{isAr ? 'الاسم' : 'Your name'} *</Label>
                                <Input value={data.guest_name} onChange={(e) => setData('guest_name', e.target.value)} required />
                                {errors.guest_name && <p className="text-xs text-destructive">{errors.guest_name}</p>}
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>{isAr ? 'البريد الإلكتروني' : 'Email'}</Label>
                                    <Input type="email" value={data.guest_email} onChange={(e) => setData('guest_email', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{isAr ? 'الهاتف' : 'Phone'}</Label>
                                    <Input value={data.guest_phone} onChange={(e) => setData('guest_phone', e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>{isAr ? 'تقييمك' : 'Rating'} *</Label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setData('rating', n)}
                                            className="p-1"
                                        >
                                            <Star className={`h-8 w-8 ${n <= data.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>{isAr ? 'تعليقك' : 'Your comment'}</Label>
                                <Textarea value={data.comment} onChange={(e) => setData('comment', e.target.value)} rows={4} />
                            </div>

                            {form?.fields?.filter((f) => !['rating', 'comment'].includes(f.key)).map((field) => (
                                <div key={field.id} className="space-y-1.5">
                                    <Label>{isAr ? field.label_ar : field.label_en}{field.is_required ? ' *' : ''}</Label>
                                    {field.type === 'text' && (
                                        <Input
                                            value={(answers[field.key] as string) ?? ''}
                                            onChange={(e) => setAnswers({ ...answers, [field.key]: e.target.value })}
                                            required={field.is_required}
                                        />
                                    )}
                                    {field.type === 'textarea' && (
                                        <Textarea
                                            value={(answers[field.key] as string) ?? ''}
                                            onChange={(e) => setAnswers({ ...answers, [field.key]: e.target.value })}
                                            required={field.is_required}
                                        />
                                    )}
                                    {field.type === 'select' && (
                                        <select
                                            className="w-full rounded border px-3 py-2 text-sm"
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
                                                type="checkbox"
                                                checked={!!answers[field.key]}
                                                onChange={(e) => setAnswers({ ...answers, [field.key]: e.target.checked })}
                                            />
                                            {isAr ? field.label_ar : field.label_en}
                                        </label>
                                    )}
                                </div>
                            ))}

                            <Button type="submit" disabled={processing}>
                                {processing ? (isAr ? 'جاري الإرسال…' : 'Submitting…') : (isAr ? 'أرسل التقييم' : 'Submit review')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
