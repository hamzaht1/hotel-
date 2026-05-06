// Shared Page form used by create.tsx and edit.tsx
import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Save, Eye, Send, Bold, Italic, Underline, Type, Link as LinkIcon, Image as ImageIcon, Table, Plus, X, ArrowUp, ArrowDown, Inbox } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export interface HeaderLink {
    label_ar: string;
    label_en: string;
    url: string;
}

export interface HeaderConfig {
    logo_url: string;
    background_color: string;
    text_color: string;
    links: HeaderLink[];
}

export type FormFieldType = 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file';

export interface FormFieldDef {
    key: string;
    type: FormFieldType;
    label_ar: string;
    label_en: string;
    placeholder_ar?: string;
    placeholder_en?: string;
    required: boolean;
    options?: string[];
}

export interface PageFormData {
    title_ar: string;
    title_en: string;
    slug: string;
    url_label_ar: string;
    url_label_en: string;
    content_ar: string;
    content_en: string;
    meta_title_ar: string;
    meta_title_en: string;
    meta_description_ar: string;
    meta_description_en: string;
    meta_keywords: string;
    og_image: string;
    attachments: Array<{ url: string; name: string; size?: string }>;
    is_published: boolean;
    sort_order: number;
    layout: string;
    show_header: boolean;
    show_footer: boolean;
    header_config: HeaderConfig | null;
    form_fields: FormFieldDef[];
    form_submit_label_ar: string;
    form_submit_label_en: string;
}

export function emptyHeaderConfig(): HeaderConfig {
    return { logo_url: '', background_color: '', text_color: '', links: [] };
}

export function emptyForm(): PageFormData {
    return {
        title_ar: '', title_en: '', slug: '',
        url_label_ar: '', url_label_en: '',
        content_ar: '', content_en: '',
        meta_title_ar: '', meta_title_en: '',
        meta_description_ar: '', meta_description_en: '',
        meta_keywords: '', og_image: '',
        attachments: [],
        is_published: false, sort_order: 0, layout: 'default',
        show_header: true, show_footer: true,
        header_config: null,
        form_fields: [],
        form_submit_label_ar: '',
        form_submit_label_en: '',
    };
}

export default function PageForm({
    data, setData, errors, processing, onSubmit, title, isArabic, cancelHref, submissionsHref,
}: {
    data: PageFormData;
    setData: <K extends keyof PageFormData>(key: K, value: PageFormData[K]) => void;
    errors: Partial<Record<keyof PageFormData, string>>;
    processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
    title: string;
    isArabic: boolean;
    cancelHref: string;
    submissionsHref?: string;
}) {
    const [activeContent, setActiveContent] = useState<'ar' | 'en'>('ar');

    function insertAtCursor(snippet: string) {
        const fieldKey = activeContent === 'ar' ? 'content_ar' : 'content_en';
        setData(fieldKey, (data[fieldKey] ?? '') + snippet);
    }

    const customHeaderEnabled = data.header_config !== null;

    function toggleCustomHeader(enabled: boolean) {
        setData('header_config', enabled ? emptyHeaderConfig() : null);
    }

    function updateHeaderField<K extends keyof HeaderConfig>(key: K, value: HeaderConfig[K]) {
        if (!data.header_config) return;
        setData('header_config', { ...data.header_config, [key]: value });
    }

    function addHeaderLink() {
        if (!data.header_config) return;
        setData('header_config', {
            ...data.header_config,
            links: [...data.header_config.links, { label_ar: '', label_en: '', url: '' }],
        });
    }

    function updateHeaderLink(i: number, patch: Partial<HeaderLink>) {
        if (!data.header_config) return;
        setData('header_config', {
            ...data.header_config,
            links: data.header_config.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
        });
    }

    function removeHeaderLink(i: number) {
        if (!data.header_config) return;
        setData('header_config', {
            ...data.header_config,
            links: data.header_config.links.filter((_, idx) => idx !== i),
        });
    }

    function moveHeaderLink(i: number, dir: -1 | 1) {
        if (!data.header_config) return;
        const links = [...data.header_config.links];
        const j = i + dir;
        if (j < 0 || j >= links.length) return;
        [links[i], links[j]] = [links[j], links[i]];
        setData('header_config', { ...data.header_config, links });
    }

    function addAttachment() {
        const url = prompt(isArabic ? 'رابط الملف' : 'File URL');
        if (!url) return;
        const name = prompt(isArabic ? 'اسم الملف' : 'File name', url.split('/').pop() ?? 'file') ?? 'file';
        setData('attachments', [...data.attachments, { url, name }]);
    }

    function addFormField() {
        const next: FormFieldDef = {
            key: `field_${data.form_fields.length + 1}`,
            type: 'text',
            label_ar: '',
            label_en: '',
            required: false,
            options: [],
        };
        setData('form_fields', [...data.form_fields, next]);
    }

    function updateFormField(i: number, patch: Partial<FormFieldDef>) {
        setData('form_fields', data.form_fields.map((f, idx) => idx === i ? { ...f, ...patch } : f));
    }

    function removeFormField(i: number) {
        setData('form_fields', data.form_fields.filter((_, idx) => idx !== i));
    }

    function moveFormField(i: number, dir: -1 | 1) {
        const fields = [...data.form_fields];
        const j = i + dir;
        if (j < 0 || j >= fields.length) return;
        [fields[i], fields[j]] = [fields[j], fields[i]];
        setData('form_fields', fields);
    }

    function removeAttachment(i: number) {
        setData('attachments', data.attachments.filter((_, idx) => idx !== i));
    }

    return (
        <div className="mx-auto max-w-4xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{title}</h1>
                <div className="flex gap-2">
                    {submissionsHref && (
                        <Button type="button" variant="outline" size="sm" asChild>
                            <Link href={submissionsHref}><Inbox className="h-4 w-4" /> {isArabic ? 'الاستجابات' : 'Submissions'}</Link>
                        </Button>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={(e) => { setData('is_published', false); (e.currentTarget.closest('form') as HTMLFormElement | null)?.requestSubmit(); }}>
                        <Save className="h-4 w-4" /> {isArabic ? 'حفظ كمسودة' : 'Save as draft'}
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled>
                        <Eye className="h-4 w-4" /> {isArabic ? 'معاينة' : 'Preview'}
                    </Button>
                    <Button type="submit" form="page-form" size="sm" disabled={processing} onClick={() => setData('is_published', true)}>
                        <Send className="h-4 w-4" /> {isArabic ? 'نشر الصفحة' : 'Publish'}
                    </Button>
                </div>
            </div>

            <form id="page-form" onSubmit={onSubmit} className="space-y-4">
                {/* Basic info */}
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base">{isArabic ? 'المعلومات الأساسية' : 'Basic info'}</CardTitle></CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                        <Field label={isArabic ? 'العنوان (عربي)' : 'Title (AR)'} error={errors.title_ar}>
                            <Input value={data.title_ar} onChange={(e) => setData('title_ar', e.target.value)} required />
                        </Field>
                        <Field label={isArabic ? 'العنوان (إنجليزي)' : 'Title (EN)'} error={errors.title_en}>
                            <Input value={data.title_en} onChange={(e) => setData('title_en', e.target.value)} required />
                        </Field>
                        <Field label="Slug" error={errors.slug}>
                            <Input value={data.slug} onChange={(e) => setData('slug', e.target.value)} required placeholder="my-page" />
                        </Field>
                        <Field label={isArabic ? 'اسم رابط الصفحة (عربي)' : 'URL label (AR)'} error={errors.url_label_ar}>
                            <Input value={data.url_label_ar} onChange={(e) => setData('url_label_ar', e.target.value)} placeholder={isArabic ? 'ما يظهر في الروابط' : 'Shown in links'} />
                        </Field>
                        <Field label={isArabic ? 'اسم رابط الصفحة (إنجليزي)' : 'URL label (EN)'} error={errors.url_label_en}>
                            <Input value={data.url_label_en} onChange={(e) => setData('url_label_en', e.target.value)} />
                        </Field>
                        <Field label={isArabic ? 'ترتيب' : 'Sort order'} error={errors.sort_order}>
                            <Input type="number" min={0} value={data.sort_order} onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)} />
                        </Field>
                        <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox checked={data.is_published} onCheckedChange={(v) => setData('is_published', v === true)} />
                                <span>{isArabic ? 'منشور' : 'Published'}</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox checked={data.show_header} onCheckedChange={(v) => setData('show_header', v === true)} />
                                <span>{isArabic ? 'عرض الهيدر' : 'Show header'}</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox checked={data.show_footer} onCheckedChange={(v) => setData('show_footer', v === true)} />
                                <span>{isArabic ? 'عرض الفوتر' : 'Show footer'}</span>
                            </label>
                        </div>
                    </CardContent>
                </Card>

                {/* Custom header */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{isArabic ? 'هيدر مخصص للصفحة' : 'Custom page header'}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isArabic
                                ? 'عند التفعيل سيستخدم هذا الهيدر بدل الهيدر العام (يجب تفعيل "عرض الهيدر" أعلاه).'
                                : 'When enabled, this header replaces the global one (requires "Show header" above).'}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox checked={customHeaderEnabled} onCheckedChange={(v) => toggleCustomHeader(v === true)} />
                            <span>{isArabic ? 'استخدام هيدر مخصص' : 'Use custom header'}</span>
                        </label>

                        {customHeaderEnabled && data.header_config && (
                            <>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <Field label={isArabic ? 'رابط الشعار' : 'Logo URL'}>
                                        <Input
                                            value={data.header_config.logo_url}
                                            onChange={(e) => updateHeaderField('logo_url', e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </Field>
                                    <Field label={isArabic ? 'لون الخلفية' : 'Background color'}>
                                        <Input
                                            type="text"
                                            value={data.header_config.background_color}
                                            onChange={(e) => updateHeaderField('background_color', e.target.value)}
                                            placeholder="#ffffff"
                                        />
                                    </Field>
                                    <Field label={isArabic ? 'لون النص' : 'Text color'}>
                                        <Input
                                            type="text"
                                            value={data.header_config.text_color}
                                            onChange={(e) => updateHeaderField('text_color', e.target.value)}
                                            placeholder="#111827"
                                        />
                                    </Field>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm">{isArabic ? 'الروابط' : 'Links'}</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addHeaderLink}>
                                            <Plus className="h-4 w-4" /> {isArabic ? 'إضافة رابط' : 'Add link'}
                                        </Button>
                                    </div>
                                    {data.header_config.links.length === 0 && (
                                        <p className="text-sm text-muted-foreground">{isArabic ? 'لا توجد روابط بعد' : 'No links yet'}</p>
                                    )}
                                    <div className="space-y-2">
                                        {data.header_config.links.map((link, i) => (
                                            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1.5fr_auto] items-start rounded border p-2">
                                                <Input
                                                    value={link.label_ar}
                                                    onChange={(e) => updateHeaderLink(i, { label_ar: e.target.value })}
                                                    placeholder={isArabic ? 'النص (عربي)' : 'Label (AR)'}
                                                    dir="rtl"
                                                />
                                                <Input
                                                    value={link.label_en}
                                                    onChange={(e) => updateHeaderLink(i, { label_en: e.target.value })}
                                                    placeholder={isArabic ? 'النص (إنجليزي)' : 'Label (EN)'}
                                                />
                                                <Input
                                                    value={link.url}
                                                    onChange={(e) => updateHeaderLink(i, { url: e.target.value })}
                                                    placeholder="/about"
                                                />
                                                <div className="flex gap-1 justify-end">
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveHeaderLink(i, -1)} disabled={i === 0} title={isArabic ? 'أعلى' : 'Move up'}>
                                                        <ArrowUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveHeaderLink(i, 1)} disabled={i === data.header_config!.links.length - 1} title={isArabic ? 'أسفل' : 'Move down'}>
                                                        <ArrowDown className="h-4 w-4" />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeHeaderLink(i)} title={isArabic ? 'حذف' : 'Remove'}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Form fields (Google-form style) */}
                <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base">{isArabic ? 'حقول النموذج' : 'Form fields'}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                {isArabic ? 'أضف حقولاً لجمع معلومات من زوار الصفحة (مثل Google Forms).' : 'Add fields to collect info from visitors (Google Forms style).'}
                            </p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addFormField}>
                            <Plus className="h-4 w-4" /> {isArabic ? 'إضافة حقل' : 'Add field'}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data.form_fields.length === 0 && (
                            <p className="text-sm text-muted-foreground">{isArabic ? 'لا توجد حقول. اضغط "إضافة حقل" للبدء.' : 'No fields yet. Click "Add field" to start.'}</p>
                        )}
                        {data.form_fields.map((field, i) => (
                            <div key={i} className="rounded border p-3 space-y-2 bg-muted/20">
                                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_auto] items-start">
                                    <Input
                                        value={field.label_ar}
                                        onChange={(e) => updateFormField(i, { label_ar: e.target.value })}
                                        placeholder={isArabic ? 'التسمية (عربي)' : 'Label (AR)'}
                                        dir="rtl"
                                    />
                                    <Input
                                        value={field.label_en}
                                        onChange={(e) => updateFormField(i, { label_en: e.target.value })}
                                        placeholder={isArabic ? 'التسمية (إنجليزي)' : 'Label (EN)'}
                                    />
                                    <select
                                        className="h-9 rounded-md border bg-background px-2 text-sm"
                                        value={field.type}
                                        onChange={(e) => updateFormField(i, { type: e.target.value as FormFieldType })}>
                                        <option value="text">Text</option>
                                        <option value="email">Email</option>
                                        <option value="tel">Phone</option>
                                        <option value="number">Number</option>
                                        <option value="textarea">Textarea</option>
                                        <option value="select">Select</option>
                                        <option value="radio">Radio</option>
                                        <option value="checkbox">Checkbox</option>
                                        <option value="file">File</option>
                                    </select>
                                    <div className="flex gap-1 justify-end">
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveFormField(i, -1)} disabled={i === 0}>
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveFormField(i, 1)} disabled={i === data.form_fields.length - 1}>
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeFormField(i)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_140px] items-center">
                                    <Input
                                        value={field.key}
                                        onChange={(e) => updateFormField(i, { key: e.target.value.replace(/[^a-z0-9_]/gi, '_').toLowerCase() })}
                                        placeholder="key"
                                        className="font-mono text-xs h-8"
                                    />
                                    <Input
                                        value={field.placeholder_en ?? ''}
                                        onChange={(e) => updateFormField(i, { placeholder_en: e.target.value })}
                                        placeholder={isArabic ? 'نص توضيحي (إنجليزي)' : 'Placeholder (EN)'}
                                        className="h-8 text-xs"
                                    />
                                    <label className="flex items-center gap-2 text-xs">
                                        <Checkbox checked={field.required} onCheckedChange={(v) => updateFormField(i, { required: v === true })} />
                                        {isArabic ? 'إلزامي' : 'Required'}
                                    </label>
                                </div>

                                {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                                    <div className="space-y-1">
                                        <Label className="text-xs">{isArabic ? 'الخيارات (سطر لكل خيار)' : 'Options (one per line)'}</Label>
                                        <Textarea
                                            rows={3}
                                            className="text-xs font-mono"
                                            value={(field.options ?? []).join('\n')}
                                            onChange={(e) => updateFormField(i, { options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}

                        {data.form_fields.length > 0 && (
                            <div className="grid gap-2 sm:grid-cols-2 pt-2 border-t">
                                <div className="space-y-1">
                                    <Label className="text-xs">{isArabic ? 'نص الزر (عربي)' : 'Submit label (AR)'}</Label>
                                    <Input value={data.form_submit_label_ar} onChange={(e) => setData('form_submit_label_ar', e.target.value)} placeholder={isArabic ? 'إرسال' : 'Submit (AR)'} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">{isArabic ? 'نص الزر (إنجليزي)' : 'Submit label (EN)'}</Label>
                                    <Input value={data.form_submit_label_en} onChange={(e) => setData('form_submit_label_en', e.target.value)} placeholder="Submit" />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Content + toolbar */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{isArabic ? 'المحتوى' : 'Content'}</CardTitle>
                        <div className="flex flex-wrap gap-1 mt-2 p-2 bg-muted/30 rounded border">
                            <ToolButton onClick={() => insertAtCursor('<strong>text</strong>')} icon={Bold} title={isArabic ? 'غامق' : 'Bold'} />
                            <ToolButton onClick={() => insertAtCursor('<em>text</em>')} icon={Italic} title={isArabic ? 'مائل' : 'Italic'} />
                            <ToolButton onClick={() => insertAtCursor('<u>text</u>')} icon={Underline} title={isArabic ? 'تسطير' : 'Underline'} />
                            <div className="mx-1 border-s h-6" />
                            <ToolButton onClick={() => insertAtCursor('<h2>Heading</h2>')} icon={Type} title={isArabic ? 'عنوان' : 'Heading'} />
                            <ToolButton onClick={() => insertAtCursor('<a href="https://">link</a>')} icon={LinkIcon} title={isArabic ? 'رابط' : 'Link'} />
                            <ToolButton
                                onClick={() => {
                                    const url = prompt(isArabic ? 'رابط الصورة' : 'Image URL');
                                    if (url) insertAtCursor(`<img src="${url}" alt="" style="max-width:100%" />`);
                                }}
                                icon={ImageIcon}
                                title={isArabic ? 'صورة' : 'Image'}
                            />
                            <ToolButton
                                onClick={() => insertAtCursor(
                                    '<table border="1" cellpadding="6" cellspacing="0"><tr><th>Col 1</th><th>Col 2</th></tr><tr><td>Cell</td><td>Cell</td></tr></table>'
                                )}
                                icon={Table}
                                title={isArabic ? 'جدول' : 'Table'}
                            />
                            <div className="ms-auto flex gap-1">
                                <Button type="button" size="sm" variant={activeContent === 'ar' ? 'default' : 'outline'} onClick={() => setActiveContent('ar')}>AR</Button>
                                <Button type="button" size="sm" variant={activeContent === 'en' ? 'default' : 'outline'} onClick={() => setActiveContent('en')}>EN</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {activeContent === 'ar' ? (
                            <Textarea
                                value={data.content_ar}
                                onChange={(e) => setData('content_ar', e.target.value)}
                                rows={12}
                                className="font-mono text-xs"
                                placeholder={isArabic ? 'HTML أو نص بسيط...' : 'HTML or plain text...'}
                                dir="rtl"
                            />
                        ) : (
                            <Textarea
                                value={data.content_en}
                                onChange={(e) => setData('content_en', e.target.value)}
                                rows={12}
                                className="font-mono text-xs"
                                placeholder="HTML or plain text..."
                                dir="ltr"
                            />
                        )}
                        {/* Live preview */}
                        <div className="mt-3 rounded border bg-muted/20 p-3">
                            <div className="text-xs text-muted-foreground mb-2">{isArabic ? 'معاينة' : 'Preview'}</div>
                            <div
                                className="prose prose-sm max-w-none"
                                dir={activeContent === 'ar' ? 'rtl' : 'ltr'}
                                dangerouslySetInnerHTML={{ __html: activeContent === 'ar' ? data.content_ar : data.content_en }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Attachments */}
                <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">{isArabic ? 'الوسائط والمرفقات' : 'Media & attachments'}</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addAttachment}>
                            <Plus className="h-4 w-4" /> {isArabic ? 'إضافة مرفق' : 'Add attachment'}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {data.attachments.length === 0 && <p className="text-sm text-muted-foreground">{isArabic ? 'لا توجد مرفقات' : 'No attachments'}</p>}
                        <div className="space-y-2">
                            {data.attachments.map((att, i) => (
                                <div key={i} className="flex items-center gap-2 rounded border p-2 text-sm">
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-primary hover:underline truncate">
                                        {att.name}
                                    </a>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeAttachment(i)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* SEO */}
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base">SEO & Meta</CardTitle></CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                        <Field label="Meta title (AR)"><Input value={data.meta_title_ar} onChange={(e) => setData('meta_title_ar', e.target.value)} /></Field>
                        <Field label="Meta title (EN)"><Input value={data.meta_title_en} onChange={(e) => setData('meta_title_en', e.target.value)} /></Field>
                        <Field label="Meta description (AR)"><Textarea rows={2} value={data.meta_description_ar} onChange={(e) => setData('meta_description_ar', e.target.value)} /></Field>
                        <Field label="Meta description (EN)"><Textarea rows={2} value={data.meta_description_en} onChange={(e) => setData('meta_description_en', e.target.value)} /></Field>
                        <Field label="Keywords (comma-separated)"><Input value={data.meta_keywords} onChange={(e) => setData('meta_keywords', e.target.value)} placeholder="hotel, luxury, riyadh" /></Field>
                        <Field label="OG image URL"><Input value={data.og_image} onChange={(e) => setData('og_image', e.target.value)} placeholder="https://..." /></Field>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" asChild><Link href={cancelHref}>{isArabic ? 'إلغاء' : 'Cancel'}</Link></Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? '...' : (isArabic ? 'حفظ' : 'Save')}
                    </Button>
                </div>
            </form>
        </div>
    );
}

function ToolButton({ onClick, icon: Icon, title }: { onClick: () => void; icon: React.ComponentType<{ className?: string }>; title: string }) {
    return (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClick} title={title}>
            <Icon className="h-4 w-4" />
        </Button>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
