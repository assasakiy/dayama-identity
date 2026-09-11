import React, { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
import { Btn } from '../../Components/ui/btn';

export default function TwoFactorChallenge() {
    const [recovery, setRecovery] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login/two-factor');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface via-background to-surface p-4">
            <Head title="Verifikasi Dua Faktor" />
            <div className="w-full max-w-sm relative">
                <div className="bg-background border border-border-subtle rounded-xl shadow-elevated overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

                    <div className="p-8">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight">Verifikasi Dua Faktor</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {recovery
                                    ? 'Masukkan salah satu kode pemulihan darurat Anda.'
                                    : 'Masukkan 6-digit kode keamanan dari aplikasi autentikator Anda.'}
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    {recovery ? 'Kode Pemulihan (Recovery Code)' : 'Kode Autentikasi'}
                                </label>
                                <input
                                    type="text"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    placeholder={recovery ? 'xxxxx-xxxxx' : '123456'}
                                    autoFocus
                                    required
                                    className="w-full h-11 px-3 text-center text-lg tracking-widest font-mono bg-surface border border-border-subtle rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                                {errors.code && (
                                    <p className="text-xs text-destructive mt-1.5 text-center">{errors.code}</p>
                                )}
                            </div>

                            <Btn type="submit" loading={processing} className="w-full h-10" icon={<ArrowRight className="w-4 h-4" />}>
                                Masuk
                            </Btn>

                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRecovery(!recovery);
                                        setData('code', '');
                                    }}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {recovery
                                        ? 'Gunakan kode autentikator'
                                        : 'Gunakan kode pemulihan darurat'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
