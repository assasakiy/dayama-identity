import React from 'react';
import { Head } from '@inertiajs/react';
import { Shield, Award } from 'lucide-react';
import AccountSettingsLayout from '@/Layouts/AccountSettingsLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import Toolbar, { CollectionFilters } from '@/Components/Collection/Toolbar';

interface RoleItem {
    id: string;
    name: string;
    rank: number;
    description?: string;
    permissions: { id: string; name: string }[];
}

interface Props {
    assignments: {
        roles: RoleItem[];
    };
    filters?: CollectionFilters;
}

export default function RolesIndex({ assignments, filters = {} }: Props) {
    const allRoles = assignments?.roles || [];
    const searchQuery = String(filters.search || '').toLowerCase();

    const roles = allRoles.filter(role =>
        !searchQuery || role.name.toLowerCase().includes(searchQuery) || (role.description && role.description.toLowerCase().includes(searchQuery))
    );

    return (
        <AccountSettingsLayout
            title="Peran"
            description="Daftar peran aktif yang diberikan ke akun Anda."
        >
            <Head title="Peran Saya" />
            <div className="space-y-6">
                <Toolbar path="/profile/roles" filters={filters} />

                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" /> Peran Aktif ({roles.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {roles.map((r) => (
                            <div key={r.id} className="p-4 rounded-lg border border-border-subtle bg-surface/50 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm">{r.name}</h3>
                                    <Badge variant="outline" className="text-xs">
                                        <Award className="w-3 h-3 mr-1" /> Tingkat {r.rank}
                                    </Badge>
                                </div>
                                {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                                <div className="pt-2">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Izin Akses:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {r.permissions?.length ? (
                                            r.permissions.map((p) => (
                                                <span key={p.id} className="px-2 py-0.5 rounded bg-surface-muted border border-border-subtle text-[11px] text-muted-foreground font-mono">
                                                    {p.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Tidak ada izin eksplisit</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!roles.length && <p className="text-sm text-muted-foreground">Tidak ada peran aktif.</p>}
                    </CardContent>
                </Card>
            </div>
        </AccountSettingsLayout>
    );
}
