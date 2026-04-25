import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface Plan { id: number; name_ar: string; name_en: string; slug: string }
interface Template { id: number; key: string; name_ar: string; name_en: string }
interface City { key: string; label_ar: string; label_en: string }

interface Props {
    plans: Plan[];
    templates: Template[];
    cities: City[];
}

export default function ClientCreate({ plans, templates, cities }: Props) {
    const { t, isArabic } = useT();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'العملاء' : 'Clients', href: '/super-admin/clients' },
        { title: isArabic ? 'إضافة عميل' : 'Add client', href: '/super-admin/clients/create' },
    ];

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        email: string;
        phone: string;
        hotel_name: string;
        plan_id: string;
        template: string;
        password: string;
        logo: File | null;
        city: string;
    }>({
        name: '',
        email: '',
        phone: '',
        hotel_name: '',
        plan_id: '',
        template: '',
        password: '',
        logo: null,
        city: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/super-admin/clients', { forceFormData: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'إضافة عميل' : 'Add client'} />
            <div className="mx-auto max-w-2xl p-6">
                <h1 className="text-2xl font-bold mb-6">{isArabic ? 'إضافة عميل جديد' : 'Add new client'}</h1>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base">{isArabic ? 'معلومات العميل' : 'Client information'}</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Field label={isArabic ? 'الاسم' : 'Full name'} error={errors.name}>
                                <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            </Field>
                            <Field label={isArabic ? 'البريد الإلكتروني' : 'Email'} error={errors.email}>
                                <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                            </Field>
                            <Field label={isArabic ? 'رقم الجوال' : 'Phone'} error={errors.phone}>
                                <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+966 5x xxx xxxx" />
                            </Field>
                            <Field label={isArabic ? 'اسم الفندق' : 'Hotel name'} error={errors.hotel_name}>
                                <Input value={data.hotel_name} onChange={(e) => setData('hotel_name', e.target.value)} required />
                            </Field>
                            <Field label={isArabic ? 'اختيار الباقة' : 'Plan'} error={(errors as Record<string, string>).plan_id}>
                                <Select value={data.plan_id} onValueChange={(v) => setData('plan_id', v)}>
                                    <SelectTrigger><SelectValue placeholder={isArabic ? 'اختر الباقة' : 'Select plan'} /></SelectTrigger>
                                    <SelectContent>
                                        {plans.map((p) => <SelectItem key={p.id} value={String(p.id)}>{isArabic ? p.name_ar : p.name_en}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label={isArabic ? 'اختيار القالب' : 'Template'} error={errors.template}>
                                <Select value={data.template} onValueChange={(v) => setData('template', v)}>
                                    <SelectTrigger><SelectValue placeholder={isArabic ? 'اختر القالب' : 'Select template'} /></SelectTrigger>
                                    <SelectContent>
                                        {templates.map((tpl) => <SelectItem key={tpl.id} value={tpl.key}>{isArabic ? tpl.name_ar : tpl.name_en}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label={isArabic ? 'المدينة' : 'City'} error={errors.city}>
                                <Select value={data.city} onValueChange={(v) => setData('city', v)}>
                                    <SelectTrigger><SelectValue placeholder={isArabic ? 'اختر المدينة' : 'Select city'} /></SelectTrigger>
                                    <SelectContent>
                                        {cities.map((c) => <SelectItem key={c.key} value={c.key}>{isArabic ? c.label_ar : c.label_en}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label={isArabic ? 'كلمة المرور' : 'Password'} error={errors.password}>
                                <Input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} minLength={8} required />
                            </Field>
                            <Field label={isArabic ? 'الصورة (اختياري)' : 'Logo (optional)'} error={(errors as Record<string, string>).logo}>
                                <Input type="file" accept="image/*" onChange={(e) => setData('logo', e.target.files?.[0] ?? null)} />
                            </Field>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/super-admin/clients">{isArabic ? 'إلغاء' : 'Cancel'}</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? '...' : (isArabic ? 'إضافة' : 'Create')}
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
