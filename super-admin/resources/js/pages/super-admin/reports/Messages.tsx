import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Send, MessageSquare, AlertCircle, HelpCircle, Wrench, Clock, CheckCircle, User, Shield, Search, Building2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useLocale } from '@/hooks/use-locale';
import { useT } from '@/hooks/use-translations';

interface Message {
    id: number; tenant_name: string; client_name: string; client_email: string | null;
    type: string; subject: string; message: string; status: string;
    assigned_to: string | null; reply: string | null; created_at: string; updated_at: string;
}

interface Props {
    messages: { data: Message[]; links: any[]; current_page: number; last_page: number };
    stats: { total: number; open: number; in_progress: number; closed: number; by_type: Record<string, number> };
    filters: Record<string, any>;
}

export default function Messages({ messages, stats, filters }: Props) {
    const { isArabic } = useLocale();
    const { t: useTranslation } = useT();
    const t = (ar: string, en: string) => isArabic ? ar : en;
    const flash = usePage().props.flash as { success?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('الإدارة العليا', 'Super Admin'), href: '/super-admin' },
        { title: t('الرسائل والدعم', 'Messages & Support'), href: '/super-admin/reports/messages' },
    ];

    const [activeType, setActiveType] = useState(filters.type || '');
    const [activeStatus, setActiveStatus] = useState(filters.status || '');
    const [search, setSearch] = useState(filters.search || '');
    const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    const typeConfig = [
        { key: '', label: t('الكل', 'All'), icon: MessageSquare, count: stats.total },
        { key: 'support', label: t('دعم', 'Support'), icon: HelpCircle, count: stats.by_type.support || 0 },
        { key: 'complaint', label: t('شكاوى', 'Complaints'), icon: AlertCircle, count: stats.by_type.complaint || 0 },
        { key: 'inquiry', label: t('استفسارات', 'Inquiries'), icon: MessageSquare, count: stats.by_type.inquiry || 0 },
        { key: 'technical', label: t('تقنية', 'Technical'), icon: Wrench, count: stats.by_type.technical || 0 },
    ];

    const typeLabels: Record<string, string> = {
        support: t('دعم فني', 'Support'), complaint: t('شكوى', 'Complaint'),
        inquiry: t('استفسار', 'Inquiry'), technical: t('مشكلة تقنية', 'Technical'),
    };
    const typeBadgeColors: Record<string, string> = {
        support: 'bg-purple-100 text-purple-600', complaint: 'bg-red-100 text-red-600',
        inquiry: 'bg-blue-100 text-blue-600', technical: 'bg-amber-100 text-amber-600',
    };
    const statusLabels: Record<string, string> = {
        open: t('مفتوح', 'Open'), in_progress: t('قيد المعالجة', 'In Progress'), closed: t('مغلق', 'Closed'),
    };
    const statusColors: Record<string, string> = {
        open: 'vuexy-badge-warning', in_progress: 'vuexy-badge-info', closed: 'vuexy-badge-success',
    };

    // Auto-refresh
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['messages', 'stats'] });
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const applyFilters = (overrides: Record<string, any> = {}) => {
        router.get('/super-admin/reports/messages', {
            type: (overrides.type ?? activeType) || undefined,
            status: (overrides.status ?? activeStatus) || undefined,
            search: (overrides.search ?? search) || undefined,
        }, { preserveState: true });
    };

    const sendReply = () => {
        if (!selectedMsg || !replyText.trim()) return;
        const currentId = selectedMsg.id;
        const sentReply = replyText;
        setSending(true);
        router.post(`/super-admin/reports/messages/${currentId}/reply`, { reply: replyText }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setReplyText('');
                setSelectedMsg((prev) => prev && prev.id === currentId ? { ...prev, reply: sentReply, status: 'in_progress' } : prev);
            },
            onFinish: () => setSending(false),
        });
    };

    const changeStatus = (msgId: number, status: string) => {
        router.post(`/super-admin/reports/messages/${msgId}/status`, { status });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString(isArabic ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('الرسائل والدعم', 'Messages & Support')} />
            <div className="flex flex-col gap-4 p-6">
                {flash?.success && (
                    <div className="vuexy-card border-l-4 border-l-[#28c76f] px-4 py-3 text-sm text-[#28c76f]">{flash.success}</div>
                )}

                {/* Stats */}
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    <MiniStat label={t('إجمالي', 'Total')} value={stats.total} color="#7367f0" />
                    <MiniStat label={t('مفتوحة', 'Open')} value={stats.open} color="#ff9f43" />
                    <MiniStat label={t('قيد المعالجة', 'In Progress')} value={stats.in_progress} color="#00bad1" />
                    <MiniStat label={t('مغلقة', 'Closed')} value={stats.closed} color="#28c76f" />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    {typeConfig.map(tab => (
                        <button key={tab.key} onClick={() => { setActiveType(tab.key); applyFilters({ type: tab.key }); }}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${activeType === tab.key ? 'bg-primary text-white' : 'border border-border text-foreground hover:bg-muted'}`}>
                            <tab.icon className="h-3.5 w-3.5" />{tab.label}
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeType === tab.key ? 'bg-white/20' : 'bg-muted'}`}>{tab.count}</span>
                        </button>
                    ))}
                    <div className="flex-1" />
                    <div className="relative min-w-[200px]">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} placeholder={t('بحث...', 'Search...')} className="vuexy-input ps-8 text-xs py-1.5" />
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3" style={{ maxHeight: '72vh' }}>
                    {/* Messages list */}
                    <div className="lg:col-span-2 vuexy-card flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto divide-y divide-border">
                            {messages.data.map(msg => (
                                <div key={msg.id} onClick={() => { setSelectedMsg(msg); setReplyText(msg.reply || ''); }}
                                    className={`p-4 cursor-pointer hover:bg-muted/30 transition-colors ${selectedMsg?.id === msg.id ? 'bg-primary/5 border-s-2 border-primary' : ''} ${!msg.reply && msg.status === 'open' ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`shrink-0 h-9 w-9 rounded-full grid place-items-center ${msg.reply ? 'bg-[#28c76f]/20' : 'bg-primary/20'}`}>
                                            {msg.reply ? <CheckCircle className="h-4 w-4 text-[#28c76f]" /> : <User className="h-4 w-4 text-primary" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm text-foreground">{msg.client_name}</span>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Building2 className="h-2.5 w-2.5" />{msg.tenant_name}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${typeBadgeColors[msg.type] || ''}`}>{typeLabels[msg.type]}</span>
                                                <span className={`vuexy-badge text-[10px] ${statusColors[msg.status]}`}>{statusLabels[msg.status]}</span>
                                            </div>
                                            <p className="text-xs font-medium text-foreground mt-0.5">{msg.subject}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{msg.message}</p>
                                            <span className="text-[10px] text-muted-foreground mt-1 block">{formatTime(msg.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {messages.data.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                    <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
                                    <p>{t('لا توجد رسائل', 'No messages')}</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {messages.last_page > 1 && (
                            <div className="flex justify-center gap-1 p-3 border-t border-border">
                                {messages.links.map((link: any, i: number) => (
                                    <button key={i} disabled={!link.url} onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                        className={`rounded px-2 py-1 text-xs ${link.active ? 'bg-primary text-white' : 'text-foreground hover:bg-muted'} ${!link.url ? 'opacity-50' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detail / Reply panel */}
                    <div className="vuexy-card flex flex-col overflow-hidden">
                        {selectedMsg ? (
                            <>
                                <div className="p-4 border-b border-border">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-foreground text-sm">{selectedMsg.subject}</h3>
                                        <select value={selectedMsg.status} onChange={e => changeStatus(selectedMsg.id, e.target.value)} className="vuexy-input text-xs py-1 w-auto">
                                            <option value="open">{t('مفتوح', 'Open')}</option>
                                            <option value="in_progress">{t('قيد المعالجة', 'In Progress')}</option>
                                            <option value="closed">{t('مغلق', 'Closed')}</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{selectedMsg.client_name}</span>
                                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{selectedMsg.tenant_name}</span>
                                        <span>{formatTime(selectedMsg.created_at)}</span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {/* Client message */}
                                    <div className="flex gap-3">
                                        <div className="shrink-0 h-8 w-8 rounded-full bg-primary/20 grid place-items-center">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="rounded-2xl rounded-es-sm bg-muted/50 border border-border p-3 flex-1">
                                            <p className="text-sm text-foreground">{selectedMsg.message}</p>
                                        </div>
                                    </div>

                                    {/* Existing reply */}
                                    {selectedMsg.reply && (
                                        <div className="flex gap-3 justify-end">
                                            <div className="rounded-2xl rounded-ee-sm bg-[#28c76f]/10 border border-[#28c76f]/20 p-3 max-w-[85%]">
                                                <p className="text-sm text-foreground">{selectedMsg.reply}</p>
                                                <p className="text-[10px] text-muted-foreground mt-1">{selectedMsg.assigned_to || t('فريق الدعم', 'Support Team')}</p>
                                            </div>
                                            <div className="shrink-0 h-8 w-8 rounded-full bg-[#28c76f]/20 grid place-items-center">
                                                <Shield className="h-4 w-4 text-[#28c76f]" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Reply input */}
                                <div className="border-t border-border p-3">
                                    <div className="flex gap-2">
                                        <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                                            placeholder={t('اكتب الرد...', 'Type your reply...')}
                                            rows={3} className="vuexy-input flex-1 text-sm resize-none" />
                                    </div>
                                    <button onClick={sendReply} disabled={sending || !replyText.trim()}
                                        className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                                        <Send className={`h-4 w-4 ${isArabic ? 'rotate-180' : ''}`} />
                                        {sending ? t('جاري الإرسال...', 'Sending...') : t('إرسال الرد', 'Send Reply')}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
                                <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
                                <p className="text-sm">{t('اختر رسالة للرد عليها', 'Select a message to reply')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="vuexy-card px-4 py-3 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full" style={{ background: color }} />
            <div>
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="text-lg font-bold" style={{ color }}>{value}</p>
            </div>
        </div>
    );
}
