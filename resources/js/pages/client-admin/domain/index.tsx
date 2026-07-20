import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Check, Copy, ExternalLink, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useT } from '@/hooks/use-translations';

interface TenantData {
    id: number;
    slug: string;
    subdomain: string | null;
    custom_domain: string | null;
    dns_verification_token: string;
    dns_verified: boolean;
    dns_verified_at: string | null;
    dns_last_checked_at: string | null;
}

interface Registrar {
    name: string;
    url: string;
}

interface Props {
    tenant: TenantData;
    platformHost: string;
    registrars: Registrar[];
}

export default function DomainIndex({ tenant, platformHost, registrars }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard'), href: '/client-admin' },
        { title: 'النطاق / Domain', href: '/client-admin/domain' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        custom_domain: tenant.custom_domain ?? '',
    });

    const [copied, setCopied] = useState<string | null>(null);

    // Mirror the server-side rule so the user gets instant feedback and a
    // clear message before a round-trip. The field is optional, so an empty
    // value is valid (it clears the custom domain).
    const DOMAIN_RE = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
    const trimmedDomain = data.custom_domain.trim();
    const localDomainError = !trimmedDomain
        ? null
        : /^https?:\/\//i.test(trimmedDomain)
            ? 'أدخل النطاق فقط بدون http:// أو https:// — Enter the domain only, without http:// or https://'
            : !DOMAIN_RE.test(trimmedDomain)
                ? 'صيغة النطاق غير صحيحة (مثال: www.yourhotel.com) — Invalid domain format (e.g. www.yourhotel.com)'
                : null;
    const domainError = errors.custom_domain ?? localDomainError;

    function save(e: React.FormEvent) {
        e.preventDefault();
        if (localDomainError) return;
        post('/client-admin/domain', { preserveScroll: true });
    }

    function verify() {
        router.post('/client-admin/domain/verify', {}, { preserveScroll: true });
    }

    function copy(value: string, key: string) {
        navigator.clipboard.writeText(value);
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
    }

    const verificationRecord = `_diyafah-verify.${tenant.custom_domain ?? 'your-domain.com'}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Domain management" />
            <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</div>
                )}

                <h1 className="text-2xl font-bold">إدارة النطاق / Domain management</h1>

                <Card>
                    <CardHeader><CardTitle>Custom domain</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Link your own domain (e.g. www.yourhotel.com) to your Diyafah website.
                        </p>
                        <form onSubmit={save} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="flex-1 space-y-1.5">
                                <Label>Domain</Label>
                                <Input
                                    value={data.custom_domain}
                                    onChange={(e) => setData('custom_domain', e.target.value)}
                                    placeholder="www.yourhotel.com"
                                    className="vuexy-input"
                                    aria-invalid={domainError ? true : undefined}
                                />
                                {domainError && <p className="text-xs text-destructive">{domainError}</p>}
                            </div>
                            <Button type="submit" disabled={processing || !!localDomainError}>Save</Button>
                        </form>

                        {tenant.custom_domain && (
                            <div className="flex items-center gap-2">
                                {tenant.dns_verified ? (
                                    <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>
                                ) : (
                                    <Badge variant="destructive" className="gap-1"><ShieldOff className="h-3 w-3" /> Not verified</Badge>
                                )}
                                {tenant.dns_verified_at && (
                                    <span className="text-xs text-muted-foreground">
                                        verified {new Date(tenant.dns_verified_at).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {tenant.custom_domain && (
                    <Card>
                        <CardHeader><CardTitle>DNS setup instructions</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm">
                                Add the following records at your domain registrar, then click <strong>Verify</strong>.
                            </p>

                            <div className="overflow-x-auto rounded border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2 text-start">Type</th>
                                            <th className="px-3 py-2 text-start">Host / Name</th>
                                            <th className="px-3 py-2 text-start">Value</th>
                                            <th className="px-3 py-2 text-start"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-t">
                                            <td className="px-3 py-2"><Badge variant="outline">CNAME</Badge></td>
                                            <td className="px-3 py-2"><code>@</code> or <code>www</code></td>
                                            <td className="px-3 py-2"><code>{platformHost}</code></td>
                                            <td className="px-3 py-2">
                                                <Button variant="ghost" size="icon" onClick={() => copy(platformHost, 'cname')}>
                                                    {copied === 'cname' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </td>
                                        </tr>
                                        <tr className="border-t">
                                            <td className="px-3 py-2"><Badge variant="outline">TXT</Badge></td>
                                            <td className="px-3 py-2"><code>{verificationRecord}</code></td>
                                            <td className="px-3 py-2"><code className="text-xs">{tenant.dns_verification_token}</code></td>
                                            <td className="px-3 py-2">
                                                <Button variant="ghost" size="icon" onClick={() => copy(tenant.dns_verification_token, 'txt')}>
                                                    {copied === 'txt' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <Button onClick={verify}>
                                <RefreshCw className="h-4 w-4" /> Verify DNS now
                            </Button>
                            {tenant.dns_last_checked_at && (
                                <p className="text-xs text-muted-foreground">
                                    Last checked: {new Date(tenant.dns_last_checked_at).toLocaleString()}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader><CardTitle>Registrars</CardTitle></CardHeader>
                    <CardContent>
                        <p className="mb-3 text-sm text-muted-foreground">
                            Don't have a domain yet? Register one at any of these providers:
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {registrars.map((r) => (
                                <a
                                    key={r.name}
                                    href={r.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between rounded border px-3 py-2 text-sm hover:bg-muted/30"
                                >
                                    <span>{r.name}</span>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                </a>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
