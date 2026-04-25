import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/hooks/use-translations';

interface Page {
    id: number;
    slug: string;
    title_ar: string;
    title_en: string;
    is_published: boolean;
    sort_order: number;
    layout: string;
    created_at: string;
}

interface PaginatedData {
    data: Page[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

interface Props {
    pages: PaginatedData;
    filters: { search?: string; status?: string };
}

export default function PagesIndex({ pages, filters }: Props) {
    const { t } = useT();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('super_admin'), href: '/super-admin' },
        { title: 'الصفحات / Pages', href: '/super-admin/pages' },
    ];

    function handleSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get('/super-admin/pages', {
            search: formData.get('search') as string,
            status: filters.status,
        }, { preserveState: true });
    }

    function handleDelete(pageId: number) {
        if (confirm('هل تريد حذف هذه الصفحة؟ / Delete this page?')) {
            router.delete(`/super-admin/pages/${pageId}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="الصفحات / Pages" />
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
                    <h1 className="text-2xl font-bold">الصفحات / Pages</h1>
                    <Button asChild>
                        <Link href="/super-admin/pages/create">
                            <Plus className="h-4 w-4" />
                            إضافة صفحة / Add Page
                        </Link>
                    </Button>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <form onSubmit={handleSearch} className="flex-1">
                        <Input
                            name="search"
                            type="text"
                            placeholder="بحث في الصفحات... / Search pages..."
                            defaultValue={filters.search || ''}
                            className="vuexy-input"
                        />
                    </form>
                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) =>
                            router.get('/super-admin/pages', { ...filters, status: value === 'all' ? undefined : value }, { preserveState: true })
                        }
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="الكل / All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل / All</SelectItem>
                            <SelectItem value="published">منشور / Published</SelectItem>
                            <SelectItem value="draft">مسودة / Draft</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card className="py-0">
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-muted-foreground">
                                    <th className="px-4 py-3 text-start font-medium">العنوان (عربي)</th>
                                    <th className="px-4 py-3 text-start font-medium">Title (EN)</th>
                                    <th className="px-4 py-3 text-start font-medium">Slug</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('status')}</th>
                                    <th className="px-4 py-3 text-start font-medium">الترتيب / Order</th>
                                    <th className="px-4 py-3 text-start font-medium">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pages.data.map((page) => (
                                    <tr key={page.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{page.title_ar}</td>
                                        <td className="px-4 py-3">{page.title_en}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <code className="text-xs">/page/{page.slug}</code>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/page/${page.slug}`)}
                                                    title="Copy URL"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={page.is_published ? 'default' : 'secondary'} className="rounded-full">
                                                {page.is_published ? 'منشور / Published' : 'مسودة / Draft'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">{page.sort_order}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                {page.is_published && (
                                                    <Button variant="ghost" size="icon" asChild title="View">
                                                        <a href={`/page/${page.slug}`} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/super-admin/pages/${page.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(page.id)}
                                                    className="text-red-500 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {pages.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                            لا توجد صفحات / No pages found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {pages.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {pages.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'ghost'}
                                size="sm"
                                disabled={!link.url}
                                asChild={!!link.url}
                                className={!link.url ? 'cursor-not-allowed opacity-50' : ''}
                            >
                                {link.url ? (
                                    <Link href={link.url} preserveState dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                )}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
