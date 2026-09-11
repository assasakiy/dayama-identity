import React from 'react';
import { useForm } from '@inertiajs/react';
import { Save, CheckCircle2, AlertCircle, Smartphone, Globe } from 'lucide-react';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Btn } from '@/Components/ui/btn';
import { Badge } from '@/Components/ui/badge';
import { Switch } from '@/Components/ui/switch';

interface Props {
    settings: Record<string, any>;
}

export default function Integrations({ settings }: Props) {
    const tiers = settings._tiers || {};

    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        google_client_id: settings.google?.client_id ?? '',
        google_client_secret: '',
        google_redirect_url: settings.google?.redirect_url ?? '',
        google_active: Boolean(settings.google?.active ?? false),
        google_priority: Number(settings.google?.priority ?? 1),

        github_client_id: settings.github?.client_id ?? '',
        github_client_secret: '',
        github_redirect_url: settings.github?.redirect_url ?? '',
        github_active: Boolean(settings.github?.active ?? false),
        github_priority: Number(settings.github?.priority ?? 2),

        facebook_client_id: settings.facebook?.client_id ?? '',
        facebook_client_secret: '',
        facebook_redirect_url: settings.facebook?.redirect_url ?? '',
        facebook_active: Boolean(settings.facebook?.active ?? false),
        facebook_priority: Number(settings.facebook?.priority ?? 3),

        discord_client_id: settings.discord?.client_id ?? '',
        discord_client_secret: '',
        discord_redirect_url: settings.discord?.redirect_url ?? '',
        discord_active: Boolean(settings.discord?.active ?? false),
        discord_priority: Number(settings.discord?.priority ?? 4),

        whatsapp_provider: settings.whatsapp?.provider ?? 'fonnte',
        whatsapp_api_key: '',
        whatsapp_sender_number: settings.whatsapp?.sender_number ?? '',

        sms_provider: settings.sms?.provider ?? 'twilio',
        sms_account_sid: settings.sms?.account_sid ?? '',
        sms_auth_token: '',
        sms_api_key: '',
        sms_sender_number: settings.sms?.sender_number ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/dashboard/settings/integrations', { preserveScroll: true });
    };

    const oauthProviders = [
        {
            key: 'google',
            name: 'Google OAuth (Prioritas Utama)',
            badge: 'Prioritas 1',
            desc: 'Autentikasi SSO Google Workspace & Akun Google.',
            configured: tiers.google?.configured ?? false,
            hasSecret: settings.has_google_client_secret ?? false,
        },
        {
            key: 'github',
            name: 'GitHub OAuth',
            badge: 'Prioritas 2',
            desc: 'Autentikasi akun GitHub untuk developer & pengguna.',
            configured: tiers.github?.configured ?? false,
            hasSecret: settings.has_github_client_secret ?? false,
        },
        {
            key: 'facebook',
            name: 'Facebook OAuth',
            badge: 'Prioritas 3',
            desc: 'Autentikasi via Facebook Login.',
            configured: tiers.facebook?.configured ?? false,
            hasSecret: settings.has_facebook_client_secret ?? false,
        },
        {
            key: 'discord',
            name: 'Discord OAuth',
            badge: 'Prioritas 4',
            desc: 'Autentikasi komunitas via Discord Login.',
            configured: tiers.discord?.configured ?? false,
            hasSecret: settings.has_discord_client_secret ?? false,
        },
    ];

    return (
        <SettingsLayout
            title="Pengaturan Integrasi"
            description="Konfigurasi penyedia OAuth (Google Prioritas, GitHub, Facebook, Discord) dan Gateway OTP (WhatsApp, SMS)."
        >
            <form onSubmit={submit} className="space-y-6">
                {recentlySuccessful && (
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Pengaturan integrasi berhasil disimpan.
                    </div>
                )}

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" /> Penyedia OAuth Social Login
                    </h2>

                    {oauthProviders.map((provider) => {
                        const key = provider.key;
                        const activeKey = `${key}_active` as keyof typeof data;
                        const clientIdKey = `${key}_client_id` as keyof typeof data;
                        const clientSecretKey = `${key}_client_secret` as keyof typeof data;
                        const redirectUrlKey = `${key}_redirect_url` as keyof typeof data;
                        const priorityKey = `${key}_priority` as keyof typeof data;
                        const errorActive = (errors as any)[`${key}_active`];

                        return (
                            <Card key={key} className={key === 'google' ? 'border-primary/40 shadow-sm' : ''}>
                                <CardHeader className="border-b border-border-subtle pb-4 flex flex-row items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-base font-semibold">{provider.name}</CardTitle>
                                            <Badge variant={provider.configured ? 'outline' : 'secondary'}>
                                                {provider.configured ? 'Terkonfigurasi' : 'Kredensial Belum Lengkap'}
                                            </Badge>
                                            {provider.badge && (
                                                <Badge variant="default" className="text-xs">
                                                    {provider.badge}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{provider.desc}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={Boolean(data[activeKey]) ? 'success' : 'secondary'}>
                                            {Boolean(data[activeKey]) ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                        <Switch
                                            checked={Boolean(data[activeKey])}
                                            onCheckedChange={(val) => setData(activeKey, val as any)}
                                            disabled={!provider.configured && !data[clientIdKey]}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    {errorActive && (
                                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 shrink-0" /> {errorActive}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Client ID</label>
                                            <input
                                                type="text"
                                                value={String(data[clientIdKey] ?? '')}
                                                onChange={(e) => setData(clientIdKey, e.target.value as any)}
                                                placeholder={`Masukkan ${provider.name} Client ID`}
                                                className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1.5 flex items-center justify-between">
                                                <span>Client Secret</span>
                                                {provider.hasSecret && (
                                                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                                        Tersimpan Terenkripsi
                                                    </span>
                                                )}
                                            </label>
                                            <input
                                                type="password"
                                                value={String(data[clientSecretKey] ?? '')}
                                                onChange={(e) => setData(clientSecretKey, e.target.value as any)}
                                                placeholder={provider.hasSecret ? '•••••••• (Biarkan kosong jika tidak berubah)' : 'Masukkan Client Secret'}
                                                className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Custom Redirect URL (Opsional)</label>
                                            <input
                                                type="text"
                                                value={String(data[redirectUrlKey] ?? '')}
                                                onChange={(e) => setData(redirectUrlKey, e.target.value as any)}
                                                placeholder={`/auth/${key}/callback`}
                                                className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Prioritas Tampilan</label>
                                            <input
                                                type="number"
                                                value={Number(data[priorityKey] ?? 1)}
                                                onChange={(e) => setData(priorityKey, Number(e.target.value) as any)}
                                                className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="space-y-4 pt-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-primary" /> Gateway Pengiriman OTP (WhatsApp & SMS)
                    </h2>

                    <Card>
                        <CardHeader className="border-b border-border-subtle pb-4">
                            <CardTitle className="text-base font-semibold">Gateway WhatsApp</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Provider</label>
                                    <select
                                        value={data.whatsapp_provider}
                                        onChange={(e) => setData('whatsapp_provider', e.target.value)}
                                        className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                    >
                                        <option value="fonnte">Fonnte</option>
                                        <option value="twilio">Twilio WhatsApp</option>
                                        <option value="generic">Generic Webhook</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 flex items-center justify-between">
                                        <span>API Key / Token</span>
                                        {Boolean(settings.has_whatsapp_api_key) && (
                                            <span className="text-xs text-emerald-600 dark:text-emerald-400">Tersimpan</span>
                                        )}
                                    </label>
                                    <input
                                        type="password"
                                        value={data.whatsapp_api_key}
                                        onChange={(e) => setData('whatsapp_api_key', e.target.value)}
                                        placeholder={Boolean(settings.has_whatsapp_api_key) ? '•••••••• (Tersimpan)' : 'Masukkan API Key'}
                                        className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Nomor Pengirim (Sender Number)</label>
                                    <input
                                        type="text"
                                        value={data.whatsapp_sender_number}
                                        onChange={(e) => setData('whatsapp_sender_number', e.target.value)}
                                        placeholder="contoh: 628123456789"
                                        className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b border-border-subtle pb-4">
                            <CardTitle className="text-base font-semibold">Gateway SMS</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Provider</label>
                                    <select
                                        value={data.sms_provider}
                                        onChange={(e) => setData('sms_provider', e.target.value)}
                                        className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                    >
                                        <option value="twilio">Twilio</option>
                                        <option value="generic">Generic SMS Gateway</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Account SID / Username</label>
                                    <input
                                        type="text"
                                        value={data.sms_account_sid}
                                        onChange={(e) => setData('sms_account_sid', e.target.value)}
                                        placeholder="Account SID"
                                        className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 flex items-center justify-between">
                                        <span>Auth Token / Secret</span>
                                        {Boolean(settings.has_sms_auth_token) && (
                                            <span className="text-xs text-emerald-600 dark:text-emerald-400">Tersimpan</span>
                                        )}
                                    </label>
                                    <input
                                        type="password"
                                        value={data.sms_auth_token}
                                        onChange={(e) => setData('sms_auth_token', e.target.value)}
                                        placeholder={Boolean(settings.has_sms_auth_token) ? '•••••••• (Tersimpan)' : 'Masukkan Auth Token'}
                                        className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end">
                    <Btn type="submit" loading={processing} icon={<Save className="w-4 h-4" />}>
                        Simpan Perubahan
                    </Btn>
                </div>
            </form>
        </SettingsLayout>
    );
}
