import AppLayout from '@/layouts/app-layout';
import InvoicesSection, { type PaginatedInvoices } from '@/components/account/invoices-section';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

export default function ClientInvoicesIndex({ invoices }: { invoices: PaginatedInvoices }) {
    const { t } = useT();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard', 'Dashboard'), href: '/client-admin' },
        { title: t('invoices', 'Invoices'), href: '/client-admin/invoices' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('invoices', 'Invoices')} />
            <div className="p-6">
                <h1 className="mb-6 text-2xl font-bold">{t('invoices', 'Invoices')}</h1>
                <InvoicesSection invoices={invoices} />
            </div>
        </AppLayout>
    );
}
