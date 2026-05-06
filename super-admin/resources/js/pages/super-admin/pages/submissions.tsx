import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, Trash2, FileText, Eye } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-translations';

type FieldType = 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file';

interface FormField {
    key: string;
    type: FieldType;
    label_ar: string;
    label_en: string;
}

interface PageInfo {
    id: number;
    slug: string;
    title_ar: string;
    title_en: string;
    form_fields: FormField[] | null;
}

interface Submission {
    id: number;
    data: Record<string, unknown>;
    ip: string | null;
    created_at: string;
}

interface Props {
    page: PageInfo;
    submissions: { data: Submission[]; current_page: number; last_page: number };
}

export default function PageSubmissions({ page, submissions }: Props) {
    const { t, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string } | undefined;
    const [open, setOpen] = useState<Submission | null>(null);

    const fields = page.form_fields ?? [];
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'الصفحات' : 'Pages', href: '/super-admin/pages' },
        { title: isArabic ? page.title_ar : page.title_en, href: `/super-admin/pages/${page.id}/edit` },
        { title: isArabic ? 'الاستجابات' : 'Submissions', href: `/super-admin/pages/${page.id}/submissions` },
    ];

    function destroy(id: number) {
        if (!confirm(isArabic ? 'هل أنت متأكد من الحذف؟' : 'Delete this submission?')) return;
        router.delete(`/super-admin/pages/${page.id}/submissions/${id}`, { preserveScroll: true });
    }

    function previewValue(value: unknown): string {
        if (value == null) return '—';
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'string' && value.startsWith('submissions/')) return value.split('/').pop() ?? value;
        return String(value);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${isArabic ? 'استجابات' : 'Submissions'} — ${isArabic ? page.title_ar : page.title_en}`} />

            <div className="p-4 lg:p-6 space-y-4">
                {flash?.success && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{flash.success}</div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <Button variant="ghost" size="sm" asChild className="-ms-2">
                            <Link href={`/super-admin/pages/${page.id}/edit`}>
                                <ArrowLeft className="h-4 w-4" /> {isArabic ? 'رجوع للصفحة' : 'Back to page'}
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold mt-1">{isArabic ? 'الاستجابات' : 'Submissions'}</h1>
                        <p className="text-sm text-muted-foreground">{isArabic ? page.title_ar : page.title_en}</p>
                    </div>
                    <Button asChild variant="outline">
                        <a href={`/super-admin/pages/${page.id}/submissions/export`}>
                            <Download className="h-4 w-4" /> {isArabic ? 'تصدير CSV' : 'Export CSV'}
                        </a>
                    </Button>
                </div>

                <div className="rounded-lg border bg-card overflow-x-auto">
                    {submissions.data.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            {isArabic ? 'لا توجد استجابات بعد' : 'No submissions yet'}
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2 text-start">#</th>
                                    <th className="px-3 py-2 text-start">{isArabic ? 'التاريخ' : 'Date'}</th>
                                    {fields.slice(0, 4).map((f) => (
                                        <th key={f.key} className="px-3 py-2 text-start">
                                            {(isArabic ? f.label_ar : f.label_en) || f.key}
                                        </th>
                                    ))}
                                    <th className="px-3 py-2 text-end">{isArabic ? 'إجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.data.map((s) => (
                                    <tr key={s.id} className="border-t hover:bg-muted/30">
                                        <td className="px-3 py-2 font-mono text-xs">{s.id}</td>
                                        <td className="px-3 py-2 text-xs whitespace-nowrap">
                                            {new Date(s.created_at).toLocaleString(isArabic ? 'ar' : 'en', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        {fields.slice(0, 4).map((f) => (
                                            <td key={f.key} className="px-3 py-2 max-w-[200px] truncate">
                                                {previewValue(s.data[f.key])}
                                            </td>
                                        ))}
                                        <td className="px-3 py-2">
                                            <div className="flex justify-end gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpen(s)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => destroy(s.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(null)}>
                    <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="font-semibold">{isArabic ? 'تفاصيل الاستجابة' : 'Submission details'} #{open.id}</h2>
                            <Button variant="ghost" size="sm" onClick={() => setOpen(null)}>×</Button>
                        </div>
                        <div className="p-4 space-y-3">
                            <p className="text-xs text-muted-foreground">
                                {new Date(open.created_at).toLocaleString(isArabic ? 'ar' : 'en')}
                                {open.ip && ` · IP: ${open.ip}`}
                            </p>
                            {fields.map((f) => {
                                const value = open.data[f.key];
                                const label = (isArabic ? f.label_ar : f.label_en) || f.key;
                                const isFile = typeof value === 'string' && value.startsWith('submissions/');
                                return (
                                    <div key={f.key} className="grid grid-cols-[120px_1fr] gap-3 text-sm border-b pb-2">
                                        <div className="text-xs text-muted-foreground">{label}</div>
                                        <div className="break-words">
                                            {isFile ? (
                                                <a href={`/storage/${value}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                                    <FileText className="h-3.5 w-3.5" /> {String(value).split('/').pop()}
                                                </a>
                                            ) : Array.isArray(value) ? value.join(', ') : (value ?? '—') as string}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
