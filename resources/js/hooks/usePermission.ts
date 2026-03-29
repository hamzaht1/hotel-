import { usePage } from '@inertiajs/react';

interface AuthUser {
    id: number;
    role: string;
    permissions?: string[];
}

export function usePermission() {
    const { auth } = usePage<{ auth: { user: AuthUser | null } }>().props;

    const can = (key: string): boolean => {
        if (!auth.user) return false;
        // Admins have all permissions
        if (auth.user.role === 'super_admin' || auth.user.role === 'client_admin') return true;
        return auth.user.permissions?.includes(key) ?? false;
    };

    const canAny = (keys: string[]): boolean => {
        return keys.some((key) => can(key));
    };

    return { can, canAny };
}
