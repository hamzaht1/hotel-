import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Send, Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/hooks/use-translations';

interface BroadcastRow {
    id: number;
    subject: string;
    body: string;
    target_type: 'all' | 'plan' | 'city';
    target_filter: { plan_id?: number; city?: string } | null;
    scheduled_at: string | null;
    sent_at: string | null;
    recipient_count: number;
    sender: { id: number; name: string } | null;
    created_at: string;
}

interface Props {
    broadcasts: { data: BroadcastRow[] };
}

export default function BroadcastsIndex({ broadcasts }: Props) {
    const { t, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'الرسائل الجماعية' : 'Broadcasts', href: '/super-admin/broadcasts' },
    ];

    function sendNow(id: number) {
        if (!confirm(isArabic ? 'تأكيد الإرسال الآن؟' : 'Send now?')) return;
        router.post(`/super-admin/broadcasts/${id}/send`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'الرسائل الجماعية' : 'Broadcasts'} />

            <div className="p-4 lg:p-6 space-y-4">
                {flash?.success && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{flash.success}</div>
                )}
                {flash?.error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{flash.error}</div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">{isArabic ? 'الرسائل الجماعية' : 'Broadcasts'}</h1>
                        <p className="text-sm text-muted-foreground">{isArabic ? 'إرسال إعلانات لجميع الفنادق أو حسب فئة' : 'Send announcements to all hotels or by segment'}</p>
                    </div>
                    <Button asChild>
                        <Link href="/super-admin/broadcasts/create">
                            <Plus className="h-4 w-4" /> {isArabic ? 'إنشاء رسالة جماعية' : 'New broadcast'}
                        </Link>
                    </Button>
                </div>

                <div className="rounded-lg border bg-card divide-y">
                    {broadcasts.data.length === 0 && (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            {isArabic ? 'لا توجد رسائل بعد' : 'No broadcasts yet'}
                        </div>
                    )}
                    {broadcasts.data.map((b) => (
                        <div key={b.id} className="p-4 flex items-start gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-sm font-semibold">{b.subject}</span>
                                    <Badge variant="outline" className="text-[10px]">
                                        {b.target_type === 'all' && (isArabic ? 'كل الفنادق' : 'All hotels')}
                                        {b.target_type === 'plan' && (isArabic ? `باقة` : 'Plan')}
                                        {b.target_type === 'city' && (isArabic ? `مدينة: ${b.target_filter?.city ?? ''}` : `City: ${b.target_filter?.city ?? ''}`)}
                                    </Badge>
                                    {b.sent_at ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                                            <CheckCircle className="h-3 w-3" /> {isArabic ? 'تم الإرسال' : 'Sent'}
                                        </span>
                                    ) : b.scheduled_at ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600">
                                            <Calendar className="h-3 w-3" /> {isArabic ? 'مجدول' : 'Scheduled'}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Clock className="h-3 w-3" /> {isArabic ? 'مسودة' : 'Draft'}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{b.body}</p>
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                    {b.sender && <span>{b.sender.name}</span>}
                                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {b.recipient_count}</span>
                                    <span>{new Date(b.created_at).toLocaleString(isArabic ? 'ar' : 'en', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                            {!b.sent_at && (
                                <Button size="sm" variant="outline" onClick={() => sendNow(b.id)}>
                                    <Send className="h-3 w-3" /> {isArabic ? 'إرسال الآن' : 'Send now'}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
