import React, { useState } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff, LogIn, Smartphone, Send, ArrowRight } from 'lucide-react';
import { Btn } from '@/Components/ui/btn';

export default function Login() {
    const { props } = usePage<any>();
    const general = props.settings?.general || {};
    const pageSettings = props.settings?.login_page || {};
    const authMethods = props.auth_methods || props.settings?.auth_methods || { password: { type: 'password' } };

    const siteName = general.site_name || 'Dayama Account';
    const logoUrl = general.logo_url || null;
    const heading = pageSettings.heading || 'Selamat Datang Kembali';
    const subheading = pageSettings.subheading || 'Masuk ke akun Anda untuk melanjutkan';

    const hasPassword = Boolean(authMethods.password);
    const hasOtp = Boolean(authMethods.otp);
    const oauthProviders = Object.values(authMethods).filter((m: any) => m.type === 'oauth') as any[];
    oauthProviders.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

    const defaultMode = (pageSettings.primary_method === 'otp' && hasOtp) ? 'otp' : (hasPassword ? 'password' : 'otp');
    const [mode, setMode] = useState<'password' | 'otp'>(defaultMode);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [submittingPassword, setSubmittingPassword] = useState(false);

    const otpChannels: string[] = authMethods.otp?.channels || ['whatsapp', 'sms'];
    const [otpIdentifier, setOtpIdentifier] = useState('');
    const [otpChannel, setOtpChannel] = useState<string>(otpChannels[0] || 'whatsapp');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpErrors, setOtpErrors] = useState<Record<string, string>>({});
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    const submitPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordErrors({});
        setSubmittingPassword(true);
        router.post('/login', { email, password, remember }, {
            onError: (errs) => { setPasswordErrors(errs); setSubmittingPassword(false); },
            onFinish: () => setSubmittingPassword(false),
        });
    };

    const handleSendOtp = (e: React.FormEvent) => {
        e.preventDefault();
        setOtpErrors({});
        setSendingOtp(true);
        router.post('/login/otp/send', { identifier: otpIdentifier, channel: otpChannel }, {
            preserveScroll: true,
            onSuccess: () => {
                setOtpSent(true);
                setSendingOtp(false);
            },
            onError: (errs) => {
                setOtpErrors(errs);
                setSendingOtp(false);
            },
        });
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        setOtpErrors({});
        setVerifyingOtp(true);
        router.post('/login/otp/verify', { identifier: otpIdentifier, channel: otpChannel, code: otpCode }, {
            onError: (errs) => {
                setOtpErrors(errs);
                setVerifyingOtp(false);
            },
            onFinish: () => setVerifyingOtp(false),
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
                                        <span>Masuk dengan {provider.name}</span>
                                    </a>
                                ))}

                                {(hasPassword || hasOtp) && (
                                    <div className="relative my-4">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle" /></div>
                                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">atau</span></div>
                                    </div>
                                )}
                            </div>
                        )}

                        {hasPassword && hasOtp && (
                            <div className="grid grid-cols-2 p-1 bg-surface-muted rounded-lg mb-5 text-sm">
                                <button
                                    type="button"
                                    onClick={() => setMode('password')}
                                    className={`py-1.5 rounded-md font-medium transition-all ${mode === 'password' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Kata Sandi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('otp')}
                                    className={`py-1.5 rounded-md font-medium transition-all ${mode === 'otp' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Kode OTP
                                </button>
                            </div>
                        )}

                        {mode === 'password' && hasPassword && (
                            <form onSubmit={submitPassword} className="space-y-4">
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
                                            placeholder="admin@dayama.test"
                                            required
                                            autoFocus
                                            autoComplete="email"
                                        />
                                    </div>
                                    {passwordErrors.email && <p className="text-xs text-destructive mt-1.5">{passwordErrors.email}</p>}
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
                                            placeholder="Masukkan kata sandi"
                                            required
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {passwordErrors.password && <p className="text-xs text-destructive mt-1.5">{passwordErrors.password}</p>}
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                            className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary"
                                        />
                                        Ingat saya
                                    </label>
                                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                                        Lupa kata sandi?
                                    </Link>
                                </div>

                                <Btn
                                    type="submit"
                                    loading={submittingPassword}
                                    className="w-full h-10"
                                    icon={<LogIn className="w-4 h-4" />}
                                >
                                    Masuk
                                </Btn>
                            </form>
                        )}

                        {mode === 'otp' && hasOtp && (
                            <div className="space-y-4">
                                {!otpSent ? (
                                    <form onSubmit={handleSendOtp} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5 text-foreground">
                                                Nomor WhatsApp / HP / Email
                                            </label>
                                            <div className="relative">
                                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                <input
                                                    type="text"
                                                    value={otpIdentifier}
                                                    onChange={(e) => setOtpIdentifier(e.target.value)}
                                                    className="w-full h-10 pl-9 pr-3 text-sm bg-surface border border-border-subtle rounded-md"
                                                    placeholder="08123456789 atau email"
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                            {otpErrors.identifier && (
                                                <p className="text-xs text-destructive mt-1.5">{otpErrors.identifier}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                                Pilih Saluran Pengiriman:
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {otpChannels.includes('whatsapp') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setOtpChannel('whatsapp')}
                                                        className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-all ${
                                                            otpChannel === 'whatsapp'
                                                                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold'
                                                                : 'border-border-subtle text-muted-foreground hover:bg-surface-muted'
                                                        }`}
                                                    >
                                                        WhatsApp
                                                    </button>
                                                )}
                                                {otpChannels.includes('sms') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setOtpChannel('sms')}
                                                        className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-all ${
                                                            otpChannel === 'sms'
                                                                ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                                : 'border-border-subtle text-muted-foreground hover:bg-surface-muted'
                                                        }`}
                                                    >
                                                        SMS
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <Btn
                                            type="submit"
                                            loading={sendingOtp}
                                            className="w-full h-10"
                                            icon={<Send className="w-4 h-4" />}
                                        >
                                            Kirim Kode OTP
                                        </Btn>
                                    </form>
                                ) : (
                                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                                        <div className="p-3 bg-surface-muted rounded-md text-xs text-muted-foreground flex justify-between items-center">
                                            <span>Dikirim ke: <strong>{otpIdentifier}</strong> ({otpChannel})</span>
                                            <button
                                                type="button"
                                                onClick={() => setOtpSent(false)}
                                                className="text-primary hover:underline"
                                            >
                                                Ubah
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1.5 text-foreground">
                                                Masukkan 6-Digit Kode OTP
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value)}
                                                placeholder="123456"
                                                autoFocus
                                                required
                                                className="w-full h-11 text-center text-lg tracking-widest font-mono bg-surface border border-border-subtle rounded-md"
                                            />
                                            {otpErrors.code && (
                                                <p className="text-xs text-destructive mt-1.5 text-center">{otpErrors.code}</p>
                                            )}
                                        </div>

                                        <Btn
                                            type="submit"
                                            loading={verifyingOtp}
                                            className="w-full h-10"
                                            icon={<ArrowRight className="w-4 h-4" />}
                                        >
                                            Verifikasi & Masuk
                                        </Btn>
                                    </form>
                                )}
                            </div>
                        )}

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            Belum punya akun? <Link href="/register" className="text-primary hover:underline font-medium">Daftar</Link>
                        </div>
                        {props.flash?.status && <p role="status" className="mt-4 text-sm">{props.flash.status}</p>}
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    &copy; {new Date().getFullYear()} {siteName}. Hak cipta dilindungi.
                </p>
            </div>
        </div>
    );
}
