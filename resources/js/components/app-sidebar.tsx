import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useT } from '@/hooks/use-translations';
import { useLocale } from '@/hooks/use-locale';
import { usePermission } from '@/hooks/usePermission';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    BedDouble,
    Image,
    FileText,
    ToggleRight,
    Phone,
    Settings,
    CreditCard,
    MessageSquare,
    Users,
    Shield,
    Layers,
    Sparkles,
    Plug,
    RefreshCw,
    Star,
    Building2,
} from 'lucide-react';
import AppLogo from './app-logo';

type SidebarLink = { item: NavItem; permission?: string };

function buildGroup(links: SidebarLink[], can: (key: string) => boolean): NavItem[] {
    return links.filter(({ permission }) => !permission || can(permission)).map(({ item }) => item);
}

export function AppSidebar() {
    const { t } = useT();
    const { isArabic } = useLocale();
    const { can } = usePermission();

    // 📊 Dashboard
    const dashboardGroup: NavItem[] = [
        { title: t('dashboard'), href: '/client-admin', icon: LayoutGrid },
    ];

    // 📌 الإدارة — public-facing content
    const managementGroup = buildGroup([
        { item: { title: t('rooms'), href: '/client-admin/rooms', icon: BedDouble }, permission: 'rooms.view' },
        { item: { title: t('gallery'), href: '/client-admin/gallery', icon: Image }, permission: 'gallery.view' },
        { item: { title: t('site_texts'), href: '/client-admin/site-texts', icon: FileText }, permission: 'site_texts.view' },
        { item: { title: t('sections'), href: '/client-admin/site-sections', icon: ToggleRight }, permission: 'site_sections.view' },
        { item: { title: t('contact'), href: '/client-admin/contact-settings', icon: Phone }, permission: 'contact.view' },
    ], can);

    // ⚙️ النظام — system identity, services
    const systemGroup = buildGroup([
        { item: { title: isArabic ? 'إعدادات النظام' : 'System Settings', href: '/client-admin/system-settings', icon: Settings }, permission: 'hotel_settings.edit' },
        { item: { title: isArabic ? 'تخصيص الموقع' : 'Site Branding', href: '/client-admin/site-branding', icon: Settings }, permission: 'hotel_settings.edit' },
        { item: { title: isArabic ? 'الخدمات' : 'Services', href: '/client-admin/services', icon: Sparkles }, permission: 'services.view' },
        { item: { title: isArabic ? 'أقسام الخدمات' : 'Service Categories', href: '/client-admin/service-categories', icon: Layers }, permission: 'services.view' },
    ], can);

    // 💼 المالية
    const financeGroup: NavItem[] = [
        { title: isArabic ? 'الفواتير' : 'Invoices', href: '/client-admin/invoices', icon: FileText },
        { title: isArabic ? 'تجديد الاشتراك' : 'Renewal', href: '/client-admin/renewal', icon: RefreshCw },
        { title: isArabic ? 'التكاملات' : 'Integrations', href: '/client-admin/integrations', icon: Plug },
    ];

    // 👥 المستخدمون — staff + roles
    const usersGroup = buildGroup([
        { item: { title: isArabic ? 'الموظفون' : 'Staff', href: '/client-admin/staff', icon: Users }, permission: 'staff.view' },
        { item: { title: isArabic ? 'الأدوار والصلاحيات' : 'Roles & Permissions', href: '/client-admin/roles', icon: Shield }, permission: 'staff.view' },
    ], can);

    // 📊 التقارير — subscription reports + customer reviews
    const reportsGroup = buildGroup([
        { item: { title: isArabic ? 'تقرير الاشتراك' : 'Subscription Report', href: '/client-admin/reports/subscriptions', icon: CreditCard }, permission: 'reports.subscriptions' },
        { item: { title: isArabic ? 'آراء العملاء' : 'Customer Reviews', href: '/client-admin/reviews', icon: Star }, permission: 'reviews.view' },
    ], can);

    // 🏢 حساب المنشأة — regroups subscription, invoices, and establishment data.
    // الفواتير/تجديد الاشتراك intentionally appear here in addition to المالية, mirroring the spec.
    const accountGroup = buildGroup([
        { item: { title: isArabic ? 'إدارة الاشتراك' : 'Subscription', href: '/client-admin/renewal', icon: RefreshCw } },
        { item: { title: isArabic ? 'الفواتير' : 'Invoices', href: '/client-admin/invoices', icon: FileText } },
        { item: { title: isArabic ? 'بيانات المنشأة' : 'Establishment Data', href: '/client-admin/hotel-settings', icon: Building2 }, permission: 'hotel_settings.view' },
    ], can);

    // 💬 الرسائل والدعم
    const supportGroup = buildGroup([
        { item: { title: isArabic ? 'الرسائل والدعم' : 'Messages & Support', href: '/client-admin/support', icon: MessageSquare }, permission: 'reports.messages' },
    ], can);

    return (
        <Sidebar collapsible="icon" variant="sidebar" side={isArabic ? 'right' : 'left'}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/client-admin" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={dashboardGroup} label={t('main')} />
                {managementGroup.length > 0 && (
                    <NavMain items={managementGroup} label={isArabic ? 'الإدارة' : 'Management'} />
                )}
                {systemGroup.length > 0 && (
                    <NavMain items={systemGroup} label={isArabic ? 'النظام' : 'System'} />
                )}
                <NavMain items={financeGroup} label={isArabic ? 'المالية' : 'Finance'} />
                {usersGroup.length > 0 && (
                    <NavMain items={usersGroup} label={isArabic ? 'المستخدمون' : 'Users'} />
                )}
                {reportsGroup.length > 0 && (
                    <NavMain items={reportsGroup} label={isArabic ? 'التقارير' : 'Reports'} />
                )}
                {accountGroup.length > 0 && (
                    <NavMain items={accountGroup} label={isArabic ? 'حساب المنشأة' : 'Establishment Account'} />
                )}
                {supportGroup.length > 0 && (
                    <NavMain items={supportGroup} label={isArabic ? 'الدعم' : 'Support'} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
