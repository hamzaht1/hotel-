import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useT } from '@/hooks/use-translations';
import { useLocale } from '@/hooks/use-locale';
import { usePermission } from '@/hooks/use-permission';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { LayoutGrid, Building2, Users, BarChart3, MessageSquare, Package, FileText, FileSignature, Plug, PaintBucket, FileStack, Receipt, Percent, Star, UserCog, Send, Settings } from 'lucide-react';
import AppLogo from './app-logo';

interface GatedNavItem extends NavItem {
    perm?: string | string[];
}

export function AppSidebar() {
    const { t } = useT();
    const { isArabic } = useLocale();
    const { canAny } = usePermission();

    function visible(items: GatedNavItem[]): NavItem[] {
        return items
            .filter((it) => {
                if (!it.perm) return true;
                const keys = Array.isArray(it.perm) ? it.perm : [it.perm];
                return canAny(...keys);
            })
            .map(({ perm: _p, ...rest }) => rest);
    }

    const superAdminNav: GatedNavItem[] = [
        { title: t('dashboard'), href: '/super-admin', icon: LayoutGrid, perm: 'dashboard.view' },
        { title: isArabic ? 'الطلبات' : 'Requests', href: '/super-admin/tenants', icon: Building2, perm: 'tenants.view' },
        { title: isArabic ? 'العملاء' : 'Clients', href: '/super-admin/clients', icon: Users, perm: 'clients.view' },
        { title: isArabic ? 'الموظفون' : 'Staff', href: '/super-admin/staff', icon: UserCog, perm: 'staff.view' },
        { title: isArabic ? 'آراء العملاء' : 'Reviews', href: '/super-admin/reviews', icon: Star, perm: 'reviews.view' },
    ];

    const managementNav: GatedNavItem[] = [
        { title: isArabic ? 'الباقات والقوالب' : 'Plans & Templates', href: '/super-admin/plans-templates', icon: Package, perm: ['plans.manage', 'templates.manage'] },
        { title: isArabic ? 'التكاملات' : 'Integrations', href: '/super-admin/integrations', icon: Plug, perm: 'integrations.manage' },
        { title: isArabic ? 'الصفحات' : 'Pages', href: '/super-admin/pages', icon: FileStack, perm: 'pages.manage' },
        { title: isArabic ? 'هوية الموقع' : 'Site Branding', href: '/super-admin/site-settings', icon: PaintBucket, perm: 'site_settings.edit' },
    ];

    const financeNav: GatedNavItem[] = [
        { title: isArabic ? 'الفواتير' : 'Invoices', href: '/super-admin/invoices', icon: FileText, perm: 'invoices.view' },
        { title: isArabic ? 'عروض الأسعار' : 'Quotes', href: '/super-admin/quotes', icon: FileSignature, perm: 'quotes.view' },
        { title: isArabic ? 'العمليات' : 'Operations', href: '/super-admin/transactions', icon: Receipt, perm: 'transactions.view' },
        { title: isArabic ? 'أكواد الخصم' : 'Discount Codes', href: '/super-admin/discount-codes', icon: Percent, perm: 'discount_codes.manage' },
        { title: isArabic ? 'إعدادات الفواتير' : 'Invoice Settings', href: '/super-admin/invoice-settings', icon: Settings, perm: 'invoices.edit' },
    ];

    const reportsNav: GatedNavItem[] = [
        { title: isArabic ? 'التقارير' : 'Reports', href: '/super-admin/reports', icon: BarChart3, perm: 'reports.view' },
        { title: isArabic ? 'مركز الدعم' : 'Support center', href: '/super-admin/support', icon: MessageSquare, perm: 'reports.messages' },
        { title: isArabic ? 'الرسائل الجماعية' : 'Broadcasts', href: '/super-admin/broadcasts', icon: Send, perm: 'reports.messages' },
    ];

    const sa = visible(superAdminNav);
    const mg = visible(managementNav);
    const fn = visible(financeNav);
    const rp = visible(reportsNav);

    return (
        <Sidebar collapsible="icon" variant="sidebar" side={isArabic ? 'right' : 'left'}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="/">
                                <AppLogo />
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {sa.length > 0 && <NavMain items={sa} label={t('menu')} />}
                {mg.length > 0 && <NavMain items={mg} label={isArabic ? 'الإدارة' : 'Management'} />}
                {fn.length > 0 && <NavMain items={fn} label={isArabic ? 'المالية' : 'Finance'} />}
                {rp.length > 0 && <NavMain items={rp} label={isArabic ? 'التقارير' : 'Reports'} />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
