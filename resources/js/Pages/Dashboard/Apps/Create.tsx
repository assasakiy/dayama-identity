import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Btn } from '@/Components/ui/btn';
import { Switch } from '@/Components/ui/switch';
import { Save, ArrowLeft, AppWindow, Globe, Lock, Eye } from 'lucide-react';

export default function Create() {
    const [form, setForm] = useState({
        name: '',
        code: '',
        description: '',
        base_url: '',
        launch_url: '',
        access_mode: 'authenticated',
        include_roles_claim: false,
        status: 'active',
    });

    const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setForm(prev => ({
            ...prev,
            name: val,
            code: isCodeManuallyEdited ? prev.code : slugify(val),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.post('/dashboard/apps', form, {
            onError: (errs) => { setErrors(errs); setSubmitting(false); },
            onSuccess: () => { setSubmitting(false); },
        });
    };

    return (
        <DashboardLayout>
            <Head title="Daftarkan Aplikasi Baru" />
            <div className="space-y-6 w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard/apps"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-background hover:bg-surface-muted transition-colors shadow-xs"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Daftarkan Aplikasi Baru</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">Integrasikan aplikasi eksternal atau service baru ke identity center</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader className="border-b border-border-subtle pb-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <AppWindow className="w-4 h-4 text-primary" /> Rincian Aplikasi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Nama Aplikasi</label>
                                    <Input
                                        name="name"
                                        value={form.name}
                                        onChange={handleNameChange}
                                        placeholder="misal: Dayama Blog"
                                        required
                                        autoFocus
                                    />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">
                                        Kode Unik <span className="text-xs text-muted-foreground font-normal">(identifier)</span>
                                    </label>
                                    <Input
                                        name="code"
                                        value={form.code}
                                        onChange={(e) => {
                                            setIsCodeManuallyEdited(true);
                                            setForm(prev => ({ ...prev, code: slugify(e.target.value) }));
                                        }}
                                        placeholder="misal: blog"
                                        required
                                    />
                                    {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Deskripsi</label>
                                <Input
                                    name="description"
                                    value={form.description}
                                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Deskripsi singkat aplikasi (opsional)"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Base URL</label>
                                    <Input
                                        name="base_url"
                                        value={form.base_url}
                                        onChange={(e) => setForm(prev => ({ ...prev, base_url: e.target.value }))}
                                        placeholder="https://blog.dayama.com"
                                        required
                                    />
                                    {errors.base_url && <p className="text-xs text-destructive">{errors.base_url}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Launch URL (Tujuan Launcher)</label>
                                    <Input
                                        name="launch_url"
                                        value={form.launch_url}
                                        onChange={(e) => setForm(prev => ({ ...prev, launch_url: e.target.value }))}
                                        placeholder="https://blog.dayama.com/dashboard"
                                        required
                                    />
                                    {errors.launch_url && <p className="text-xs text-destructive">{errors.launch_url}</p>}
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="text-sm font-medium">Mode Akses</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div
                                        onClick={() => setForm(prev => ({ ...prev, access_mode: 'public' }))}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            form.access_mode === 'public'
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-border-subtle bg-surface hover:bg-surface-muted'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                                            <Eye className="w-4 h-4 text-emerald-500" />
                                            <span>Publik</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                            Dapat diakses publik tanpa login. SSO opsional bila butuh fitur akun.
                                        </p>
                                    </div>

                                    <div
                                        onClick={() => setForm(prev => ({ ...prev, access_mode: 'authenticated' }))}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            form.access_mode === 'authenticated'
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-border-subtle bg-surface hover:bg-surface-muted'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                                            <Globe className="w-4 h-4 text-primary" />
                                            <span>Terotentikasi</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                            Semua akun aktif dapat masuk. Otorisasi peran dikelola di aplikasi tujuan.
                                        </p>
                                    </div>

                                    <div
                                        onClick={() => setForm(prev => ({ ...prev, access_mode: 'restricted' }))}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            form.access_mode === 'restricted'
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-border-subtle bg-surface hover:bg-surface-muted'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                                            <Lock className="w-4 h-4 text-amber-500" />
                                            <span>Terbatas</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                            Hanya pengguna yang diberikan izin eksplisit di registry yang dapat masuk.
                                        </p>
                                    </div>
                                </div>
                                {errors.access_mode && <p className="text-xs text-destructive">{errors.access_mode}</p>}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Kirim Klaim Roles / Groups</p>
                                    <p className="text-xs text-muted-foreground">Sertakan klaim peran di ID token untuk integrasi pihak ketiga (Nextcloud, Grafana, dll)</p>
                                </div>
                                <Switch
                                    checked={form.include_roles_claim}
                                    onCheckedChange={(val) => setForm(prev => ({ ...prev, include_roles_claim: val }))}
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Status Aktif</p>
                                    <p className="text-xs text-muted-foreground">Aplikasi nonaktif disembunyikan dari launcher semua pengguna</p>
                                </div>
                                <Switch
                                    checked={form.status === 'active'}
                                    onCheckedChange={(val) => setForm(prev => ({ ...prev, status: val ? 'active' : 'inactive' }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Link
                            href="/dashboard/apps"
                            className="inline-flex h-9 items-center justify-center rounded-md border border-border-subtle bg-background px-4 text-sm font-medium hover:bg-surface-muted transition-colors"
                        >
                            Batal
                        </Link>
                        <Btn type="submit" loading={submitting} icon={<Save className="w-4 h-4" />}>
                            Daftarkan Aplikasi
                        </Btn>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
