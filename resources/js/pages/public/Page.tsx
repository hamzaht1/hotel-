import PublicLayout from '@/layouts/public-layout';
import CustomPageHeader, { HeaderConfig } from '@/components/public/CustomPageHeader';
import PagePublicForm, { PublicFormField } from '@/components/public/PagePublicForm';
import { Head, usePage } from '@inertiajs/react';

interface PageData {
    id: number;
    slug: string;
    title_ar: string;
    title_en: string;
    content_ar: string;
    content_en: string;
    meta_description_ar: string | null;
    meta_description_en: string | null;
    layout: string;
    show_header: boolean;
    show_footer: boolean;
    header_config: HeaderConfig | null;
    form_fields: PublicFormField[] | null;
    form_submit_label_ar: string | null;
    form_submit_label_en: string | null;
}

interface Props {
    page: PageData;
}

export default function Page({ page }: Props) {
    const { locale } = (usePage().props as unknown) as { locale: 'ar' | 'en' };
    const isArabic = locale === 'ar';

    const title = isArabic ? page.title_ar : page.title_en;
    const content = isArabic ? page.content_ar : page.content_en;
    const metaDescription = isArabic ? page.meta_description_ar : page.meta_description_en;

    const useCustomHeader = page.show_header && page.header_config !== null;
    const formFields = page.form_fields ?? [];
    const hasForm = formFields.length > 0;

    return (
        <PublicLayout
            showHeader={page.show_header && !useCustomHeader}
            showFooter={page.show_footer}
        >
            <Head title={title}>
                {metaDescription && <meta name="description" content={metaDescription} />}
            </Head>
            {useCustomHeader && page.header_config && <CustomPageHeader config={page.header_config} />}
            <section className="py-10 px-2">
                <div className="mx-auto max-w-5xl px-4 sm:px-6">
                    <h1 className="text-center text-3xl font-bold text-public-primary sm:text-4xl">
                        {title}
                    </h1>
                    {content && (
                        <div
                            className="prose prose-lg mx-auto mt-8 max-w-none text-slate-700 dark:text-slate-300"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    )}
                </div>
            </section>
            {hasForm && (
                <PagePublicForm
                    slug={page.slug}
                    fields={formFields}
                    submitLabelAr={page.form_submit_label_ar}
                    submitLabelEn={page.form_submit_label_en}
                />
            )}
        </PublicLayout>
    );
}
