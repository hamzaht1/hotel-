import { Head, useForm, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface Field {
    key: string;
    label_ar: string;
    label_en: string;
    type: 'text' | 'textarea' | 'number' | 'date' | 'tel' | 'email' | 'select' | 'file' | 'checkbox';
    options: string[] | null;
    is_required: boolean;
}

interface Service {
    id: number;
    name_ar: string;
    name_en: string;
    description_ar: string | null;
    description_en: string | null;
    price: string;
    duration: string | null;
    featured_image: string | null;
    required_fields: Field[] | null;
}

interface Tenant { id: number; name: string; slug: string; logo: string | null }

interface Props { tenant: Tenant; service: Service }

export default function ServiceBooking({ tenant, service }: Props) {
    const flash = usePage().props.flash as { success?: string } | undefined;
    const isAr = typeof document !== 'undefined' && document.documentElement.lang === 'ar';

    const { data, setData, post, processing, errors } = useForm<{
        guest_name: string;
        guest_email: string;
        guest_phone: string;
        data: Record<string, unknown>;
    }>({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        data: {},
    });

    function setField(key: string, value: unknown) {
        setData('data', { ...data.data, [key]: value });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/hotel/${tenant.slug}/services/${service.id}/book`, { forceFormData: true });
    }

    const fields = service.required_fields ?? [];

    return (
        <div className="min-h-screen bg-muted/20 py-10">
            <Head title={isAr ? service.name_ar : service.name_en} />
            <div className="mx-auto max-w-2xl px-4">
                {flash?.success ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                            <CheckCircle2 className="h-14 w-14 text-green-500" />
                            <h1 className="text-xl font-bold">{isAr ? 'تم إرسال طلبك' : 'Request sent'}</h1>
                            <p className="text-muted-foreground">{flash.success}</p>
                            <a href={`/hotel/${tenant.slug}`} className="text-sm text-primary underline">{isAr ? 'العودة' : 'Back'}</a>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>{isAr ? service.name_ar : service.name_en}</CardTitle>
                            <p className="text-sm text-muted-foreground">{tenant.name}</p>
                        </CardHeader>
                        <CardContent>
                            {service.featured_image && (
                                <img src={`/storage/${service.featured_image}`} alt="" className="mb-4 h-40 w-full rounded object-cover" />
                            )}
                            {(service.description_ar || service.description_en) && (
                                <p className="mb-4 text-sm text-muted-foreground">
                                    {isAr ? service.description_ar : service.description_en}
                                </p>
                            )}
                            <div className="mb-4 flex items-center gap-4 text-sm">
                                <span><strong>{isAr ? 'السعر' : 'Price'}:</strong> {service.price} SAR</span>
                                {service.duration && <span><strong>{isAr ? 'المدة' : 'Duration'}:</strong> {service.duration}</span>}
                            </div>

                            <form onSubmit={submit} className="flex flex-col gap-4">
                                <div className="space-y-1.5">
                                    <Label>{isAr ? 'الاسم' : 'Name'} *</Label>
                                    <Input value={data.guest_name} onChange={(e) => setData('guest_name', e.target.value)} required />
                                    {errors.guest_name && <p className="text-xs text-destructive">{errors.guest_name}</p>}
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>{isAr ? 'البريد' : 'Email'}</Label>
                                        <Input type="email" value={data.guest_email} onChange={(e) => setData('guest_email', e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>{isAr ? 'الهاتف' : 'Phone'}</Label>
                                        <Input value={data.guest_phone} onChange={(e) => setData('guest_phone', e.target.value)} />
                                    </div>
                                </div>

                                {fields.map((field) => (
                                    <div key={field.key} className="space-y-1.5">
                                        <Label>{isAr ? field.label_ar : field.label_en}{field.is_required ? ' *' : ''}</Label>
                                        {field.type === 'textarea' && (
                                            <Textarea
                                                value={(data.data[field.key] as string) ?? ''}
                                                onChange={(e) => setField(field.key, e.target.value)}
                                                required={field.is_required}
                                            />
                                        )}
                                        {['text', 'tel', 'email', 'number', 'date'].includes(field.type) && (
                                            <Input
                                                type={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                                value={(data.data[field.key] as string) ?? ''}
                                                onChange={(e) => setField(field.key, e.target.value)}
                                                required={field.is_required}
                                            />
                                        )}
                                        {field.type === 'select' && (
                                            <select
                                                className="w-full rounded border px-3 py-2 text-sm"
                                                value={(data.data[field.key] as string) ?? ''}
                                                onChange={(e) => setField(field.key, e.target.value)}
                                                required={field.is_required}
                                            >
                                                <option value="">—</option>
                                                {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        )}
                                        {field.type === 'file' && (
                                            <Input
                                                type="file"
                                                onChange={(e) => setField(field.key, e.target.files?.[0] ?? null)}
                                                required={field.is_required}
                                            />
                                        )}
                                        {field.type === 'checkbox' && (
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={!!data.data[field.key]}
                                                    onChange={(e) => setField(field.key, e.target.checked)}
                                                    required={field.is_required}
                                                />
                                                {isAr ? field.label_ar : field.label_en}
                                            </label>
                                        )}
                                    </div>
                                ))}

                                <Button type="submit" disabled={processing}>
                                    {processing ? (isAr ? 'جاري الإرسال…' : 'Submitting…') : (isAr ? 'أرسل الطلب' : 'Send request')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
