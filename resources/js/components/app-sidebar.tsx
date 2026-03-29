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
} from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { t } = useT();
    const { isArabic } = useLocale();
    const { can, canAny } = usePermission();

    const clientDashboard: NavItem[] = [
        { title: t('dashboard'), href: '/client-admin', icon: LayoutGrid },
    ];

    const allManagement: { item: NavItem; permission: string }[] = [
        { item: { title: t('rooms'), href: '/client-admin/rooms', icon: BedDouble }, permission: 'rooms.view' },
        { item: { title: t('gallery'), href: '/client-admin/gallery', icon: Image }, permission: 'gallery.view' },
        { item: { title: t('site_texts'), href: '/client-admin/site-texts', icon: FileText }, permission: 'site_texts.view' },
        { item: { title: t('sections'), href: '/client-admin/site-sections', icon: ToggleRight }, permission: 'site_sections.view' },
        { item: { title: t('contact'), href: '/client-admin/contact-settings', icon: Phone }, permission: 'contact.view' },
        { item: { title: t('hotel_settings'), href: '/client-admin/hotel-settings', icon: Settings }, permission: 'hotel_settings.view' },
        { item: { title: isArabic ? 'أقسام الخدمات' : 'Service Categories', href: '/client-admin/service-categories', icon: Layers }, permission: 'services.view' },
        { item: { title: isArabic ? 'الخدمات' : 'Services', href: '/client-admin/services', icon: Sparkles }, permission: 'services.view' },
    ];

    const clientManagement = allManagement
        .filter(({ permission }) => can(permission))
        .map(({ item }) => item);

    const invoicesNav: NavItem[] = [
        { title: isArabic ? 'الفواتير' : 'Invoices', href: '/client-admin/invoices', icon: FileText },
        { title: isArabic ? 'تجديد الاشتراك' : 'Renewal', href: '/client-admin/renewal', icon: RefreshCw },
        { title: isArabic ? 'التكاملات' : 'Integrations', href: '/client-admin/integrations', icon: Plug },
    ];

    const allReports: { item: NavItem; permission: string }[] = [
        { item: { title: isArabic ? 'تقرير الاشتراك' : 'Subscription', href: '/client-admin/reports/subscriptions', icon: CreditCard }, permission: 'reports.subscriptions' },
        { item: { title: isArabic ? 'الرسائل والدعم' : 'Messages & Support', href: '/client-admin/reports/messages', icon: MessageSquare }, permission: 'reports.messages' },
    ];

    const clientReports = allReports
        .filter(({ permission }) => can(permission))
        .map(({ item }) => item);

    const staffNav: NavItem[] = [];
    if (can('staff.view')) {
        staffNav.push({ title: isArabic ? 'الموظفون' : 'Staff', href: '/client-admin/staff', icon: Users });
        staffNav.push({ title: isArabic ? 'الأدوار والصلاحيات' : 'Roles & Permissions', href: '/client-admin/roles', icon: Shield });
    }

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
                <NavMain items={clientDashboard} label={t('main')} />
                {clientManagement.length > 0 && (
                    <NavMain items={clientManagement} label={t('management')} />
                )}
                <NavMain items={invoicesNav} label={isArabic ? 'المالية' : 'Finance'} />
                {staffNav.length > 0 && (
                    <NavMain items={staffNav} label={isArabic ? 'الموظفون' : 'Staff'} />
                )}
                {clientReports.length > 0 && (
                    <NavMain items={clientReports} label={isArabic ? 'التقارير' : 'Reports'} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
