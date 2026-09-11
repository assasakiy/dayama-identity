import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    User, Shield, Settings2, Share2, Download,
    Trash2, LayoutDashboard, Users, KeyRound, Mail,
    Monitor, PanelLeftClose, PanelLeftOpen, ShieldCheck, Bell, Palette, AppWindow, X
} from 'lucide-react';
import { GlobalToast } from '../Components/GlobalToast';
import { Toaster } from '../Components/ui/toaster';
import { Header, ProfileDropdown, AppDropdown, NotificationDropdown } from './Header';

export { Header, ProfileDropdown, AppDropdown, NotificationDropdown };

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
}

interface NavGroup {
    key: string;
    label: string;
    items: NavItem[];
}

const personalStandalone: NavItem = {
    label: 'Profil Saya',
    href: '/profile',
    icon: User,
};

const personalGroups: NavGroup[] = [
    {
        key: 'account',
        label: 'Akun & Peran',
        items: [
            { label: 'Detail Akun', href: '/profile/details', icon: Settings2 },
            { label: 'Peran Saya', href: '/profile/roles', icon: Shield },
        ],
    },
    {
        key: 'security',
        label: 'Keamanan & Akses',
        items: [
            { label: 'Keamanan', href: '/profile/security', icon: ShieldCheck },
            { label: 'Sesi Aktif', href: '/profile/sessions', icon: Monitor },
            { label: 'Alamat Email', href: '/profile/emails', icon: Mail },
            { label: 'Akun Terhubung', href: '/profile/connected-accounts', icon: Share2 },
        ],
    },
    {
        key: 'preferences',
        label: 'Preferensi & Data',
        items: [
            { label: 'Notifikasi', href: '/profile/notifications', icon: Bell },
            { label: 'Tampilan', href: '/profile/appearance', icon: Palette },
            { label: 'Ekspor Data', href: '/profile/export', icon: Download },
            { label: 'Hapus Akun', href: '/profile/delete', icon: Trash2 },
        ],
    },
];

const adminStandalone: NavItem = {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: 'account.dashboard.view',
};

const adminGroups: NavGroup[] = [
    {
        key: 'access',
        label: 'Akses & Otorisasi',
        items: [
            { label: 'Pengguna', href: '/dashboard/users', icon: Users, permission: 'account.users.view' },
            { label: 'Peran', href: '/dashboard/roles', icon: Shield, permission: 'account.roles.view' },
            { label: 'Izin', href: '/dashboard/permissions', icon: KeyRound, permission: 'account.permissions.view' },
            { label: 'Aplikasi', href: '/dashboard/apps', icon: AppWindow, permission: 'account.apps.view' },
        ],
    },
    {
        key: 'system',
        label: 'Sistem',
        items: [
            { label: 'Pengaturan', href: '/dashboard/settings/authentication', icon: Settings2, permission: 'account.dashboard.view' },
        ],
    },
];

export function Sidebar({ collapsed, mobile, close, toggle }: { collapsed: boolean; mobile: boolean; close: () => void; toggle: () => void }) {
    const { url, props } = usePage<any>();
    const siteName = props.branding?.site_name || props.settings?.general?.site_name || 'Dayama Account';
    const logoUrl = props.branding?.logo_url ?? props.settings?.general?.logo_url ?? null;
    const path = url.split('?')[0];
    const isPersonal = path === '/profile' || path.startsWith('/profile/');

    const standalone = isPersonal
        ? personalStandalone
        : (props.auth?.permissions?.includes('account.dashboard.view') ? adminStandalone : null);

    const rawGroups = isPersonal ? personalGroups : adminGroups;
    const groups = rawGroups.map(g => ({
        ...g,
        items: g.items.filter(item => !item.permission || props.auth?.permissions?.includes(item.permission)),
    })).filter(g => g.items.length > 0);

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        account: true,
        security: true,
        preferences: true,
        access: true,
        system: true,
    });

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-background border-r border-border-subtle shadow-sm transition-all duration-300 ease-in-out overflow-x-hidden w-64 ${
                mobile ? 'translate-x-0' : '-translate-x-full'
            } ${collapsed ? 'lg:translate-x-0 lg:w-20' : 'lg:translate-x-0 lg:w-64'}`}
        >
            <div className={`flex items-center h-16 border-b border-border-subtle shrink-0 px-4 ${collapsed ? 'lg:justify-center' : 'justify-between'}`}>
                <Link href="/profile" className="flex items-center gap-3 overflow-hidden whitespace-nowrap min-w-0">
                    {logoUrl ? (
                        <img src={logoUrl} alt={siteName} className="shrink-0 w-8 h-8 object-contain" />
                    ) : (
                        <span className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-sm font-bold shadow-xs">
                            {siteName.charAt(0)}
                        </span>
                    )}
                    <span className={`font-bold text-lg text-foreground transition-opacity duration-200 truncate ${collapsed ? 'lg:hidden' : 'inline-block'}`}>
                        {siteName}
                    </span>
                </Link>
                <button
                    type="button"
                    onClick={close}
                    aria-label="Tutup navigasi"
                    className="lg:hidden inline-flex items-center justify-center p-1.5 rounded-lg text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors cursor-pointer active:scale-95 shrink-0"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <nav aria-label={isPersonal ? 'Navigasi Pribadi' : 'Navigasi Administrasi'} className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-3 py-4">
                {standalone && (() => {
                    const Icon = standalone.icon;
                    const active = path === standalone.href;
                    return (
                        <Link
                            href={standalone.href}
                            onClick={close}
                            aria-current={active ? 'page' : undefined}
                            className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors overflow-hidden ${
                                active
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground'
                            } ${collapsed ? 'lg:justify-center px-2' : ''}`}
                        >
                            <Icon className="w-[18px] h-[18px] shrink-0" />
                            <span className={`ml-3 whitespace-nowrap truncate transition-all duration-200 ${collapsed ? 'lg:hidden' : 'inline-block'}`}>
                                {standalone.label}
                            </span>
                        </Link>
                    );
                })()}

                {groups.map((group) => {
                    const isExpanded = expandedGroups[group.key] ?? true;
                    return (
                        <div key={group.key} className="pt-2">
                            <button
                                type="button"
                                onClick={() => toggleGroup(group.key)}
                                className={`flex items-center justify-between w-full px-3 py-1.5 group cursor-pointer overflow-hidden ${collapsed ? 'lg:hidden' : ''}`}
                            >
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 group-hover:text-muted-foreground transition-colors text-left truncate">
                                    {group.label}
                                </span>
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`text-muted-foreground/40 group-hover:text-muted-foreground transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                    aria-hidden="true"
                                >
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </button>
                            {(isExpanded || collapsed) && (
                                <div className="space-y-0.5 mt-1">
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        const active = path === item.href || (item.href !== '/dashboard' && item.href !== '/profile' && path.startsWith(item.href + '/'));
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={close}
                                                aria-current={active ? 'page' : undefined}
                                                className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors overflow-hidden ${
                                                    active
                                                        ? 'bg-primary/10 text-primary font-semibold'
                                                        : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground'
                                                } ${collapsed ? 'lg:justify-center px-2' : ''}`}
                                            >
                                                <Icon className="w-[18px] h-[18px] shrink-0" />
                                                <span className={`ml-3 whitespace-nowrap truncate transition-all duration-200 ${collapsed ? 'lg:hidden' : 'inline-block'}`}>
                                                    {item.label}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-border-subtle shrink-0 overflow-hidden">
                <button
                    type="button"
                    onClick={toggle}
                    aria-label={collapsed ? 'Perluas navigasi' : 'Ciutkan navigasi'}
                    className={`hidden lg:flex items-center gap-3 w-full p-2 rounded-lg text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-all cursor-pointer overflow-hidden ${
                        collapsed ? 'justify-center' : 'justify-start'
                    }`}
                >
                    {collapsed ? <PanelLeftOpen className="w-5 h-5 shrink-0" /> : <PanelLeftClose className="w-5 h-5 shrink-0" />}
                    {!collapsed && <span className="text-sm font-medium whitespace-nowrap">Ciutkan</span>}
                </button>
            </div>
        </aside>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobile, setMobile] = useState(false);

    return (
        <div className="h-screen w-screen overflow-hidden bg-surface font-sans text-foreground flex">
            <GlobalToast />
            <Toaster />
            {mobile && (
                <div
                    aria-label="Tutup navigasi"
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity cursor-pointer"
                    onClick={() => setMobile(false)}
                />
            )}
            <Sidebar
                collapsed={collapsed}
                mobile={mobile}
                close={() => setMobile(false)}
                toggle={() => setCollapsed(!collapsed)}
            />
            <div className={`flex flex-col flex-1 h-screen w-full overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                <Header open={() => setMobile(true)} />
                <main className="flex-1 overflow-y-auto bg-surface/50 scroll-smooth">
                    <div className="w-full p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
