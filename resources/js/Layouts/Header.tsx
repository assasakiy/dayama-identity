import React from 'react';
import { Link, usePage, useForm } from '@inertiajs/react';
import {
    User, Shield, Bell, LayoutDashboard, Menu, LogOut, Grid2X2, AppWindow
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Btn } from '@/Components/ui/btn';

export function ProfileDropdown() {
    const { auth } = usePage<any>().props;
    const logout = useForm({});
    const user = auth?.user;
    const initials = (user?.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button aria-label="Menu profil" className="flex items-center gap-2.5 p-1 pl-2.5 pr-1 rounded-full hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 cursor-pointer">
                    <span className="hidden sm:block text-xs font-semibold text-foreground">{user?.name}</span>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs ring-2 ring-background overflow-hidden bg-gradient-to-tr from-primary to-primary/80 shrink-0">
                        {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-border-subtle p-2">
                <div className="px-2 py-2 mb-2 border-b border-border-subtle">
                    <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>Profil Saya</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/profile/security" className="flex items-center gap-2 cursor-pointer">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span>Keamanan Akun</span>
                    </Link>
                </DropdownMenuItem>
                <div className="pt-2 mt-1 border-t border-border-subtle">
                    <Btn
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        loading={logout.processing}
                        icon={<LogOut className="w-4 h-4" />}
                        onClick={() => logout.post('/logout')}
                    >
                        Keluar
                    </Btn>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function AppDropdown() {
    const { apps = [] } = usePage<any>().props;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button aria-label="Aplikasi" className="p-2 rounded-lg text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 cursor-pointer">
                    <Grid2X2 className="w-5 h-5" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-border-subtle p-2">
                <div className="px-2 py-1.5 mb-1 border-b border-border-subtle text-xs font-semibold text-muted-foreground">
                    Aplikasi Terhubung
                </div>
                {apps.map((app: { name: string; url: string; key?: string }) => {
                    const Icon = app.name === 'Account' ? User : (app.name === 'Console' ? LayoutDashboard : AppWindow);

                    return (
                        <DropdownMenuItem key={app.url} asChild>
                            <a href={app.url} className="flex items-center gap-2 cursor-pointer">
                                <Icon className="w-4 h-4 text-primary" />
                                <span>{app.name}</span>
                            </a>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function NotificationDropdown() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button aria-label="Notifikasi" className="relative p-2 rounded-lg text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 cursor-pointer">
                    <Bell className="w-5 h-5" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl overflow-hidden shadow-lg border-border-subtle">
                <div className="p-4 border-b border-border-subtle bg-surface/50 font-semibold text-sm">Notifikasi</div>
                <p className="p-4 text-sm text-muted-foreground">Tidak ada pemberitahuan baru.</p>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function Header({ open }: { open: () => void }) {
    const { props } = usePage<any>();
    const siteName = props.branding?.site_name || props.settings?.general?.site_name || 'Dayama Account';
    const logoUrl = props.branding?.logo_url ?? props.settings?.general?.logo_url ?? null;

    return (
        <header className="shrink-0 z-30 h-16 bg-background/80 border-b border-border-subtle backdrop-blur-xl flex items-center justify-between px-4 lg:px-8 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
                <button
                    type="button"
                    aria-label="Buka navigasi"
                    className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors cursor-pointer active:scale-95 shrink-0"
                    onClick={open}
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Branding hanya tampil di mobile/tablet saat sidebar tertutup */}
                <Link href="/profile" className="flex lg:hidden items-center gap-2.5 min-w-0 overflow-hidden">
                    {logoUrl ? (
                        <img src={logoUrl} alt={siteName} className="w-7 h-7 object-contain shrink-0" />
                    ) : (
                        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold shadow-xs shrink-0">
                            {siteName.charAt(0)}
                        </span>
                    )}
                    <span className="font-bold text-base tracking-tight text-foreground whitespace-nowrap truncate">
                        {siteName}
                    </span>
                </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <AppDropdown />
                <NotificationDropdown />
                <ProfileDropdown />
            </div>
        </header>
    );
}
