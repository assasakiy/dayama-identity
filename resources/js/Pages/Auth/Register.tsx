import React, { useState } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff, UserPlus, User, AlertCircle } from 'lucide-react';
import { Btn } from '@/Components/ui/btn';

export default function Register() {
    const { props } = usePage<any>();
    const general = props.settings?.general || {};
    const pageSettings = props.settings?.register_page || {};
    const registerMethods = props.register_methods || props.settings?.register_methods || { password: { type: 'password' } };

    const siteName = general.site_name || 'Dayama Account';
    const logoUrl = general.logo_url || null;
    const heading = pageSettings.heading || 'Daftar Akun Baru';
    const subheading = pageSettings.subheading || 'Mulai perjalanan Anda bersama kami';
    const allowRegistration = pageSettings.allow_registration !== false;
    const termsRequired = Boolean(pageSettings.terms_required ?? true);

    const hasPassword = Boolean(registerMethods.password);
    const oauthProviders = Object.values(registerMethods).filter((m: any) => m.type === 'oauth') as any[];
    oauthProviders.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password_confirmation, setPasswordConfirmation] = useState('');
    const [terms, setTerms] = useState(!termsRequired);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (termsRequired && !terms) {
            setErrors({ terms: 'Anda wajib menyetujui Syarat & Ketentuan.' });
            return;
        }

        setSubmitting(true);
        router.post('/register', { name, email, password, password_confirmation }, {
            onError: (errs) => { setErrors(errs); setSubmitting(false); },
            onFinish: () => setSubmitting(false),
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
                            <h1 className="text-xl font-semibold tracking-tight">{heading}</h1>
                            <p className="text-sm text-muted-foreground mt-1.5">{subheading}</p>
                        </div>

                        {!allowRegistration ? (
                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-300 text-sm text-center">
                                <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                                Pendaftaran akun baru sedang ditutup oleh administrator.
                                <div className="mt-4">
                                    <Link href="/login" className="text-primary font-medium hover:underline">
                                        Kembali ke halaman masuk
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <>
                                {oauthProviders.length > 0 && (
                                    <div className="space-y-2 mb-6">
                                        {oauthProviders.map((provider) => (
                                            <a
                                                key={provider.provider}
                                                href={`/auth/${provider.provider}`}
                                                className={`w-full h-10 px-4 rounded-md border text-sm font-medium flex items-center justify-center gap-2.5 transition-all ${
                                                    provider.provider === 'google'
                                                        ? 'bg-background hover:bg-surface-muted border-border text-foreground font-semibold shadow-sm'
                                                        : 'bg-surface hover:bg-surface-muted border-border-subtle text-muted-foreground'
                                                }`}
                                            >
                                                <span>Daftar dengan {provider.name}</span>
                                            </a>
                                        ))}

                                        {hasPassword && (
                                            <div className="relative my-4">
                                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle" /></div>
                                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">atau daftar dengan email</span></div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {hasPassword && (
                                    <form onSubmit={submit} className="space-y-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium mb-1.5 text-foreground">Nama Lengkap</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                <input
                                                    id="name"
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full h-10 pl-9 pr-3 text-sm bg-surface border border-border-subtle rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                    placeholder="Nama Anda"
                                                    required
                                                    autoFocus
                                                    autoComplete="name"
                                                />
                                            </div>
                                            {errors.name && <p className="text-xs text-destructive mt-1.5">{errors.name}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-foreground">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                <input
                                                    id="email"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full h-10 pl-9 pr-3 text-sm bg-surface border border-border-subtle rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                    placeholder="nama@email.com"
                                                    required
                                                    autoComplete="email"
                                                />
                                            </div>
                                            {errors.email && <p className="text-xs text-destructive mt-1.5">{errors.email}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-foreground">Kata Sandi</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                <input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full h-10 pl-9 pr-10 text-sm bg-surface border border-border-subtle rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                    placeholder="Buat kata sandi"
                                                    required
                                                    autoComplete="new-password"
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
                                                    value={password_confirmation}
                                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                                    className="w-full h-10 pl-9 pr-10 text-sm bg-surface border border-border-subtle rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                    placeholder="Ulangi kata sandi"
                                                    required
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                        </div>

                                        {termsRequired && (
                                            <div>
                                                <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={terms}
                                                        onChange={(e) => setTerms(e.target.checked)}
                                                        className="mt-0.5 w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary"
                                                    />
                                                    <span>
                                                        Saya menyetujui <a href="/terms" target="_blank" className="text-primary hover:underline">Syarat & Ketentuan</a> serta <a href="/privacy" target="_blank" className="text-primary hover:underline">Kebijakan Privasi</a>.
                                                    </span>
                                                </label>
                                                {errors.terms && <p className="text-xs text-destructive mt-1">{errors.terms}</p>}
                                            </div>
                                        )}

                                        <Btn
                                            type="submit"
                                            loading={submitting}
                                            className="w-full h-10"
                                            icon={<UserPlus className="w-4 h-4" />}
                                        >
                                            Daftar Akun
                                        </Btn>
                                    </form>
                                )}
                            </>
                        )}

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            Sudah punya akun? <Link href="/login" className="text-primary hover:underline font-medium">Masuk</Link>
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
