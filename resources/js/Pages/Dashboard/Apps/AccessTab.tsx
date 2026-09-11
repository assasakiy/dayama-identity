import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Btn } from '@/Components/ui/btn';
import { Badge } from '@/Components/ui/badge';
import ConfirmDialog from '@/Components/ui/confirm-dialog';
import { Lock, UserPlus, Trash2, User } from 'lucide-react';

export interface GrantedUser {
    id: string;
    name: string;
    email: string;
    status: string;
}

interface Props {
    applicationId: string;
    accessMode: string;
    grantedUsers: GrantedUser[];
    users: Array<{ id: string; name: string; email: string }>;
}

export default function AccessTab({ applicationId, accessMode, grantedUsers, users }: Props) {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [granting, setGranting] = useState(false);
    const [userToRevoke, setUserToRevoke] = useState<GrantedUser | null>(null);

    const handleGrantAccess = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) return;
        setGranting(true);
        router.post(`/dashboard/apps/${applicationId}/grants`, { user_id: selectedUserId }, {
            preserveScroll: true,
            onSuccess: () => { setSelectedUserId(''); setGranting(false); },
            onError: () => setGranting(false),
        });
    };

    const confirmRevoke = () => {
        if (!userToRevoke) return;
        router.delete(`/dashboard/apps/${applicationId}/grants/${userToRevoke.id}`, {
            preserveScroll: true,
            onSuccess: () => setUserToRevoke(null),
        });
    };

    const grantedUserIds = new Set(grantedUsers.map(u => u.id));
    const availableUsersToGrant = users.filter(u => !grantedUserIds.has(u.id));

    if (accessMode !== 'restricted') {
        return (
            <Card className="mt-4">
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Mode akses saat ini adalah <strong>{accessMode === 'public' ? 'Publik' : 'Terotentikasi'}</strong>. Ubah ke mode <strong>Terbatas</strong> untuk mengelola hak akses pengguna.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 mt-4">
            <Card>
                <CardHeader className="border-b border-border-subtle pb-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-500" /> Pengguna dengan Izin Akses ({grantedUsers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <form onSubmit={handleGrantAccess} className="flex flex-col sm:flex-row items-center gap-3">
                        <select
                            aria-label="Pilih Pengguna"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="flex h-9 w-full sm:w-80 rounded-md border border-border-subtle bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                        >
                            <option value="">-- Pilih Pengguna Aktif --</option>
                            {availableUsersToGrant.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.email})
                                </option>
                            ))}
                        </select>
                        <Btn type="submit" size="sm" loading={granting} disabled={!selectedUserId} icon={<UserPlus className="w-4 h-4" />}>
                            Beri Akses
                        </Btn>
                    </form>

                    <div className="border border-border-subtle rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-surface-muted/50 border-b border-border-subtle text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3">Nama</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {grantedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground text-xs">
                                            Belum ada pengguna yang diberikan akses khusus ke aplikasi ini.
                                        </td>
                                    </tr>
                                ) : (
                                    grantedUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-surface-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                <span>{u.name}</span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={u.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                                                    {u.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    aria-label={`Cabut akses ${u.name}`}
                                                    onClick={() => setUserToRevoke(u)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!userToRevoke}
                onOpenChange={(open) => { if (!open) setUserToRevoke(null); }}
                title="Cabut Akses Pengguna"
                message={`Yakin ingin mencabut akses aplikasi untuk ${userToRevoke?.name}? Pengguna ini tidak akan dapat membuka aplikasi ini lagi.`}
                confirmLabel="Cabut Akses"
                variant="danger"
                onConfirm={confirmRevoke}
            />
        </div>
    );
}
