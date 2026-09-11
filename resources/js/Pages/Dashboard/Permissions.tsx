import React from 'react';
import { Head } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import Toolbar, { CollectionFilters } from '@/Components/Collection/Toolbar';
import Pagination, { Paginated } from '@/Components/Collection/Pagination';
import Records from '@/Components/Collection/Records';

interface Permission { id: string; name: string; module: string | null; action: string; roles_count: number }

export default function PermissionsIndex({ permissions, modules, filters }: { permissions: Paginated<Permission>; modules: string[]; filters: CollectionFilters }) {
    const action = (permission: Permission) => (
        <div className="flex items-center justify-end">
            <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                {permission.action}
            </span>
        </div>
    );

    return (
        <DashboardLayout>
            <Head title="Izin Akses (Permissions)" />
            <div className="space-y-6 w-full">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Izin Akses (Permissions)</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{permissions.total} izin terdaftar dalam sistem Account</p>
                </div>

                <Toolbar path="/dashboard/permissions" filters={filters} definitions={[{ key: 'module', label: 'Semua Modul', options: modules.map(module => ({ value: module, label: module })) }]} />

                <Records
                    records={permissions.data}
                    grid={filters.view === 'grid'}
                    columns={[
                        { key: 'name', label: 'Nama Izin', render: p => <span className="font-mono text-xs font-semibold">{p.name}</span> },
                        { key: 'module', label: 'Modul', render: p => <span className="text-xs text-muted-foreground">{p.module ?? '—'}</span> },
                        { key: 'action', label: 'Aksi', align: 'right', render: action },
                    ]}
                    card={p => (
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="break-words text-sm font-semibold">{p.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">{p.module}</p>
                                </div>
                                <KeyRound className="h-4 w-4 text-primary shrink-0" />
                            </div>
                            <div className="flex items-center justify-end border-t border-border-subtle pt-2">
                                {action(p)}
                            </div>
                        </div>
                    )}
                    pagination={<Pagination page={permissions} path="/dashboard/permissions" filters={filters} />}
                />
            </div>
        </DashboardLayout>
    );
}
