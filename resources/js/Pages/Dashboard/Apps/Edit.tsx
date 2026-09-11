import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Btn } from '@/Components/ui/btn';
import { Switch } from '@/Components/ui/switch';
import { Badge } from '@/Components/ui/badge';
import ConfirmDialog from '@/Components/ui/confirm-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import ClientTab from './ClientTab';
import { Save, ArrowLeft, AppWindow, Globe, Lock, UserPlus, Trash2, User, Eye } from 'lucide-react';

interface GrantedUser {
    id: string;
    name: string;
    email: string;
    status: string;
}

interface OAuthClient {
    id: string;
    name: string;
    redirect_uris: string[];
    grant_types: string[];
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
        status: application.status,
    });

    const [selectedUserId, setSelectedUserId] = useState('');
    const [granting, setGranting] = useState(false);
    const [userToRevoke, setUserToRevoke] = useState<GrantedUser | null>(null);
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

    const handleGrantAccess = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) return;
        setGranting(true);
        router.post(`/dashboard/apps/${application.id}/grants`, { user_id: selectedUserId }, {
            preserveScroll: true,
            onSuccess: () => { setSelectedUserId(''); setGranting(false); },
            onError: () => setGranting(false),
        });
    };

    const confirmRevoke = () => {
        if (!userToRevoke) return;
        router.delete(`/dashboard/apps/${application.id}/grants/${userToRevoke.id}`, {
            preserveScroll: true,
            onSuccess: () => setUserToRevoke(null),
        });
    };

    const grantedUserIds = new Set((application.users || []).map(u => u.id));
    const availableUsersToGrant = users.filter(u => !grantedUserIds.has(u.id));

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
                                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                                required
                                            />
                                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium">Kode Unik</label>
                                            <Input
                                                name="code"
                                                value={form.code}
                                                onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
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
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium">Base URL</label>
                                            <Input
                                                name="base_url"
                                                value={form.base_url}
                                                onChange={(e) => setForm(prev => ({ ...prev, base_url: e.target.value }))}
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
                        <div className="space-y-6 mt-4">
                            {form.access_mode === 'restricted' ? (
                                <Card>
                                    <CardHeader className="border-b border-border-subtle pb-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                                <Lock className="w-4 h-4 text-amber-500" /> Pengguna dengan Izin Akses ({application.users?.length || 0})
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-6">
                                        <form onSubmit={handleGrantAccess} className="flex flex-col sm:flex-row items-center gap-3">
                                            <select
                                                aria-label="Pilih Pengguna"
                                                value={selectedUserId}
                                                onChange={(e) => setSelectedUserId(e.target.value)}
                                                className="flex h-9 w-full sm:w-80 rounded-md border border-border-subtle bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                                            >
                                                <option value="">-- Pilih Pengguna Aktif --</option>
                                                {availableUsersToGrant.map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.name} ({u.email})
                                                    </option>
                                                ))}
                                            </select>
                                            <Btn type="submit" size="sm" loading={granting} disabled={!selectedUserId} icon={<UserPlus className="w-4 h-4" />}>
                                                Beri Akses
                                            </Btn>
                                        </form>

                                        <div className="border border-border-subtle rounded-xl overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-surface-muted/50 border-b border-border-subtle text-xs text-muted-foreground uppercase">
                                                    <tr>
                                                        <th className="px-4 py-3">Nama</th>
                                                        <th className="px-4 py-3">Email</th>
                                                        <th className="px-4 py-3">Status</th>
                                                        <th className="px-4 py-3 text-right">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-subtle">
                                                    {(application.users || []).length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground text-xs">
                                                                Belum ada pengguna yang diberikan akses khusus ke aplikasi ini.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        (application.users || []).map(u => (
                                                            <tr key={u.id} className="hover:bg-surface-muted/30 transition-colors">
                                                                <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                                    <span>{u.name}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                                                                <td className="px-4 py-3">
                                                                    <Badge variant={u.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                                                                        {u.status}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Cabut akses ${u.name}`}
                                                                        onClick={() => setUserToRevoke(u)}
                                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="pt-6">
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            Mode akses saat ini adalah <strong>{form.access_mode === 'public' ? 'Publik' : 'Terotentikasi'}</strong>. Ubah ke mode <strong>Terbatas</strong> untuk mengelola hak akses pengguna.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
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

                <ConfirmDialog
                    open={!!userToRevoke}
                    onOpenChange={(open) => { if (!open) setUserToRevoke(null); }}
                    title="Cabut Akses Pengguna"
                    message={`Yakin ingin mencabut akses aplikasi untuk ${userToRevoke?.name}? Pengguna ini tidak akan dapat membuka aplikasi ini lagi.`}
                    confirmLabel="Cabut Akses"
                    variant="danger"
                    onConfirm={confirmRevoke}
                />
            </div>
        </DashboardLayout>
    );
}
