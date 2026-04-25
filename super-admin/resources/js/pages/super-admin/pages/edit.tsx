import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { useT } from '@/hooks/use-translations';
import PageForm, { PageFormData } from './form';

interface PageData {
    id: number;
    slug: string;
    url_label_ar: string | null;
    url_label_en: string | null;
    title_ar: string;
    title_en: string;
    content_ar: string | null;
    content_en: string | null;
    meta_title_ar: string | null;
    meta_title_en: string | null;
    meta_description_ar: string | null;
    meta_description_en: string | null;
    meta_keywords: string | null;
    og_image: string | null;
    attachments: Array<{ url: string; name: string; size?: string }> | null;
    is_published: boolean;
    sort_order: number;
    layout: string;
    show_header: boolean;
    show_footer: boolean;
}

export default function EditPage({ page }: { page: PageData }) {
    const { t, isArabic } = useT();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'الصفحات' : 'Pages', href: '/super-admin/pages' },
        { title: page.title_ar, href: `/super-admin/pages/${page.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<PageFormData>({
        title_ar: page.title_ar,
        title_en: page.title_en,
        slug: page.slug,
        url_label_ar: page.url_label_ar ?? '',
        url_label_en: page.url_label_en ?? '',
        content_ar: page.content_ar ?? '',
        content_en: page.content_en ?? '',
        meta_title_ar: page.meta_title_ar ?? '',
        meta_title_en: page.meta_title_en ?? '',
        meta_description_ar: page.meta_description_ar ?? '',
        meta_description_en: page.meta_description_en ?? '',
        meta_keywords: page.meta_keywords ?? '',
        og_image: page.og_image ?? '',
        attachments: page.attachments ?? [],
        is_published: page.is_published,
        sort_order: page.sort_order,
        layout: page.layout,
        show_header: page.show_header,
        show_footer: page.show_footer,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/super-admin/pages/${page.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={page.title_ar} />
            <PageForm
                data={data}
                setData={setData as <K extends keyof PageFormData>(k: K, v: PageFormData[K]) => void}
                errors={errors as Partial<Record<keyof PageFormData, string>>}
                processing={processing}
                onSubmit={submit}
                title={isArabic ? 'تعديل الصفحة' : 'Edit page'}
                isArabic={isArabic}
                cancelHref="/super-admin/pages"
            />
        </AppLayout>
    );
}
