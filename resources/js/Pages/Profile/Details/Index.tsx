import React, { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import AccountSettingsLayout from '@/Layouts/AccountSettingsLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/Components/ui/card';
import ConfirmDialog from '@/Components/ui/confirm-dialog';
import { Mail, Globe, CalendarDays, Loader2, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { Btn } from '@/Components/ui/btn';
import VerifyPanel, { UserEmail } from './VerifyPanel';

export default function AccountIndex() {
    const { user, emails, preferences, flash } = usePage<any>().props as any;

    const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    const { data, setData, put, processing, recentlySuccessful, isDirty } = useForm({
        timezone: preferences?.timezone || 'UTC',
        language: preferences?.language || 'en',
    });

    const [newEmail, setNewEmail] = useState('');
    const [emailSearch, setEmailSearch] = useState('');
    const [addingEmail, setAddingEmail] = useState(false);
    const [emailToRemove, setEmailToRemove] = useState<string | null>(null);
    const [actionId, setActionId] = useState<string | null>(null);
    // Track which email row is showing the OTP panel
    const [verifyingId, setVerifyingId] = useState<string | null>(null);

    const submitSettings = (e: React.FormEvent) => {
        e.preventDefault();
        put('/profile');
    };

    const addEmail = () => {
        if (!newEmail) return;
        setAddingEmail(true);
        router.post('/profile/emails', { email: newEmail }, {
            preserveScroll: true,
            onSuccess: (page: any) => {
                setNewEmail('');
                setAddingEmail(false);
                // Auto-open verify panel for the newly added email
                const added = (page.props.emails as UserEmail[])?.find(
                    (e: UserEmail) => e.email === newEmail && !e.email_verified_at
                );
                if (added) setVerifyingId(added.id);
            },
            onError: () => setAddingEmail(false),
        });
    };

    const removeEmail = (id: string) => {
        setEmailToRemove(id);
    };

    const confirmRemoveEmail = () => {
        if (!emailToRemove) return;
        const id = emailToRemove;
        setActionId(id);
        if (verifyingId === id) setVerifyingId(null);
        router.delete(`/profile/emails/${id}`, {
            preserveScroll: true,
            onSuccess: () => setEmailToRemove(null),
            onFinish: () => setActionId(null),
        });
    };

    const makePrimary = (id: string) => {
        setActionId(id);
        router.post(`/profile/emails/${id}/primary`, {}, {
            preserveScroll: true,
            onFinish: () => setActionId(null),
        });
    };

    const sortedEmails = emails ? [...emails].sort((a: UserEmail, b: UserEmail) => {
        if (a.is_primary) return -1;
        if (b.is_primary) return 1;
        if (a.email_verified_at && !b.email_verified_at) return -1;
        if (!a.email_verified_at && b.email_verified_at) return 1;
        return 0;
    }).filter((email: UserEmail) => !emailSearch || email.email.toLowerCase().includes(emailSearch.toLowerCase())) : [];

    return (
        <AccountSettingsLayout
            title="Pengaturan Akun"
            description="Kelola identifier akun dan pengaturan regional Anda."
        >
            <div className="space-y-6">

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                {/* Account Details Section */}
                <Card>
                    <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center shrink-0">
                                <CalendarDays className="w-4.5 h-4.5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-0.5">Anggota sejak</p>
                                <p className="font-medium">{joinedDate}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Email Addresses Section */}
                <Card>
                    <CardHeader className="pb-3 border-b border-border-subtle">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <span className="w-6 h-6 rounded bg-surface-muted flex items-center justify-center">
                                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                </span>
                                Alamat Email
                            </div>
                        </CardTitle>
                        <CardDescription className="text-xs mt-1.5 ml-8">
                            Kelola alamat email yang terhubung dengan akun Anda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {emails && emails.length > 1 && (
                            <div className="py-2.5">
                                <input
                                    type="text"
                                    placeholder="Cari alamat email..."
                                    value={emailSearch}
                                    onChange={e => setEmailSearch(e.target.value)}
                                    className="w-full h-8 px-3 text-xs rounded-md border border-border-subtle bg-background"
                                />
                            </div>
                        )}
                        <div className="divide-y divide-border-subtle">
                            {sortedEmails.length === 0 && (
                                <div className="py-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-sm">{user.email}</p>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">Utama</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Digunakan untuk login, notifikasi, dan pemulihan akun.</p>
                                </div>
                            )}

                            {sortedEmails.map((email: UserEmail) => (
                                <div key={email.id} className="py-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium text-sm">{email.email}</p>
                                                {email.is_primary ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">Utama</span>
                                                ) : email.email_verified_at ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20">Terverifikasi</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-warning/10 text-warning dark:text-warning border border-warning/20">Belum Terverifikasi</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {email.is_primary
                                                    ? 'Digunakan untuk login, notifikasi, dan pemulihan akun.'
                                                    : !email.email_verified_at
                                                        ? 'Verifikasi email ini sebelum dapat dijadikan utama.'
                                                        : 'Alamat email cadangan terverifikasi.'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {!email.is_primary && (
                                                <>
                                                    {email.email_verified_at ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => makePrimary(email.id)}
                                                            disabled={actionId === email.id}
                                                            className="px-3 py-1.5 bg-surface-muted hover:bg-border/50 text-foreground border border-border rounded text-xs font-medium transition-colors disabled:opacity-50"
                                                        >
                                                            {actionId === email.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Jadikan Utama'}
                                                        </button>
                                    ) : (
                                        (() => {
                                            // Check if the existing code is expired
                                            const isExpired = !email.email_verified_at &&
                                                email.verification_code_expires_at &&
                                                new Date(email.verification_code_expires_at).getTime() < Date.now();

                                            return (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isExpired) {
                                                            // Resend directly when code is expired
                                                            router.post(`/profile/emails/${email.id}/verify`, {}, {
                                                                preserveScroll: true,
                                                                onSuccess: () => setVerifyingId(email.id),
                                                            });
                                                        } else {
                                                            setVerifyingId(verifyingId === email.id ? null : email.id);
                                                        }
                                                    }}
                                                    className={`px-3 py-1.5 border rounded text-xs font-medium transition-colors ${
                                                        verifyingId === email.id
                                                            ? 'bg-warning/20 border-warning/40 text-warning dark:text-amber-400'
                                                            : 'bg-warning/10 hover:bg-warning/20 border-warning/30 text-warning dark:text-amber-400'
                                                    }`}
                                                >
                                                    {verifyingId === email.id
                                                        ? 'Sembunyikan'
                                                        : isExpired
                                                            ? 'Kirim Ulang Kode'
                                                            : 'Masukkan Kode'
                                                    }
                                                </button>
                                            );
                                        })()
                                    )}
                                    <span className="text-border-subtle text-xs">|</span>
                                    <button
                                        type="button"
                                        onClick={() => removeEmail(email.id)}
                                        disabled={actionId === email.id}
                                        className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                                    >
                                        Hapus
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* OTP verification panel */}
                    {!email.is_primary && !email.email_verified_at && verifyingId === email.id && (
                        <VerifyPanel
                            email={email}
                            onDone={() => setVerifyingId(null)}
                            onExpired={() => setVerifyingId(null)}
                        />
                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add New Email Form */}
                        <div className="mt-2 pt-4 border-t border-border-subtle">
                            <label className="text-sm font-medium block mb-2">Tambah Alamat Email</label>
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addEmail()}
                                    placeholder="Masukkan alamat email baru"
                                    className="w-full sm:flex-1 px-3 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={addEmail}
                                    disabled={addingEmail || !newEmail}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors shrink-0 disabled:opacity-50"
                                >
                                    {addingEmail && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Tambah Email
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Regional Settings */}
                <Card>
                    <form onSubmit={submitSettings}>
                        <CardHeader className="border-b border-border-subtle pb-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <span className="w-6 h-6 rounded bg-surface-muted flex items-center justify-center">
                                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                                </span>
                                Preferensi Regional
                            </CardTitle>
                            <CardDescription className="text-xs mt-1.5 ml-8">
                                Atur bahasa dan zona waktu yang diinginkan untuk dashboard.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2.5 max-w-md">
                                <label className="text-sm font-medium">Bahasa</label>
                                <div className="relative">
                                    <select
                                        value={data.language}
                                        onChange={e => setData('language', e.target.value)}
                                        className="w-full appearance-none px-3 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                    >
                                        <option value="en">Inggris (US)</option>
                                        <option value="id">Bahasa Indonesia</option>
                                        <option value="es">Spanyol</option>
                                        <option value="fr">Prancis</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2.5 max-w-md">
                                <label className="text-sm font-medium">Zona Waktu</label>
                                <div className="relative">
                                    <select
                                        value={data.timezone}
                                        onChange={e => setData('timezone', e.target.value)}
                                        className="w-full appearance-none px-3 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                    >
                                        <option value="UTC">UTC (Universal Coordinated Time)</option>
                                        <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                                        <option value="America/New_York">America/New_York (EST)</option>
                                        <option value="Europe/London">Europe/London (GMT)</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <div className="px-6 py-4 border-t border-border-subtle flex justify-end gap-3 bg-surface-muted/10 rounded-b-lg">
                            {recentlySuccessful && (
                                <span className="text-sm text-green-600 self-center font-medium flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" /> Tersimpan!
                                </span>
                            )}
                            <Btn
                                type="submit"
                                loading={processing}
                                disabled={!isDirty || processing}
                                icon={<Save className="w-4 h-4" />}
                            >
                                Simpan Perubahan
                            </Btn>
                        </div>
                    </form>
                </Card>
            </div>
            <ConfirmDialog
                open={!!emailToRemove}
                onOpenChange={(open) => { if (!open) setEmailToRemove(null); }}
                title="Hapus Alamat Email"
                message="Apakah Anda yakin ingin menghapus email ini? Anda tidak akan bisa login atau menerima notifikasi lagi."
                confirmLabel="Hapus Email"
                variant="danger"
                onConfirm={confirmRemoveEmail}
            />
        </AccountSettingsLayout>
    );
}
