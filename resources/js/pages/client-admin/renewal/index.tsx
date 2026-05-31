import AppLayout from '@/layouts/app-layout';
import RenewalSection, { type RenewalProps } from '@/components/account/renewal-section';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

export default function RenewalIndex(props: RenewalProps) {
    const { t } = useT();
    const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard', 'Dashboard'), href: '/client-admin' },
        { title: isArabic ? 'تجديد الاشتراك' : 'Renewal', href: '/client-admin/renewal' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'تجديد الاشتراك' : 'Renewal'} />
            <div className="p-6">
                <h1 className="mb-6 text-2xl font-bold">{isArabic ? 'تجديد الاشتراك' : 'Subscription Renewal'}</h1>
                <RenewalSection {...props} />
            </div>
        </AppLayout>
    );
}
