import React, { useState } from 'react';
import { usePage, router, Head } from '@inertiajs/react';
import AccountSettingsLayout from '@/Layouts/AccountSettingsLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/Components/ui/card';
import ConfirmDialog from '@/Components/ui/confirm-dialog';
import Toolbar, { CollectionFilters } from '@/Components/Collection/Toolbar';
import { Share2, Plus, Code, Mail, Loader2 } from 'lucide-react';

interface ConnectedAccount {
    id: string;
    provider: string;
    provider_name: string;
    provider_id: string;
    email: string | null;
    avatar: string | null;
}

export default function ConnectedIndex() {
    const { connectedAccounts = [], status, filters = {} } = usePage<any>().props;
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [disconnectTarget, setDisconnectTarget] = useState<{ accountId: string; providerId: string } | null>(null);

    const availableProviders = [
        { id: 'google', name: 'Google', icon: Mail },
        { id: 'github', name: 'GitHub', icon: Code },
    ];

    const searchQuery = String(filters.search || '').toLowerCase();
    const visibleProviders = availableProviders.filter(provider => {
        if (!searchQuery) return true;
        const connected = connectedAccounts.find((a: ConnectedAccount) => a.provider_name === provider.id);
        return provider.name.toLowerCase().includes(searchQuery) || (connected?.email && connected.email.toLowerCase().includes(searchQuery));
    });

    const handleConnect = (providerId: string) => {
        setLoadingId(providerId);
        window.location.href = `/auth/${providerId}`;
    };

    const handleDisconnect = (accountId: string, providerId: string) => {
        setDisconnectTarget({ accountId, providerId });
    };

    const confirmDisconnect = () => {
        if (!disconnectTarget) return;
        setLoadingId(disconnectTarget.providerId);
        router.delete(`/profile/connected-accounts/${disconnectTarget.accountId}`, {
            onSuccess: () => setDisconnectTarget(null),
            onFinish: () => setLoadingId(null),
        });
    };

    return (
        <AccountSettingsLayout
            title="Akun Terhubung"
            description="Kelola akun pihak ketiga yang terhubung ke profil Anda."
        >
            <Head title="Akun Terhubung" />
            <div className="space-y-6">
                {status && (
                    <div className="p-4 rounded-md bg-green-50 text-green-700 text-sm font-medium border border-green-200">
                        {status}
                    </div>
                )}

                <Toolbar path="/profile/connected-accounts" filters={filters} />

                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-surface-muted flex items-center justify-center">
                                <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </span>
                            Akun Sosial & OAuth
                        </CardTitle>
                        <CardDescription className="text-xs mt-1.5 ml-8">
                            Hubungkan akun Anda untuk mengaktifkan single sign-on (SSO) dan bagikan konten Anda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {visibleProviders.map((provider) => {
                                const connected = connectedAccounts.find((a: ConnectedAccount) => a.provider_name === provider.id);
                                const isLoading = loadingId === provider.id;

                                return (
                                    <div key={provider.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border-subtle rounded-lg bg-surface-muted/30 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shadow-sm shrink-0">
                                                <provider.icon className="w-5 h-5 text-foreground" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold">{provider.name}</h4>
                                                {connected ? (
                                                    <p className="text-xs text-muted-foreground mt-0.5 break-all">
                                                        Terhubung sebagai {connected.email || 'tertaut'}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Belum terhubung
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="shrink-0 ml-14 sm:ml-0">
                                            {connected ? (
                                                <button
                                                    onClick={() => handleDisconnect(connected.id, provider.id)}
                                                    disabled={isLoading}
                                                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors border border-transparent hover:border-destructive/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Putuskan'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleConnect(provider.id)}
                                                    disabled={isLoading}
                                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-surface-muted shadow-sm transition-colors disabled:opacity-50"
                                                >
                                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                    {isLoading ? 'Menghubungkan...' : 'Hubungkan'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {!visibleProviders.length && (
                                <p className="p-4 text-center text-sm text-muted-foreground">Tidak ada akun yang sesuai pencarian.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <ConfirmDialog
                open={!!disconnectTarget}
                onOpenChange={(open) => { if (!open) setDisconnectTarget(null); }}
                title="Putuskan Akun"
                message="Apakah Anda yakin ingin memutuskan akun ini?"
                confirmLabel="Putuskan"
                variant="danger"
                onConfirm={confirmDisconnect}
            />
        </AccountSettingsLayout>
    );
}
