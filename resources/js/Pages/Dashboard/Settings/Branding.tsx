import React from 'react';
import { useForm } from '@inertiajs/react';
import { Palette, Save, CheckCircle2 } from 'lucide-react';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Btn } from '@/Components/ui/btn';

interface Props {
    settings: Record<string, any>;
}

export default function Branding({ settings }: Props) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        site_name: settings.site_name ?? 'Dayama Account',
        tagline: settings.tagline ?? 'Identity & Access Management',
        logo_url: settings.logo_url ?? '',
        favicon_url: settings.favicon_url ?? '',
        primary_color: settings.primary_color ?? '#4f46e5',
        secondary_color: settings.secondary_color ?? '#06b6d4',
        support_email: settings.support_email ?? 'support@dayama.test',
        terms_url: settings.terms_url ?? '',
        privacy_url: settings.privacy_url ?? '',
        copyright: settings.copyright ?? '© 2026 Dayama. All rights reserved.',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/dashboard/settings/branding', { preserveScroll: true });
    };

    return (
        <SettingsLayout
            title="Pengaturan Branding & Tampilan"
            description="Kelola identitas visual aplikasi, logo, nama situs, skema warna, dan tautan hukum."
        >
            <form onSubmit={submit} className="space-y-6">
                {recentlySuccessful && (
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Pengaturan branding berhasil disimpan.
                    </div>
                )}

                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Palette className="w-5 h-5 text-primary" /> Identitas Situs & Warna
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Nama Situs / Aplikasi</label>
                                <input
                                    type="text"
                                    value={data.site_name}
                                    onChange={(e) => setData('site_name', e.target.value)}
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                                {errors.site_name && <p className="text-xs text-destructive mt-1">{errors.site_name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Tagline</label>
                                <input
                                    type="text"
                                    value={data.tagline}
                                    onChange={(e) => setData('tagline', e.target.value)}
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Warna Utama (Primary Color)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={data.primary_color}
                                        onChange={(e) => setData('primary_color', e.target.value)}
                                        className="w-10 h-10 rounded border border-border cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={data.primary_color}
                                        onChange={(e) => setData('primary_color', e.target.value)}
                                        className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md font-mono"
                                    />
                                </div>
                                {errors.primary_color && <p className="text-xs text-destructive mt-1">{errors.primary_color}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Warna Sekunder (Secondary Color)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={data.secondary_color}
                                        onChange={(e) => setData('secondary_color', e.target.value)}
                                        className="w-10 h-10 rounded border border-border cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={data.secondary_color}
                                        onChange={(e) => setData('secondary_color', e.target.value)}
                                        className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md font-mono"
                                    />
                                </div>
                                {errors.secondary_color && <p className="text-xs text-destructive mt-1">{errors.secondary_color}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Logo URL</label>
                                <input
                                    type="text"
                                    value={data.logo_url}
                                    onChange={(e) => setData('logo_url', e.target.value)}
                                    placeholder="https://... atau /logo.png"
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Favicon URL</label>
                                <input
                                    type="text"
                                    value={data.favicon_url}
                                    onChange={(e) => setData('favicon_url', e.target.value)}
                                    placeholder="https://... atau /favicon.ico"
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Email Dukungan (Support Email)</label>
                                <input
                                    type="email"
                                    value={data.support_email}
                                    onChange={(e) => setData('support_email', e.target.value)}
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Teks Hak Cipta</label>
                                <input
                                    type="text"
                                    value={data.copyright}
                                    onChange={(e) => setData('copyright', e.target.value)}
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">URL Syarat & Ketentuan</label>
                                <input
                                    type="text"
                                    value={data.terms_url}
                                    onChange={(e) => setData('terms_url', e.target.value)}
                                    placeholder="https://dayama.test/terms"
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">URL Kebijakan Privasi</label>
                                <input
                                    type="text"
                                    value={data.privacy_url}
                                    onChange={(e) => setData('privacy_url', e.target.value)}
                                    placeholder="https://dayama.test/privacy"
                                    className="w-full h-10 px-3 text-sm bg-surface border border-border-subtle rounded-md"
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
