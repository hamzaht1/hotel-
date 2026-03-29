import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface Tenant {
    id: number;
    name: string;
    slug: string;
    domain: string | null;
    subdomain: string | null;
    template: string;
    email: string | null;
    phone: string | null;
    plan: string;
    plan_id: number | null;
    subscription_starts_at: string | null;
    subscription_ends_at: string | null;
    is_active: boolean;
}

interface PlanOption {
    id: number;
    name_ar: string;
    name_en: string;
    slug: string;
    price: string;
}

interface Props {
    tenant: Tenant;
    plans: PlanOption[];
}

export default function EditTenant({ tenant, plans }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: t('tenants'), href: '/super-admin/tenants' },
        { title: t('edit'), href: '#' },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain || '',
        subdomain: tenant.subdomain || '',
        template: tenant.template,
        email: tenant.email || '',
        phone: tenant.phone || '',
        plan_id: tenant.plan_id || ('' as string | number),
        subscription_starts_at: tenant.subscription_starts_at || '',
        subscription_ends_at: tenant.subscription_ends_at || '',
        is_active: tenant.is_active,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/super-admin/tenants/${tenant.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit')} ${tenant.name}`} />
            <div className="mx-auto max-w-3xl p-6">
                <h1 className="mb-6 text-2xl font-bold">{t('edit')}: {tenant.name}</h1>

                {flash?.success && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('tenant_info')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label={t('name')} error={errors.name}>
                                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required className="vuexy-input" />
                                </Field>
                                <Field label={t('slug')} error={errors.slug}>
                                    <Input value={data.slug} onChange={(e) => setData('slug', e.target.value)} required className="vuexy-input" />
                                </Field>
                                <Field label={t('domain_optional')} error={errors.domain}>
                                    <Input value={data.domain} onChange={(e) => setData('domain', e.target.value)} className="vuexy-input" />
                                </Field>
                                <Field label={t('subdomain_optional')} error={errors.subdomain}>
                                    <Input value={data.subdomain} onChange={(e) => setData('subdomain', e.target.value)} className="vuexy-input" />
                                </Field>
                                <Field label={t('email')} error={errors.email}>
                                    <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="vuexy-input" />
                                </Field>
                                <Field label={t('phone')} error={errors.phone}>
                                    <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="vuexy-input" />
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('template_plan')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label={t('template')} error={errors.template}>
                                    <Select value={data.template} onValueChange={(value) => setData('template', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="madina">Madina</SelectItem>
                                            <SelectItem value="riyadh">Riyadh</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label={t('plan')} error={(errors as Record<string, string>).plan_id}>
                                    <Select value={String(data.plan_id)} onValueChange={(value) => setData('plan_id', Number(value))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('select_plan')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans.map((plan) => (
                                                <SelectItem key={plan.id} value={String(plan.id)}>
                                                    {plan.name_ar} ({plan.price} SAR)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label={t('sub_start')} error={errors.subscription_starts_at}>
                                    <Input
                                        type="date"
                                        value={data.subscription_starts_at}
                                        onChange={(e) => setData('subscription_starts_at', e.target.value)}
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('sub_end')} error={errors.subscription_ends_at}>
                                    <Input
                                        type="date"
                                        value={data.subscription_ends_at}
                                        onChange={(e) => setData('subscription_ends_at', e.target.value)}
                                        className="vuexy-input"
                                    />
                                </Field>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked === true)}
                                />
                                <Label htmlFor="is_active">{t('active')}</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/super-admin/tenants">{t('cancel')}</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('saving') : t('save_changes')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
