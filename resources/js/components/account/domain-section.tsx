import { router, useForm, usePage } from '@inertiajs/react';
import { Check, Copy, ExternalLink, RefreshCw, ShieldCheck, ShieldOff, Globe, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OtpGate from '@/components/account/otp-gate';

export interface DomainTenant {
    id: number;
    slug: string;
    subdomain: string | null;
    custom_domain: string | null;
    dns_verification_token: string;
    dns_verified: boolean;
    dns_verified_at: string | null;
    dns_last_checked_at: string | null;
    subdomain_changes_count: number;
    subdomain_last_changed_at: string | null;
    ssl_status: string | null;
}

export interface DomainProps {
    tenant: DomainTenant;
    platformHost: string;
    maxSubdomainChanges: number;
    registrars: { name: string; url: string }[];
}

export default function DomainSection({ domain }: { domain: DomainProps }) {
    const { tenant, platformHost, maxSubdomainChanges, registrars } = domain;
    const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [copied, setCopied] = useState<string | null>(null);
    const [otpOpen, setOtpOpen] = useState(false);

    const customForm = useForm({ custom_domain: tenant.custom_domain ?? '' });
    const subForm = useForm({ subdomain: tenant.subdomain ?? '' });

    const changesLeft = Math.max(0, maxSubdomainChanges - tenant.subdomain_changes_count);

    function saveCustom(e: React.FormEvent) {
        e.preventDefault();
        customForm.post('/client-admin/domain', { preserveScroll: true });
    }

    function verify() {
        router.post('/client-admin/domain/verify', {}, { preserveScroll: true });
    }

    function saveSubdomain() {
        subForm.post('/client-admin/domain/subdomain', {
            preserveScroll: true,
            // Refresh the domain data right after OTP so the link, SSL badge and
            // remaining-changes counter update instantly (no manual reload).
            onSuccess: () => router.reload({ only: ['domain'] }),
        });
    }

    function copy(value: string, key: string) {
        navigator.clipboard.writeText(value);
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
    }

    const verificationRecord = `_diyafah-verify.${tenant.custom_domain ?? 'your-domain.com'}`;
    const subdomainUrl = subForm.data.subdomain ? `https://${subForm.data.subdomain}.${platformHost}` : null;

    const sslBadge = () => {
        if (tenant.ssl_status === 'active')
            return <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100"><ShieldCheck className="h-3 w-3" /> SSL {isArabic ? 'مفعّل' : 'Active'}</Badge>;
        if (tenant.ssl_status === 'pending')
            return <Badge className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100"><ShieldAlert className="h-3 w-3" /> SSL {isArabic ? 'قيد الإصدار' : 'Pending'}</Badge>;
        return <Badge variant="outline" className="gap-1"><ShieldAlert className="h-3 w-3" /> {isArabic ? 'بدون SSL' : 'No SSL'}</Badge>;
    };

    return (
        <div className="flex flex-col gap-6">
            {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>}
            {flash?.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</div>}

            {/* Subdomain */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> {isArabic ? 'النطاق الفرعي' : 'Subdomain'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {isArabic ? 'رابط موقعك على منصة ضيافة. يتطلب التعديل تحققاً عبر رمز.' : 'Your address on the Diyafah platform. Changing it requires OTP verification.'}
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-1.5">
                            <Label>{isArabic ? 'النطاق الفرعي' : 'Subdomain'}</Label>
                            <div className="flex items-center overflow-hidden rounded-md border focus-within:ring-2 focus-within:ring-primary/30" dir="ltr">
                                <Input
                                    value={subForm.data.subdomain}
                                    onChange={(e) => subForm.setData('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    placeholder="myhotel"
                                    className="flex-1 rounded-none border-0 focus-visible:ring-0"
                                />
                                <span className="select-none bg-muted px-3 py-2 text-sm text-muted-foreground">.{platformHost}</span>
                            </div>
                            {subForm.errors.subdomain && <p className="text-xs text-destructive">{subForm.errors.subdomain}</p>}
                        </div>
                        <Button
                            type="button"
                            onClick={() => setOtpOpen(true)}
                            disabled={subForm.processing || changesLeft <= 0 || subForm.data.subdomain === (tenant.subdomain ?? '')}
                        >
                            {isArabic ? 'تعديل' : 'Change'}
                        </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        {subdomainUrl && (
                            <a href={subdomainUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline" dir="ltr">{subdomainUrl}</a>
                        )}
                        {sslBadge()}
                        <span className="text-xs text-muted-foreground">
                            {isArabic ? `مرات التعديل المتبقية: ${changesLeft}` : `Changes left: ${changesLeft}`}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Custom domain */}
            <Card>
                <CardHeader><CardTitle>{isArabic ? 'النطاق المخصص' : 'Custom domain'}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {isArabic ? 'اربط نطاقك الخاص (مثل www.yourhotel.com) بموقعك.' : 'Link your own domain (e.g. www.yourhotel.com) to your website.'}
                    </p>
                    <form onSubmit={saveCustom} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-1.5">
                            <Label>{isArabic ? 'النطاق' : 'Domain'}</Label>
                            <Input value={customForm.data.custom_domain} onChange={(e) => customForm.setData('custom_domain', e.target.value)} placeholder="www.yourhotel.com" dir="ltr" />
                            {customForm.errors.custom_domain && <p className="text-xs text-destructive">{customForm.errors.custom_domain}</p>}
                        </div>
                        <Button type="submit" disabled={customForm.processing}>{isArabic ? 'حفظ' : 'Save'}</Button>
                    </form>

                    {tenant.custom_domain && (
                        <div className="flex items-center gap-2">
                            {tenant.dns_verified ? (
                                <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> {isArabic ? 'موثّق' : 'Verified'}</Badge>
                            ) : (
                                <Badge variant="destructive" className="gap-1"><ShieldOff className="h-3 w-3" /> {isArabic ? 'غير موثّق' : 'Not verified'}</Badge>
                            )}
                            {sslBadge()}
                            {tenant.dns_verified_at && (
                                <span className="text-xs text-muted-foreground">{isArabic ? 'تم التوثيق' : 'verified'} {new Date(tenant.dns_verified_at).toLocaleString()}</span>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* DNS setup */}
            {tenant.custom_domain && (
                <Card>
                    <CardHeader><CardTitle>{isArabic ? 'إعداد سجلات DNS' : 'DNS setup instructions'}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm">{isArabic ? 'أضف السجلات التالية لدى مزوّد النطاق ثم اضغط تحقق.' : 'Add the following records at your domain registrar, then click Verify.'}</p>
                        <div className="overflow-x-auto rounded border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 text-start">{isArabic ? 'النوع' : 'Type'}</th>
                                        <th className="px-3 py-2 text-start">{isArabic ? 'الاسم' : 'Host / Name'}</th>
                                        <th className="px-3 py-2 text-start">{isArabic ? 'القيمة' : 'Value'}</th>
                                        <th className="px-3 py-2 text-start"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-t">
                                        <td className="px-3 py-2"><Badge variant="outline">CNAME</Badge></td>
                                        <td className="px-3 py-2"><code>@</code> {isArabic ? 'أو' : 'or'} <code>www</code></td>
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
                        <Button onClick={verify}><RefreshCw className="h-4 w-4 me-2" /> {isArabic ? 'تحقق الآن' : 'Verify DNS now'}</Button>
                        {tenant.dns_last_checked_at && (
                            <p className="text-xs text-muted-foreground">{isArabic ? 'آخر فحص' : 'Last checked'}: {new Date(tenant.dns_last_checked_at).toLocaleString()}</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Registrars */}
            <Card>
                <CardHeader><CardTitle>{isArabic ? 'مزوّدو النطاقات' : 'Registrars'}</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {registrars.map((r) => (
                            <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded border px-3 py-2 text-sm hover:bg-muted/30">
                                <span>{r.name}</span>
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <OtpGate
                action="subdomain_change"
                open={otpOpen}
                onClose={() => setOtpOpen(false)}
                onVerified={saveSubdomain}
                title={isArabic ? 'تأكيد تعديل النطاق الفرعي' : 'Confirm subdomain change'}
            />
        </div>
    );
}
