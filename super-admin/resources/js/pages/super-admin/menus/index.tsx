import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface PageOption {
    id: number;
    title_ar: string;
    title_en: string;
    slug: string;
}

interface MenuItem {
    label_ar: string;
    label_en: string;
    type: 'page' | 'link';
    page_id: number | null;
    url: string;
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
    url: '',
});

export default function MenusIndex({ headerMenu, footerMenu, pages }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'القوائم / Menus', href: '/super-admin/menus' },
    ];

    const [headerItems, setHeaderItems] = useState<MenuItem[]>(headerMenu || []);
    const [footerItems, setFooterItems] = useState<MenuItem[]>(footerMenu || []);
    const [savingHeader, setSavingHeader] = useState(false);
    const [savingFooter, setSavingFooter] = useState(false);

    function saveMenu(location: 'header' | 'footer', items: MenuItem[], setSaving: (v: boolean) => void) {
        setSaving(true);
        router.put(`/super-admin/menus/${location}`, { items }, {
            preserveState: true,
            onFinish: () => setSaving(false),
        });
    }

    function updateItem<K extends keyof MenuItem>(
        items: MenuItem[],
        setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>,
        index: number,
        key: K,
        value: MenuItem[K],
    ) {
        const updated = [...items];
        updated[index] = { ...updated[index], [key]: value };
        setItems(updated);
    }

    function removeItem(items: MenuItem[], setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>, index: number) {
        setItems(items.filter((_, i) => i !== index));
    }

    function renderMenuSection(
        title: string,
        location: 'header' | 'footer',
        items: MenuItem[],
        setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>,
        saving: boolean,
        setSaving: (v: boolean) => void,
    ) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{title}</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, emptyItem()])}>
                            <Plus className="h-4 w-4" />
                            إضافة عنصر / Add Item
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {items.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                            لا توجد عناصر / No items yet
                        </p>
                    )}
                    <div className="flex flex-col gap-4">
                        {items.map((item, index) => (
                            <div key={index} className="rounded-lg border p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <Badge variant="outline" className="rounded-full">
                                        #{index + 1} - {item.type === 'page' ? 'صفحة / Page' : 'رابط / Link'}
                                    </Badge>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeItem(items, setItems, index)}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>التسمية (عربي) / Label (AR)</Label>
                                        <Input
                                            value={item.label_ar}
                                            onChange={(e) => updateItem(items, setItems, index, 'label_ar', e.target.value)}
                                            className="vuexy-input"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>التسمية (إنجليزي) / Label (EN)</Label>
                                        <Input
                                            value={item.label_en}
                                            onChange={(e) => updateItem(items, setItems, index, 'label_en', e.target.value)}
                                            className="vuexy-input"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>النوع / Type</Label>
                                        <Select
                                            value={item.type}
                                            onValueChange={(value: 'page' | 'link') => {
                                                updateItem(items, setItems, index, 'type', value);
                                                if (value === 'link') {
                                                    updateItem(items, setItems, index, 'page_id', null);
                                                } else {
                                                    updateItem(items, setItems, index, 'url', '');
                                                }
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="page">صفحة / Page</SelectItem>
                                                <SelectItem value="link">رابط خارجي / External Link</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {item.type === 'page' ? (
                                        <div className="space-y-1.5">
                                            <Label>الصفحة / Page</Label>
                                            <Select
                                                value={item.page_id ? String(item.page_id) : ''}
                                                onValueChange={(value) => updateItem(items, setItems, index, 'page_id', parseInt(value))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر صفحة / Select page" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {pages.map((page) => (
                                                        <SelectItem key={page.id} value={String(page.id)}>
                                                            {page.title_ar} / {page.title_en}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <Label>الرابط / URL</Label>
                                            <Input
                                                value={item.url}
                                                onChange={(e) => updateItem(items, setItems, index, 'url', e.target.value)}
                                                placeholder="https://..."
                                                className="vuexy-input"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {items.length > 0 && (
                        <div className="mt-4 flex justify-end">
                            <Button
                                type="button"
                                onClick={() => saveMenu(location, items, setSaving)}
                                disabled={saving}
                            >
                                {saving ? 'جاري الحفظ... / Saving...' : 'حفظ القائمة / Save Menu'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="القوائم / Menus" />
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

                <h1 className="text-2xl font-bold">القوائم / Menus</h1>

                <div className="grid gap-6 lg:grid-cols-2">
                    {renderMenuSection(
                        'قائمة الهيدر / Header Menu',
                        'header',
                        headerItems,
                        setHeaderItems,
                        savingHeader,
                        setSavingHeader,
                    )}
                    {renderMenuSection(
                        'قائمة الفوتر / Footer Menu',
                        'footer',
                        footerItems,
                        setFooterItems,
                        savingFooter,
                        setSavingFooter,
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
