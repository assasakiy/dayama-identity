import React, { useState } from 'react';
import axios from 'axios';
import { useForm, usePage, router, Head } from '@inertiajs/react';
import AccountSettingsLayout from '@/Layouts/AccountSettingsLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/Components/ui/dialog';
import ConfirmDialog from '@/Components/ui/confirm-dialog';
import { ShieldCheck, Loader2, Save, Check } from 'lucide-react';
import { Btn } from '@/Components/ui/btn';

export default function SecurityIndex() {
    const { two_factor_enabled } = usePage<any>().props as any;
    const { data, setData, put, processing, errors, recentlySuccessful, reset, isDirty } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/profile/password', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);
    const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [isDisableConfirmOpen, setIsDisableConfirmOpen] = useState(false);

    const enable2FA = () => {
        setIsGenerating(true);
        axios.post('/profile/security/two-factor').then(response => {
            setQrCodeSvg(response.data.qr_code_svg);
            setSecret(response.data.secret);
            setIs2FADialogOpen(true);
            setIsGenerating(false);
        }).catch(() => {
            setIsGenerating(false);
        });
    };

    const confirm2FA = (e: React.FormEvent) => {
        e.preventDefault();
        setIsConfirming(true);
        router.post('/profile/security/two-factor/confirm', { code: twoFactorCode }, {
            preserveScroll: true,
            onSuccess: () => {
                setIs2FADialogOpen(false);
                setIsConfirming(false);
                setTwoFactorCode('');
            },
            onError: () => {
                setIsConfirming(false);
            }
        });
    };

    const disable2FA = () => {
        setIsDisableConfirmOpen(true);
    };

    const confirmDisable2FA = () => {
        router.delete('/profile/security/two-factor', { 
            preserveScroll: true,
            onSuccess: () => setIsDisableConfirmOpen(false)
        });
    };

    return (
        <AccountSettingsLayout 
            title="Keamanan" 
            description="Kelola kata sandi dan pengaturan keamanan Anda."
        >
            <Head title="Keamanan Akun" />
            <div className="space-y-6">
                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            Ubah Kata Sandi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={submit} className="space-y-5 w-full">
                            <div className="space-y-2.5">
                                <label className="text-sm font-medium">Kata Sandi Saat Ini</label>
                                <input
                                    type="password"
                                    value={data.current_password}
                                    onChange={e => setData('current_password', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                />
                                {errors.current_password && <p className="text-sm text-destructive">{errors.current_password}</p>}
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-sm font-medium">Kata Sandi Baru</label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                />
                                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-sm font-medium">Konfirmasi Kata Sandi Baru</label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={e => setData('password_confirmation', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-2">
                                {recentlySuccessful && (
                                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Kata sandi diperbarui.</p>
                                )}
                                <Btn 
                                    type="submit" 
                                    loading={processing}
                                    disabled={!isDirty || processing}
                                    icon={<Save className="w-4 h-4" />}
                                >
                                    Perbarui Kata Sandi
                                </Btn>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                            Autentikasi Dua Faktor (2FA)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-border-subtle bg-surface-muted/50 rounded-lg">
                            <div>
                                <h3 className="text-sm font-semibold mb-1">
                                    {two_factor_enabled ? 'Autentikasi dua faktor telah aktif' : 'Lindungi akun Anda'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {two_factor_enabled 
                                        ? "Akun Anda terlindungi. Anda akan dimintai kode aman saat masuk." 
                                        : "Tambahkan lapisan keamanan ekstra ke akun Anda dengan mengaktifkan autentikasi dua faktor."}
                                </p>
                            </div>
                            {two_factor_enabled ? (
                                <button 
                                    onClick={disable2FA}
                                    type="button" 
                                    className="w-full sm:w-auto px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors whitespace-nowrap"
                                >
                                    Nonaktifkan 2FA
                                </button>
                            ) : (
                                <button 
                                    onClick={enable2FA}
                                    disabled={isGenerating}
                                    type="button" 
                                    className="w-full sm:w-auto px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                                >
                                    {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Aktifkan 2FA
                                </button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={is2FADialogOpen} onOpenChange={setIs2FADialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Atur Autentikasi Dua Faktor</DialogTitle>
                        <DialogDescription>
                            Konfigurasi aplikasi autentikator Anda untuk memulai.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-4 space-y-4">
                        <div className="text-sm text-center">
                            Pindai kode QR berikut menggunakan aplikasi autentikator di ponsel Anda (seperti Google Authenticator).
                        </div>
                        
                        {qrCodeSvg && (
                            <div className="bg-white p-2 rounded-lg" dangerouslySetInnerHTML={{ __html: qrCodeSvg }} />
                        )}
                        
                        {secret && (
                            <div className="text-xs text-center text-muted-foreground">
                                <p className="mb-1">Atau masukkan kunci setup secara manual:</p>
                                <code className="px-2 py-1 bg-surface-muted rounded text-foreground font-mono">{secret}</code>
                            </div>
                        )}
                    </div>
                    
                    <form onSubmit={confirm2FA} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kode Autentikasi</label>
                            <input
                                type="text"
                                value={twoFactorCode}
                                onChange={e => setTwoFactorCode(e.target.value)}
                                placeholder="Masukkan kode 6 digit"
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <button 
                                type="button" 
                                onClick={() => setIs2FADialogOpen(false)}
                                className="px-4 py-2 bg-surface-muted text-foreground rounded-lg text-sm font-medium hover:bg-border/50 transition-colors"
                            >
                                Batal
                            </button>
                            <Btn 
                                type="submit" 
                                loading={isConfirming}
                                disabled={isConfirming || twoFactorCode.length < 6}
                                icon={<Check className="w-4 h-4" />}
                            >
                                Verifikasi & Aktifkan
                            </Btn>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isDisableConfirmOpen}
                onOpenChange={setIsDisableConfirmOpen}
                title="Nonaktifkan Autentikasi Dua Faktor"
                message="Apakah Anda yakin ingin menonaktifkan autentikasi dua faktor? Ini akan mengurangi keamanan akun Anda."
                confirmLabel="Nonaktifkan 2FA"
                variant="danger"
                onConfirm={confirmDisable2FA}
            />
        </AccountSettingsLayout>
    );
}
