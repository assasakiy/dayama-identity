import React from 'react';
import { useForm } from '@inertiajs/react';
import { Shield, KeyRound, Smartphone, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Btn } from '@/Components/ui/btn';
import { Badge } from '@/Components/ui/badge';
import { Switch } from '@/Components/ui/switch';

interface Props {
    settings: Record<string, any>;
}

export default function Authentication({ settings }: Props) {
    const tiers = settings._tiers || {};

    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        password_login_active: Boolean(settings.password_login?.active ?? true),
        password_min_length: Number(settings.password_login?.min_length ?? 8),
        password_require_uppercase: Boolean(settings.password_login?.require_uppercase ?? false),
        password_require_numeric: Boolean(settings.password_login?.require_numeric ?? false),
        password_require_special_char: Boolean(settings.password_login?.require_special_char ?? false),
        otp_login_active: Boolean(settings.otp_login?.active ?? false),
        otp_default_channel: String(settings.otp_login?.default_channel ?? 'whatsapp'),
        otp_expiry_minutes: Number(settings.otp_login?.expiry_minutes ?? 5),
        otp_channels_whatsapp_active: Boolean(settings.otp_channels?.whatsapp?.active ?? false),
        otp_channels_sms_active: Boolean(settings.otp_channels?.sms?.active ?? false),
        two_factor_enforcement: String(settings.two_factor?.enforcement ?? 'optional'),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/dashboard/settings/authentication', { preserveScroll: true });
    };

    return (
        <SettingsLayout
            title="Pengaturan Autentikasi"
            description="Konfigurasi metode masuk, kebijakan kata sandi, OTP, dan autentikasi dua faktor."
        >
            <form onSubmit={submit} className="space-y-6">
                {recentlySuccessful && (
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Pengaturan autentikasi berhasil disimpan.
                    </div>
                )}

                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-primary" /> Masuk dengan Kata Sandi
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <Badge variant={data.password_login_active ? 'success' : 'secondary'}>
                                {data.password_login_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                            <Switch
                                checked={data.password_login_active}
                                onCheckedChange={(val) => setData('password_login_active', val)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Panjang Minimum Kata Sandi</label>
                                <input
                                    type="number"
                                    min="6"
                                    max="64"
                                    value={data.password_min_length}
                                    onChange={(e) => setData('password_min_length', Number(e.target.value))}
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                                {errors.password_min_length && (
                                    <p className="text-xs text-destructive mt-1">{errors.password_min_length}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.password_require_uppercase}
                                    onChange={(e) => setData('password_require_uppercase', e.target.checked)}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                Wajib mengandung huruf besar (A-Z)
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.password_require_numeric}
                                    onChange={(e) => setData('password_require_numeric', e.target.checked)}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                Wajib mengandung angka (0-9)
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.password_require_special_char}
                                    onChange={(e) => setData('password_require_special_char', e.target.checked)}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                Wajib mengandung karakter spesial (!@#$%^&*)
                            </label>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-primary" /> Masuk dengan OTP (WhatsApp / SMS)
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                3-Tier: Memerlukan saluran WhatsApp atau SMS yang terkonfigurasi sebelum dapat diaktifkan.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant={data.otp_login_active ? 'success' : 'secondary'}>
                                {data.otp_login_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                            <Switch
                                checked={data.otp_login_active}
                                onCheckedChange={(val) => setData('otp_login_active', val)}
                                disabled={!tiers.otp_whatsapp?.configured && !tiers.otp_sms?.configured}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-5">
                        {errors.otp_login_active && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {errors.otp_login_active}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg border border-border-subtle bg-surface-muted/30 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">Saluran WhatsApp</span>
                                        <Badge variant={tiers.otp_whatsapp?.configured ? 'outline' : 'secondary'}>
                                            {tiers.otp_whatsapp?.configured ? 'Terkonfigurasi' : 'Belum Dikonfigurasi'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Kredensial diatur pada menu Integrasi.
                                    </p>
                                </div>
                                <Switch
                                    checked={data.otp_channels_whatsapp_active}
                                    onCheckedChange={(val) => setData('otp_channels_whatsapp_active', val)}
                                    disabled={!tiers.otp_whatsapp?.configured}
                                />
                            </div>

                            <div className="p-4 rounded-lg border border-border-subtle bg-surface-muted/30 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">Saluran SMS</span>
                                        <Badge variant={tiers.otp_sms?.configured ? 'outline' : 'secondary'}>
                                            {tiers.otp_sms?.configured ? 'Terkonfigurasi' : 'Belum Dikonfigurasi'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Kredensial gateway diatur pada menu Integrasi.
                                    </p>
                                </div>
                                <Switch
                                    checked={data.otp_channels_sms_active}
                                    onCheckedChange={(val) => setData('otp_channels_sms_active', val)}
                                    disabled={!tiers.otp_sms?.configured}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Saluran Default OTP</label>
                                <select
                                    value={data.otp_default_channel}
                                    onChange={(e) => setData('otp_default_channel', e.target.value)}
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                >
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="sms">SMS</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Masa Berlaku OTP (Menit)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={data.otp_expiry_minutes}
                                    onChange={(e) => setData('otp_expiry_minutes', Number(e.target.value))}
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" /> Kebijakan Autentikasi Dua Faktor (2FA)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="two_factor_enforcement"
                                    value="optional"
                                    checked={data.two_factor_enforcement === 'optional'}
                                    onChange={(e) => setData('two_factor_enforcement', e.target.value)}
                                    className="text-primary focus:ring-primary"
                                />
                                Opsional (Pengguna bebas mengaktifkan atau tidak dari profil)
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="two_factor_enforcement"
                                    value="required_for_admin"
                                    checked={data.two_factor_enforcement === 'required_for_admin'}
                                    onChange={(e) => setData('two_factor_enforcement', e.target.value)}
                                    className="text-primary focus:ring-primary"
                                />
                                Wajib untuk Administrator (Super Admin & Admin)
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="two_factor_enforcement"
                                    value="required_for_all"
                                    checked={data.two_factor_enforcement === 'required_for_all'}
                                    onChange={(e) => setData('two_factor_enforcement', e.target.value)}
                                    className="text-primary focus:ring-primary"
                                />
                                Wajib untuk Seluruh Pengguna
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="two_factor_enforcement"
                                    value="disabled"
                                    checked={data.two_factor_enforcement === 'disabled'}
                                    onChange={(e) => setData('two_factor_enforcement', e.target.value)}
                                    className="text-primary focus:ring-primary"
                                />
                                Dinonaktifkan
                            </label>
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
