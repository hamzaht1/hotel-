import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RequiredField {
    key: string;
    label_ar: string;
    label_en: string;
    type: 'text' | 'textarea' | 'number' | 'date' | 'tel' | 'email' | 'select' | 'file' | 'checkbox';
    options: string[];
    is_required: boolean;
}

interface Service {
    id: number;
    name_ar: string;
    name_en: string;
    accepts_bookings: boolean;
    required_fields: RequiredField[] | null;
}

export default function RequiredFields({ service }: { service: Service }) {
    const flash = usePage().props.flash as { success?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/client-admin' },
        { title: 'Services', href: '/client-admin/services' },
        { title: service.name_ar, href: `/client-admin/services/${service.id}/edit` },
        { title: 'Required data', href: `/client-admin/services/${service.id}/required-fields` },
    ];

    const { data, setData, post, processing } = useForm<{
        accepts_bookings: boolean;
        required_fields: RequiredField[];
    }>({
        accepts_bookings: service.accepts_bookings,
        required_fields: service.required_fields ?? [],
    });

    function add() {
        setData('required_fields', [...data.required_fields, {
            key: `field_${data.required_fields.length + 1}`,
            label_ar: '',
            label_en: '',
            type: 'text',
            options: [],
            is_required: false,
        }]);
    }

    function patch(i: number, p: Partial<RequiredField>) {
        const next = data.required_fields.slice();
        next[i] = { ...next[i], ...p };
        setData('required_fields', next);
    }

    function remove(i: number) {
        setData('required_fields', data.required_fields.filter((_, idx) => idx !== i));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/client-admin/services/${service.id}/required-fields`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Required data — ${service.name_en}`} />
            <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                <h1 className="text-2xl font-bold">البيانات المطلوبة / Required data</h1>
                <p className="text-sm text-muted-foreground">
                    Define what information guests must provide when requesting this service.
                </p>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader><CardTitle>Booking</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="accepts"
                                    checked={data.accepts_bookings}
                                    onCheckedChange={(v) => setData('accepts_bookings', v === true)}
                                />
                                <Label htmlFor="accepts">Accept bookings from the public site</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Fields</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={add}>
                                <Plus className="h-4 w-4" /> Add field
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.required_fields.length === 0 && (
                                <p className="text-sm text-muted-foreground">No custom fields yet.</p>
                            )}
                            {data.required_fields.map((field, i) => (
                                <div key={i} className="grid gap-3 rounded border p-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>Key</Label>
                                        <Input value={field.key} onChange={(e) => patch(i, { key: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Type</Label>
                                        <Select value={field.type} onValueChange={(v) => patch(i, { type: v as RequiredField['type'] })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="textarea">Textarea</SelectItem>
                                                <SelectItem value="number">Number</SelectItem>
                                                <SelectItem value="date">Date</SelectItem>
                                                <SelectItem value="tel">Phone</SelectItem>
                                                <SelectItem value="email">Email</SelectItem>
                                                <SelectItem value="select">Select</SelectItem>
                                                <SelectItem value="file">File</SelectItem>
                                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Label (AR)</Label>
                                        <Input value={field.label_ar} onChange={(e) => patch(i, { label_ar: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Label (EN)</Label>
                                        <Input value={field.label_en} onChange={(e) => patch(i, { label_en: e.target.value })} />
                                    </div>
                                    {field.type === 'select' && (
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <Label>Options (comma-separated)</Label>
                                            <Input
                                                value={(field.options ?? []).join(', ')}
                                                onChange={(e) => patch(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between sm:col-span-2">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`req-${i}`}
                                                checked={field.is_required}
                                                onCheckedChange={(v) => patch(i, { is_required: v === true })}
                                            />
                                            <Label htmlFor={`req-${i}`}>Required</Label>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>{processing ? 'Saving…' : 'Save'}</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
