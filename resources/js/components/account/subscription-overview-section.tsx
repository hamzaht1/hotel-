import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, CalendarCheck, Hourglass, Globe, ShieldCheck, ShieldAlert, CheckCircle2, CreditCard, Package } from 'lucide-react';

export interface SubscriptionPlan {
    name_ar: string;
    name_en: string;
    price: string;
    billing_cycle?: string;
    features_ar?: string[];
    features_en?: string[];
    limits?: Record<string, number | string>;
}

export interface SubscriptionInfo {
    status: string;
    subscription_starts_at: string | null;
    subscription_ends_at: string | null;
    days_remaining: number | null;
    subdomain: string | null;
    subdomain_url: string | null;
    ssl_status: string | null;
    plan: SubscriptionPlan | null;
}

/**
 * Read-only subscription overview: current plan, value, dates, days remaining,
 * the dedicated subdomain link, plan features and the live status.
 */
export default function SubscriptionOverviewSection({ subscription }: { subscription: SubscriptionInfo }) {
    const isArabic = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    const { plan } = subscription;
    const price = Number(plan?.price ?? 0);
    const days = subscription.days_remaining;
    const features = (isArabic ? plan?.features_ar : plan?.features_en) ?? [];

    const statusBadge = () => {
        if (subscription.status === 'active') {
            return <Badge className="rounded-full bg-green-100 text-green-700 hover:bg-green-100">{isArabic ? 'نشط' : 'Active'}</Badge>;
        }
        return <Badge className="rounded-full bg-red-100 text-red-700 hover:bg-red-100">{isArabic ? 'منتهي' : 'Expired'}</Badge>;
    };

    const daysColor =
        days === null ? 'text-foreground' : days <= 0 ? 'text-red-600' : days <= 7 ? 'text-red-500' : days <= 30 ? 'text-amber-500' : 'text-green-600';

    const sslBadge = () => {
        if (subscription.ssl_status === 'active') {
            return (
                <Badge className="rounded-full bg-green-100 text-green-700 hover:bg-green-100">
                    <ShieldCheck className="h-3 w-3 me-1" /> SSL {isArabic ? 'مفعّل' : 'Active'}
                </Badge>
            );
        }
        if (subscription.ssl_status === 'pending') {
            return (
                <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100">
                    <ShieldAlert className="h-3 w-3 me-1" /> SSL {isArabic ? 'قيد الإصدار' : 'Pending'}
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="rounded-full">
                <ShieldAlert className="h-3 w-3 me-1" /> {isArabic ? 'بدون SSL' : 'No SSL'}
            </Badge>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Top metric cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    icon={Package}
                    label={isArabic ? 'الباقة الحالية' : 'Current plan'}
                    value={plan ? (isArabic ? plan.name_ar : plan.name_en) : (isArabic ? 'غير محدد' : 'N/A')}
                />
                <MetricCard
                    icon={CreditCard}
                    label={isArabic ? 'قيمة الاشتراك' : 'Subscription value'}
                    value={`${price.toLocaleString()} SAR`}
                    hint={plan?.billing_cycle === 'monthly' ? (isArabic ? 'شهري' : 'monthly') : (isArabic ? 'سنوي' : 'yearly')}
                />
                <MetricCard
                    icon={Hourglass}
                    label={isArabic ? 'الأيام المتبقية' : 'Days remaining'}
                    value={days === null ? '—' : days > 0 ? String(days) : (isArabic ? 'منتهي' : 'Expired')}
                    valueClass={daysColor}
                />
                <div className="vuexy-card flex flex-col justify-center gap-2 p-5">
                    <span className="text-sm text-muted-foreground">{isArabic ? 'حالة الاشتراك' : 'Status'}</span>
                    <div>{statusBadge()}</div>
                </div>
            </div>

            {/* Dates + subdomain */}
            <Card>
                <CardHeader>
                    <CardTitle>{isArabic ? 'تفاصيل الاشتراك' : 'Subscription details'}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 sm:grid-cols-2">
                    <InfoRow icon={CalendarDays} label={isArabic ? 'تاريخ البداية' : 'Start date'} value={subscription.subscription_starts_at || '—'} />
                    <InfoRow icon={CalendarCheck} label={isArabic ? 'تاريخ الانتهاء' : 'End date'} value={subscription.subscription_ends_at || '—'} />
                    <div className="sm:col-span-2">
                        <div className="mb-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                            <Globe className="h-4 w-4" />
                            {isArabic ? 'الرابط الفرعي المخصص' : 'Dedicated subdomain link'}
                        </div>
                        {subscription.subdomain_url ? (
                            <div className="flex flex-wrap items-center gap-3">
                                <a href={subscription.subdomain_url} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline" dir="ltr">
                                    {subscription.subdomain_url}
                                </a>
                                {sslBadge()}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">{isArabic ? 'لم يتم تعيين نطاق فرعي بعد' : 'No subdomain assigned yet'}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Plan features */}
            {features.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>{isArabic ? 'مميزات الباقة' : 'Plan features'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {features.map((f, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, hint, valueClass }: { icon: typeof Package; label: string; value: string; hint?: string; valueClass?: string }) {
    return (
        <div className="vuexy-card flex items-start gap-3 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-lg font-bold ${valueClass ?? ''}`}>{value}</p>
                {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold">{value}</p>
            </div>
        </div>
    );
}
