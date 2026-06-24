import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface Field {
    key: string;
    label_ar: string;
    label_en: string;
    type: 'text' | 'textarea' | 'rating' | 'select' | 'checkbox';
    options: string[];
    is_required: boolean;
    sort_order: number;
}

interface ReviewFormModel {
    id?: number;
    title_ar: string;
    title_en: string;
    intro_ar: string | null;
    intro_en: string | null;
    is_active: boolean;
    fields: Field[];
}

interface Props {
    form: ReviewFormModel | null;
}

export default function ReviewFormBuilder({ form }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: '/client-admin' },
        { title: 'Reviews', href: '/client-admin/reviews' },
        { title: 'Form builder', href: '/client-admin/reviews/form' },
    ];

    const { data, setData, post, processing, errors } = useForm<ReviewFormModel>({
        title_ar: form?.title_ar ?? 'نموذج تقييم الإقامة',
        title_en: form?.title_en ?? 'Stay review form',
        intro_ar: form?.intro_ar ?? '',
        intro_en: form?.intro_en ?? '',
        is_active: form?.is_active ?? true,
        fields: form?.fields ?? [
            { key: 'rating', label_ar: 'التقييم', label_en: 'Rating', type: 'rating', options: [], is_required: true, sort_order: 0 },
            { key: 'comment', label_ar: 'تعليقك', label_en: 'Your comment', type: 'textarea', options: [], is_required: false, sort_order: 1 },
        ],
    });

    function addField() {
        setData('fields', [...data.fields, {
            key: `field_${data.fields.length + 1}`,
            label_ar: '',
            label_en: '',
            type: 'text',
            options: [],
            is_required: false,
            sort_order: data.fields.length,
        }]);
    }

    function updateField(i: number, patch: Partial<Field>) {
        const next = data.fields.slice();
        next[i] = { ...next[i], ...patch };
        setData('fields', next);
    }

    function removeField(i: number) {
        setData('fields', data.fields.filter((_, idx) => idx !== i));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/client-admin/reviews/form');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Review form builder" />
            <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                {Object.keys(errors).length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <p className="mb-1 font-medium">Some fields need fixing / بعض الحقول تحتاج إلى تصحيح:</p>
                        <ul className="list-inside list-disc space-y-0.5">
                            {Object.entries(errors).map(([key, msg]) => (
                                <li key={key}>{msg as string}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <h1 className="text-2xl font-bold">Form builder</h1>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader><CardTitle>Form settings</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Title (AR)</Label>
                                <Input value={data.title_ar} onChange={(e) => setData('title_ar', e.target.value)} required />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Title (EN)</Label>
                                <Input value={data.title_en} onChange={(e) => setData('title_en', e.target.value)} required />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label>Intro (AR)</Label>
                                <Textarea value={data.intro_ar ?? ''} onChange={(e) => setData('intro_ar', e.target.value)} rows={2} />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label>Intro (EN)</Label>
                                <Textarea value={data.intro_en ?? ''} onChange={(e) => setData('intro_en', e.target.value)} rows={2} />
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                                <Checkbox checked={data.is_active} onCheckedChange={(v) => setData('is_active', v === true)} id="active" />
                                <Label htmlFor="active">Active</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>Fields</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addField}><Plus className="h-4 w-4" /> Add field</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.fields.map((field, i) => (
                                <div key={i} className="grid gap-3 rounded border p-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>Key</Label>
                                        <Input value={field.key} onChange={(e) => updateField(i, { key: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Type</Label>
                                        <Select value={field.type} onValueChange={(v) => updateField(i, { type: v as Field['type'] })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="textarea">Textarea</SelectItem>
                                                <SelectItem value="rating">Rating (1-5)</SelectItem>
                                                <SelectItem value="select">Select</SelectItem>
                                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Label (AR)</Label>
                                        <Input value={field.label_ar} onChange={(e) => updateField(i, { label_ar: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Label (EN)</Label>
                                        <Input value={field.label_en} onChange={(e) => updateField(i, { label_en: e.target.value })} />
                                    </div>
                                    {field.type === 'select' && (
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <Label>Options (comma-separated)</Label>
                                            <Input
                                                value={(field.options ?? []).join(', ')}
                                                onChange={(e) => updateField(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between sm:col-span-2">
                                        <div className="flex items-center gap-2">
                                            <Checkbox checked={field.is_required} onCheckedChange={(v) => updateField(i, { is_required: v === true })} id={`req-${i}`} />
                                            <Label htmlFor={`req-${i}`}>Required</Label>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeField(i)} className="text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>{processing ? 'Saving…' : 'Save form'}</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
