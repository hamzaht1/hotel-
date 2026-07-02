import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Send, Sparkles, UserCheck, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import { useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/hooks/use-translations';

type Status = 'new' | 'in_progress' | 'closed';
type Category = 'support' | 'complaint' | 'inquiry' | 'technical' | 'contact';

interface Attachment {
    id: number;
    url: string;
    original_name: string | null;
    mime_type: string | null;
    size: number | null;
    is_image: boolean;
}

interface ConversationFull {
    id: number;
    subject: string;
    category: Category;
    status: Status;
    source: 'support' | 'contact' | 'broadcast' | 'platform';
    client_name: string | null;
    client_email: string | null;
    client_phone: string | null;
    assigned_to: { id: number; name: string } | null;
    messages: Array<{
        id: number;
        sender_type: 'tenant' | 'admin';
        sender_name: string;
        body: string;
        created_at: string;
        attachments: Attachment[];
    }>;
}

const CATEGORY_META: Record<Category, { ar: string; en: string }> = {
    support: { ar: 'الدعم', en: 'Support' },
    complaint: { ar: 'شكوى', en: 'Complaint' },
    inquiry: { ar: 'استفسار', en: 'Inquiry' },
    technical: { ar: 'تقني', en: 'Technical' },
    contact: { ar: 'تواصل معنا', en: 'Contact us' },
};

const STATUS_META: Record<Status, { ar: string; en: string; cls: string }> = {
    new: { ar: 'جديد', en: 'New', cls: 'bg-amber-100 text-amber-700' },
    in_progress: { ar: 'قيد المراجعة', en: 'In progress', cls: 'bg-blue-100 text-blue-700' },
    closed: { ar: 'مغلق', en: 'Closed', cls: 'bg-emerald-100 text-emerald-700' },
};

export default function ClientSupportShow({ conversation }: { conversation: ConversationFull }) {
    const { t, isArabic } = useT();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: '/client-admin' },
        { title: isArabic ? 'الرسائل والدعم' : 'Messages & support', href: '/client-admin/support' },
        { title: `#${conversation.id}`, href: `/client-admin/support/${conversation.id}` },
    ];

    const fileInput = useRef<HTMLInputElement>(null);
    const reply = useForm<{ body: string; attachments: File[] }>({ body: '', attachments: [] });

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

    function sendReply(e: React.FormEvent) {
        e.preventDefault();
        if (!reply.data.body.trim()) return;
        reply.post(`/client-admin/support/${conversation.id}/reply`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reply.reset('body', 'attachments'),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={conversation.subject} />

            <div className="mx-auto max-w-3xl p-4 lg:p-6 space-y-3">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/client-admin/support">
                        <ArrowLeft className="h-4 w-4" />
                        {isArabic ? 'رجوع للطلبات' : 'Back to requests'}
                    </Link>
                </Button>

                {/* Header */}
                <div className="rounded-lg border bg-card p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                            <div className="text-xs text-muted-foreground font-mono">#{conversation.id}</div>
                            <h1 className="text-lg font-bold">{conversation.subject}</h1>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">{CATEGORY_META[conversation.category][isArabic ? 'ar' : 'en']}</Badge>
                            <span className={`text-[10px] rounded px-1.5 py-0.5 ${STATUS_META[conversation.status].cls}`}>
                                {STATUS_META[conversation.status][isArabic ? 'ar' : 'en']}
                            </span>
                        </div>
                    </div>
                    {conversation.source === 'contact' && (conversation.client_name || conversation.client_email || conversation.client_phone) && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border bg-muted/30 px-3 py-2 text-xs">
                            {conversation.client_name && (
                                <span className="font-medium">{isArabic ? 'المرسل' : 'Sender'}: {conversation.client_name}</span>
                            )}
                            {conversation.client_email && (
                                <a href={`mailto:${conversation.client_email}`} className="text-muted-foreground hover:text-primary" dir="ltr">✉ {conversation.client_email}</a>
                            )}
                            {conversation.client_phone && (
                                <a href={`tel:${conversation.client_phone}`} className="text-muted-foreground hover:text-primary" dir="ltr">📞 {conversation.client_phone}</a>
                            )}
                        </div>
                    )}
                    {conversation.assigned_to && (
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-1">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            {isArabic ? 'موظف ضيافة يتولى طلبك الآن.' : 'A Diyafah agent is handling your request.'}
                            <UserCheck className="h-3.5 w-3.5 ms-1" />
                            <span className="font-semibold text-foreground">{conversation.assigned_to.name}</span>
                        </div>
                    )}
                </div>

                {/* Messages */}
                <div className="rounded-lg border bg-card p-4 space-y-3 min-h-[300px]">
                    {conversation.messages.map((m) => (
                        <MessageBubble key={m.id} m={m} isArabic={isArabic} />
                    ))}
                </div>

                {/* Reply */}
                {conversation.status !== 'closed' && (
                    <form onSubmit={sendReply} className="rounded-lg border bg-card p-3 space-y-2">
                        <Textarea
                            value={reply.data.body}
                            onChange={(e) => reply.setData('body', e.target.value)}
                            placeholder={isArabic ? 'اكتب رسالتك...' : 'Type your message...'}
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
                )}
                {conversation.status === 'closed' && (
                    <div className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                        {isArabic ? 'هذه المحادثة مغلقة' : 'This conversation is closed'}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function MessageBubble({ m, isArabic }: { m: { sender_type: 'tenant' | 'admin'; sender_name: string; body: string; created_at: string; attachments: Attachment[] }; isArabic: boolean }) {
    const isClient = m.sender_type === 'tenant';
    return (
        <div className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isClient ? 'bg-slate-900 text-white' : 'bg-muted border'}`}>
                <div className={`text-[10px] mb-1 ${isClient ? 'opacity-80' : 'text-muted-foreground'}`}>
                    {isClient ? (isArabic ? 'أنت' : 'You') : (isArabic ? 'دعم ضيافة' : 'Diyafah support')}
                    {!isClient && <span> · {m.sender_name}</span>}
                    {' · '}
                    {new Date(m.created_at).toLocaleString(isArabic ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </div>
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                {m.attachments && m.attachments.length > 0 && (
                    <div className="grid gap-1.5 grid-cols-2 mt-2">
                        {m.attachments.map((a) => <AttachmentItem key={a.id} a={a} dark={isClient} />)}
                    </div>
                )}
            </div>
        </div>
    );
}

function AttachmentItem({ a, dark }: { a: Attachment; dark: boolean }) {
    if (a.is_image) {
        return (
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="block">
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
