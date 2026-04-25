import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, X, Eye, EyeOff, ArrowUp, ArrowDown, Indent } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface PageOption { id: number; title_ar: string; title_en: string; slug: string }

interface MenuItem {
    label_ar: string;
    label_en: string;
    type: 'page' | 'section' | 'external';
    page_id: number | null;
    section_anchor: string | null;
    url: string;
    is_visible: boolean;
    parent_index: number | null;
}

interface Props {
    headerMenu: MenuItem[];
    footerMenu: MenuItem[];
    pages: PageOption[];
}

const emptyItem = (): MenuItem => ({
    label_ar: '',
    label_en: '',
    type: 'page',
    page_id: null,
    section_anchor: null,
    url: '',
    is_visible: true,
    parent_index: null,
});

function normalize(items: MenuItem[]): MenuItem[] {
    // Ensure new shape for legacy items
    return (items || []).map((it: any) => ({
        label_ar: it.label_ar ?? '',
        label_en: it.label_en ?? '',
        type: (it.type === 'link' ? 'external' : it.type) ?? 'page',
        page_id: it.page_id ?? null,
        section_anchor: it.section_anchor ?? null,
        url: it.url ?? '',
        is_visible: it.is_visible !== undefined ? it.is_visible : true,
        parent_index: it.parent_index ?? null,
    }));
}

export default function MenusIndex({ headerMenu, footerMenu, pages }: Props) {
    const { t, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'هوية الموقع' : 'Site Branding', href: '/super-admin/site-settings' },
        { title: isArabic ? 'القوائم' : 'Menus', href: '/super-admin/menus' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'القوائم' : 'Menus'} />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                <h1 className="text-2xl font-bold">{isArabic ? 'القوائم' : 'Menus'}</h1>

                <MenuEditor
                    title={isArabic ? 'قائمة الهيدر' : 'Header menu'}
                    location="header"
                    initial={normalize(headerMenu)}
                    pages={pages}
                    isArabic={isArabic}
                />

                <MenuEditor
                    title={isArabic ? 'قائمة الفوتر' : 'Footer menu'}
                    location="footer"
                    initial={normalize(footerMenu)}
                    pages={pages}
                    isArabic={isArabic}
                />
            </div>
        </AppLayout>
    );
}

function MenuEditor({ title, location, initial, pages, isArabic }: {
    title: string;
    location: 'header' | 'footer';
    initial: MenuItem[];
    pages: PageOption[];
    isArabic: boolean;
}) {
    const [items, setItems] = useState<MenuItem[]>(initial);
    const [saving, setSaving] = useState(false);

    function patch(i: number, p: Partial<MenuItem>) {
        const next = [...items];
        next[i] = { ...next[i], ...p };
        setItems(next);
    }

    function add() {
        setItems([...items, emptyItem()]);
    }

    function remove(i: number) {
        // Also unlink any child items
        const next = items.filter((_, idx) => idx !== i).map((it) => ({
            ...it,
            parent_index: it.parent_index === i ? null : it.parent_index !== null && it.parent_index > i ? it.parent_index - 1 : it.parent_index,
        }));
        setItems(next);
    }

    function move(i: number, direction: -1 | 1) {
        const target = i + direction;
        if (target < 0 || target >= items.length) return;
        const next = [...items];
        [next[i], next[target]] = [next[target], next[i]];
        setItems(next);
    }

    function save() {
        setSaving(true);
        router.put(`/super-admin/menus/${location}`, { items }, {
            preserveState: true,
            onFinish: () => setSaving(false),
        });
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{title}</CardTitle>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={add}>
                        <Plus className="h-4 w-4" /> {isArabic ? 'إضافة عنصر' : 'Add item'}
                    </Button>
                    <Button type="button" size="sm" onClick={save} disabled={saving}>
                        {saving ? '...' : (isArabic ? 'حفظ' : 'Save')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">{isArabic ? 'لا توجد عناصر' : 'No items'}</p>
                )}
                {items.map((item, i) => {
                    const isNested = item.parent_index !== null;
                    return (
                        <div
                            key={i}
                            className={`border rounded p-3 space-y-2 ${isNested ? 'ms-8 border-l-4 border-l-primary' : ''} ${!item.is_visible ? 'opacity-60' : ''}`}
                        >
                            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_40px]">
                                <div>
                                    <Label className="text-xs">{isArabic ? 'الاسم (عربي)' : 'Label (AR)'}</Label>
                                    <Input value={item.label_ar} onChange={(e) => patch(i, { label_ar: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="text-xs">{isArabic ? 'الاسم (إنجليزي)' : 'Label (EN)'}</Label>
                                    <Input value={item.label_en} onChange={(e) => patch(i, { label_en: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="text-xs">{isArabic ? 'النوع' : 'Type'}</Label>
                                    <Select value={item.type} onValueChange={(v) => patch(i, { type: v as MenuItem['type'] })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="page">{isArabic ? 'صفحة' : 'Page'}</SelectItem>
                                            <SelectItem value="section">{isArabic ? 'قسم' : 'Section'}</SelectItem>
                                            <SelectItem value="external">{isArabic ? 'رابط خارجي' : 'External'}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col justify-end gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-red-500"
                                        onClick={() => remove(i)}
                                        title={isArabic ? 'حذف' : 'Delete'}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Target config */}
                            {item.type === 'page' && (
                                <div>
                                    <Label className="text-xs">{isArabic ? 'الصفحة' : 'Target page'}</Label>
                                    <Select
                                        value={item.page_id ? String(item.page_id) : ''}
                                        onValueChange={(v) => patch(i, { page_id: parseInt(v) })}
                                    >
                                        <SelectTrigger><SelectValue placeholder={isArabic ? 'اختر صفحة' : 'Select page'} /></SelectTrigger>
                                        <SelectContent>
                                            {pages.map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)}>
                                                    {isArabic ? p.title_ar : p.title_en}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {item.type === 'section' && (
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div>
                                        <Label className="text-xs">{isArabic ? 'الصفحة' : 'Page'}</Label>
                                        <Select
                                            value={item.page_id ? String(item.page_id) : ''}
                                            onValueChange={(v) => patch(i, { page_id: parseInt(v) })}
                                        >
                                            <SelectTrigger><SelectValue placeholder={isArabic ? 'اختر صفحة' : 'Select'} /></SelectTrigger>
                                            <SelectContent>
                                                {pages.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {isArabic ? p.title_ar : p.title_en}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs">{isArabic ? 'المرساة (#section)' : 'Anchor (#section)'}</Label>
                                        <Input
                                            value={item.section_anchor ?? ''}
                                            onChange={(e) => patch(i, { section_anchor: e.target.value })}
                                            placeholder="about, services, contact..."
                                        />
                                    </div>
                                </div>
                            )}
                            {item.type === 'external' && (
                                <div>
                                    <Label className="text-xs">URL</Label>
                                    <Input
                                        value={item.url}
                                        onChange={(e) => patch(i, { url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            )}

                            {/* Parent + visibility + reorder */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                                <label className="flex items-center gap-2 text-xs">
                                    <Checkbox
                                        checked={item.is_visible}
                                        onCheckedChange={(v) => patch(i, { is_visible: v === true })}
                                    />
                                    {item.is_visible ? <Eye className="h-3 w-3 text-emerald-600" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                                    <span>{isArabic ? 'مرئي' : 'Visible'}</span>
                                </label>

                                <div className="flex items-center gap-1">
                                    <Indent className="h-3 w-3 text-muted-foreground" />
                                    <Label className="text-xs">{isArabic ? 'عنصر فرعي من' : 'Child of'}:</Label>
                                    <Select
                                        value={item.parent_index !== null ? String(item.parent_index) : 'none'}
                                        onValueChange={(v) => patch(i, { parent_index: v === 'none' ? null : parseInt(v) })}
                                    >
                                        <SelectTrigger className="h-7 w-[180px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{isArabic ? 'عنصر رئيسي' : 'Top-level'}</SelectItem>
                                            {items.map((p, idx) => {
                                                if (idx === i || p.parent_index !== null) return null;
                                                return (
                                                    <SelectItem key={idx} value={String(idx)}>
                                                        {isArabic ? p.label_ar : p.label_en}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="ms-auto flex items-center gap-0.5">
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0}>
                                        <ArrowUp className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                                        <ArrowDown className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
