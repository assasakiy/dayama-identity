import React from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Btn } from '@/Components/ui/btn';

export default function ForgotPassword() {
    const { props } = usePage<any>();
    const general = props.settings?.general || {};
    const siteName = general.site_name || 'Dayama Account';
    const logoUrl = general.logo_url || null;

    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/forgot-password');
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
                            <h1 className="text-xl font-semibold tracking-tight">Lupa Kata Sandi</h1>
                            <p className="text-sm text-muted-foreground mt-1.5">
                                Masukkan alamat email Anda untuk menerima tautan pemulihan kata sandi.
                            </p>
                        </div>

                        {props.flash?.status && (
                            <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 text-green-700 dark:text-green-300 text-xs">
                                {props.flash.status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-foreground">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full h-10 pl-9 pr-3 text-sm bg-surface border border-border-subtle rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="nama@email.com"
                                        required
                                        autoFocus
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-destructive mt-1.5">{errors.email}</p>}
                            </div>

                            <Btn
                                type="submit"
                                loading={processing}
                                className="w-full h-10"
                                icon={<Send className="w-4 h-4" />}
                            >
                                Kirim Tautan Pemulihan
                            </Btn>
                        </form>

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            <Link href="/login" className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium">
                                <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Masuk
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
