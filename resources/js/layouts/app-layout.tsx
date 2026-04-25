import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import ReviewPopup from '@/components/review-popup';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
        <ReviewPopup />
    </AppLayoutTemplate>
);
