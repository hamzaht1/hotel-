import AppLayout from '@/layouts/app-layout';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { GripVertical, ArrowUp, ArrowDown, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

interface SiteSection {
    id: number;
    section_name: string;
    is_active: boolean;
    sort_order: number;
}

interface Props {
    sections: SiteSection[];
    availableToAdd: string[];
}

export default function SiteSectionsIndex({ sections, availableToAdd }: Props) {
    const { t } = useT();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('client_admin'), href: '/client-admin' },
        { title: t('sections'), href: '/client-admin/site-sections' },
    ];

    const sectionLabels: Record<string, { name: string; desc: string }> = {
        hero: { name: t('hero_banner'), desc: t('hero_desc') },
        rooms: { name: t('rooms_section'), desc: t('rooms_desc') },
        services: { name: t('services'), desc: t('services_desc') },
        gallery: { name: t('gallery_section'), desc: t('gallery_desc') },
        testimonials: { name: t('testimonials'), desc: t('testimonials_desc') },
        partners: { name: t('partners'), desc: t('partners_desc') },
        contact: { name: t('contact_section'), desc: t('contact_desc') },
    };

    const [items, setItems] = useState<SiteSection[]>(sections);
    useEffect(() => { setItems(sections); }, [sections]);

    function handleToggle(id: number) {
        router.post(`/client-admin/site-sections/${id}/toggle`);
    }

    function handleAdd(sectionName: string) {
        router.post('/client-admin/site-sections', { section_name: sectionName });
    }

    function handleDelete(id: number) {
        if (!confirm(t('confirm_delete'))) return;
        router.delete(`/client-admin/site-sections/${id}`);
    }

    function moveUp(index: number) {
        if (index === 0) return;
        const updated = [...items];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        const reordered = updated.map((item, i) => ({ ...item, sort_order: i + 1 }));
        setItems(reordered);
        router.post('/client-admin/site-sections/reorder', {
            items: reordered.map((item) => ({ id: item.id, sort_order: item.sort_order })),
        });
    }

    function moveDown(index: number) {
        if (index === items.length - 1) return;
        const updated = [...items];
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
        const reordered = updated.map((item, i) => ({ ...item, sort_order: i + 1 }));
        setItems(reordered);
        router.post('/client-admin/site-sections/reorder', {
            items: reordered.map((item) => ({ id: item.id, sort_order: item.sort_order })),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Site Sections" />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('website_sections')}</h1>
                    <p className="text-sm text-muted-foreground">{t('sections_desc')}</p>
                </div>

                <div className="vuexy-card divide-y">
                    {items.map((section, index) => {
                        const labels = sectionLabels[section.section_name] || { name: section.section_name, desc: '' };
                        return (
                            <div key={section.id} className="flex items-center gap-4 p-4 hover:bg-muted/30">
                                <div className="flex items-center gap-1">
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    <button
                                        onClick={() => moveUp(index)}
                                        disabled={index === 0}
                                        className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => moveDown(index)}
                                        disabled={index === items.length - 1}
                                        className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{labels.name}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{labels.desc}</p>
                                </div>
                                <button
                                    onClick={() => handleToggle(section.id)}
                                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                                        section.is_active
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                                    }`}
                                >
                                    {section.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    {section.is_active ? t('visible') : t('hidden')}
                                </button>
                                <button
                                    onClick={() => handleDelete(section.id)}
                                    className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                                    title={t('delete')}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {sections.length === 0 && (
                    <div className="vuexy-card p-12 text-center text-muted-foreground">
                        {t('no_sections')}
                    </div>
                )}

                {availableToAdd && availableToAdd.length > 0 && (
                    <div className="vuexy-card p-6">
                        <h2 className="mb-4 text-lg font-semibold">{t('add_section')}</h2>
                        <div className="flex flex-wrap gap-2">
                            {availableToAdd.map((name) => {
                                const label = sectionLabels[name]?.name || name;
                                return (
                                    <button
                                        key={name}
                                        onClick={() => handleAdd(name)}
                                        className="inline-flex items-center gap-2 rounded-full border border-dashed border-primary/40 px-4 py-2 text-sm text-primary hover:bg-primary/5"
                                    >
                                        <Plus className="h-4 w-4" />
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
