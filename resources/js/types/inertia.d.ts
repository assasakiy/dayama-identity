import type { Page } from '@inertiajs/core';

/**
 * Global Inertia shared props type augmentation.
 * Defines the shape of `usePage().props` across the entire dashboard.
 */
declare module '@inertiajs/core' {
    interface PageProps {
        auth: {
            user: {
                id: string;
                name: string;
                email: string;
                username?: string;
                avatar?: string | null;
                avatar_url?: string | null;
                biography?: string | null;
                website?: string | null;
                status?: string;
                email_verified_at?: string | null;
                created_at?: string;
                highest_rank?: number;
                is_primary_super_admin?: boolean;
                is_protected?: boolean;
                is_verified?: boolean;
            };
            roles?: string[];
            permissions: string[];
        };
        flash?: {
            status?: string;
            success?: string;
            error?: string;
            info?: string;
        };
        errors?: Record<string, string>;
        ziggy?: Record<string, unknown>;
    }
}

export {};
