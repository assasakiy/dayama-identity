import React from 'react';
import { useForm } from '@inertiajs/react';
import { UserPlus, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Btn } from '@/Components/ui/btn';
import { Badge } from '@/Components/ui/badge';
import { Switch } from '@/Components/ui/switch';

interface Props {
    settings: Record<string, any>;
    available_methods: Record<string, boolean>;
}

export default function RegisterPage({ settings, available_methods }: Props) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        allow_registration: Boolean(settings.allow_registration ?? true),
        heading: settings.heading ?? 'Daftar Akun Baru',
        subheading: settings.subheading ?? 'Mulai perjalanan Anda bersama kami',
        show_login_link: Boolean(settings.show_login_link ?? true),
        terms_required: Boolean(settings.terms_required ?? true),
        require_email_verification: Boolean(settings.require_email_verification ?? true),
        methods_password: Boolean(settings.methods?.password ?? true),
        methods_google: Boolean(settings.methods?.google ?? false),
        methods_github: Boolean(settings.methods?.github ?? false),
        methods_facebook: Boolean(settings.methods?.facebook ?? false),
        methods_discord: Boolean(settings.methods?.discord ?? false),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/dashboard/settings/register-page', { preserveScroll: true });
    };

    const methodList = [
        { key: 'password', name: 'Form Pendaftaran Kata Sandi', active: available_methods.password },
        { key: 'google', name: 'Daftar dengan Google (Prioritas)', active: available_methods.google },
        { key: 'github', name: 'Daftar dengan GitHub', active: available_methods.github },
        { key: 'facebook', name: 'Daftar dengan Facebook', active: available_methods.facebook },
        { key: 'discord', name: 'Daftar dengan Discord', active: available_methods.discord },
    ];

    return (
        <SettingsLayout
            title="Pengaturan Halaman Pendaftaran"
            description="Atur penerimaan registrasi publik, metode yang ditampilkan (Tier 3), dan persyaratan registrasi."
        >
            <form onSubmit={submit} className="space-y-6">
                {recentlySuccessful && (
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Pengaturan halaman pendaftaran berhasil disimpan.
                    </div>
                )}

                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-primary" /> Buka Pendaftaran Akun Baru
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                Jika dinonaktifkan, halaman pendaftaran publik ditutup untuk pendaftaran baru.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant={data.allow_registration ? 'success' : 'secondary'}>
                                {data.allow_registration ? 'Dibuka' : 'Ditutup'}
                            </Badge>
                            <Switch
                                checked={data.allow_registration}
                                onCheckedChange={(val) => setData('allow_registration', val)}
                            />
                        </div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="text-base font-semibold">Metode Pendaftaran yang Ditampilkan</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            Hanya metode yang berstatus <strong>Aktif</strong> yang dapat diaktifkan untuk registrasi.
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
                        <CardTitle className="text-base font-semibold">Tampilan & Ketentuan</CardTitle>
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
                        </div>

                        <div className="space-y-3 pt-3 border-t border-border-subtle">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.terms_required}
                                    onChange={(e) => setData('terms_required', e.target.checked)}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                Wajib menyetujui Syarat & Ketentuan serta Kebijakan Privasi
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.require_email_verification}
                                    onChange={(e) => setData('require_email_verification', e.target.checked)}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                Wajib verifikasi alamat email sebelum akun dapat digunakan penuh
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.show_login_link}
                                    onChange={(e) => setData('show_login_link', e.target.checked)}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                Tampilkan tautan "Sudah memiliki akun? Masuk"
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
