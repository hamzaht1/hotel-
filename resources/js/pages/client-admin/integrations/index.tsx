import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CreditCard, MessageSquare, CheckCircle, XCircle, Power, BarChart3, Save, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useT } from '@/hooks/use-translations';

interface IntegrationSetting {
    id: number;
    provider: string;
    type: string;
    is_active: boolean;
}

interface GoogleAnalyticsData {
    measurement_id: string;
    is_active: boolean;
}

interface Props {
    globalIntegrations: IntegrationSetting[];
    tenantIntegrations: Record<string, IntegrationSetting>;
    googleAnalytics: GoogleAnalyticsData;
}

const PROVIDER_LABELS: Record<string, { en: string; ar: string }> = {
    moyasar: { en: 'Moyasar', ar: 'مويسر' },
    tap: { en: 'Tap', ar: 'تاب' },
    unifonic: { en: 'Unifonic', ar: 'يونيفونك' },
};

export default function IntegrationsIndex({ globalIntegrations, tenantIntegrations, googleAnalytics }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard', 'Dashboard'), href: '/client-admin' },
        { title: 'التكاملات / Integrations', href: '/client-admin/integrations' },
    ];

    function handleToggle(provider: string) {
        router.post(`/client-admin/integrations/${provider}/toggle`, {}, {
            preserveScroll: true,
        });
    }

    const paymentIntegrations = globalIntegrations.filter((i) => i.type === 'payment');
    const smsIntegrations = globalIntegrations.filter((i) => i.type === 'sms');

    function renderCard(integration: IntegrationSetting) {
        const labels = PROVIDER_LABELS[integration.provider] || { en: integration.provider, ar: integration.provider };
        const tenantSetting = tenantIntegrations[integration.provider];
        const isEnabledForTenant = tenantSetting?.is_active || false;
        const isGloballyConfigured = integration.is_active;
        const Icon = integration.type === 'payment' ? CreditCard : MessageSquare;

        return (
            <Card key={integration.provider} className="overflow-hidden">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">{labels.ar} / {labels.en}</CardTitle>
                            </div>
                        </div>
                        <Badge
                            variant="secondary"
                            className={`rounded-full ${integration.type === 'payment' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400'}`}
                        >
                            {integration.type === 'payment' ? 'دفع / Payment' : 'رسائل / SMS'}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                    {/* Global status */}
                    <div className="flex items-center gap-2 text-sm">
                        {isGloballyConfigured ? (
                            <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-green-700 dark:text-green-400">
                                    مُهيأ من المشرف / Configured by admin
                                </span>
                            </>
                        ) : (
                            <>
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-red-600 dark:text-red-400">
                                    غير مُهيأ / Not configured
                                </span>
                            </>
                        )}
                    </div>

                    {/* Tenant status */}
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={isEnabledForTenant ? 'default' : 'secondary'}
                            className="rounded-full"
                        >
                            {isEnabledForTenant ? 'مفعل / Enabled' : 'معطل / Disabled'}
                        </Badge>
                    </div>
                </CardContent>

                <CardFooter className="border-t px-6 py-3 flex items-center justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(integration.provider)}
                        disabled={!isGloballyConfigured}
                        className={
                            isEnabledForTenant
                                ? 'text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950'
                                : 'text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:hover:bg-green-950'
                        }
                    >
                        <Power className="h-3.5 w-3.5 me-1" />
                        {isEnabledForTenant ? 'تعطيل / Disable' : 'تفعيل / Enable'}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

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
                        تفعيل أو تعطيل التكاملات لمنشأتك / Enable or disable integrations for your property
                    </p>
                </div>

                {/* Analytics Providers */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        التحليلات / Analytics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <GoogleAnalyticsCard googleAnalytics={googleAnalytics} />
                    </div>
                </div>

                {globalIntegrations.length === 0 ? (
                    <Card>
                        <CardContent className="flex items-center justify-center py-12">
                            <p className="text-muted-foreground">
                                لا توجد تكاملات دفع/رسائل متاحة بعد / No payment/SMS integrations available yet
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Payment Providers */}
                        {paymentIntegrations.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    بوابات الدفع / Payment Providers
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {paymentIntegrations.map(renderCard)}
                                </div>
                            </div>
                        )}

                        {/* SMS Providers */}
                        {smsIntegrations.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    خدمات الرسائل / SMS Providers
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {smsIntegrations.map(renderCard)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}

// Google Analytics integration card. Wired to the backend: saving a valid
// GA4 measurement id (provider="google_analytics", type="analytics")
// activates tracking automatically; clearing it disables tracking.
function GoogleAnalyticsCard({ googleAnalytics }: { googleAnalytics: GoogleAnalyticsData }) {
    const { data, setData, post, processing } = useForm({
        measurement_id: googleAnalytics.measurement_id ?? '',
    });

    const isActive = googleAnalytics.is_active && !!googleAnalytics.measurement_id;

    function save(e: React.FormEvent) {
        e.preventDefault();
        post('/client-admin/integrations/google-analytics', { preserveScroll: true });
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950">
                            <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">قوقل أناليتكس / Google Analytics</CardTitle>
                        </div>
                    </div>
                    <Badge
                        variant={isActive ? 'default' : 'secondary'}
                        className={`rounded-full ${isActive ? '' : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'}`}
                    >
                        {isActive ? 'مفعل / Active' : 'تحليلات / Analytics'}
                    </Badge>
                </div>
            </CardHeader>

            <form onSubmit={save}>
                <CardContent className="pt-0 space-y-3">
                    <p className="text-sm text-muted-foreground">
                        تتبع زوار موقعك عبر Google Analytics 4.
                        <br />
                        Track your site visitors with Google Analytics 4.
                    </p>
                    <div className="space-y-1.5">
                        <Label htmlFor="ga_measurement_id">معرّف القياس / Measurement ID</Label>
                        <Input
                            id="ga_measurement_id"
                            value={data.measurement_id}
                            onChange={(e) => setData('measurement_id', e.target.value)}
                            placeholder="G-XXXXXXXXXX"
                            dir="ltr"
                            className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            {isActive ? (
                                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <CheckCircle className="h-3.5 w-3.5" /> التتبع مفعّل على موقعك / Tracking is live on your site
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1">
                                    <XCircle className="h-3.5 w-3.5 text-muted-foreground" /> اترك الحقل فارغاً لإيقاف التتبع / Leave empty to disable
                                </span>
                            )}
                        </p>
                        <a
                            href="https://support.google.com/analytics/answer/9539598"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                            أين أجد المعرّف؟ / Where do I find my ID? <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </CardContent>

                <CardFooter className="border-t px-6 py-3 flex items-center justify-end">
                    <Button type="submit" size="sm" disabled={processing}>
                        <Save className="h-3.5 w-3.5 me-1" />
                        {processing ? 'جاري الحفظ… / Saving…' : 'حفظ / Save'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
