import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, useForm } from '@inertiajs/react';
import {
    CreditCard,
    MessageSquare,
    Shield,
    Eye,
    EyeOff,
    CheckCircle2,
    XCircle,
    Loader2,
    PlugZap,
    ExternalLink,
    AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useT } from '@/hooks/use-translations';
import { useState } from 'react';

interface ProviderField {
    key: string;
    label: string;
    placeholder: string;
    secret: boolean;
    required: boolean;
    /** True when a value is already stored (secrets are never sent in clear). */
    filled: boolean;
    /** Current value for non-secret fields; null for secrets. */
    value: string | null;
    /** Masked preview for secrets, e.g. "sk_test_••••f456". */
    masked: string | null;
}

interface Provider {
    provider: string;
    type: 'payment' | 'sms';
    label: string;
    label_ar: string;
    docs_url: string;
    is_active: boolean;
    configured: boolean;
    /** Derived from the stored key ("_test" prefix); null when no key yet. */
    test_mode: boolean | null;
    updated_at: string | null;
    fields: ProviderField[];
}

interface Props {
    providers: Provider[];
    activePaymentProvider: string | null;
}

interface TestResult {
    success: boolean;
    message: string;
}

function ProviderCard({ provider, activePaymentProvider }: { provider: Provider; activePaymentProvider: string | null }) {
    const [showSecrets, setShowSecrets] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<TestResult | null>(null);

    // Secrets start empty: leaving them untouched keeps the stored value.
    const form = useForm<{ credentials: Record<string, string>; is_active: boolean }>({
        credentials: Object.fromEntries(provider.fields.map((f) => [f.key, f.secret ? '' : (f.value ?? '')])),
        is_active: provider.is_active,
    });

    const willReplaceActive =
        provider.type === 'payment' &&
        form.data.is_active &&
        !provider.is_active &&
        !!activePaymentProvider &&
        activePaymentProvider !== provider.provider;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setTestResult(null);
        form.put(`/super-admin/integrations/${provider.provider}`, { preserveScroll: true });
    }

    /**
     * Probes the *saved* credentials, so unsaved edits are not covered — the
     * button label says so.
     */
    async function testConnection() {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch(`/super-admin/integrations/${provider.provider}/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
                },
            });
            const body = await res.json();
            setTestResult({ success: !!body.success, message: body.message ?? 'Unexpected response' });
        } catch {
            setTestResult({ success: false, message: 'تعذر تنفيذ الاختبار / Could not run the test' });
        } finally {
            setTesting(false);
        }
    }

    const Icon = provider.type === 'payment' ? CreditCard : MessageSquare;
    const credentialError = (form.errors as Record<string, string>).credentials;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">
                                {provider.label_ar} / {provider.label}
                            </CardTitle>
                            <a
                                href={provider.docs_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                                التوثيق / Docs <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        {provider.is_active ? (
                            <Badge className="rounded-full bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-400">
                                <CheckCircle2 className="h-3 w-3 me-1" />
                                مُفعّل / Active
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="rounded-full">
                                معطّل / Inactive
                            </Badge>
                        )}
                        <Badge
                            variant={provider.configured ? 'default' : 'destructive'}
                            className="rounded-full"
                        >
                            {provider.configured ? 'مُهيأ / Configured' : 'غير مُهيأ / Not Configured'}
                        </Badge>
                        {provider.test_mode !== null && (
                            <Badge
                                variant="secondary"
                                className={`rounded-full ${
                                    provider.test_mode
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                                }`}
                            >
                                {provider.test_mode ? 'اختبار / Test keys' : 'إنتاج / Live keys'}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>

            <form onSubmit={submit}>
                <CardContent className="space-y-4 pt-0">
                    {provider.fields.map((field) => (
                        <div key={field.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor={`${provider.provider}-${field.key}`} className="text-sm font-medium">
                                    {field.label}
                                    {field.required && <span className="text-destructive"> *</span>}
                                </Label>
                                {field.secret && field.filled && (
                                    <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                                        {field.masked}
                                    </span>
                                )}
                            </div>
                            <Input
                                id={`${provider.provider}-${field.key}`}
                                type={field.secret && !showSecrets ? 'password' : 'text'}
                                dir="ltr"
                                placeholder={field.secret && field.filled ? 'اتركه فارغاً للإبقاء على القيمة الحالية' : field.placeholder}
                                value={form.data.credentials[field.key] ?? ''}
                                onChange={(e) =>
                                    form.setData('credentials', {
                                        ...form.data.credentials,
                                        [field.key]: e.target.value,
                                    })
                                }
                            />
                        </div>
                    ))}

                    {provider.fields.some((f) => f.secret) && (
                        <button
                            type="button"
                            onClick={() => setShowSecrets(!showSecrets)}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {showSecrets ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {showSecrets ? 'إخفاء / Hide' : 'إظهار / Show'}
                        </button>
                    )}

                    {credentialError && (
                        <p className="text-sm text-destructive">{credentialError}</p>
                    )}

                    {/* Activation toggle */}
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium">تفعيل / Enable</p>
                            <p className="text-xs text-muted-foreground">
                                {provider.type === 'payment'
                                    ? 'بوابة واحدة فقط تكون مُفعّلة / Only one gateway can be active'
                                    : 'استخدام هذا المزود لإرسال الرسائل / Use this provider for SMS'}
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={form.data.is_active}
                            onClick={() => form.setData('is_active', !form.data.is_active)}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                                form.data.is_active ? 'bg-primary' : 'bg-input'
                            }`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${
                                    form.data.is_active ? 'translate-x-[22px]' : 'translate-x-[2px]'
                                }`}
                            />
                        </button>
                    </div>

                    {willReplaceActive && (
                        <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            سيتم تعطيل {activePaymentProvider} عند الحفظ / Saving will deactivate {activePaymentProvider}
                        </p>
                    )}

                    {testResult && (
                        <p
                            className={`flex items-start gap-1.5 text-xs ${
                                testResult.success ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                            }`}
                        >
                            {testResult.success ? (
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            ) : (
                                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            )}
                            {testResult.message}
                        </p>
                    )}
                </CardContent>

                <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-3">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                            مشفر / Encrypted
                            {provider.updated_at && ` — ${provider.updated_at}`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {provider.type === 'payment' && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={testConnection}
                                disabled={testing || !provider.configured}
                                title="يختبر البيانات المحفوظة / Tests the saved credentials"
                            >
                                {testing ? <Loader2 className="h-3.5 w-3.5 me-1 animate-spin" /> : <PlugZap className="h-3.5 w-3.5 me-1" />}
                                اختبار الاتصال / Test
                            </Button>
                        )}
                        <Button type="submit" size="sm" disabled={form.processing}>
                            {form.processing ? 'جاري الحفظ...' : 'حفظ / Save'}
                        </Button>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function IntegrationsIndex({ providers, activePaymentProvider }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'التكاملات / Integrations', href: '/super-admin/integrations' },
    ];

    const paymentProviders = providers.filter((p) => p.type === 'payment');
    const smsProviders = providers.filter((p) => p.type === 'sms');

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
                    <p className="mt-1 text-sm text-muted-foreground">
                        إدارة بوابات الدفع وخدمات الرسائل / Manage payment gateways and SMS providers
                    </p>
                </div>

                {/* Payment Providers */}
                <div>
                    <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                        <CreditCard className="h-5 w-5" />
                        بوابات الدفع / Payment Providers
                    </h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                        {activePaymentProvider ? (
                            <>
                                البوابة المُفعّلة حالياً: <span className="font-semibold">{activePaymentProvider}</span> — كل عمليات
                                الدفع والتجديد تمر عبرها. / Active gateway: all checkouts and renewals go through it.
                            </>
                        ) : (
                            <>
                                لا توجد بوابة مُفعّلة — يعتمد الدفع على مفاتيح <code className="font-mono">.env</code> إن وُجدت. /
                                No active gateway — checkout falls back to the <code className="font-mono">.env</code> keys.
                            </>
                        )}
                    </p>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {paymentProviders.map((provider) => (
                            <ProviderCard
                                key={provider.provider}
                                provider={provider}
                                activePaymentProvider={activePaymentProvider}
                            />
                        ))}
                    </div>
                </div>

                {/* SMS Providers */}
                <div>
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <MessageSquare className="h-5 w-5" />
                        خدمات الرسائل / SMS Providers
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {smsProviders.map((provider) => (
                            <ProviderCard
                                key={provider.provider}
                                provider={provider}
                                activePaymentProvider={activePaymentProvider}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
