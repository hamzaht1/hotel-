import PublicLayout from '@/layouts/public-layout';
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

    return (
        <PublicLayout showHeader={page.show_header} showFooter={page.show_footer}>
            <Head title={title}>
                {metaDescription && <meta name="description" content={metaDescription} />}
            </Head>
            <section className="py-10 px-2">
                <div className="mx-auto max-w-5xl px-4 sm:px-6">
                    <h1 className="text-center text-3xl font-bold text-public-primary sm:text-4xl">
                        {title}
                    </h1>
                    <div
                        className="prose prose-lg mx-auto mt-8 max-w-none text-slate-700 dark:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
            </section>
        </PublicLayout>
    );
}
