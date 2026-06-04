import AppLayout from '@/layouts/app-layout';
import EstablishmentDataSection, { type HotelSettings } from '@/components/account/establishment-data-section';
import RenewalSection, { type RenewalProps } from '@/components/account/renewal-section';
import InvoicesSection, { type PaginatedInvoices } from '@/components/account/invoices-section';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Building2, RefreshCw, FileText } from 'lucide-react';
import { useState } from 'react';

interface Props {
    settings: HotelSettings;
    invoices: PaginatedInvoices;
    tenant: RenewalProps['tenant'];
    renewals: RenewalProps['renewals'];
    canRenew: boolean;
    bankDetails: RenewalProps['bankDetails'];
    moyasarPublishableKey: string | null;
    paymentCallbackUrl: string;
}

type TabKey = 'establishment' | 'renewal' | 'invoices';

/**
 * Unified Establishment Account page that gathers the three previously
 * separate screens (Establishment Data / Renewal / Invoices) into one
 * tabbed surface. Each tab body is rendered from the section component
 * that the original page also uses, so no behaviour is duplicated.
 */
export default function AccountIndex({
    settings,
    invoices,
    tenant,
    renewals,
    canRenew,
    bankDetails,
    moyasarPublishableKey,
    paymentCallbackUrl,
}: Props) {
    const { t } = useT();
    const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

    // Read the initial tab from the URL hash so a bookmark like
    // /client-admin/account#renewal lands on the right tab.
    const initialTab: TabKey = (() => {
        if (typeof window === 'undefined') return 'establishment';
        const hash = window.location.hash.replace('#', '') as TabKey;
        return ['establishment', 'renewal', 'invoices'].includes(hash) ? hash : 'establishment';
    })();
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

    function selectTab(tab: TabKey) {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            history.replaceState(null, '', `#${tab}`);
        }
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard', 'Dashboard'), href: '/client-admin' },
        { title: isArabic ? 'حساب المنشأة' : 'Establishment Account', href: '/client-admin/account' },
    ];

    const tabs: { key: TabKey; label: string; icon: typeof Building2 }[] = [
        { key: 'establishment', label: t('hotel_settings'), icon: Building2 },
        { key: 'renewal', label: isArabic ? 'تجديد الاشتراك' : 'Renewal', icon: RefreshCw },
        { key: 'invoices', label: t('invoices', 'Invoices'), icon: FileText },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'حساب المنشأة' : 'Establishment Account'} />
            <div className="flex flex-col gap-6 p-4 sm:p-6">
                {/* Page header */}
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{isArabic ? 'حساب المنشأة' : 'Establishment Account'}</h1>
                        <p className="text-sm text-muted-foreground">
                            {isArabic
                                ? 'إدارة بيانات المنشأة والاشتراك والفواتير في مكان واحد'
                                : 'Manage your establishment data, subscription and invoices in one place'}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="vuexy-card flex flex-wrap items-center gap-1 p-1.5">
                    {tabs.map(({ key, label, icon: Icon }) => {
                        const active = activeTab === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => selectTab(key)}
                                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition sm:flex-none ${
                                    active
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Active tab body */}
                {activeTab === 'establishment' && <EstablishmentDataSection settings={settings} />}
                {activeTab === 'renewal' && (
                    <RenewalSection
                        tenant={tenant}
                        renewals={renewals}
                        canRenew={canRenew}
                        bankDetails={bankDetails}
                        moyasarPublishableKey={moyasarPublishableKey}
                        paymentCallbackUrl={paymentCallbackUrl}
                    />
                )}
                {activeTab === 'invoices' && <InvoicesSection invoices={invoices} />}
            </div>
        </AppLayout>
    );
}
