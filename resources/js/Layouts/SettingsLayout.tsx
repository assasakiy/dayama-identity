import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Shield, Share2, LogIn, UserPlus, Bell, Palette } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const navItems = [
    { label: 'Autentikasi', href: '/dashboard/settings/authentication', icon: Shield },
    { label: 'Integrasi', href: '/dashboard/settings/integrations', icon: Share2 },
    { label: 'Halaman Masuk', href: '/dashboard/settings/login-page', icon: LogIn },
    { label: 'Halaman Daftar', href: '/dashboard/settings/register-page', icon: UserPlus },
    { label: 'Notifikasi & SMTP', href: '/dashboard/settings/notifications', icon: Bell },
    { label: 'Branding', href: '/dashboard/settings/branding', icon: Palette },
];

export default function SettingsLayout({
    children,
    title,
    description,
}: {
    children: React.ReactNode;
    title: string;
    description?: string;
}) {
    const { url } = usePage();
    const currentPath = url.split('?')[0];

    return (
        <DashboardLayout>
            <div className="pb-10 max-w-5xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
                </div>

                <div className="flex border-b border-border-subtle mb-6 overflow-x-auto space-x-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = currentPath === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                                    active
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {children}
            </div>
        </DashboardLayout>
    );
}
