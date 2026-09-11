import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import {
    ShieldCheck,
    ShieldOff,
    Clock,
    CheckCircle2,
    XCircle,
    Mail,
    Link2,
    Smartphone,
    Globe,
} from 'lucide-react';

interface LoginHistoryItem {
    id: number;
    when: string;
    ip: string;
    user_agent: string;
    successful: boolean;
}

interface EmailItem {
    id: string;
    email: string;
    is_primary: boolean;
    verified_at: string | null;
}

interface ConnectedAccountItem {
    id: string;
    provider: string;
    email: string | null;
    connected_at: string;
}

interface Props {
    isTwoFactorEnabled: boolean;
    loginHistory?: LoginHistoryItem[];
    emails?: EmailItem[];
    connectedAccounts?: ConnectedAccountItem[];
}

export function UserSecurityTab({
    isTwoFactorEnabled,
    loginHistory = [],
    emails = [],
    connectedAccounts = [],
}: Props) {
    return (
        <div className="space-y-6">
            {/* 2FA Status Card */}
            <Card>
                <CardHeader className="border-b border-border-subtle pb-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        {isTwoFactorEnabled ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        ) : (
                            <ShieldOff className="w-4 h-4 text-amber-500" />
                        )}
                        Autentikasi Dua Faktor (2FA)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border-subtle bg-surface/40">
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                {isTwoFactorEnabled ? '2FA Aktif' : '2FA Belum Diaktifkan'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isTwoFactorEnabled
                                    ? 'Akun ini dilindungi kode sandi TOTP dari aplikasi autentikator setiap kali masuk.'
                                    : 'Pengguna dapat mengaktifkan 2FA secara mandiri melalui menu Pengaturan Keamanan Akun.'}
                            </p>
                        </div>
                        <Badge variant={isTwoFactorEnabled ? 'default' : 'secondary'} className="self-start sm:self-auto text-xs">
                            {isTwoFactorEnabled ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Email Addresses */}
            {emails.length > 0 && (
                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" /> Alamat Email Terdaftar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 divide-y divide-border-subtle">
                        {emails.map((e) => (
                            <div key={e.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                                <div>
                                    <p className="text-sm font-medium">{e.email}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {e.verified_at ? `Terverifikasi pada ${e.verified_at}` : 'Belum diverifikasi'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {e.is_primary && (
                                        <Badge variant="default" className="text-[10px]">Utama</Badge>
                                    )}
                                    <Badge variant={e.verified_at ? 'outline' : 'secondary'} className="text-[10px]">
                                        {e.verified_at ? 'Terverifikasi' : 'Tertunda'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Connected Accounts */}
            {connectedAccounts.length > 0 && (
                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-primary" /> Akun Sosial Terhubung
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 divide-y divide-border-subtle">
                        {connectedAccounts.map((c) => (
                            <div key={c.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">{c.provider}</p>
                                        <p className="text-xs text-muted-foreground">{c.email || 'Tertaut'} · sejak {c.connected_at}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[10px]">Terhubung</Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Login History Table */}
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-background shadow-xs">
                <div className="px-5 py-4 border-b border-border-subtle bg-surface/30">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" /> Riwayat Masuk Terbaru
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Catatan aktivitas upaya login pengguna ke sistem</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="border-b border-border-subtle bg-surface-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-2.5 text-left font-medium">Waktu</th>
                                <th className="px-4 py-2.5 text-left font-medium">Alamat IP</th>
                                <th className="px-4 py-2.5 text-left font-medium">Peramban / Klien</th>
                                <th className="px-4 py-2.5 text-right font-medium">Hasil</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loginHistory.map((h) => (
                                <tr key={h.id} className="hover:bg-surface-muted/30 transition-colors">
                                    <td className="px-4 py-2.5 font-medium">{h.when}</td>
                                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{h.ip}</td>
                                    <td className="px-4 py-2.5 text-muted-foreground">{h.user_agent}</td>
                                    <td className="px-4 py-2.5 text-right">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                            h.successful
                                                ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                                                : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                                        }`}>
                                            {h.successful ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                            {h.successful ? 'Berhasil' : 'Gagal'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!loginHistory.length && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground text-xs">
                                        Belum ada riwayat aktivitas masuk yang tercatat.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
