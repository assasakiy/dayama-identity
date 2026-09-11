import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Btn } from '@/Components/ui/btn';
import { Switch } from '@/Components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import ClientTab from './ClientTab';
import AccessTab, { GrantedUser } from './AccessTab';
import { Save, ArrowLeft, AppWindow, Globe, Lock, Eye } from 'lucide-react';

interface OAuthClient {
    id: string;
    name: string;
    redirect_uris: string[];
    grant_types: string[];
    is_confidential?: boolean;
    revoked: boolean;
    created_at: string;
    updated_at: string;
}

interface ApplicationData {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    logo?: string | null;
    base_url: string;
    launch_url: string;
    access_mode: 'public' | 'authenticated' | 'restricted';
    include_roles_claim?: boolean;
    status: 'active' | 'inactive';
    users?: GrantedUser[];
    clients?: OAuthClient[];
}

export default function Edit({
    application,
    users = [],
}: {
    application: ApplicationData;
    users: Array<{ id: string; name: string; email: string }>;
}) {
    const [form, setForm] = useState({
        name: application.name,
        code: application.code,
        description: application.description ?? '',
        base_url: application.base_url,
        launch_url: application.launch_url,
        access_mode: application.access_mode,
        include_roles_claim: Boolean(application.include_roles_claim),
        status: application.status,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.put(`/dashboard/apps/${application.id}`, form, {
            onError: (errs) => { setErrors(errs); setSubmitting(false); },
            onSuccess: () => { setSubmitting(false); },
        });
    };

    const { props } = usePage<any>();
    const canManageOAuth = props.auth?.permissions?.includes('account.oauth-clients.manage') ?? false;

    return (
        <DashboardLayout>
            <Head title={`Edit ${application.name}`} />
            <div className="space-y-6 w-full max-w-5xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard/apps"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-background hover:bg-surface-muted transition-colors shadow-xs"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Edit Aplikasi: {application.name}</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">Konfigurasi alamat, mode otorisasi, dan hak akses pengguna</p>
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="access">Access</TabsTrigger>
                        <TabsTrigger value="clients">Clients</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general">
                        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                            <Card>
                                <CardHeader className="border-b border-border-subtle pb-4">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <AppWindow className="w-4 h-4 text-primary" /> Profil & Alamat Layanan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Input
                                                label="Nama Aplikasi"
                                                name="name"
                                                value={form.name}
                                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                                required
                                            />
                                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <Input
                                                label="Kode Unik (Slug)"
                                                name="code"
                                                value={form.code}
                                                onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
                                                required
                                            />
                                            {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">Deskripsi Singkat</label>
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                            rows={2}
                                            className="w-full mt-1.5 rounded-md border border-border-subtle bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                                        />
                                        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Input
                                                label="Base URL"
                                                name="base_url"
                                                value={form.base_url}
                                                onChange={(e) => setForm(prev => ({ ...prev, base_url: e.target.value }))}
                                                required
                                            />
                                            {errors.base_url && <p className="text-xs text-destructive">{errors.base_url}</p>}
                                        </div>
                                        <div>
                                            <Input
                                                label="Launch URL (SSO Landing)"
                                                name="launch_url"
                                                value={form.launch_url}
                                                onChange={(e) => setForm(prev => ({ ...prev, launch_url: e.target.value }))}
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
                                            <p className="text-xs text-muted-foreground">Sertakan peran di ID token untuk app pihak ketiga (Nextcloud, Grafana, dll)</p>
                                        </div>
                                        <Switch
                                            checked={form.include_roles_claim}
                                            onCheckedChange={(val) => setForm(prev => ({ ...prev, include_roles_claim: val }))}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Status Aktif</p>
                                            <p className="text-xs text-muted-foreground">Aplikasi nonaktif tidak muncul di launcher siapa pun</p>
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
                                    Simpan Perubahan
                                </Btn>
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="access">
                        <AccessTab
                            applicationId={application.id}
                            accessMode={form.access_mode}
                            grantedUsers={application.users || []}
                            users={users}
                        />
                    </TabsContent>

                    <TabsContent value="clients">
                        <div className="mt-4">
                            <ClientTab
                                applicationId={application.id}
                                clients={application.clients || []}
                                canManage={canManageOAuth}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
