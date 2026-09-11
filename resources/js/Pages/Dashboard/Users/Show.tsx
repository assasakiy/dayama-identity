import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import {
    ArrowLeft,
    Pencil,
    KeyRound,
    ShieldAlert,
    ShieldCheck,
    BadgeCheck,
    Lock,
    User as UserIcon,
    Layers,
    Shield,
} from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import { Btn } from '@/Components/ui/btn';
import { UserSummaryTab } from './UserSummaryTab';
import { UserRolesTab } from './UserRolesTab';
import { UserSecurityTab } from './UserSecurityTab';

interface Props {
    user: any;
    available_roles: any[];
    login_history?: any[];
    emails?: any[];
    connected_accounts?: any[];
}

export default function UserShow({
    user,
    available_roles = [],
    login_history = [],
    emails = [],
    connected_accounts = [],
}: Props) {
    const [tab, setTab] = useState<'ringkasan' | 'akses' | 'keamanan'>('ringkasan');
    const [resetting, setResetting] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(false);

    const avatarInitial = (user.name || 'U').charAt(0).toUpperCase();

    const handleResetPassword = () => {
        if (!confirm(`Kirim tautan reset kata sandi ke email ${user.email}?`)) return;
        setResetting(true);
        router.post('/forgot-password', { email: user.email }, {
            preserveScroll: true,
            onFinish: () => setResetting(false),
        });
    };

    const handleToggleStatus = () => {
        const nextStatus = user.status === 'active' ? 'inactive' : 'active';
        const label = nextStatus === 'active' ? 'mengaktifkan' : 'menonaktifkan (suspend)';
        if (!confirm(`Apakah Anda yakin ingin ${label} akun ${user.name}?`)) return;
        setTogglingStatus(true);
        router.put(`/dashboard/users/${user.id}`, { status: nextStatus }, {
            preserveScroll: true,
            onFinish: () => setTogglingStatus(false),
        });
    };

    const tabs = [
        { key: 'ringkasan' as const, label: 'Ringkasan & Profil', icon: UserIcon },
        { key: 'akses' as const, label: 'Peran & Akses (RBAC)', icon: ShieldCheck },
        { key: 'keamanan' as const, label: 'Keamanan & Riwayat', icon: Lock },
    ];

    return (
        <DashboardLayout>
            <Head title={`Pengguna: ${user.name}`} />
            <div className="space-y-6 w-full">
                {/* Back link */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/users"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-background hover:bg-surface-muted transition-colors shadow-xs"
                        aria-label="Kembali ke daftar pengguna"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Detail Pengguna</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Kelola informasi akun, peran, dan riwayat keamanan</p>
                    </div>
                </div>

                {/* Banner & Identity Header */}
                <div className="bg-background border border-border-subtle rounded-2xl overflow-hidden shadow-xs">
                    {/* Top Banner Strip */}
                    <div className="h-36 sm:h-44 w-full bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40 relative">
                        {user.banner && (
                            <img src={user.banner} alt="" className="w-full h-full object-cover" />
                        )}
                    </div>

                    {/* Profile Header Content */}
                    <div className="px-6 pb-6 pt-2 relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-4">
                            <div className="flex items-end gap-4">
                                <div className="w-24 h-24 rounded-full border-4 border-background bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-3xl font-bold shadow-md overflow-hidden shrink-0 relative z-10">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        avatarInitial
                                    )}
                                </div>
                                <div className="space-y-1 pb-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-xl font-bold text-foreground flex items-center gap-1.5">
                                            {user.name}
                                            {user.is_verified && (
                                                <BadgeCheck className="w-5 h-5 text-primary fill-primary/10" />
                                            )}
                                        </h2>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-mono">
                                        @{user.username} · {user.email}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                                <Btn
                                    size="sm"
                                    variant="outline"
                                    loading={resetting}
                                    icon={<KeyRound className="w-4 h-4" />}
                                    onClick={handleResetPassword}
                                >
                                    Reset Password
                                </Btn>
                                {user.can.update && !user.is_primary_super_admin && (
                                    <Btn
                                        size="sm"
                                        variant={user.status === 'active' ? 'danger' : 'outline'}
                                        loading={togglingStatus}
                                        icon={<ShieldAlert className="w-4 h-4" />}
                                        onClick={handleToggleStatus}
                                    >
                                        {user.status === 'active' ? 'Suspend Akun' : 'Aktifkan Akun'}
                                    </Btn>
                                )}
                                {user.can.update && (
                                    <Link
                                        href={`/dashboard/users/${user.id}/edit`}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                                    >
                                        <Pencil className="w-3.5 h-3.5" /> Edit Pengguna
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Badges Strip */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border-subtle">
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {user.status === 'active' ? 'Aktif' : 'Nonaktif / Suspended'}
                            </Badge>
                            {user.is_verified ? (
                                <Badge variant="outline" className="text-xs text-primary border-primary/20 bg-primary/5">
                                    Email Terverifikasi
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-xs">
                                    Email Belum Terverifikasi
                                </Badge>
                            )}
                            {user.is_protected && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                                    <Lock className="w-3 h-3" /> Akun Terlindungi
                                </span>
                            )}
                            {user.roles?.map((r: string) => (
                                <span key={r} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-muted border border-border-subtle text-foreground">
                                    <Shield className="w-3 h-3 text-primary" /> {r}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex gap-1 border-b border-border-subtle">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        const active = tab === t.key;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setTab(t.key)}
                                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                                    active
                                        ? 'border-primary text-primary font-semibold'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{t.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Contents */}
                <div className="pt-2">
                    {tab === 'ringkasan' && <UserSummaryTab user={user} />}
                    {tab === 'akses' && (
                        <UserRolesTab
                            userId={user.id}
                            canUpdate={user.can.update}
                            assignments={user.role_assignments}
                            availableRoles={available_roles}
                        />
                    )}
                    {tab === 'keamanan' && (
                        <UserSecurityTab
                            isTwoFactorEnabled={user.is_two_factor_enabled}
                            loginHistory={login_history}
                            emails={emails}
                            connectedAccounts={connected_accounts}
                        />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
