import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    Eye,
    Mail,
    Globe,
    User as UserIcon,
    Lock,
    ShieldCheck,
    Phone,
    FileText,
    BadgeCheck,
} from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Btn } from '@/Components/ui/btn';

interface UserData {
    id: string;
    name: string;
    email: string;
    username?: string;
    avatar_url?: string | null;
    banner?: string | null;
    biography?: string | null;
    phone?: string | null;
    website?: string | null;
    social_links?: { github?: string; twitter?: string; linkedin?: string } | null;
    roles: string[];
    is_primary_super_admin: boolean;
    is_protected: boolean;
    is_verified: boolean;
    status: string;
}

interface RoleItem {
    id: string;
    name: string;
    display_name?: string;
    rank: number;
    description?: string;
}

interface Props {
    user: UserData | null;
    roles: RoleItem[];
}

export default function UserForm({ user, roles }: Props) {
    const { auth } = usePage<any>().props;
    const canManageProtection = auth.user.is_primary_super_admin || (auth.user.highest_rank ?? 0) >= 100;
    const isEditing = !!user;

    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [biography, setBiography] = useState(user?.biography ?? '');
    const [website, setWebsite] = useState(user?.website ?? '');
    const [github, setGithub] = useState(user?.social_links?.github ?? '');
    const [twitter, setTwitter] = useState(user?.social_links?.twitter ?? '');
    const [linkedin, setLinkedin] = useState(user?.social_links?.linkedin ?? '');
    const [status, setStatus] = useState(user?.status ?? 'active');
    const [isProtected, setIsProtected] = useState(user?.is_protected ?? false);
    const [isVerified, setIsVerified] = useState(user?.is_verified ?? false);
    const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles ?? []);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const toggleRole = (roleName: string) => {
        setSelectedRoles((prev) =>
            prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        const payload: Record<string, any> = {
            name,
            email,
            status,
            phone: phone || null,
            biography: biography || null,
            website: website || null,
            social_links: {
                github: github || null,
                twitter: twitter || null,
                linkedin: linkedin || null,
            },
            roles: selectedRoles,
            is_protected: isProtected,
            is_verified: isVerified,
        };

        if (password) {
            payload.password = password;
        }

        const options = {
            onError: (errs: Record<string, string>) => {
                setErrors(errs);
                setSubmitting(false);
            },
            onSuccess: () => setSubmitting(false),
        };

        if (isEditing && user) {
            router.put(`/dashboard/users/${user.id}`, payload, options);
        } else {
            router.post('/dashboard/users', payload, options);
        }
    };

    const avatarInitial = (name || 'U').charAt(0).toUpperCase();

    return (
        <DashboardLayout>
            <Head title={isEditing ? `Edit Pengguna: ${user.name}` : 'Pengguna Baru'} />
            <div className="space-y-6 w-full">
                {/* Header Back & Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard/users"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-background hover:bg-surface-muted transition-colors shadow-xs"
                            aria-label="Kembali"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">
                                {isEditing ? 'Edit Pengguna' : 'Pengguna Baru'}
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isEditing ? `Perbarui profil dan akses untuk ${user.name}` : 'Daftarkan akun pengguna baru ke dalam sistem'}
                            </p>
                        </div>
                    </div>
                    {isEditing && user && (
                        <div className="flex justify-end">
                            <Link
                                href={`/dashboard/users/${user.id}`}
                                className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-medium border border-border-subtle rounded-lg bg-background hover:bg-surface-muted transition-all shadow-xs"
                            >
                                <Eye className="w-3.5 h-3.5" /> Lihat Detail Akun
                            </Link>
                        </div>
                    )}
                </div>

                {/* Banner & Real-Time Header Preview */}
                <div className="bg-background border border-border-subtle rounded-2xl overflow-hidden shadow-xs">
                    <div className="h-28 sm:h-36 w-full bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40 relative">
                        {user?.banner && <img src={user.banner} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="px-6 pb-5 relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10">
                            <div className="flex items-end gap-3.5">
                                <div className="w-20 h-20 rounded-full border-4 border-background bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-md overflow-hidden shrink-0 relative z-10">
                                    {user?.avatar_url ? (
                                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        avatarInitial
                                    )}
                                </div>
                                <div className="space-y-0.5 pb-1">
                                    <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                                        {name || 'Nama Pengguna'}
                                        {isVerified && <BadgeCheck className="w-4 h-4 text-primary fill-primary/10" />}
                                    </h2>
                                    <p className="text-xs text-muted-foreground font-mono">
                                        {email || 'email@domain.com'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status === 'active' ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300' : 'bg-surface-muted text-muted-foreground'}`}>
                                    {status === 'active' ? 'Aktif' : 'Nonaktif'}
                                </span>
                                {isProtected && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                        <Lock className="w-3 h-3" /> Dilindungi
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left 2 Cols: Form Inputs */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader className="border-b border-border-subtle pb-4">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-primary" /> Informasi Akun & Kredensial
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            label="Nama Lengkap"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            error={errors.name}
                                            placeholder="John Doe"
                                        />
                                        <Input
                                            label="Alamat Email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            error={errors.email}
                                            placeholder="nama@email.com"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            label={isEditing ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi'}
                                            type="password"
                                            required={!isEditing}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            error={errors.password}
                                            placeholder={isEditing ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter'}
                                        />
                                        <Input
                                            label="Nomor Telepon / WhatsApp"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            error={errors.phone}
                                            placeholder="0812xxxxxxx"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="border-b border-border-subtle pb-4">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" /> Profil Publik & Tautan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Biografi Singkat</label>
                                        <textarea
                                            rows={3}
                                            value={biography}
                                            onChange={(e) => setBiography(e.target.value)}
                                            className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            placeholder="Catatan profil pengguna..."
                                        />
                                    </div>
                                    <Input
                                        label="Situs Web"
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        error={errors.website}
                                        placeholder="https://example.com"
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Input label="GitHub" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="username" />
                                        <Input label="Twitter" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="username" />
                                        <Input label="LinkedIn" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="username" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="border-b border-border-subtle pb-4">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-primary" /> Tetapkan Peran (Roles)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {roles.map((role) => {
                                            const isSelected = selectedRoles.includes(role.name);
                                            return (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => toggleRole(role.name)}
                                                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                                            : 'border-border-subtle bg-surface/40 hover:bg-surface-muted'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-sm">{role.name}</span>
                                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-muted text-muted-foreground font-mono">
                                                            Rank {role.rank}
                                                        </span>
                                                    </div>
                                                    {role.description && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{role.description}</p>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.roles && <p className="text-xs text-destructive mt-2">{errors.roles}</p>}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right 1 Col: Status Controls & Actions */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader className="border-b border-border-subtle pb-4">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-primary" /> Status & Kontrol Akun
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Status Akun</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-full h-10 rounded-lg border border-border-subtle bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        >
                                            <option value="active">Aktif</option>
                                            <option value="inactive">Nonaktif</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3 pt-2 border-t border-border-subtle">
                                        <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isVerified}
                                                onChange={(e) => setIsVerified(e.target.checked)}
                                                className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary"
                                            />
                                            <span>Email Terverifikasi</span>
                                        </label>

                                        {canManageProtection && (
                                            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isProtected}
                                                    onChange={(e) => setIsProtected(e.target.checked)}
                                                    className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary"
                                                />
                                                <span>Akun Dilindungi (Protected)</span>
                                            </label>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Link
                                    href="/dashboard/users"
                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-border-subtle bg-background px-4 text-sm font-medium hover:bg-surface-muted transition-colors shadow-xs"
                                >
                                    Batal
                                </Link>
                                <Btn type="submit" loading={submitting} icon={<Save className="w-4 h-4" />}>
                                    {isEditing ? 'Perbarui Pengguna' : 'Simpan Pengguna'}
                                </Btn>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
