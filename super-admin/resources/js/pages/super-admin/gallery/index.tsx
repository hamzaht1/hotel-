import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Building2, PanelBottom, Save, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/hooks/use-translations';
import { useStorageUrl } from '@/lib/storage';
import { ChangeEvent, FormEvent, useState } from 'react';

interface GalleryImage {
    id: number;
    group: string;
    image_path: string;
    title: string | null;
    width: number;
    sort_order: number;
    is_active: boolean;
}

type Group = 'hotels' | 'footer';

interface Props {
    images: Record<Group, GalleryImage[]>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'super_admin', href: '/super-admin' },
    { title: 'معرض الصور / Gallery', href: '/super-admin/gallery' },
];

export default function GalleryIndex() {
    const { images } = usePage().props as unknown as Props;
    const pageProps = usePage().props as { flash?: { success?: string; error?: string } };
    const flash = pageProps.flash;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="معرض الصور / Gallery" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                        {flash.success}
                    </div>
                )}

                <GroupSection
                    group="hotels"
                    title="فنادق موثوقة / Trusted Hotels"
                    hint="الشعارات التي تظهر في قسم « نفخر بثقتهم » على الصفحة الرئيسية."
                    icon={<Building2 className="h-4 w-4" />}
                    items={images.hotels ?? []}
                />

                <GroupSection
                    group="footer"
                    title="شعارات التذييل / Footer Logos"
                    hint="الشعارات التي تظهر في تذييل الصفحة الرئيسية."
                    icon={<PanelBottom className="h-4 w-4" />}
                    items={images.footer ?? []}
                />
            </div>
        </AppLayout>
    );
}

function GroupSection({
    group,
    title,
    hint,
    icon,
    items,
}: {
    group: Group;
    title: string;
    hint: string;
    icon: React.ReactNode;
    items: GalleryImage[];
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    {icon}
                    {title}
                    <Badge variant="secondary">{items.length}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{hint}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <AddForm group={group} />

                {items.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {items.map((img) => (
                            <ImageCard key={img.id} img={img} />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">لا توجد صور بعد.</p>
                )}
            </CardContent>
        </Card>
    );
}

function AddForm({ group }: { group: Group }) {
    const { data, setData, post, processing, reset, errors } = useForm<{
        group: Group;
        image: File | null;
        title: string;
        width: number;
    }>({
        group,
        image: null,
        title: '',
        width: 128,
    });

    const onFile = (e: ChangeEvent<HTMLInputElement>) => setData('image', e.target.files?.[0] ?? null);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/super-admin/gallery', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reset('image', 'title'),
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-md border border-dashed p-3">
            <div className="space-y-1">
                <Label className="text-xs">صورة / Image</Label>
                <Input type="file" accept="image/*" onChange={onFile} className="max-w-xs" />
                {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}
            </div>
            <div className="space-y-1">
                <Label className="text-xs">الوصف / Alt</Label>
                <Input value={data.title} onChange={(e) => setData('title', e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs">العرض (px) / Width</Label>
                <Input
                    type="number"
                    min={24}
                    max={1000}
                    value={data.width}
                    onChange={(e) => setData('width', Number(e.target.value))}
                    className="w-24"
                />
            </div>
            <Button type="submit" size="sm" disabled={processing || !data.image}>
                <Upload className="me-1 h-4 w-4" />
                إضافة
            </Button>
        </form>
    );
}

function ImageCard({ img }: { img: GalleryImage }) {
    const { t } = useT();
    const storageUrl = useStorageUrl();
    const [title, setTitle] = useState(img.title ?? '');
    const [width, setWidth] = useState<number>(img.width);
    const [isActive, setIsActive] = useState<boolean>(img.is_active);
    const [saving, setSaving] = useState(false);

    const src = storageUrl(img.image_path) ?? '';

    const save = () => {
        setSaving(true);
        router.post(
            `/super-admin/gallery/${img.id}`,
            { title, width, is_active: isActive },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
            },
        );
    };

    const remove = () => {
        if (!window.confirm('حذف هذه الصورة؟')) return;
        router.delete(`/super-admin/gallery/${img.id}`, { preserveScroll: true });
    };

    return (
        <div className="space-y-3 rounded-lg border p-3">
            {/* Preview at the configured display width */}
            <div className="flex min-h-24 items-center justify-center rounded bg-muted/40 p-2">
                {src ? (
                    <img src={src} alt={title} style={{ width: `${width}px`, maxWidth: '100%' }} className="h-auto object-contain" />
                ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 space-y-1">
                    <Label className="text-xs">الوصف / Alt</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">العرض (px)</Label>
                    <Input type="number" min={24} max={1000} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
                </div>
                <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                        {t('active') || 'مفعّل'}
                    </label>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <Button type="button" size="sm" onClick={save} disabled={saving}>
                    <Save className="me-1 h-4 w-4" />
                    {saving ? '...' : 'حفظ'}
                </Button>
                <Button type="button" size="sm" variant="destructive" onClick={remove}>
                    <Trash2 className="me-1 h-4 w-4" />
                    حذف
                </Button>
            </div>
        </div>
    );
}
