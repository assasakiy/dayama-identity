import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Users,
    Shield,
    UserPlus,
    Settings,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Clock,
    ShieldCheck,
} from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';

interface RecentUser {
    id: string;
    name: string;
    email: string;
    status: string;
    created_at: string | null;
}

interface RecentLogin {
    id: number;
    user_name: string;
    user_email: string | null;
    ip_address: string | null;
    successful: boolean;
    created_at: string | null;
}

interface RoleSummary {
    id: string;
    name: string;
    rank: number;
    users_count: number;
}

interface Props {
    stats: {
        users_count: number;
        active_users_count: number;
        roles_count: number;
    };
    recent_users: RecentUser[];
    recent_logins: RecentLogin[];
    roles_summary: RoleSummary[];
}

export default function Index({
    stats,
    recent_users,
    recent_logins,
    roles_summary,
}: Props) {
    const mainCards = [
        {
            label: 'Total Pengguna',
            value: stats.users_count,
            sub: `${stats.active_users_count} akun aktif`,
            href: '/dashboard/users',
            Icon: Users,
            color: 'text-primary',
            bg: 'bg-primary/10',
        },
        {
            label: 'Peran Sistem',
            value: stats.roles_count,
            sub: 'Hierarki hak & matriks izin',
            href: '/dashboard/roles',
            Icon: Shield,
            color: 'text-violet-600 dark:text-violet-400',
            bg: 'bg-violet-500/10',
        },
    ];

    return (
        <DashboardLayout>
            <Head title="Dasbor Konsol" />
            <div className="space-y-6 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dasbor Konsol</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Pusat kendali identitas digital dan hak otorisasi Dayama Platform
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2.5">
                        <Link
                            href="/dashboard/users/create"
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                        >
                            <UserPlus className="w-3.5 h-3.5" /> Pengguna Baru
                        </Link>
                        <Link
                            href="/dashboard/settings/authentication"
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-subtle bg-background px-3.5 text-xs font-medium text-foreground hover:bg-surface-muted transition-colors shadow-xs"
                        >
                            <Settings className="w-3.5 h-3.5" /> Pengaturan
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mainCards.map((c) => (
                        <Link key={c.label} href={c.href} className="group block">
                            <Card className="hover:border-primary/40 hover:shadow-xs transition-all">
                                <CardContent className="pt-5 pb-5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
                                        <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.color} flex items-center justify-center transition-colors`}>
                                            <c.Icon className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{c.value}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="overflow-hidden rounded-xl border border-border-subtle bg-background shadow-xs">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface/30">
                                <div>
                                    <h2 className="text-sm font-semibold flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" /> Aktivitas Masuk Terbaru
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Catatan upaya autentikasi terakhir ke akun</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="border-b border-border-subtle bg-surface-muted/40">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Pengguna</th>
                                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Alamat IP</th>
                                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Waktu</th>
                                            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y border-border-subtle">
                                        {recent_logins.map((l) => (
                                            <tr key={l.id} className="hover:bg-surface-muted/30 transition-colors">
                                                <td className="px-4 py-2.5">
                                                    <p className="font-semibold text-foreground">{l.user_name}</p>
                                                    {l.user_email && <p className="text-[11px] text-muted-foreground">{l.user_email}</p>}
                                                </td>
                                                <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                                                    {l.ip_address || '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-muted-foreground">
                                                    {l.created_at ? new Date(l.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                                        l.successful
                                                            ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                                                            : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                                                    }`}>
                                                        {l.successful ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                        {l.successful ? 'Berhasil' : 'Gagal'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {!recent_logins.length && (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-muted-foreground">Belum ada riwayat masuk.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border-subtle bg-background shadow-xs">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface/30">
                                <div>
                                    <h2 className="text-sm font-semibold flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary" /> Pengguna Terdaftar Terbaru
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Akun yang baru dibuat dalam sistem</p>
                                </div>
                                <Link href="/dashboard/users" className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium">
                                    Lihat Semua <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="divide-y divide-border-subtle">
                                {recent_users.map((u) => (
                                    <div key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-muted/30 transition-colors">
                                        <div>
                                            <Link href={`/dashboard/users/${u.id}`} className="font-semibold text-sm hover:text-primary transition-colors">
                                                {u.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground">{u.email}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={u.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                                                {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="border-b border-border-subtle pb-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-primary" /> Peran Utama
                                </CardTitle>
                                <Link href="/dashboard/roles" className="text-xs text-primary hover:underline font-medium">
                                    Kelola
                                </Link>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-2.5">
                                {roles_summary.map((r) => (
                                    <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-muted/40 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                                {r.rank}
                                            </span>
                                            <span className="text-xs font-semibold">{r.name}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {r.users_count} pengguna
                                        </span>
                                    </div>
                                ))}
                                {!roles_summary.length && <p className="text-xs text-muted-foreground text-center py-4">Belum ada peran.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
