import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Send, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-translations';

interface Plan {
    id: number;
    name_ar: string;
    name_en: string;
}

interface Props {
    plans: Plan[];
    cities: string[];
}

type TargetType = 'all' | 'plan' | 'city';

interface FormData {
    target_type: TargetType;
    target_filter: { plan_id?: number; city?: string };
    subject: string;
    body: string;
    scheduled_at: string;
}

export default function BroadcastCreate({ plans, cities }: Props) {
    const { t, isArabic } = useT();

    const { data, setData, post, processing, errors } = useForm<FormData>({
        target_type: 'all',
        target_filter: {},
        subject: '',
        body: '',
        scheduled_at: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'الرسائل الجماعية' : 'Broadcasts', href: '/super-admin/broadcasts' },
        { title: isArabic ? 'رسالة جديدة' : 'New broadcast', href: '/super-admin/broadcasts/create' },
    ];

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/super-admin/broadcasts');
    }

    function changeTarget(type: TargetType) {
        setData((d) => ({ ...d, target_type: type, target_filter: {} }));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'رسالة جماعية جديدة' : 'New broadcast'} />

            <div className="mx-auto max-w-3xl p-4 lg:p-6 space-y-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/super-admin/broadcasts">
                        <ArrowLeft className="h-4 w-4" /> {isArabic ? 'رجوع' : 'Back'}
                    </Link>
                </Button>

                <div>
                    <h1 className="text-2xl font-bold">{isArabic ? 'إنشاء رسالة جماعية' : 'New broadcast'}</h1>
                    <p className="text-sm text-muted-foreground">{isArabic ? 'تواصل مع كل الفنادق دفعة واحدة' : 'Reach all hotels in one go'}</p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {/* Target */}
                    <div className="rounded-lg border bg-card p-4 space-y-3">
                        <Label className="text-sm font-semibold">{isArabic ? 'الجمهور المستهدف' : 'Target audience'}</Label>
                        <div className="grid gap-2 sm:grid-cols-3">
                            <TargetCard active={data.target_type === 'all'} onClick={() => changeTarget('all')}
                                title={isArabic ? 'كل الفنادق' : 'All hotels'}
                                desc={isArabic ? 'إرسال للجميع' : 'Send to everyone'} />
                            <TargetCard active={data.target_type === 'plan'} onClick={() => changeTarget('plan')}
                                title={isArabic ? 'حسب الباقة' : 'By plan'}
                                desc={isArabic ? 'فنادق باقة محددة' : 'Hotels on a specific plan'} />
                            <TargetCard active={data.target_type === 'city'} onClick={() => changeTarget('city')}
                                title={isArabic ? 'حسب المدينة' : 'By city'}
                                desc={isArabic ? 'فنادق مدينة محددة' : 'Hotels in a specific city'} />
                        </div>

                        {data.target_type === 'plan' && (
                            <div className="space-y-1.5">
                                <Label className="text-xs">{isArabic ? 'الباقة' : 'Plan'}</Label>
                                <select required
                                    className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                                    value={data.target_filter.plan_id ?? ''}
                                    onChange={(e) => setData('target_filter', { plan_id: parseInt(e.target.value) })}>
                                    <option value="">{isArabic ? 'اختر باقة...' : 'Select a plan...'}</option>
                                    {plans.map((p) => (
                                        <option key={p.id} value={p.id}>{isArabic ? p.name_ar : p.name_en}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {data.target_type === 'city' && (
                            <div className="space-y-1.5">
                                <Label className="text-xs">{isArabic ? 'المدينة' : 'City'}</Label>
                                <select required
                                    className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                                    value={data.target_filter.city ?? ''}
                                    onChange={(e) => setData('target_filter', { city: e.target.value })}>
                                    <option value="">{isArabic ? 'اختر مدينة...' : 'Select a city...'}</option>
                                    {cities.map((c) => (<option key={c} value={c}>{c}</option>))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="rounded-lg border bg-card p-4 space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-sm">{isArabic ? 'الموضوع' : 'Subject'}</Label>
                            <Input value={data.subject} onChange={(e) => setData('subject', e.target.value)} required maxLength={255} />
                            {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm">{isArabic ? 'المحتوى' : 'Body'}</Label>
                            <Textarea rows={6} value={data.body} onChange={(e) => setData('body', e.target.value)} required />
                            {errors.body && <p className="text-xs text-destructive">{errors.body}</p>}
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="rounded-lg border bg-card p-4 space-y-1.5">
                        <Label className="text-sm inline-flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> {isArabic ? 'الجدولة (اختياري)' : 'Schedule (optional)'}
                        </Label>
                        <Input type="datetime-local"
                            value={data.scheduled_at}
                            onChange={(e) => setData('scheduled_at', e.target.value)} />
                        <p className="text-[11px] text-muted-foreground">
                            {isArabic
                                ? 'اتركه فارغاً للإرسال الفوري.'
                                : 'Leave empty to send immediately.'}
                        </p>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/super-admin/broadcasts">{isArabic ? 'إلغاء' : 'Cancel'}</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Send className="h-4 w-4" />
                            {data.scheduled_at
                                ? (isArabic ? 'جدولة' : 'Schedule')
                                : (isArabic ? 'إرسال الآن' : 'Send now')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function TargetCard({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
    return (
        <button type="button" onClick={onClick}
            className={`text-start rounded-lg border-2 p-3 transition ${active ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/40'}`}>
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
        </button>
    );
}
