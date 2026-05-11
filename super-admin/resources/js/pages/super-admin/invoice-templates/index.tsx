import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Check, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/hooks/use-translations';

interface TemplateOption {
    key: string;
    label: string;
}

interface Props {
    templates: TemplateOption[];
    defaultTemplate: string;
}

export default function InvoiceTemplatesIndex({ templates, defaultTemplate }: Props) {
    const { t, isArabic } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: isArabic ? 'الفواتير' : 'Invoices', href: '/super-admin/invoices' },
        { title: isArabic ? 'قوالب الفواتير' : 'Invoice templates', href: '/super-admin/invoice-templates' },
    ];

    function setDefault(template: string) {
        router.post('/super-admin/invoice-templates/default', { template }, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isArabic ? 'قوالب الفواتير' : 'Invoice templates'} />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                        {flash.success}
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold">{isArabic ? 'قوالب الفواتير' : 'Invoice templates'}</h1>
                    <p className="text-sm text-muted-foreground">
                        {isArabic
                            ? 'اختر القالب الافتراضي للفواتير الجديدة. يمكن تجاوزه يدويًا عند إنشاء كل فاتورة.'
                            : 'Pick the default template for new invoices. Each invoice can still override it individually.'}
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((tmpl) => {
                        const isDefault = tmpl.key === defaultTemplate;
                        const previewUrl = `/super-admin/invoice-templates/${tmpl.key}/preview`;
                        return (
                            <Card key={tmpl.key} className={isDefault ? 'border-primary ring-2 ring-primary/30' : ''}>
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <CardTitle className="text-base">{tmpl.label}</CardTitle>
                                    {isDefault && (
                                        <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                                            <Star className="h-3 w-3" />
                                            {isArabic ? 'افتراضي' : 'Default'}
                                        </Badge>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="aspect-[3/4] overflow-hidden rounded-md border bg-white">
                                        <iframe
                                            src={previewUrl}
                                            title={`${tmpl.label} preview`}
                                            className="h-full w-full"
                                            style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            asChild
                                        >
                                            <a href={previewUrl} target="_blank" rel="noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                                {isArabic ? 'معاينة' : 'Open preview'}
                                            </a>
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="flex-1"
                                            disabled={isDefault}
                                            onClick={() => setDefault(tmpl.key)}
                                        >
                                            <Check className="h-4 w-4" />
                                            {isDefault
                                                ? (isArabic ? 'مختار' : 'Selected')
                                                : (isArabic ? 'تعيين كافتراضي' : 'Set as default')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
