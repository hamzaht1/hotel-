import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { useT } from '@/hooks/use-translations';
import PageForm, { emptyForm, PageFormData } from './form';

export default function CreatePage() {
    const { t, isArabic } = useT();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'الصفحات' : 'Pages', href: '/super-admin/pages' },
        { title: isArabic ? 'إضافة صفحة' : 'Add page', href: '/super-admin/pages/create' },
    ];

    const { data, setData, post, processing, errors } = useForm<PageFormData>(emptyForm());

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/super-admin/pages');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'إضافة صفحة' : 'Add page'} />
            <PageForm
                data={data}
                setData={setData as <K extends keyof PageFormData>(k: K, v: PageFormData[K]) => void}
                errors={errors as Partial<Record<keyof PageFormData, string>>}
                processing={processing}
                onSubmit={submit}
                title={isArabic ? 'إضافة صفحة' : 'Add page'}
                isArabic={isArabic}
                cancelHref="/super-admin/pages"
            />
        </AppLayout>
    );
}
