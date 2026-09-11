import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Shield, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Btn } from '@/Components/ui/btn';
import ConfirmDialog from '@/Components/ui/confirm-dialog';

interface RoleAssignmentItem {
    id: string;
    role_name: string;
    role_rank: number;
    assigned_at: string | null;
}

interface Props {
    userId: string;
    canUpdate: boolean;
    assignments: RoleAssignmentItem[];
    availableRoles: { id: string; name: string; rank: number }[];
}

export function UserRolesTab({
    userId,
    canUpdate,
    assignments = [],
    availableRoles = [],
}: Props) {
    const [selectedRoleId, setSelectedRoleId] = useState(availableRoles[0]?.id || '');
    const [assigning, setAssigning] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoleId) return;
        setAssigning(true);
        router.post(`/dashboard/users/${userId}/roles`, {
            role_id: selectedRoleId,
        }, {
            preserveScroll: true,
            onFinish: () => setAssigning(false),
        });
    };

    const confirmRevoke = () => {
        if (!assignmentToDelete) return;
        router.delete(`/dashboard/users/${userId}/roles/${assignmentToDelete}`, {
            preserveScroll: true,
            onSuccess: () => setAssignmentToDelete(null),
        });
    };

    return (
        <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-background shadow-xs">
                <div className="px-5 py-4 border-b border-border-subtle bg-surface/30">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> Penugasan Peran
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Daftar peran aktif pengguna</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border-subtle bg-surface-muted/50 text-xs font-semibold text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left">Peran</th>
                                <th className="px-4 py-3 text-left">Tingkat (Rank)</th>
                                <th className="px-4 py-3 text-left">Ditetapkan</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {assignments.map((ra) => (
                                <tr key={ra.id} className="hover:bg-surface-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                                        {ra.role_name}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                        Rank {ra.role_rank}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {ra.assigned_at}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {canUpdate && (
                                            <button
                                                type="button"
                                                onClick={() => setAssignmentToDelete(ra.id)}
                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                aria-label={`Cabut peran ${ra.role_name}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!assignments.length && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground text-xs">
                                        Belum ada penugasan peran aktif untuk pengguna ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {canUpdate && availableRoles.length > 0 && (
                <Card>
                    <CardHeader className="border-b border-border-subtle pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Plus className="w-4 h-4 text-primary" /> Tetapkan Peran Baru
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <form onSubmit={handleAssign} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-medium">Pilih Peran</label>
                                <select
                                    value={selectedRoleId}
                                    onChange={(e) => setSelectedRoleId(e.target.value)}
                                    className="w-full h-9 rounded-md border border-border-subtle bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    {availableRoles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} (Rank {r.rank})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end">
                                <Btn type="submit" loading={assigning} icon={<Plus className="w-4 h-4" />}>
                                    Tetapkan Peran
                                </Btn>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <ConfirmDialog
                open={!!assignmentToDelete}
                onOpenChange={(open) => { if (!open) setAssignmentToDelete(null); }}
                title="Cabut Penugasan Peran"
                message="Apakah Anda yakin ingin mencabut peran ini dari pengguna? Hak akses terkait peran tersebut akan dibatalkan seketika."
                confirmLabel="Cabut Peran"
                variant="danger"
                onConfirm={confirmRevoke}
            />
        </div>
    );
}
