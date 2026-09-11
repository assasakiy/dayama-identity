import React from 'react';
import { usePage, Head } from '@inertiajs/react';
import { Monitor, Clock, Shield } from 'lucide-react';
import AccountSettingsLayout from '@/Layouts/AccountSettingsLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';

export default function SessionsIndex() {
    const { user } = usePage<any>().props;

    return (
        <AccountSettingsLayout
            title="Sesi Aktif"
            description="Perangkat dan peramban yang saat ini masuk ke akun Anda."
        >
            <Head title="Sesi Aktif" />
            <div className="space-y-6">
                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-primary" /> Sesi Saat Ini
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-border-subtle bg-surface/50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <Monitor className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Peramban Web Aktif</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3 h-3" /> Masuk sebagai {user.email}
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border border-green-200">
                                Sesi Ini
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Pengelolaan multi-perangkat jarak jauh akan disinkronkan saat terhubung ke layanan OAuth provider.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AccountSettingsLayout>
    );
}
