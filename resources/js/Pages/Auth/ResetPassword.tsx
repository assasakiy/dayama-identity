import React, { useState } from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import { Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Btn } from '@/Components/ui/btn';

export default function ResetPassword({ token, email }: { token: string; email: string }) {
    const { props } = usePage<any>();
    const general = props.settings?.general || {};
    const siteName = general.site_name || 'Dayama Account';
    const logoUrl = general.logo_url || null;

    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/reset-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface via-background to-surface p-4">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary-muted)_0%,_transparent_60%)] opacity-40" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-primary-muted)_0%,_transparent_60%)] opacity-30" />

            <div className="w-full max-w-sm relative">
                <div className="bg-background border border-border-subtle rounded-lg shadow-elevated overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

                    <div className="p-8">
                        <div className="text-center mb-6">
                            {logoUrl ? (
                                <img src={logoUrl} alt={siteName} className="w-12 h-12 object-contain mx-auto mb-4" />
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-4 shadow-sm">
                                    {siteName.charAt(0)}
                                </div>
                            )}
                            <h1 className="text-xl font-semibold tracking-tight">Atur Ulang Kata Sandi</h1>
                            <p className="text-sm text-muted-foreground mt-1.5">
                                Masukkan kata sandi baru untuk akun Anda.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <input type="hidden" value={data.email} />

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-foreground">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    disabled
                                    className="w-full h-10 px-3 text-sm bg-surface-muted border border-border-subtle rounded-md text-muted-foreground"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-foreground">Kata Sandi Baru</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full h-10 pl-9 pr-10 text-sm bg-surface border border-border-subtle rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="Minimal 8 karakter"
                                        required
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-destructive mt-1.5">{errors.password}</p>}
                            </div>

                            <div>
                                <label htmlFor="password_confirmation" className="block text-sm font-medium mb-1.5 text-foreground">Konfirmasi Kata Sandi</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <input
                                        id="password_confirmation"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="w-full h-10 pl-9 pr-10 text-sm bg-surface border border-border-subtle rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="Ulangi kata sandi baru"
                                        required
                                    />
                                </div>
                                {errors.password_confirmation && <p className="text-xs text-destructive mt-1.5">{errors.password_confirmation}</p>}
                            </div>

                            {errors.token && <p className="text-xs text-destructive mt-1.5 text-center">{errors.token}</p>}

                            <Btn
                                type="submit"
                                loading={processing}
                                className="w-full h-10"
                                icon={<KeyRound className="w-4 h-4" />}
                            >
                                Simpan Kata Sandi Baru
                            </Btn>
                        </form>

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Kembali ke Halaman Masuk
                            </Link>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    &copy; {new Date().getFullYear()} {siteName}. Hak cipta dilindungi.
                </p>
            </div>
        </div>
    );
}
