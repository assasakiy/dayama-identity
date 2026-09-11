import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Bell, Mail, Save, CheckCircle2, AlertCircle, Send, ShieldAlert, Lock } from 'lucide-react';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Btn } from '@/Components/ui/btn';
import { Badge } from '@/Components/ui/badge';
import { Switch } from '@/Components/ui/switch';

interface Props {
    settings: Record<string, any>;
}

export default function Notifications({ settings }: Props) {
    const tiers = settings._tiers || {};
    const smtpConfigured = tiers.smtp?.configured ?? false;

    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        smtp_host: settings.smtp?.host ?? '',
        smtp_port: Number(settings.smtp?.port ?? 587),
        smtp_username: settings.smtp?.username ?? '',
        smtp_password: '',
        smtp_encryption: settings.smtp?.encryption ?? 'tls',
        smtp_from_address: settings.smtp?.from_address ?? 'noreply@dayama.test',
        smtp_from_name: settings.smtp?.from_name ?? 'Dayama Account',
        smtp_active: Boolean(settings.smtp?.active ?? false),

        rules_security_alerts_active: Boolean(settings.rules?.security_alerts?.active ?? false),
        rules_login_alerts_active: Boolean(settings.rules?.login_alerts?.active ?? false),
        rules_account_updates_active: Boolean(settings.rules?.account_updates?.active ?? false),
        rules_newsletter_active: Boolean(settings.rules?.newsletter?.active ?? false),
    });

    const [testingSmtp, setTestingSmtp] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/dashboard/settings/notifications', { preserveScroll: true });
    };

    const handleTestSmtp = () => {
        setTestingSmtp(true);
        router.post('/dashboard/settings/notifications/test-smtp', {}, {
            preserveScroll: true,
            onFinish: () => setTestingSmtp(false),
        });
    };

    return (
        <SettingsLayout
            title="Pengaturan Notifikasi & SMTP"
            description="Konfigurasi server SMTP dan aturan notifikasi akun. Aturan notifikasi wajib diaktifkan setelah SMTP aktif."
        >
            <form onSubmit={submit} className="space-y-6">
                {recentlySuccessful && (
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Pengaturan notifikasi berhasil disimpan.
                    </div>
                )}

                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4 flex flex-row items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-primary" /> Konfigurasi SMTP
                                </CardTitle>
                                <Badge variant={smtpConfigured ? 'outline' : 'secondary'}>
                                    {smtpConfigured ? 'Terkonfigurasi' : 'Belum Lengkap'}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                SMTP harus dikonfigurasi dan berstatus aktif sebelum aturan notifikasi email dapat diaktifkan.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant={data.smtp_active ? 'success' : 'secondary'}>
                                {data.smtp_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                            <Switch
                                checked={data.smtp_active}
                                onCheckedChange={(val) => setData('smtp_active', val)}
                                disabled={!smtpConfigured && !data.smtp_host}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {errors.smtp_active && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {errors.smtp_active}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">SMTP Host</label>
                                <input
                                    type="text"
                                    value={data.smtp_host}
                                    onChange={(e) => setData('smtp_host', e.target.value)}
                                    placeholder="smtp.mailtrap.io atau mail.dayama.test"
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">SMTP Port</label>
                                <input
                                    type="number"
                                    value={data.smtp_port}
                                    onChange={(e) => setData('smtp_port', Number(e.target.value))}
                                    placeholder="587"
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Enkripsi</label>
                                <select
                                    value={data.smtp_encryption}
                                    onChange={(e) => setData('smtp_encryption', e.target.value)}
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                >
                                    <option value="tls">TLS</option>
                                    <option value="ssl">SSL</option>
                                    <option value="none">None</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Username</label>
                                <input
                                    type="text"
                                    value={data.smtp_username}
                                    onChange={(e) => setData('smtp_username', e.target.value)}
                                    placeholder="username"
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 flex items-center justify-between">
                                    <span>Password</span>
                                    {Boolean(settings.has_smtp_password) && (
                                        <span className="text-xs text-emerald-600 dark:text-emerald-400">Tersimpan</span>
                                    )}
                                </label>
                                <input
                                    type="password"
                                    value={data.smtp_password}
                                    onChange={(e) => setData('smtp_password', e.target.value)}
                                    placeholder={Boolean(settings.has_smtp_password) ? '•••••••• (Tersimpan)' : 'Masukkan Password'}
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Alamat Pengirim (From Email)</label>
                                <input
                                    type="email"
                                    value={data.smtp_from_address}
                                    onChange={(e) => setData('smtp_from_address', e.target.value)}
                                    placeholder="noreply@dayama.test"
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Nama Pengirim (From Name)</label>
                                <input
                                    type="text"
                                    value={data.smtp_from_name}
                                    onChange={(e) => setData('smtp_from_name', e.target.value)}
                                    placeholder="Dayama Account"
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Btn
                                type="button"
                                variant="secondary"
                                onClick={handleTestSmtp}
                                loading={testingSmtp}
                                disabled={!data.smtp_active}
                                icon={<Send className="w-4 h-4" />}
                            >
                                Uji Coba Koneksi SMTP
                            </Btn>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Bell className="w-5 h-5 text-primary" /> Aturan Notifikasi Sistem
                            </CardTitle>
                            <Badge variant={data.smtp_active ? 'outline' : 'secondary'}>
                                {data.smtp_active ? 'SMTP Siap' : 'Terkunci (Perlu SMTP Aktif)'}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Aturan berikut hanya dapat diaktifkan apabila SMTP telah aktif. Pengguna <strong>tidak dapat memilih keluar (opt-out)</strong> dari notifikasi keamanan wajib.
                        </p>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="divide-y divide-border-subtle">
                            <div className="py-3 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-emerald-600" />
                                        <span className="text-sm font-medium">Peringatan Keamanan Akun (Wajib)</span>
                                        <Badge variant="default" className="text-xs">Wajib Non-Opt-Out</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Notifikasi pergantian kata sandi, aktivasi/deaktivasi 2FA. Pengguna tidak dapat menonaktifkan ini.
                                    </p>
                                    {errors.rules_security_alerts_active && (
                                        <p className="text-xs text-destructive mt-1">{errors.rules_security_alerts_active}</p>
                                    )}
                                </div>
                                <Switch
                                    checked={data.rules_security_alerts_active}
                                    onCheckedChange={(val) => setData('rules_security_alerts_active', val)}
                                    disabled={!data.smtp_active}
                                />
                            </div>

                            <div className="py-3 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-emerald-600" />
                                        <span className="text-sm font-medium">Peringatan Masuk Perangkat Baru (Wajib)</span>
                                        <Badge variant="default" className="text-xs">Wajib Non-Opt-Out</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Notifikasi ketika ada sesi masuk dari IP atau browser baru.
                                    </p>
                                    {errors.rules_login_alerts_active && (
                                        <p className="text-xs text-destructive mt-1">{errors.rules_login_alerts_active}</p>
                                    )}
                                </div>
                                <Switch
                                    checked={data.rules_login_alerts_active}
                                    onCheckedChange={(val) => setData('rules_login_alerts_active', val)}
                                    disabled={!data.smtp_active}
                                />
                            </div>

                            <div className="py-3 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-emerald-600" />
                                        <span className="text-sm font-medium">Pembaruan Email & Data Sensitif (Wajib)</span>
                                        <Badge variant="default" className="text-xs">Wajib Non-Opt-Out</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Notifikasi ketika email utama diubah atau ditambahkan.
                                    </p>
                                    {errors.rules_account_updates_active && (
                                        <p className="text-xs text-destructive mt-1">{errors.rules_account_updates_active}</p>
                                    )}
                                </div>
                                <Switch
                                    checked={data.rules_account_updates_active}
                                    onCheckedChange={(val) => setData('rules_account_updates_active', val)}
                                    disabled={!data.smtp_active}
                                />
                            </div>

                            <div className="py-3 flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium">Kabar Berita & Update Produk (Opsional)</span>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Pengguna dapat memilih keluar (opt-out) dari preferensi profil mereka.
                                    </p>
                                    {errors.rules_newsletter_active && (
                                        <p className="text-xs text-destructive mt-1">{errors.rules_newsletter_active}</p>
                                    )}
                                </div>
                                <Switch
                                    checked={data.rules_newsletter_active}
                                    onCheckedChange={(val) => setData('rules_newsletter_active', val)}
                                    disabled={!data.smtp_active}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Btn type="submit" loading={processing} icon={<Save className="w-4 h-4" />}>
                        Simpan Perubahan
                    </Btn>
                </div>
            </form>
        </SettingsLayout>
    );
}
