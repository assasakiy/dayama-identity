import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { auth } = usePage().props as any;
    const permissions: string[] = auth?.permissions || [];
    const roles: string[] = auth?.roles || [];
    const user = auth?.user || null;

    const hasPermission = (permission: string) => !!user && permissions.includes(permission);

    const hasRole = (role: string) => {
        if (!user) return false;
        return roles.includes(role);
    };

    return {
        can: hasPermission,
        hasRole,
        permissions,
        roles,
    };
}
