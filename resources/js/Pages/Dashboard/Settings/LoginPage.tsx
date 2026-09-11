import React from 'react';
import { useForm } from '@inertiajs/react';
import { LogIn, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Btn } from '@/Components/ui/btn';
import { Badge } from '@/Components/ui/badge';
import { Switch } from '@/Components/ui/switch';

interface Props {
    settings: Record<string, any>;
    available_methods: Record<string, boolean>;
}

export default function LoginPage({ settings, available_methods }: Props) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        heading: settings.heading ?? 'Selamat Datang Kembali',
        subheading: settings.subheading ?? 'Masuk ke akun Anda untuk melanjutkan',
        layout: settings.layout ?? 'card',
        show_remember_me: Boolean(settings.show_remember_me ?? true),
        show_forgot_password: Boolean(settings.show_forgot_password ?? true),
        show_register_link: Boolean(settings.show_register_link ?? true),
        primary_method: settings.primary_method ?? 'password',
        methods_password: Boolean(settings.methods?.password ?? true),
        methods_otp: Boolean(settings.methods?.otp ?? false),
        methods_google: Boolean(settings.methods?.google ?? false),
        methods_github: Boolean(settings.methods?.github ?? false),
        methods_facebook: Boolean(settings.methods?.facebook ?? false),
        methods_discord: Boolean(settings.methods?.discord ?? false),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/dashboard/settings/login-page', { preserveScroll: true });
    };

    const methodList = [
        { key: 'password', name: 'Kata Sandi (Email & Password)', active: available_methods.password },
        { key: 'otp', name: 'OTP (WhatsApp / SMS)', active: available_methods.otp },
        { key: 'google', name: 'Google Login (Prioritas)', active: available_methods.google },
        { key: 'github', name: 'GitHub Login', active: available_methods.github },
        { key: 'facebook', name: 'Facebook Login', active: available_methods.facebook },
        { key: 'discord', name: 'Discord Login', active: available_methods.discord },
    ];

    return (
        <SettingsLayout
            title="Pengaturan Halaman Masuk"
            description="Atur metode masuk yang ditampilkan (Tier 3) dan tata letak halaman /login."
        >
            <form onSubmit={submit} className="space-y-6">
                {recentlySuccessful && (
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Pengaturan halaman masuk berhasil disimpan.
                    </div>
                )}

                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <LogIn className="w-5 h-5 text-primary" /> Metode yang Ditampilkan pada /login
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            Hanya metode yang telah berstatus <strong>Aktif</strong> (Tier 2) yang dapat diaktifkan untuk ditampilkan pada halaman masuk.
                        </p>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="divide-y divide-border-subtle">
                            {methodList.map((m) => {
                                const fieldKey = `methods_${m.key}` as keyof typeof data;
                                const fieldError = (errors as any)[fieldKey];

                                return (
                                    <div key={m.key} className="py-3 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{m.name}</span>
                                                <Badge variant={m.active ? 'outline' : 'secondary'}>
                                                    {m.active ? 'Tersedia' : 'Nonaktif di Pengaturan'}
                                                </Badge>
                                            </div>
                                            {fieldError && (
                                                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5" /> {fieldError}
                                                </p>
                                            )}
                                        </div>
                                        <Switch
                                            checked={Boolean(data[fieldKey])}
                                            onCheckedChange={(val) => setData(fieldKey, val as any)}
                                            disabled={!m.active}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="text-base font-semibold">Tampilan & Navigasi</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Judul Form</label>
                                <input
                                    type="text"
                                    value={data.heading}
                                    onChange={(e) => setData('heading', e.target.value)}
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Subjudul</label>
                                <input
                                    type="text"
                                    value={data.subheading}
                                    onChange={(e) => setData('subheading', e.target.value)}
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Metode Utama (Default Tab)</label>
                                <select
                                    value={data.primary_method}
                                    onChange={(e) => setData('primary_method', e.target.value)}
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                >
                                    <option value="password">Kata Sandi</option>
                                    <option value="otp">OTP</option>
                                    <option value="google">Google</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-border-subtle">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.show_remember_me}
                                    onChange={(e) => setData('show_remember_me', e.target.checked)}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                Tampilkan opsi "Ingat Saya" (Remember me)
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.show_forgot_password}
                                    onChange={(e) => setData('show_forgot_password', e.target.checked)}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                Tampilkan tautan "Lupa Kata Sandi"
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.show_register_link}
                                    onChange={(e) => setData('show_register_link', e.target.checked)}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                Tampilkan tautan ke halaman pendaftaran
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
