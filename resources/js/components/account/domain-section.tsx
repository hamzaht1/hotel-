import { router, useForm, usePage } from '@inertiajs/react';
import { ShieldCheck, ShieldAlert, Globe } from 'lucide-react';
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
    const { tenant, platformHost, maxSubdomainChanges } = domain;
    const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [otpOpen, setOtpOpen] = useState(false);

    const subForm = useForm({ subdomain: tenant.subdomain ?? '' });

    const changesLeft = Math.max(0, maxSubdomainChanges - tenant.subdomain_changes_count);

    function saveSubdomain() {
        subForm.post('/client-admin/domain/subdomain', {
            preserveScroll: true,
            // Refresh the domain data right after OTP so the link, SSL badge and
            // remaining-changes counter update instantly (no manual reload).
            onSuccess: () => router.reload({ only: ['domain'] }),
        });
    }

    // Tenants live on a path under the platform host (e.g.
    // https://diafa.cloud/hotel/myhotel), not on a subdomain.
    const subdomainUrl = subForm.data.subdomain ? `https://${platformHost}/hotel/${subForm.data.subdomain}` : null;

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
                                <span className="select-none bg-muted px-3 py-2 text-sm text-muted-foreground">{platformHost}/hotel/</span>
                                <Input
                                    value={subForm.data.subdomain}
                                    onChange={(e) => subForm.setData('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    placeholder="myhotel"
                                    className="flex-1 rounded-none border-0 focus-visible:ring-0"
                                />
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
