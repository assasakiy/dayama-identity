import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Plus, Pencil, ShieldCheck, Lock, Save, Shield,
    Crown, Star, User, Copy, Trash2, MoreVertical
} from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import Toolbar, { CollectionFilters } from '@/Components/Collection/Toolbar';
import Pagination, { Paginated } from '@/Components/Collection/Pagination';
import Records from '@/Components/Collection/Records';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/Components/ui/modal';
import { Input } from '@/Components/ui/input';
import { Btn } from '@/Components/ui/btn';
import PermissionMatrix from '@/Components/ui/permission-matrix';
import ConfirmDialog from '@/Components/ui/confirm-dialog';

interface Role {
    id: string;
    name: string;
    display_name?: string;
    description?: string;
    color?: string;
    icon?: string;
    rank: number;
    is_system: boolean;
    status: string;
    permissions_count: number;
    permission_names: string[];
    users_count: number;
    can: { update: boolean; delete: boolean };
}

interface Permission { id: string; name: string; module: string; action: string; description: string }

const ROLE_COLORS = ['#7c3aed', '#2563eb', '#dc2626', '#059669', '#d97706', '#6b7280', '#ec4899', '#0891b2'];
const ROLE_ICONS = ['shield', 'crown', 'star', 'user'];

function RoleIcon({ icon, color, className = 'w-4 h-4' }: { icon?: string; color?: string; className?: string }) {
    const style = color ? { color } : {};
    switch (icon) {
        case 'crown': return <Crown className={className} style={style} />;
        case 'star': return <Star className={className} style={style} />;
        case 'user': return <User className={className} style={style} />;
        default: return <ShieldCheck className={className} style={style} />;
    }
}

export default function RolesIndex({
    roles,
    groupedPermissions,
    filters,
    canCreate,
}: {
    roles: Paginated<Role>;
    groupedPermissions: Record<string, Permission[]>;
    filters: CollectionFilters;
    canCreate: boolean;
}) {
    const [editing, setEditing] = useState<Role | null>(null);
    const [open, setOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

    const form = useForm({
        name: '',
        display_name: '',
        description: '',
        color: '#7c3aed',
        icon: 'shield',
        rank: 10,
        permission_ids: [] as string[],
    });

    const permissions = Object.values(groupedPermissions).flat();

    const openCreate = () => {
        setEditing(null);
        form.clearErrors();
        form.setData({
            name: '',
            display_name: '',
            description: '',
            color: '#7c3aed',
            icon: 'shield',
            rank: 10,
            permission_ids: [],
        });
        setOpen(true);
    };

    const openEdit = (role: Role) => {
        setEditing(role);
        form.clearErrors();
        form.setData({
            name: role.name,
            display_name: role.display_name || role.name,
            description: role.description || '',
            color: role.color || '#7c3aed',
            icon: role.icon || 'shield',
            rank: role.rank,
            permission_ids: permissions.filter(p => role.permission_names?.includes(p.name)).map(p => p.id),
        });
        setOpen(true);
    };

    const handleDuplicate = (role: Role) => {
        router.post(`/dashboard/roles/${role.id}/duplicate`, {}, { preserveScroll: true });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/dashboard/roles/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const actions = (role: Role) => (
        <div className="flex items-center justify-end gap-1">
            {role.can.update && (
                <button
                    aria-label={`Edit ${role.name}`}
                    onClick={() => openEdit(role)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
                >
                    <Pencil className="h-4 w-4" />
                </button>
            )}
            {canCreate && (
                <button
                    aria-label={`Duplikat ${role.name}`}
                    onClick={() => handleDuplicate(role)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
                >
                    <Copy className="h-4 w-4" />
                </button>
            )}
            {role.can.delete && !role.is_system && (
                <button
                    aria-label={`Hapus ${role.name}`}
                    onClick={() => setDeleteTarget(role)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            )}
        </div>
    );

    return (
        <DashboardLayout>
            <Head title="Peran Akses (Roles)" />
            <div className="space-y-6 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Peran Akses (Roles)</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">{roles.total} peran terdaftar dalam sistem</p>
                    </div>
                    {canCreate && (
                        <div className="flex justify-end">
                            <Btn onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
                                Peran Baru
                            </Btn>
                        </div>
                    )}
                </div>

                <Toolbar path="/dashboard/roles" filters={filters} />

                <Records
                    records={roles.data}
                    grid={filters.view === 'grid'}
                    columns={[
                        {
                            key: 'name',
                            label: 'Nama Peran',
                            render: r => (
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                                        style={{ backgroundColor: `${r.color || '#7c3aed'}15`, color: r.color || '#7c3aed' }}
                                    >
                                        <RoleIcon icon={r.icon} color={r.color} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-sm">{r.display_name || r.name}</span>
                                            {r.is_system && <Lock aria-label="Peran sistem" className="h-3 w-3 text-muted-foreground" />}
                                        </div>
                                        <p className="font-mono text-xs text-muted-foreground">{r.name}</p>
                                    </div>
                                </div>
                            ),
                        },
                        { key: 'rank', label: 'Tingkat (Rank)', render: r => <span className="font-mono text-xs">{r.rank}</span> },
                        {
                            key: 'permissions',
                            label: 'Izin & Pengguna',
                            render: r => (
                                <span className="text-xs text-muted-foreground">
                                    {r.permissions_count} izin · {r.users_count} pengguna
                                </span>
                            ),
                        },
                        { key: 'actions', label: 'Aksi', align: 'right', render: actions },
                    ]}
                    card={role => (
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                                        style={{ backgroundColor: `${role.color || '#7c3aed'}15`, color: role.color || '#7c3aed' }}
                                    >
                                        <RoleIcon icon={role.icon} color={role.color} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold flex items-center gap-1">
                                            {role.display_name || role.name}
                                            {role.is_system && <Lock className="h-3 w-3 text-muted-foreground" />}
                                        </h3>
                                        <p className="font-mono text-xs text-muted-foreground">{role.name}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-muted">
                                    Rank {role.rank}
                                </span>
                            </div>
                            {role.description && <p className="text-xs text-muted-foreground line-clamp-2">{role.description}</p>}
                            <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-xs text-muted-foreground">
                                <span>{role.permissions_count} izin · {role.users_count} pengguna</span>
                                {actions(role)}
                            </div>
                        </div>
                    )}
                    pagination={<Pagination page={roles} path="/dashboard/roles" filters={filters} />}
                />
            </div>

            {/* Create / Edit Modal */}
            <Modal open={open} onOpenChange={setOpen} maxWidth="2xl">
                <ModalHeader
                    title={editing ? `Edit Peran: ${editing.name}` : 'Buat Peran Baru'}
                    description="Kelola nama, tampilan, tingkat kekuasaan (rank), dan izin akses peran ini."
                    onClose={() => setOpen(false)}
                />
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
                        editing ? form.put(`/dashboard/roles/${editing.id}`, options) : form.post('/dashboard/roles', options);
                    }}
                >
                    <ModalBody className="space-y-4 max-h-[70vh]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Nama Kunci (Identifier/Slug)"
                                required
                                value={form.data.name}
                                onChange={e => form.setData('name', e.target.value)}
                                error={form.errors.name}
                                placeholder="misal: editor_yayasan"
                            />
                            <Input
                                label="Nama Tampilan (Display Name)"
                                value={form.data.display_name}
                                onChange={e => form.setData('display_name', e.target.value)}
                                error={form.errors.display_name}
                                placeholder="misal: Editor Yayasan"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Tingkat Hierarki (Rank 0-100)"
                                type="number"
                                min={0}
                                max={100}
                                value={form.data.rank}
                                onChange={e => form.setData('rank', Number(e.target.value))}
                                error={form.errors.rank}
                            />
                            <div>
                                <label className="block text-xs font-medium mb-1.5">Warna Aksen</label>
                                <div className="flex items-center gap-2 pt-1">
                                    {ROLE_COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => form.setData('color', c)}
                                            className={`w-6 h-6 rounded-full transition-transform ${form.data.color === c ? 'scale-125 ring-2 ring-primary ring-offset-2' : 'hover:scale-110'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Ikon Peran</label>
                            <div className="flex items-center gap-2">
                                {ROLE_ICONS.map(i => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => form.setData('icon', i)}
                                        className={`px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                                            form.data.icon === i
                                                ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                : 'border-border-subtle hover:bg-surface-muted text-muted-foreground'
                                        }`}
                                    >
                                        <RoleIcon icon={i} className="w-3.5 h-3.5" />
                                        <span className="capitalize">{i}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Input
                            label="Deskripsi Peran"
                            value={form.data.description}
                            onChange={e => form.setData('description', e.target.value)}
                            error={form.errors.description}
                            placeholder="Deskripsikan fungsi dan batasan peran ini"
                        />

                        <div className="pt-2 border-t border-border-subtle">
                            <p className="text-sm font-semibold mb-2">Matriks Izin Akses Domain Account</p>
                            <PermissionMatrix
                                groupedPermissions={groupedPermissions}
                                selected={permissions.filter(p => form.data.permission_ids.includes(p.id)).map(p => p.name)}
                                onChange={names => form.setData('permission_ids', permissions.filter(p => names.includes(p.name)).map(p => p.id))}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Btn type="submit" loading={form.processing} icon={<Save className="w-4 h-4" />}>
                            {editing ? 'Perbarui Peran' : 'Simpan Peran'}
                        </Btn>
                    </ModalFooter>
                </form>
            </Modal>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={open => { if (!open) setDeleteTarget(null); }}
                title="Hapus Peran"
                message={`Apakah Anda yakin ingin menghapus peran "${deleteTarget?.display_name || deleteTarget?.name}"? Pengguna dengan peran ini akan kehilangan hak akses terkait.`}
                confirmLabel="Hapus Peran"
                variant="danger"
                onConfirm={confirmDelete}
            />
        </DashboardLayout>
    );
}
