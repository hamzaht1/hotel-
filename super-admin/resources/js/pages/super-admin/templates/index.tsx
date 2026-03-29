import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Power, Hotel, ChevronDown, ChevronUp, Palette, Type, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useT } from '@/hooks/use-translations';
import { useState } from 'react';

interface Template {
    id: number;
    key: string;
    name_ar: string;
    name_en: string;
    description_ar: string | null;
    description_en: string | null;
    preview_image: string | null;
    is_active: boolean;
    settings: Record<string, any> | null;
    sort_order: number;
    tenants_count: number;
    created_at: string;
}

interface Props {
    templates: Template[];
}

const templateColors: Record<string, string> = {
    starter: 'from-blue-500 to-blue-700',
    starter_flavor: 'from-amber-500 to-orange-700',
    starter_flavor2: 'from-emerald-500 to-teal-700',
    starter_flavor3: 'from-violet-500 to-purple-700',
    starter_flavor4: 'from-rose-500 to-pink-700',
    starter_flavor5: 'from-cyan-500 to-sky-700',
};

function getTemplateGradient(key: string): string {
    if (templateColors[key]) return templateColors[key];
    // Generate a consistent color based on key hash
    const hash = key.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const gradients = [
        'from-indigo-500 to-blue-700',
        'from-emerald-500 to-green-700',
        'from-amber-500 to-yellow-700',
        'from-rose-500 to-red-700',
        'from-violet-500 to-purple-700',
        'from-cyan-500 to-teal-700',
    ];
    return gradients[hash % gradients.length];
}

function SettingsDisplay({ settings }: { settings: Record<string, any> | null }) {
    if (!settings || Object.keys(settings).length === 0) {
        return (
            <p className="text-xs text-muted-foreground italic">
                لا توجد إعدادات / No settings
            </p>
        );
    }

    const iconMap: Record<string, React.ReactNode> = {
        primary_color: <Palette className="h-3.5 w-3.5 text-muted-foreground" />,
        font_family: <Type className="h-3.5 w-3.5 text-muted-foreground" />,
        regions: <Globe className="h-3.5 w-3.5 text-muted-foreground" />,
    };

    return (
        <div className="space-y-2">
            {Object.entries(settings).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 shrink-0">
                        {iconMap[key] || <span className="inline-block h-3.5 w-3.5 rounded-full bg-muted" />}
                    </span>
                    <span className="font-medium text-muted-foreground min-w-[100px]">{key}:</span>
                    <span className="text-foreground break-all">
                        {typeof value === 'object' ? (
                            Array.isArray(value) ? value.join(', ') : JSON.stringify(value, null, 0)
                        ) : (
                            key === 'primary_color' ? (
                                <span className="inline-flex items-center gap-1.5">
                                    <span
                                        className="inline-block h-3.5 w-3.5 rounded-sm border border-border"
                                        style={{ backgroundColor: String(value) }}
                                    />
                                    {String(value)}
                                </span>
                            ) : String(value)
                        )}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function TemplatesIndex({ templates }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [expandedSettings, setExpandedSettings] = useState<Record<number, boolean>>({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'القوالب / Templates', href: '/super-admin/templates' },
    ];

    function handleToggle(templateId: number) {
        if (confirm('هل تريد تغيير حالة هذا القالب؟ / Toggle this template?')) {
            router.post(`/super-admin/templates/${templateId}/toggle`);
        }
    }

    function toggleSettings(templateId: number) {
        setExpandedSettings((prev) => ({
            ...prev,
            [templateId]: !prev[templateId],
        }));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="القوالب / Templates" />
            <div className="flex flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">القوالب / Templates</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            إدارة قوالب المنشآت / Manage hotel templates (seeded, not manually created)
                        </p>
                    </div>
                    <Badge variant="secondary" className="rounded-full text-sm px-3 py-1 self-start">
                        {templates.length} قالب / template{templates.length !== 1 ? 's' : ''}
                    </Badge>
                </div>

                {/* Grid of Cards */}
                {templates.length === 0 ? (
                    <Card>
                        <CardContent className="flex items-center justify-center py-12">
                            <p className="text-muted-foreground">لا توجد قوالب / No templates found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {templates.map((template) => (
                            <Card key={template.id} className="overflow-hidden py-0 gap-0">
                                {/* Preview Image / Colored Header */}
                                {template.preview_image ? (
                                    <div className="relative h-40 overflow-hidden">
                                        <img
                                            src={template.preview_image}
                                            alt={template.name_en}
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                        <div className="absolute bottom-3 start-4">
                                            <Badge
                                                className="rounded-full bg-white/20 text-white backdrop-blur-sm border-white/30"
                                            >
                                                {template.key}
                                            </Badge>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`relative h-40 bg-gradient-to-br ${getTemplateGradient(template.key)} flex items-center justify-center`}>
                                        <span className="text-3xl font-bold text-white/90 uppercase tracking-wider">
                                            {template.key}
                                        </span>
                                        <div className="absolute bottom-3 start-4">
                                            <Badge
                                                className="rounded-full bg-white/20 text-white backdrop-blur-sm border-white/30"
                                            >
                                                {template.key}
                                            </Badge>
                                        </div>
                                    </div>
                                )}

                                {/* Card Body */}
                                <CardHeader className="pb-3 pt-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg">{template.name_ar}</CardTitle>
                                            <CardDescription className="mt-1">{template.name_en}</CardDescription>
                                        </div>
                                        <Badge
                                            variant={template.is_active ? 'default' : 'destructive'}
                                            className="rounded-full shrink-0"
                                        >
                                            {template.is_active ? 'مفعل / Active' : 'معطل / Inactive'}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="pb-3 pt-0">
                                    {/* Description */}
                                    {(template.description_ar || template.description_en) && (
                                        <div className="mb-3 text-sm text-muted-foreground">
                                            {template.description_ar && <p>{template.description_ar}</p>}
                                            {template.description_en && (
                                                <p className="mt-0.5 text-xs">{template.description_en}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Tenants Count */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <Hotel className="h-4 w-4 text-muted-foreground" />
                                        <Badge
                                            variant="secondary"
                                            className="rounded-full"
                                        >
                                            {template.tenants_count} {template.tenants_count === 1 ? 'فندق يستخدم هذا القالب / hotel using this template' : 'فندق يستخدم هذا القالب / hotels using this template'}
                                        </Badge>
                                    </div>

                                    {/* Settings Section (Collapsible) */}
                                    <div className="border-t pt-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleSettings(template.id)}
                                            className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <span>الإعدادات / Settings</span>
                                            {expandedSettings[template.id] ? (
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            ) : (
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                        {expandedSettings[template.id] && (
                                            <div className="mt-2 rounded-lg bg-muted/50 p-3">
                                                <SettingsDisplay settings={template.settings} />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>

                                {/* Footer with Toggle */}
                                <CardFooter className="border-t px-6 py-3 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(template.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggle(template.id)}
                                        className={
                                            template.is_active
                                                ? 'text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950'
                                                : 'text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:hover:bg-green-950'
                                        }
                                    >
                                        <Power className="h-3.5 w-3.5 me-1" />
                                        {template.is_active ? 'تعطيل / Deactivate' : 'تفعيل / Activate'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
