import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useT } from '@/hooks/use-translations';
import { useLocale } from '@/hooks/use-locale';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { LayoutGrid, Building2, BarChart3, CreditCard, MessageSquare, Package, Tags, FileText, Palette, FormInput, Plug, PaintBucket, FileStack, Menu, RefreshCw } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { t } = useT();
    const { isArabic } = useLocale();

    const superAdminNav: NavItem[] = [
        { title: t('dashboard'), href: '/super-admin', icon: LayoutGrid },
        { title: t('tenants'), href: '/super-admin/tenants', icon: Building2 },
        { title: isArabic ? 'طلبات التجديد' : 'Renewals', href: '/super-admin/renewals', icon: RefreshCw },
    ];

    const managementNav: NavItem[] = [
        { title: isArabic ? 'الباقات' : 'Plans', href: '/super-admin/plans', icon: Package },
        { title: isArabic ? 'أكواد الخصم' : 'Discount Codes', href: '/super-admin/discount-codes', icon: Tags },
        { title: isArabic ? 'الفواتير' : 'Invoices', href: '/super-admin/invoices', icon: FileText },
        { title: isArabic ? 'القوالب' : 'Templates', href: '/super-admin/templates', icon: Palette },
        { title: isArabic ? 'النماذج' : 'Form Builder', href: '/super-admin/form-builder', icon: FormInput },
        { title: isArabic ? 'التكاملات' : 'Integrations', href: '/super-admin/integrations', icon: Plug },
        { title: isArabic ? 'الصفحات' : 'Pages', href: '/super-admin/pages', icon: FileStack },
        { title: isArabic ? 'القوائم' : 'Menus', href: '/super-admin/menus', icon: Menu },
        { title: isArabic ? 'هوية الموقع' : 'Site Branding', href: '/super-admin/site-settings', icon: PaintBucket },
    ];

    const reportsNav: NavItem[] = [
        { title: isArabic ? 'التقارير المالية' : 'Financial Reports', href: '/super-admin/reports/financial', icon: BarChart3 },
        { title: isArabic ? 'تقارير الاشتراكات' : 'Subscriptions', href: '/super-admin/reports/subscriptions', icon: CreditCard },
        { title: isArabic ? 'الرسائل والدعم' : 'Messages & Support', href: '/super-admin/reports/messages', icon: MessageSquare },
    ];

    return (
        <Sidebar collapsible="icon" variant="sidebar" side={isArabic ? 'right' : 'left'}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/super-admin" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={superAdminNav} label={t('menu')} />
                <NavMain items={managementNav} label={isArabic ? 'الإدارة' : 'Management'} />
                <NavMain items={reportsNav} label={isArabic ? 'التقارير' : 'Reports'} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
