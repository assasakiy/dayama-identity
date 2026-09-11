import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Eye, EyeOff, Trash2, AppWindow, ExternalLink, Lock, Globe } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import Toolbar, { CollectionFilters } from '@/Components/Collection/Toolbar';
import Pagination, { Paginated } from '@/Components/Collection/Pagination';
import Records from '@/Components/Collection/Records';
import { Badge } from '@/Components/ui/badge';
import ConfirmDialog from '@/Components/ui/confirm-dialog';

interface ApplicationItem {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    logo?: string | null;
    base_url: string;
    launch_url: string;
    access_mode: 'public' | 'authenticated' | 'restricted';
    status: 'active' | 'inactive';
    users_count?: number;
    created_at?: string;
}

export default function Index({
    applications,
    filters,
    canManage,
}: {
    applications: Paginated<ApplicationItem>;
    filters: CollectionFilters;
    canManage: boolean;
}) {
    const [appToDelete, setAppToDelete] = useState<ApplicationItem | null>(null);

    const statusBadge = (app: ApplicationItem) => (
        <Badge variant={app.status === 'active' ? 'default' : 'secondary'} className="text-[11px] gap-1 font-normal">
            {app.status === 'active' ? <Eye className="h-3 w-3 text-emerald-500" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
            {app.status === 'active' ? 'Aktif' : 'Nonaktif'}
        </Badge>
    );

    const accessBadge = (app: ApplicationItem) => (
        <Badge variant="outline" className="text-[11px] gap-1 font-normal">
            {app.access_mode === 'restricted' ? (
                <>
                    <Lock className="h-3 w-3 text-amber-500" />
                    <span>Terbatas ({app.users_count ?? 0})</span>
                </>
            ) : app.access_mode === 'public' ? (
                <>
                    <Eye className="h-3 w-3 text-emerald-500" />
                    <span>Publik</span>
                </>
            ) : (
                <>
                    <Globe className="h-3 w-3 text-blue-500" />
                    <span>Terotentikasi</span>
                </>
            )}
        </Badge>
    );

    const actions = (app: ApplicationItem) => canManage && (
        <div className="flex items-center justify-end gap-1">
            <Link
                aria-label={`Edit ${app.name}`}
                href={`/dashboard/apps/${app.id}/edit`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
            >
                <Pencil className="h-4 w-4" />
            </Link>
            <button
                type="button"
                aria-label={`Hapus ${app.name}`}
                onClick={() => setAppToDelete(app)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );

    const confirmDelete = () => {
        if (!appToDelete) return;
        router.delete(`/dashboard/apps/${appToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => setAppToDelete(null),
        });
    };

    return (
        <DashboardLayout>
            <Head title="Registry Aplikasi" />
            <div className="space-y-6 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Registry Aplikasi</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Kelola aplikasi terhubung dan kontrol akses pengguna ({applications.total} total)</p>
                    </div>
                    {canManage && (
                        <div className="flex justify-end">
                            <Link
                                href="/dashboard/apps/create"
                                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                            >
                                <Plus className="h-4 w-4" /> Daftarkan Aplikasi
                            </Link>
                        </div>
                    )}
                </div>

                <Toolbar
                    path="/dashboard/apps"
                    filters={filters}
                    definitions={[
                        { key: 'status', label: 'Semua Status', options: [{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Nonaktif' }] },
                        { key: 'access_mode', label: 'Semua Mode Akses', options: [{ value: 'public', label: 'Publik' }, { value: 'authenticated', label: 'Terotentikasi' }, { value: 'restricted', label: 'Terbatas' }] },
                    ]}
                />

                <Records
                    records={applications.data}
                    grid={filters.view === 'grid'}
                    columns={[
                        {
                            key: 'app',
                            label: 'Aplikasi',
                            render: (app: ApplicationItem) => (
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <AppWindow className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{app.name}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{app.code}</p>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: 'urls',
                            label: 'Base URL & Launch URL',
                            render: (app: ApplicationItem) => (
                                <div className="space-y-0.5 text-xs">
                                    <a href={app.base_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground flex items-center gap-1 truncate max-w-xs">
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{app.base_url}</span>
                                    </a>
                                    <a href={app.launch_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 truncate max-w-xs">
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{app.launch_url}</span>
                                    </a>
                                </div>
                            ),
                        },
                        {
                            key: 'access_mode',
                            label: 'Mode Akses',
                            render: (app: ApplicationItem) => accessBadge(app),
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (app: ApplicationItem) => statusBadge(app),
                        },
                        {
                            key: 'actions',
                            label: 'Aksi',
                            align: 'right',
                            render: (app: ApplicationItem) => actions(app),
                        },
                    ]}
                    card={(app: ApplicationItem) => (
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <AppWindow className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">{app.name}</h3>
                                        <p className="font-mono text-xs text-muted-foreground">{app.code}</p>
                                    </div>
                                </div>
                                {statusBadge(app)}
                            </div>
                            <div className="text-xs space-y-1">
                                <p className="text-muted-foreground truncate">{app.base_url}</p>
                                <div>{accessBadge(app)}</div>
                            </div>
                            <div className="flex items-center justify-end border-t border-border-subtle pt-3 text-xs text-muted-foreground">
                                {actions(app)}
                            </div>
                        </div>
                    )}
                    pagination={<Pagination page={applications as any} path="/dashboard/apps" filters={filters} />}
                />

                <ConfirmDialog
                    open={!!appToDelete}
                    onOpenChange={(open) => { if (!open) setAppToDelete(null); }}
                    title="Hapus Aplikasi"
                    message={`Apakah Anda yakin ingin menghapus aplikasi "${appToDelete?.name}"? Pengguna tidak akan dapat mengakses aplikasi ini lagi.`}
                    confirmLabel="Hapus Aplikasi"
                    variant="danger"
                    onConfirm={confirmDelete}
                />
            </div>
        </DashboardLayout>
    );
}
