import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import Toolbar, { CollectionFilters } from '@/Components/Collection/Toolbar';
import Pagination, { Paginated } from '@/Components/Collection/Pagination';
import Records from '@/Components/Collection/Records';
import { Badge } from '@/Components/ui/badge';
import ConfirmDialog from '@/Components/ui/confirm-dialog';

interface User {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
    status: string;
    is_verified: boolean;
    roles: { name: string }[];
    can: { update: boolean; delete: boolean };
}

interface Role { id: string; name: string; display_name?: string }

function UserAvatar({ user }: { user: User }) {
    const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    if (user.avatar_url) {
        return <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-border-subtle shrink-0" />;
    }
    return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
            {initials}
        </div>
    );
}

export default function Index({ users, roles, filters, canCreate }: { users: Paginated<User>; roles: Role[]; filters: CollectionFilters; canCreate: boolean }) {
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const actions = (user: User) => (
        <div className="flex items-center justify-end gap-1">
            <Link
                aria-label={`Lihat ${user.name}`}
                href={`/dashboard/users/${user.id}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
            >
                <Eye className="h-4 w-4" />
            </Link>
            {user.can.update && (
                <Link
                    aria-label={`Edit ${user.name}`}
                    href={`/dashboard/users/${user.id}/edit`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
                >
                    <Pencil className="h-4 w-4" />
                </Link>
            )}
            {user.can.delete && (
                <button
                    type="button"
                    aria-label={`Hapus ${user.name}`}
                    onClick={() => setUserToDelete(user)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            )}
        </div>
    );

    const identity = (user: User) => (
        <div className="flex items-center gap-3">
            <UserAvatar user={user} />
            <div>
                <Link className="font-semibold text-foreground hover:text-primary transition-colors text-sm" href={`/dashboard/users/${user.id}`}>
                    {user.name}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>
        </div>
    );

    const badges = (user: User) => (
        <div className="flex flex-wrap gap-1">
            {user.roles.map(role => (
                <span key={role.name} className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-muted/70 px-2 py-0.5 text-xs text-foreground font-medium">
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    {role.name}
                </span>
            ))}
            {!user.roles.length && <span className="text-xs text-muted-foreground italic">Belum ada peran</span>}
        </div>
    );

    const statusBadge = (user: User) => (
        <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-[11px] font-normal">
            {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
        </Badge>
    );

    const confirmDelete = () => {
        if (!userToDelete) return;
        router.delete(`/dashboard/users/${userToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => setUserToDelete(null),
        });
    };

    return (
        <DashboardLayout>
            <Head title="Pengguna (Users)" />
            <div className="space-y-6 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Pengguna (Users)</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Kelola identitas akun dan hak akses pengguna sistem ({users.total} total)</p>
                    </div>
                    {canCreate && (
                        <div className="flex justify-end">
                            <Link
                                href="/dashboard/users/create"
                                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                            >
                                <Plus className="h-4 w-4" /> Pengguna Baru
                            </Link>
                        </div>
                    )}
                </div>

                <Toolbar
                    path="/dashboard/users"
                    filters={filters}
                    definitions={[
                        { key: 'role', label: 'Semua Peran', options: roles.map(role => ({ value: role.name, label: role.display_name ?? role.name })) },
                        { key: 'status', label: 'Semua Status', options: [{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Nonaktif' }, { value: 'banned', label: 'Diblokir' }] },
                        { key: 'verified', label: 'Semua Pengguna', options: [{ value: 'yes', label: 'Email Terverifikasi' }, { value: 'no', label: 'Belum Terverifikasi' }] },
                    ]}
                />

                <Records
                    records={users.data}
                    grid={filters.view === 'grid'}
                    columns={[
                        { key: 'identity', label: 'Pengguna', render: identity },
                        { key: 'roles', label: 'Peran', render: badges },
                        { key: 'status', label: 'Status', render: statusBadge },
                        { key: 'actions', label: 'Aksi', align: 'right', render: actions },
                    ]}
                    card={user => (
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                {identity(user)}
                                {statusBadge(user)}
                            </div>
                            <div className="pt-2">{badges(user)}</div>
                            <div className="flex items-center justify-end border-t border-border-subtle pt-2">
                                {actions(user)}
                            </div>
                        </div>
                    )}
                    pagination={<Pagination page={users} path="/dashboard/users" filters={filters} />}
                />
            </div>

            <ConfirmDialog
                open={!!userToDelete}
                onOpenChange={open => { if (!open) setUserToDelete(null); }}
                title="Hapus Pengguna"
                message={`Apakah Anda yakin ingin menghapus akun "${userToDelete?.name}" (${userToDelete?.email})? Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel="Hapus Pengguna"
                variant="danger"
                onConfirm={confirmDelete}
            />
        </DashboardLayout>
    );
}
