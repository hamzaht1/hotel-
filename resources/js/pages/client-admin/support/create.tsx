import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Send, ArrowLeft, HelpCircle, AlertCircle, MessageSquare, Wrench, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-translations';

type Category = 'support' | 'complaint' | 'inquiry' | 'technical';

const CATEGORIES: Array<{ key: Category; ar: string; en: string; descAr: string; descEn: string; icon: typeof HelpCircle; color: string; activeColor: string }> = [
    { key: 'support', ar: 'الدعم', en: 'Support', descAr: 'مساعدة عامة بشأن الموقع', descEn: 'General help with the site', icon: HelpCircle, color: 'border-blue-200 hover:border-blue-400', activeColor: 'border-blue-500 bg-blue-50' },
    { key: 'complaint', ar: 'شكوى', en: 'Complaint', descAr: 'مشاكل الفواتير أو الخدمة', descEn: 'Billing or service issues', icon: AlertCircle, color: 'border-red-200 hover:border-red-400', activeColor: 'border-red-500 bg-red-50' },
    { key: 'inquiry', ar: 'استفسار', en: 'Inquiry', descAr: 'أسئلة حول الميزات', descEn: 'Questions about features', icon: MessageSquare, color: 'border-emerald-200 hover:border-emerald-400', activeColor: 'border-emerald-500 bg-emerald-50' },
    { key: 'technical', ar: 'تقني', en: 'Technical', descAr: 'أخطاء أو توقف أو تكاملات', descEn: 'Bugs, downtime or integrations', icon: Wrench, color: 'border-orange-200 hover:border-orange-400', activeColor: 'border-orange-500 bg-orange-50' },
];

export default function ClientSupportCreate() {
    const { t, isArabic } = useT();
    const fileInput = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, errors } = useForm<{ category: Category; subject: string; body: string; attachments: File[] }>({
        category: 'support',
        subject: '',
        body: '',
        attachments: [],
    });

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
        setData('attachments', [...data.attachments, ...valid].slice(0, 10));
    }

    function removeAttachment(i: number) {
        setData('attachments', data.attachments.filter((_, idx) => idx !== i));
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: '/client-admin' },
        { title: isArabic ? 'الرسائل والدعم' : 'Messages & support', href: '/client-admin/support' },
        { title: isArabic ? 'طلب جديد' : 'New request', href: '/client-admin/support/create' },
    ];

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/client-admin/support', { forceFormData: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'طلب جديد' : 'New request'} />

            <div className="mx-auto max-w-3xl p-4 lg:p-6 space-y-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/client-admin/support">
                        <ArrowLeft className="h-4 w-4" />
                        {isArabic ? 'رجوع للطلبات' : 'Back to requests'}
                    </Link>
                </Button>

                <div>
                    <h1 className="text-2xl font-bold">{isArabic ? 'إنشاء طلب جديد' : 'Create new request'}</h1>
                    <p className="text-sm text-muted-foreground">{isArabic ? 'اختر التصنيف وصِف مشكلتك' : 'Pick a category and describe your issue'}</p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {/* Category cards */}
                    <div>
                        <Label className="text-sm mb-2 block">{isArabic ? 'التصنيف' : 'Category'}</Label>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {CATEGORIES.map((c) => {
                                const Icon = c.icon;
                                const active = data.category === c.key;
                                return (
                                    <button key={c.key} type="button"
                                        onClick={() => setData('category', c.key)}
                                        className={`text-start rounded-lg border-2 p-3 transition ${active ? c.activeColor : c.color}`}>
                                        <Icon className="h-5 w-5 mb-2" />
                                        <div className="text-sm font-semibold">{c[isArabic ? 'ar' : 'en']}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{c[isArabic ? 'descAr' : 'descEn']}</div>
                                    </button>
                                );
                            })}
                        </div>
                        {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                        <Label className="text-sm">{isArabic ? 'الموضوع' : 'Subject'}</Label>
                        <Input value={data.subject} onChange={(e) => setData('subject', e.target.value)} required />
                        {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
                    </div>

                    {/* Body */}
                    <div className="space-y-1.5">
                        <Label className="text-sm">{isArabic ? 'صف المشكلة' : 'Describe the issue'}</Label>
                        <Textarea
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                            rows={6}
                            placeholder={isArabic ? 'أخبرنا بما يحدث — أرفق روابط أو لقطات إن أمكن.' : 'Tell us what is happening — paste links or screenshots if possible.'}
                            required />
                        {errors.body && <p className="text-xs text-destructive">{errors.body}</p>}
                    </div>

                    {/* Attachments */}
                    <div className="space-y-1.5">
                        <Label className="text-sm">{isArabic ? 'المرفقات' : 'Attachments'}</Label>
                        <input ref={fileInput} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            className="hidden"
                            onChange={(e) => { pickFiles(e.target.files); e.target.value = ''; }} />
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                            <Paperclip className="h-4 w-4" /> {isArabic ? 'إضافة ملفات' : 'Add files'}
                        </Button>
                        <p className="text-[11px] text-muted-foreground">
                            {isArabic ? 'صور أو مستندات (حد أقصى 20 ميجا لكل ملف)' : 'Images or documents (max 20 MB each)'}
                        </p>
                        {data.attachments.length > 0 && (
                            <div className="grid gap-2 sm:grid-cols-2 mt-2">
                                {data.attachments.map((f, i) => (
                                    <AttachmentPreview key={i} file={f} onRemove={() => removeAttachment(i)} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/client-admin/support">{isArabic ? 'إلغاء' : 'Cancel'}</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Send className="h-4 w-4" /> {isArabic ? 'إرسال إلى ضيافة' : 'Send to Diyafah'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function AttachmentPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
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
