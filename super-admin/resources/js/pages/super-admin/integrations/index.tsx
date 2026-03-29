import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, useForm } from '@inertiajs/react';
import { CreditCard, MessageSquare, Shield, Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useT } from '@/hooks/use-translations';
import { useState } from 'react';

interface IntegrationSetting {
    id: number;
    provider: string;
    type: string;
    credentials: string | null;
    is_active: boolean;
    settings: Record<string, any> | null;
}

interface Props {
    integrations: Record<string, IntegrationSetting[]>;
}

const PROVIDERS = [
    { key: 'moyasar', label: 'Moyasar', labelAr: 'مويسر', type: 'payment', icon: CreditCard, fields: ['api_key', 'secret_key'] },
    { key: 'tap', label: 'Tap', labelAr: 'تاب', type: 'payment', icon: CreditCard, fields: ['api_key', 'secret_key'] },
    { key: 'unifonic', label: 'Unifonic', labelAr: 'يونيفونك', type: 'sms', icon: MessageSquare, fields: ['app_sid', 'sender_id'] },
];

function ProviderCard({ provider, existing }: { provider: typeof PROVIDERS[number]; existing: IntegrationSetting | undefined }) {
    const { t } = useT();
    const [showCredentials, setShowCredentials] = useState(false);

    const form = useForm({
        type: provider.type,
        credentials: existing?.credentials || '',
        is_active: existing?.is_active || false,
        settings: existing?.settings || {},
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/super-admin/integrations/${provider.key}`, {
            preserveScroll: true,
        });
    }

    const isConfigured = !!existing?.credentials;
    const Icon = provider.icon;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{provider.labelAr} / {provider.label}</CardTitle>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <Badge
                            variant="secondary"
                            className={`rounded-full ${provider.type === 'payment' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400'}`}
                        >
                            {provider.type === 'payment' ? 'دفع / Payment' : 'رسائل / SMS'}
                        </Badge>
                        <Badge
                            variant={isConfigured ? 'default' : 'destructive'}
                            className="rounded-full"
                        >
                            {isConfigured ? 'مُهيأ / Configured' : 'غير مُهيأ / Not Configured'}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 pt-0">
                    {provider.fields.map((field) => (
                        <div key={field} className="space-y-2">
                            <Label htmlFor={`${provider.key}-${field}`} className="text-sm font-medium">
                                {field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            </Label>
                            <div className="relative">
                                <Input
                                    id={`${provider.key}-${field}`}
                                    type={showCredentials ? 'text' : 'password'}
                                    placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                                    value={(() => {
                                        try {
                                            const parsed = JSON.parse(form.data.credentials || '{}');
                                            return parsed[field] || '';
                                        } catch {
                                            return '';
                                        }
                                    })()}
                                    onChange={(e) => {
                                        let parsed: Record<string, string> = {};
                                        try {
                                            parsed = JSON.parse(form.data.credentials || '{}');
                                        } catch {
                                            parsed = {};
                                        }
                                        parsed[field] = e.target.value;
                                        form.setData('credentials', JSON.stringify(parsed));
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setShowCredentials(!showCredentials)}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showCredentials ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {showCredentials ? 'إخفاء / Hide' : 'إظهار / Show'}
                    </button>
                </CardContent>

                <CardFooter className="border-t px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">مشفر / Encrypted</span>
                    </div>
                    <Button type="submit" size="sm" disabled={form.processing}>
                        {form.processing ? 'جاري الحفظ...' : 'حفظ / Save'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function IntegrationsIndex({ integrations }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'التكاملات / Integrations', href: '/super-admin/integrations' },
    ];

    // Build a flat map of existing settings by provider
    const existingMap: Record<string, IntegrationSetting> = {};
    if (integrations) {
        Object.values(integrations).forEach((group) => {
            if (Array.isArray(group)) {
                group.forEach((item) => {
                    existingMap[item.provider] = item;
                });
            }
        });
    }

    const paymentProviders = PROVIDERS.filter((p) => p.type === 'payment');
    const smsProviders = PROVIDERS.filter((p) => p.type === 'sms');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="التكاملات / Integrations" />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">التكاملات / Integrations</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        إدارة بوابات الدفع وخدمات الرسائل / Manage payment gateways and SMS providers
                    </p>
                </div>

                {/* Payment Providers */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        بوابات الدفع / Payment Providers
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {paymentProviders.map((provider) => (
                            <ProviderCard
                                key={provider.key}
                                provider={provider}
                                existing={existingMap[provider.key]}
                            />
                        ))}
                    </div>
                </div>

                {/* SMS Providers */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        خدمات الرسائل / SMS Providers
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {smsProviders.map((provider) => (
                            <ProviderCard
                                key={provider.key}
                                provider={provider}
                                existing={existingMap[provider.key]}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
