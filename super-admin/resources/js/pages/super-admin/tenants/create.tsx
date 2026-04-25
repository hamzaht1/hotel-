import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface PlanOption {
    id: number;
    name_ar: string;
    name_en: string;
    slug: string;
    price: string;
}

interface Props {
    plans: PlanOption[];
}

export default function CreateTenant({ plans }: Props) {
    const { t } = useT();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: t('tenants'), href: '/super-admin/tenants' },
        { title: t('create_tenant'), href: '/super-admin/tenants/create' },
    ];

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        slug: string;
        domain: string;
        subdomain: string;
        template: string;
        email: string;
        phone: string;
        plan_id: string | number;
        subscription_starts_at: string;
        subscription_ends_at: string;
        is_active: boolean;
        logo: File | null;
        admin_name: string;
        admin_email: string;
        admin_password: string;
        payment_method: string;
        payment_status: string;
        bank_transfer_receipt: File | null;
        payment_notes: string;
    }>({
        name: '',
        slug: '',
        domain: '',
        subdomain: '',
        template: 'madina',
        email: '',
        phone: '',
        plan_id: '' as string | number,
        subscription_starts_at: '',
        subscription_ends_at: '',
        is_active: true,
        logo: null,
        admin_name: '',
        admin_email: '',
        admin_password: '',
        payment_method: 'manual',
        payment_status: 'approved',
        bank_transfer_receipt: null,
        payment_notes: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/super-admin/tenants', { forceFormData: true });
    }

    function autoSlug(name: string) {
        setData('slug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_tenant')} />
            <div className="mx-auto max-w-3xl p-6">
                <h1 className="mb-6 text-2xl font-bold">{t('create_tenant')}</h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('tenant_info')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label={t('name')} error={errors.name}>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => { setData('name', e.target.value); autoSlug(e.target.value); }}
                                        required
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('slug')} error={errors.slug}>
                                    <Input
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        required
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('domain_optional')} error={errors.domain}>
                                    <Input
                                        value={data.domain}
                                        onChange={(e) => setData('domain', e.target.value)}
                                        placeholder="hotel.example.com"
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('subdomain_optional')} error={errors.subdomain}>
                                    <Input
                                        value={data.subdomain}
                                        onChange={(e) => setData('subdomain', e.target.value)}
                                        placeholder="grand"
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('email')} error={errors.email}>
                                    <Input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('phone')} error={errors.phone}>
                                    <Input
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('logo')} error={(errors as Record<string, string>).logo}>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setData('logo', e.target.files?.[0] ?? null)}
                                        className="vuexy-input"
                                    />
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

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('admin_user')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label={t('admin_name')} error={errors.admin_name}>
                                    <Input
                                        value={data.admin_name}
                                        onChange={(e) => setData('admin_name', e.target.value)}
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('admin_email')} error={errors.admin_email}>
                                    <Input
                                        type="email"
                                        value={data.admin_email}
                                        onChange={(e) => setData('admin_email', e.target.value)}
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('admin_password')} error={errors.admin_password}>
                                    <Input
                                        type="password"
                                        value={data.admin_password}
                                        onChange={(e) => setData('admin_password', e.target.value)}
                                        minLength={8}
                                        className="vuexy-input"
                                    />
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('payment')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label={t('payment_method')} error={(errors as Record<string, string>).payment_method}>
                                    <Select value={data.payment_method} onValueChange={(value) => setData('payment_method', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manual">{t('manual')}</SelectItem>
                                            <SelectItem value="bank_transfer">{t('bank_transfer')}</SelectItem>
                                            <SelectItem value="tap">Tap</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label={t('payment_status')} error={(errors as Record<string, string>).payment_status}>
                                    <Select value={data.payment_status} onValueChange={(value) => setData('payment_status', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">{t('pending')}</SelectItem>
                                            <SelectItem value="approved">{t('approved')}</SelectItem>
                                            <SelectItem value="rejected">{t('rejected')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label={t('bank_transfer_receipt')} error={(errors as Record<string, string>).bank_transfer_receipt}>
                                    <Input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => setData('bank_transfer_receipt', e.target.files?.[0] ?? null)}
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('payment_notes')} error={(errors as Record<string, string>).payment_notes}>
                                    <Input
                                        value={data.payment_notes}
                                        onChange={(e) => setData('payment_notes', e.target.value)}
                                        className="vuexy-input"
                                    />
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/super-admin/tenants">{t('cancel')}</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('creating') : t('create_tenant')}
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
