import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useT } from '@/hooks/use-translations';
import { useState } from 'react';

interface FieldDefinition {
    key: string;
    type: string;
    label_ar: string;
    label_en: string;
    required: boolean;
    options: string[];
}

interface FormTemplate {
    id: number;
    name_ar: string;
    name_en: string;
    type: string;
    fields: FieldDefinition[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface PaginatedData {
    data: FormTemplate[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    templates: PaginatedData;
}

interface FormData {
    name_ar: string;
    name_en: string;
    type: string;
    fields: FieldDefinition[];
    is_active: boolean;
}

const FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'file', label: 'File' },
];

const TYPE_COLORS: Record<string, string> = {
    subscription: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    contact: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    support: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    custom: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '_')
        .replace(/-+/g, '_')
        .replace(/^_+|_+$/g, '');
}

export default function FormBuilderIndex({ templates }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);

    const [formState, setFormState] = useState<FormData>({
        name_ar: '',
        name_en: '',
        type: 'custom',
        fields: [],
        is_active: true,
    });
    const [optionsInput, setOptionsInput] = useState<Record<number, string>>({});
    const [processing, setProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'النماذج / Form Builder', href: '/super-admin/form-builder' },
    ];

    function resetForm() {
        setFormState({
            name_ar: '',
            name_en: '',
            type: 'custom',
            fields: [],
            is_active: true,
        });
        setOptionsInput({});
        setEditingTemplate(null);
    }

    function openCreateDialog() {
        resetForm();
        setDialogOpen(true);
    }

    function openEditDialog(template: FormTemplate) {
        setEditingTemplate(template);
        setFormState({
            name_ar: template.name_ar,
            name_en: template.name_en,
            type: template.type,
            fields: template.fields || [],
            is_active: template.is_active,
        });
        const opts: Record<number, string> = {};
        (template.fields || []).forEach((f, i) => {
            if (f.options && f.options.length > 0) {
                opts[i] = f.options.join(', ');
            }
        });
        setOptionsInput(opts);
        setDialogOpen(true);
    }

    function addField() {
        setFormState((prev) => ({
            ...prev,
            fields: [
                ...prev.fields,
                {
                    key: '',
                    type: 'text',
                    label_ar: '',
                    label_en: '',
                    required: false,
                    options: [],
                },
            ],
        }));
    }

    function updateField(index: number, updates: Partial<FieldDefinition>) {
        setFormState((prev) => {
            const newFields = [...prev.fields];
            newFields[index] = { ...newFields[index], ...updates };
            // Auto-generate key from label_en
            if (updates.label_en !== undefined) {
                newFields[index].key = slugify(updates.label_en);
            }
            return { ...prev, fields: newFields };
        });
    }

    function removeField(index: number) {
        setFormState((prev) => ({
            ...prev,
            fields: prev.fields.filter((_, i) => i !== index),
        }));
        setOptionsInput((prev) => {
            const next = { ...prev };
            delete next[index];
            // Re-index keys above the removed index
            const reindexed: Record<number, string> = {};
            Object.entries(next).forEach(([k, v]) => {
                const ki = parseInt(k);
                if (ki > index) {
                    reindexed[ki - 1] = v;
                } else {
                    reindexed[ki] = v;
                }
            });
            return reindexed;
        });
    }

    function moveField(index: number, direction: 'up' | 'down') {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        setFormState((prev) => {
            if (newIndex < 0 || newIndex >= prev.fields.length) return prev;
            const newFields = [...prev.fields];
            [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
            return { ...prev, fields: newFields };
        });
        setOptionsInput((prev) => {
            const next = { ...prev };
            const temp = next[index];
            next[index] = next[newIndex];
            next[newIndex] = temp;
            return next;
        });
    }

    function handleOptionsChange(index: number, value: string) {
        setOptionsInput((prev) => ({ ...prev, [index]: value }));
        const options = value
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean);
        updateField(index, { options });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);

        const url = editingTemplate
            ? `/super-admin/form-builder/${editingTemplate.id}`
            : '/super-admin/form-builder';
        const method = editingTemplate ? 'put' : 'post';

        router[method](url, formState, {
            onSuccess: () => {
                setDialogOpen(false);
                resetForm();
                setProcessing(false);
            },
            onError: () => {
                setProcessing(false);
            },
        });
    }

    function handleDelete(template: FormTemplate) {
        if (confirm('هل تريد حذف هذا النموذج؟ / Delete this form template?')) {
            router.delete(`/super-admin/form-builder/${template.id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="النماذج / Form Builder" />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">النماذج / Form Builder</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            إنشاء وإدارة نماذج مخصصة / Create and manage custom form templates
                        </p>
                    </div>
                    <Button onClick={openCreateDialog}>
                        <Plus className="h-4 w-4 me-2" />
                        إنشاء نموذج / Create Form
                    </Button>
                </div>

                {/* Templates Grid */}
                {templates.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex items-center justify-center py-12">
                            <p className="text-muted-foreground">لا توجد نماذج / No form templates found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {templates.data.map((template) => (
                            <Card key={template.id} className="overflow-hidden">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg">{template.name_ar}</CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">{template.name_en}</p>
                                        </div>
                                        <Badge
                                            variant={template.is_active ? 'default' : 'destructive'}
                                            className="rounded-full shrink-0"
                                        >
                                            {template.is_active ? 'مفعل / Active' : 'معطل / Inactive'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-3 pt-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[template.type] || TYPE_COLORS.custom}`}
                                        >
                                            {template.type}
                                        </span>
                                        <Badge variant="secondary" className="rounded-full">
                                            {(template.fields || []).length} {(template.fields || []).length === 1 ? 'حقل / field' : 'حقول / fields'}
                                        </Badge>
                                    </div>
                                    {(template.fields || []).length > 0 && (
                                        <div className="mt-3 space-y-1">
                                            {template.fields.slice(0, 4).map((field, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/30" />
                                                    <span>{field.label_en}</span>
                                                    <span className="text-muted-foreground/50">({field.type})</span>
                                                    {field.required && <span className="text-red-500">*</span>}
                                                </div>
                                            ))}
                                            {template.fields.length > 4 && (
                                                <p className="text-xs text-muted-foreground/50 ps-4">
                                                    +{template.fields.length - 4} more...
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="border-t px-6 py-3 flex items-center justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEditDialog(template)}>
                                        <Pencil className="h-3.5 w-3.5 me-1" />
                                        تعديل / Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950"
                                        onClick={() => handleDelete(template)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 me-1" />
                                        حذف / Delete
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {templates.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {templates.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

                {/* Create / Edit Dialog */}
                <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingTemplate
                                    ? 'تعديل النموذج / Edit Form Template'
                                    : 'إنشاء نموذج جديد / Create Form Template'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingTemplate
                                    ? 'قم بتعديل بيانات النموذج / Update the form template details'
                                    : 'أدخل بيانات النموذج الجديد / Enter the new form template details'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name_ar">الاسم بالعربية / Name (AR)</Label>
                                    <Input
                                        id="name_ar"
                                        value={formState.name_ar}
                                        onChange={(e) => setFormState((p) => ({ ...p, name_ar: e.target.value }))}
                                        placeholder="نموذج الاشتراك"
                                        required
                                        dir="rtl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name_en">الاسم بالإنجليزية / Name (EN)</Label>
                                    <Input
                                        id="name_en"
                                        value={formState.name_en}
                                        onChange={(e) => setFormState((p) => ({ ...p, name_en: e.target.value }))}
                                        placeholder="Subscription Form"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>النوع / Type</Label>
                                    <Select
                                        value={formState.type}
                                        onValueChange={(v) => setFormState((p) => ({ ...p, type: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="subscription">Subscription / اشتراك</SelectItem>
                                            <SelectItem value="contact">Contact / تواصل</SelectItem>
                                            <SelectItem value="support">Support / دعم</SelectItem>
                                            <SelectItem value="custom">Custom / مخصص</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end space-x-2 rtl:space-x-reverse pb-1">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={formState.is_active}
                                            onCheckedChange={(checked) =>
                                                setFormState((p) => ({ ...p, is_active: checked === true }))
                                            }
                                        />
                                        <Label htmlFor="is_active" className="cursor-pointer">
                                            مفعل / Active
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            {/* Fields Builder */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">
                                        الحقول / Fields ({formState.fields.length})
                                    </Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addField}>
                                        <Plus className="h-3.5 w-3.5 me-1" />
                                        إضافة حقل / Add Field
                                    </Button>
                                </div>

                                {formState.fields.length === 0 && (
                                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                        لا توجد حقول بعد. اضغط "إضافة حقل" للبدء.
                                        <br />
                                        No fields yet. Click "Add Field" to start.
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {formState.fields.map((field, index) => (
                                        <div
                                            key={index}
                                            className="rounded-lg border bg-muted/30 p-4 space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    حقل / Field #{index + 1}
                                                    {field.key && (
                                                        <span className="ms-2 font-mono text-xs text-muted-foreground/70">
                                                            ({field.key})
                                                        </span>
                                                    )}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0"
                                                        disabled={index === 0}
                                                        onClick={() => moveField(index, 'up')}
                                                    >
                                                        <ChevronUp className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0"
                                                        disabled={index === formState.fields.length - 1}
                                                        onClick={() => moveField(index, 'down')}
                                                    >
                                                        <ChevronDown className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                                        onClick={() => removeField(index)}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">العنوان بالعربية / Label (AR)</Label>
                                                    <Input
                                                        value={field.label_ar}
                                                        onChange={(e) => updateField(index, { label_ar: e.target.value })}
                                                        placeholder="اسم الشركة"
                                                        dir="rtl"
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">العنوان بالإنجليزية / Label (EN)</Label>
                                                    <Input
                                                        value={field.label_en}
                                                        onChange={(e) => updateField(index, { label_en: e.target.value })}
                                                        placeholder="Company Name"
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">نوع الحقل / Field Type</Label>
                                                    <Select
                                                        value={field.type}
                                                        onValueChange={(v) => updateField(index, { type: v })}
                                                    >
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {FIELD_TYPES.map((ft) => (
                                                                <SelectItem key={ft.value} value={ft.value}>
                                                                    {ft.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex items-end pb-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`required-${index}`}
                                                            checked={field.required}
                                                            onCheckedChange={(checked) =>
                                                                updateField(index, { required: checked === true })
                                                            }
                                                        />
                                                        <Label htmlFor={`required-${index}`} className="text-xs cursor-pointer">
                                                            مطلوب / Required
                                                        </Label>
                                                    </div>
                                                </div>
                                            </div>

                                            {field.type === 'select' && (
                                                <div className="space-y-1">
                                                    <Label className="text-xs">الخيارات / Options (comma-separated)</Label>
                                                    <Input
                                                        value={optionsInput[index] || ''}
                                                        onChange={(e) => handleOptionsChange(index, e.target.value)}
                                                        placeholder="Option 1, Option 2, Option 3"
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setDialogOpen(false); resetForm(); }}
                                >
                                    إلغاء / Cancel
                                </Button>
                                <Button type="submit" disabled={processing || formState.fields.length === 0}>
                                    {processing
                                        ? 'جاري الحفظ... / Saving...'
                                        : editingTemplate
                                            ? 'تحديث / Update'
                                            : 'إنشاء / Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
