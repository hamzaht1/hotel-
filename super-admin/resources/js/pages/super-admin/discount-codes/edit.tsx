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

interface DiscountCode {
    id: number;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    plan_id: number | null;
    plan: { id: number; name_ar: string; name_en: string } | null;
    max_uses: number | null;
    current_uses: number;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
    created_at: string;
}

interface PlanOption {
    id: number;
    name_ar: string;
    name_en: string;
}

interface Props {
    discountCode: DiscountCode;
    plans: PlanOption[];
}

export default function EditDiscountCode({ discountCode, plans }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: t('discount_codes', 'Discount Codes'), href: '/super-admin/discount-codes' },
        { title: t('edit', 'Edit'), href: '#' },
    ];

    const { data, setData, put, processing, errors } = useForm({
        code: discountCode.code,
        type: discountCode.type as 'percentage' | 'fixed',
        value: discountCode.value as string | number,
        plan_id: discountCode.plan_id ? String(discountCode.plan_id) : '',
        max_uses: discountCode.max_uses !== null ? discountCode.max_uses : ('' as string | number),
        valid_from: discountCode.valid_from || '',
        valid_until: discountCode.valid_until || '',
        is_active: discountCode.is_active,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/super-admin/discount-codes/${discountCode.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit', 'Edit')} ${discountCode.code}`} />
            <div className="mx-auto max-w-3xl p-6">
                <h1 className="mb-6 text-2xl font-bold">{t('edit', 'Edit')}: {discountCode.code}</h1>

                {flash?.success && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                        {flash.error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('code_details', 'Code Details')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label={t('code', 'Code')} error={errors.code}>
                                    <Input
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        required
                                        className="vuexy-input font-mono"
                                    />
                                </Field>
                                <Field label={t('type', 'Type')} error={errors.type}>
                                    <Select value={data.type} onValueChange={(value) => setData('type', value as 'percentage' | 'fixed')}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">{t('percentage', 'Percentage (%)')}</SelectItem>
                                            <SelectItem value="fixed">{t('fixed_amount', 'Fixed Amount (SAR)')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label={t('value', 'Value')} error={errors.value}>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.value}
                                        onChange={(e) => setData('value', e.target.value)}
                                        required
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('plan', 'Plan')} error={errors.plan_id}>
                                    <Select value={data.plan_id || '_all'} onValueChange={(value) => setData('plan_id', value === '_all' ? '' : value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_all">{t('all_plans', 'All Plans')}</SelectItem>
                                            {plans.map((plan) => (
                                                <SelectItem key={plan.id} value={String(plan.id)}>
                                                    {plan.name_ar} / {plan.name_en}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label={t('max_uses', 'Max Uses')} error={errors.max_uses}>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={data.max_uses}
                                        onChange={(e) => setData('max_uses', e.target.value)}
                                        placeholder={t('unlimited', 'Leave empty for unlimited')}
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('current_uses', 'Current Uses')}>
                                    <Input
                                        type="number"
                                        value={discountCode.current_uses}
                                        disabled
                                        className="vuexy-input bg-muted"
                                    />
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('validity_period', 'Validity Period')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label={t('valid_from', 'Valid From')} error={errors.valid_from}>
                                    <Input
                                        type="date"
                                        value={data.valid_from}
                                        onChange={(e) => setData('valid_from', e.target.value)}
                                        required
                                        className="vuexy-input"
                                    />
                                </Field>
                                <Field label={t('valid_until', 'Valid Until')} error={errors.valid_until}>
                                    <Input
                                        type="date"
                                        value={data.valid_until}
                                        onChange={(e) => setData('valid_until', e.target.value)}
                                        required
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
                                <Label htmlFor="is_active">{t('active', 'Active')}</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/super-admin/discount-codes">{t('cancel', 'Cancel')}</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('saving', 'Saving...') : t('save_changes', 'Save Changes')}
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
