import AppLayout from '@/layouts/app-layout';
import EstablishmentDataSection, { type HotelSettings } from '@/components/account/establishment-data-section';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

export default function HotelSettingsEdit({ settings }: { settings: HotelSettings }) {
    const { t } = useT();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('client_admin'), href: '/client-admin' },
        { title: t('hotel_settings'), href: '/client-admin/hotel-settings' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Hotel Settings" />
            <div className="p-6">
                <h1 className="mb-6 text-2xl font-bold">{t('hotel_settings')}</h1>
                <EstablishmentDataSection settings={settings} />
            </div>
        </AppLayout>
    );
}
