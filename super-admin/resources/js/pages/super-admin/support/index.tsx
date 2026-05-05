import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState, useMemo, useRef } from 'react';
import {
    MessageSquare, AlertCircle, HelpCircle, Wrench, Send, Inbox,
    Search, CheckCircle, Star, Clock, UserCheck, Mail, ChevronRight, MoreHorizontal, Megaphone,
    Paperclip, X, Image as ImageIcon, FileText, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/hooks/use-translations';

type Status = 'new' | 'in_progress' | 'closed';
type Category = 'support' | 'complaint' | 'inquiry' | 'technical';

interface ConversationListItem {
    id: number;
    subject: string;
    category: Category;
    status: Status;
    source: 'support' | 'contact';
    client_name: string | null;
    last_message_at: string | null;
    admin_unread_count: number;
    messages_count: number;
    tenant: { id: number; name: string; logo_url?: string | null } | null;
    assigned_to: { id: number; name: string } | null;
    latest_message: { body: string; sender_type: string } | null;
}

interface Attachment {
    id: number; url: string; original_name: string | null; mime_type: string | null; size: number | null; is_image: boolean;
}

interface ConversationFull extends ConversationListItem {
    client_email: string | null;
    messages: Array<{
        id: number; sender_type: 'tenant' | 'admin'; sender_name: string; body: string;
        created_at: string; read_at: string | null;
        attachments: Attachment[];
    }>;
}

interface Stats {
    open: number; resolved_today: number; avg_response_seconds: number | null; satisfaction: number;
    by_category: Record<'all' | Category, number>;
    tabs: Record<'all' | 'new' | 'in_progress' | 'closed', number>;
}

interface Props {
    conversations: { data: ConversationListItem[] };
    selected: ConversationFull | null;
    stats: Stats;
    filters: { category?: string; tab?: string; search?: string };
}

const CATEGORY_META: Record<Category, { ar: string; en: string; color: string; icon: typeof MessageSquare }> = {
    support: { ar: 'الدعم', en: 'Support', color: 'bg-blue-500', icon: HelpCircle },
    complaint: { ar: 'الشكاوى', en: 'Complaints', color: 'bg-red-500', icon: AlertCircle },
    inquiry: { ar: 'الاستفسارات', en: 'Inquiries', color: 'bg-emerald-500', icon: MessageSquare },
    technical: { ar: 'المشاكل التقنية', en: 'Technical', color: 'bg-orange-500', icon: Wrench },
};

const STATUS_META: Record<Status, { ar: string; en: string; cls: string }> = {
    new: { ar: 'جديد', en: 'New', cls: 'bg-amber-100 text-amber-700' },
    in_progress: { ar: 'قيد المراجعة', en: 'In progress', cls: 'bg-blue-100 text-blue-700' },
    closed: { ar: 'مغلق', en: 'Closed', cls: 'bg-emerald-100 text-emerald-700' },
};

function formatRelative(iso: string | null, isArabic: boolean): string {
    if (!iso) return '';
    const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diffSec < 60) return isArabic ? 'الآن' : 'now';
    const min = Math.floor(diffSec / 60);
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
}

function formatResponseTime(seconds: number | null, isArabic: boolean): string {
    if (seconds == null) return '—';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

export default function SupportIndex({ conversations, selected, stats, filters }: Props) {
    const { t, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string } | undefined;

    const [search, setSearch] = useState(filters.search || '');
    const [activeCategory, setActiveCategory] = useState(filters.category || 'all');
    const [activeTab, setActiveTab] = useState(filters.tab || 'all');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'مركز الدعم' : 'Support center', href: '/super-admin/support' },
    ];

    const fileInput = useRef<HTMLInputElement>(null);
    const reply = useForm<{ body: string; attachments: File[] }>({ body: '', attachments: [] });
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

    function pickFiles(list: FileList | null) {
        if (!list) return;
        const valid: File[] = [];
        for (const f of Array.from(list)) {
            if (f.size > 20 * 1024 * 1024) {
                alert((isArabic ? 'الملف يتجاوز 20 ميجا: ' : 'File exceeds 20 MB: ') + f.name);
                continue;
            }
            valid.push(f);
        }
        reply.setData('attachments', [...reply.data.attachments, ...valid].slice(0, 10));
    }

    function removeAttachment(i: number) {
        reply.setData('attachments', reply.data.attachments.filter((_, idx) => idx !== i));
    }

    async function loadAiSuggestions() {
        if (!selected) return;
        setAiLoading(true);
        try {
            const res = await fetch(`/super-admin/support/${selected.id}/ai-suggestions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
            });
            const data = await res.json();
            setAiSuggestions(data.suggestions ?? []);
        } catch {
            setAiSuggestions([]);
        } finally {
            setAiLoading(false);
        }
    }

    function applyFilter(overrides: Record<string, string | undefined> = {}) {
        router.get('/super-admin/support', {
            category: overrides.category ?? (activeCategory === 'all' ? undefined : activeCategory),
            tab: overrides.tab ?? (activeTab === 'all' ? undefined : activeTab),
            search: overrides.search ?? (search || undefined),
            conversation: selected?.id,
        }, { preserveState: true, preserveScroll: true });
    }

    function openConversation(id: number) {
        router.get('/super-admin/support', {
            ...filters,
            conversation: id,
        }, { preserveState: true, preserveScroll: true });
    }

    function sendReply(e: React.FormEvent) {
        e.preventDefault();
        if (!selected || !reply.data.body.trim()) return;
        reply.post(`/super-admin/support/${selected.id}/reply`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { reply.reset('body', 'attachments'); setAiSuggestions([]); },
        });
    }

    function takeConversation() {
        if (!selected) return;
        router.post(`/super-admin/support/${selected.id}/take`, {}, { preserveScroll: true });
    }

    function changeStatus(status: Status) {
        if (!selected) return;
        router.post(`/super-admin/support/${selected.id}/status`, { status }, { preserveScroll: true });
    }

    const sidebarCategories: Array<{ key: 'all' | Category; label: string; icon: typeof Inbox; color?: string }> = useMemo(() => [
        { key: 'all', label: isArabic ? 'جميع المحادثات' : 'All conversations', icon: Inbox },
        { key: 'support', label: CATEGORY_META.support[isArabic ? 'ar' : 'en'], icon: HelpCircle, color: 'bg-blue-500' },
        { key: 'complaint', label: CATEGORY_META.complaint[isArabic ? 'ar' : 'en'], icon: AlertCircle, color: 'bg-red-500' },
        { key: 'inquiry', label: CATEGORY_META.inquiry[isArabic ? 'ar' : 'en'], icon: MessageSquare, color: 'bg-emerald-500' },
        { key: 'technical', label: CATEGORY_META.technical[isArabic ? 'ar' : 'en'], icon: Wrench, color: 'bg-orange-500' },
    ], [isArabic]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'مركز الدعم' : 'Support center'} />

            <div className="p-4 lg:p-6 space-y-4">
                {flash?.success && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                )}

                <div className="flex items-center justify-end">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/super-admin/broadcasts/create">
                            <Megaphone className="h-4 w-4" /> {isArabic ? 'إنشاء رسالة جماعية' : 'New broadcast'}
                        </Link>
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard icon={MessageSquare} color="bg-blue-100 text-blue-600"
                        label={isArabic ? 'المحادثات المفتوحة' : 'Open conversations'}
                        value={stats.open} />
                    <KpiCard icon={CheckCircle} color="bg-emerald-100 text-emerald-600"
                        label={isArabic ? 'تم الحل اليوم' : 'Resolved today'}
                        value={stats.resolved_today} />
                    <KpiCard icon={Clock} color="bg-amber-100 text-amber-600"
                        label={isArabic ? 'متوسط الرد' : 'Avg. response'}
                        value={formatResponseTime(stats.avg_response_seconds, isArabic)} />
                    <KpiCard icon={Star} color="bg-purple-100 text-purple-600"
                        label={isArabic ? 'الرضا' : 'Satisfaction'}
                        value={stats.satisfaction.toFixed(1)} />
                </div>

                <div className="grid gap-4 lg:grid-cols-[220px_1fr_1fr]">
                    {/* Sidebar */}
                    <aside className="rounded-lg border bg-card p-3 space-y-1">
                        <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                            {isArabic ? 'التصنيفات' : 'Categories'}
                        </h3>
                        {sidebarCategories.map((cat) => {
                            const Icon = cat.icon;
                            const count = stats.by_category[cat.key] ?? 0;
                            const active = activeCategory === cat.key;
                            return (
                                <button key={cat.key} type="button"
                                    onClick={() => { setActiveCategory(cat.key); applyFilter({ category: cat.key === 'all' ? undefined : cat.key }); }}
                                    className={`w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm transition ${active ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'}`}>
                                    {cat.color && <span className={`h-2 w-2 rounded-full ${cat.color}`} />}
                                    <Icon className="h-4 w-4 flex-shrink-0" />
                                    <span className="flex-1 text-start truncate">{cat.label}</span>
                                    <span className="text-xs text-muted-foreground">{count}</span>
                                </button>
                            );
                        })}
                    </aside>

                    {/* List */}
                    <section className="rounded-lg border bg-card overflow-hidden flex flex-col">
                        {/* Tabs */}
                        <div className="border-b px-3 pt-3 pb-2 space-y-2">
                            <div className="flex gap-1 flex-wrap">
                                {(['all', 'new', 'in_progress', 'mine', 'closed'] as const).map((tab) => (
                                    <button key={tab} type="button"
                                        onClick={() => { setActiveTab(tab); applyFilter({ tab: tab === 'all' ? undefined : tab }); }}
                                        className={`text-xs rounded-md px-3 py-1.5 transition ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
                                        {labelTab(tab, isArabic)}
                                        {tab !== 'mine' && <span className="ms-1 opacity-70">({stats.tabs[tab as keyof typeof stats.tabs]})</span>}
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') applyFilter(); }}
                                    placeholder={isArabic ? 'بحث...' : 'Search...'}
                                    className="ps-8 h-8 text-sm" />
                            </div>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto divide-y">
                            {conversations.data.length === 0 && (
                                <p className="p-6 text-center text-sm text-muted-foreground">
                                    {isArabic ? 'لا توجد محادثات' : 'No conversations'}
                                </p>
                            )}
                            {conversations.data.map((c) => {
                                const isSelected = selected?.id === c.id;
                                const cat = CATEGORY_META[c.category];
                                const st = STATUS_META[c.status];
                                return (
                                    <button key={c.id} type="button" onClick={() => openConversation(c.id)}
                                        className={`w-full text-start p-3 transition ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
                                        <div className="flex items-start gap-2">
                                            <div className={`h-1.5 w-1.5 mt-2 rounded-full flex-shrink-0 ${cat.color}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-semibold truncate">
                                                        {c.tenant?.name ?? '—'}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                                        {formatRelative(c.last_message_at, isArabic)}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate">{c.client_name}</div>
                                                <div className="text-xs truncate mt-0.5">{c.subject}</div>
                                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{cat[isArabic ? 'ar' : 'en']}</Badge>
                                                    <span className={`text-[10px] rounded px-1.5 py-0.5 ${st.cls}`}>{st[isArabic ? 'ar' : 'en']}</span>
                                                    {c.assigned_to && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                                            <UserCheck className="h-3 w-3" /> {c.assigned_to.name}
                                                        </span>
                                                    )}
                                                    {c.admin_unread_count > 0 && !isSelected && (
                                                        <span className="ms-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground text-background text-[10px] px-1">
                                                            {c.admin_unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Detail */}
                    <section className="rounded-lg border bg-card overflow-hidden flex flex-col min-h-[500px]">
                        {!selected && (
                            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-6 text-center">
                                {isArabic ? 'اختر محادثة لعرضها' : 'Select a conversation to view it'}
                            </div>
                        )}
                        {selected && (
                            <>
                                {/* Header */}
                                <div className="border-b p-3 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold truncate">{selected.tenant?.name}</span>
                                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm truncate">{selected.client_name}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5">{selected.subject}</div>
                                            {selected.assigned_to && (
                                                <div className="text-[11px] text-muted-foreground mt-1">
                                                    <UserCheck className="inline h-3 w-3 me-1" />
                                                    {isArabic ? 'أُسند إلى' : 'Assigned to'} {selected.assigned_to.name}
                                                </div>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <Badge variant="outline" className="text-[10px]">{CATEGORY_META[selected.category][isArabic ? 'ar' : 'en']}</Badge>
                                        <span className={`text-[10px] rounded px-1.5 py-0.5 ${STATUS_META[selected.status].cls}`}>
                                            {STATUS_META[selected.status][isArabic ? 'ar' : 'en']}
                                        </span>
                                        {!selected.assigned_to && (
                                            <Button size="sm" variant="default" className="h-7 text-xs ms-auto" onClick={takeConversation}>
                                                <UserCheck className="h-3 w-3" /> {isArabic ? 'استلام المحادثة' : 'Take it'}
                                            </Button>
                                        )}
                                        {selected.status !== 'closed' && (
                                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => changeStatus('closed')}>
                                                <CheckCircle className="h-3 w-3" /> {isArabic ? 'إغلاق' : 'Close'}
                                            </Button>
                                        )}
                                        {selected.status === 'closed' && (
                                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => changeStatus('in_progress')}>
                                                {isArabic ? 'إعادة الفتح' : 'Reopen'}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                                    {selected.messages.map((m) => (
                                        <MessageBubble key={m.id} m={m} isArabic={isArabic} />
                                    ))}
                                </div>

                                {/* AI suggestions */}
                                <div className="border-t px-3 py-2 bg-purple-50/50">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[11px] font-semibold inline-flex items-center gap-1 text-purple-700">
                                            <Sparkles className="h-3 w-3" /> {isArabic ? 'اقتراحات الذكاء الاصطناعي' : 'AI suggestions'}
                                        </span>
                                        <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px]"
                                            onClick={loadAiSuggestions} disabled={aiLoading}>
                                            {aiLoading ? '...' : (isArabic ? 'توليد' : 'Generate')}
                                        </Button>
                                    </div>
                                    {aiSuggestions.length > 0 && (
                                        <div className="space-y-1">
                                            {aiSuggestions.map((s, i) => (
                                                <button key={i} type="button"
                                                    onClick={() => reply.setData('body', s)}
                                                    className="block w-full text-start text-xs rounded border bg-white px-2 py-1.5 hover:bg-purple-50 transition">
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Reply */}
                                <form onSubmit={sendReply} className="border-t p-3 space-y-2">
                                    <Textarea
                                        value={reply.data.body}
                                        onChange={(e) => reply.setData('body', e.target.value)}
                                        placeholder={isArabic ? 'اكتب الرد...' : 'Type your reply...'}
                                        rows={3}
                                        required />
                                    <input ref={fileInput} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden"
                                        onChange={(e) => { pickFiles(e.target.files); e.target.value = ''; }} />
                                    {reply.data.attachments.length > 0 && (
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {reply.data.attachments.map((f, i) => (
                                                <PendingPreview key={i} file={f} onRemove={() => removeAttachment(i)} />
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <Button type="button" variant="ghost" size="sm" onClick={() => fileInput.current?.click()}>
                                            <Paperclip className="h-4 w-4" /> {isArabic ? 'إرفاق' : 'Attach'}
                                        </Button>
                                        <Button type="submit" size="sm" disabled={reply.processing || !reply.data.body.trim()}>
                                            <Send className="h-4 w-4" /> {isArabic ? 'إرسال' : 'Send'}
                                        </Button>
                                    </div>
                                </form>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}

function labelTab(tab: string, isArabic: boolean): string {
    const labels: Record<string, [string, string]> = {
        all: ['الكل', 'All'],
        new: ['جديد', 'New'],
        in_progress: ['قيد المراجعة', 'In progress'],
        mine: ['محادثاتي', 'Mine'],
        closed: ['مغلق', 'Closed'],
    };
    return labels[tab][isArabic ? 0 : 1];
}

function KpiCard({ icon: Icon, color, label, value }: { icon: typeof MessageSquare; color: string; label: string; value: string | number }) {
    return (
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-xl font-bold">{value}</div>
            </div>
        </div>
    );
}

function MessageBubble({ m, isArabic }: { m: { sender_type: 'tenant' | 'admin'; sender_name: string; body: string; created_at: string; attachments: Attachment[] }; isArabic: boolean }) {
    const isAdmin = m.sender_type === 'admin';
    return (
        <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isAdmin ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                <div className={`text-[10px] mb-1 ${isAdmin ? 'opacity-80' : 'text-muted-foreground'}`}>
                    {m.sender_name} · {new Date(m.created_at).toLocaleString(isArabic ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </div>
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                {m.attachments && m.attachments.length > 0 && (
                    <div className="grid gap-1.5 grid-cols-2 mt-2">
                        {m.attachments.map((a) => <AttachmentItem key={a.id} a={a} dark={isAdmin} />)}
                    </div>
                )}
            </div>
        </div>
    );
}

function AttachmentItem({ a, dark }: { a: Attachment; dark: boolean }) {
    if (a.is_image) {
        return (
            <a href={a.url} target="_blank" rel="noopener noreferrer">
                <img src={a.url} alt={a.original_name ?? ''} className="rounded border max-h-40 w-full object-cover" />
            </a>
        );
    }
    return (
        <a href={a.url} target="_blank" rel="noopener noreferrer"
           className={`flex items-center gap-2 rounded border px-2 py-1.5 text-xs ${dark ? 'border-white/30 bg-white/10' : 'bg-background'}`}>
            <FileText className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{a.original_name ?? 'file'}</span>
        </a>
    );
}

function PendingPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
    const isImage = file.type.startsWith('image/');
    const [preview, setPreview] = useState<string | null>(null);
    if (isImage && preview === null) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
    }
    return (
        <div className="rounded border bg-muted/30 p-2 flex items-center gap-2">
            {isImage && preview ? (
                <img src={preview} alt="" className="h-10 w-10 object-cover rounded" />
            ) : (
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="text-xs truncate">{file.name}</div>
                <div className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={onRemove}>
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
