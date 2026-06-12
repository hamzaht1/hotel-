import AppLayout from '@/layouts/app-layout';
import EstablishmentDataSection, { type HotelSettings, type EstablishmentDocument } from '@/components/account/establishment-data-section';
import RenewalSection, { type RenewalProps } from '@/components/account/renewal-section';
import InvoicesSection, { type PaginatedInvoices } from '@/components/account/invoices-section';
import SubscriptionOverviewSection, { type SubscriptionInfo } from '@/components/account/subscription-overview-section';
import DomainSection, { type DomainProps } from '@/components/account/domain-section';
import { useT } from '@/hooks/use-translations';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Building2, RefreshCw, FileText, LayoutDashboard, Globe } from 'lucide-react';
import { useState } from 'react';

interface Props {
    settings: HotelSettings;
    contactEmail: string | null;
    documents: EstablishmentDocument[];
    subscription: SubscriptionInfo;
    domain: DomainProps;
    invoices: PaginatedInvoices;
    tenant: RenewalProps['tenant'];
    renewals: RenewalProps['renewals'];
    canRenew: boolean;
    bankDetails: RenewalProps['bankDetails'];
    moyasarPublishableKey: string | null;
    paymentCallbackUrl: string;
}

type TabKey = 'overview' | 'profile' | 'renewal' | 'domain' | 'invoices';

const TAB_KEYS: TabKey[] = ['overview', 'profile', 'renewal', 'domain', 'invoices'];

/**
 * Unified Establishment Account page gathering five surfaces into one tabbed
 * screen: subscription overview, profile & compliance, renewal & checkout,
 * subdomain/domain, and invoices.
 */
export default function AccountIndex({
    settings,
    contactEmail,
    documents,
    subscription,
    domain,
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

    const initialTab: TabKey = (() => {
        if (typeof window === 'undefined') return 'overview';
        const hash = window.location.hash.replace('#', '') as TabKey;
        return TAB_KEYS.includes(hash) ? hash : 'overview';
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
        { key: 'overview', label: isArabic ? 'نظرة عامة' : 'Overview', icon: LayoutDashboard },
        { key: 'profile', label: isArabic ? 'الملف والامتثال' : 'Profile & Compliance', icon: Building2 },
        { key: 'renewal', label: isArabic ? 'تجديد الاشتراك' : 'Renewal', icon: RefreshCw },
        { key: 'domain', label: isArabic ? 'النطاق' : 'Domain', icon: Globe },
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
                                ? 'إدارة الاشتراك والبيانات والنطاق والفواتير في مكان واحد'
                                : 'Manage your subscription, data, domain and invoices in one place'}
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
                                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition sm:flex-none ${
                                    active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Active tab body */}
                {activeTab === 'overview' && <SubscriptionOverviewSection subscription={subscription} />}
                {activeTab === 'profile' && <EstablishmentDataSection settings={settings} documents={documents} contactEmail={contactEmail} />}
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
                {activeTab === 'domain' && <DomainSection domain={domain} />}
                {activeTab === 'invoices' && <InvoicesSection invoices={invoices} />}
            </div>
        </AppLayout>
    );
}
