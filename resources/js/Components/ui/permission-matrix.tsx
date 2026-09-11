import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, CheckSquare, Square, MinusSquare } from 'lucide-react';

interface PermissionItem {
    id: string;
    name: string;
    module?: string;
    action?: string;
    description?: string;
}

interface GroupedPermissions {
    [module: string]: PermissionItem[];
}

interface PermissionMatrixProps {
    groupedPermissions: GroupedPermissions;
    selected: string[];
    onChange: (selected: string[]) => void;
}

const MODULE_LABELS: Record<string, string> = {
    dashboard: 'Dasbor',
    posts: 'Postingan',
    pages: 'Halaman',
    media: 'Media',
    comments: 'Komentar',
    categories: 'Kategori',
    tags: 'Tag',
    users: 'Pengguna',
    roles: 'Peran',
    settings: 'Pengaturan',
    analytics: 'Analitik',
    other: 'Lainnya',
};

const ACTION_COLORS: Record<string, string> = {
    view: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    create: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
    edit: 'bg-warning/10 text-warning border-warning/20 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    delete: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    publish: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    moderate: 'bg-warning/10 text-warning border-warning/20 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    upload: 'bg-info/10 text-info border-info/20 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    restore: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
    update: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    reply: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
};

function TriCheckbox({ state, onChange }: { state: 'all' | 'some' | 'none'; onChange: () => void }) {
    if (state === 'all') return (
        <button type="button" onClick={onChange} className="w-4 h-4 rounded flex items-center justify-center bg-primary border border-primary text-primary-foreground shrink-0 transition-all hover:bg-primary/80">
            <CheckSquare className="w-3 h-3" />
        </button>
    );
    if (state === 'some') return (
        <button type="button" onClick={onChange} className="w-4 h-4 rounded flex items-center justify-center bg-primary/20 border border-primary shrink-0 transition-all hover:bg-primary/30">
            <MinusSquare className="w-3 h-3 text-primary" />
        </button>
    );
    return (
        <button type="button" onClick={onChange} className="w-4 h-4 rounded flex items-center justify-center border border-border-subtle shrink-0 hover:border-primary transition-all">
            <Square className="w-3 h-3 text-muted-foreground opacity-0 hover:opacity-50" />
        </button>
    );
}

export default function PermissionMatrix({ groupedPermissions, selected, onChange }: PermissionMatrixProps) {
    const [search, setSearch] = useState('');
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const entries = useMemo(() => {
        return Object.entries(groupedPermissions).map(([mod, perms]) => ({
            label: MODULE_LABELS[mod] || mod,
            items: perms,
        }));
    }, [groupedPermissions]);

    const allPermNames = useMemo(
        () => entries.flatMap((e) => e.items.map((p) => p.name)),
        [entries]
    );

    const filtered = useMemo(() => {
        if (!search.trim()) return entries;
        const q = search.toLowerCase();
        return entries
            .map((e) => ({
                ...e,
                items: e.items.filter(
                    (p) => p.name.toLowerCase().includes(q) || (p.action || '').toLowerCase().includes(q)
                ),
            }))
            .filter((e) => e.items.length > 0);
    }, [entries, search]);

    const toggleGroup = (groupLabel: string) => {
        const group = entries.find((e) => e.label === groupLabel);
        if (!group) return;
        const perms = group.items.map((p) => p.name);
        const allSel = perms.every((n) => selected.includes(n));
        if (allSel) {
            onChange(selected.filter((s) => !perms.includes(s)));
        } else {
            const next = new Set(selected);
            perms.forEach((p) => next.add(p));
            onChange(Array.from(next));
        }
    };

    const togglePerm = (permName: string) => {
        if (selected.includes(permName)) {
            onChange(selected.filter((s) => s !== permName));
        } else {
            onChange([...selected, permName]);
        }
    };

    const toggleCollapse = (label: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            next.has(label) ? next.delete(label) : next.add(label);
            return next;
        });
    };

    const selectAll = () => onChange(allPermNames);
    const clearAll = () => onChange([]);

    const getGroupState = (groupLabel: string): 'all' | 'some' | 'none' => {
        const group = entries.find((e) => e.label === groupLabel);
        if (!group) return 'none';
        const perms = group.items.map((p) => p.name);
        const selCount = perms.filter((p) => selected.includes(p)).length;
        if (selCount === 0) return 'none';
        if (selCount === perms.length) return 'all';
        return 'some';
    };

    const getActionLabel = (perm: PermissionItem): string => {
        return perm.action || perm.name;
    };

    const getActionColor = (perm: PermissionItem): string => {
        const action = perm.action?.split('.')[0] || '';
        return ACTION_COLORS[action] || 'bg-surface-muted text-muted-foreground border-border-subtle';
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari izin..."
                        className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border-subtle bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                </div>
                <button type="button" onClick={selectAll} className="h-8 px-3 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors border border-transparent hover:border-primary/20">
                    Pilih Semua
                </button>
                <button type="button" onClick={clearAll} className="h-8 px-3 text-xs font-medium text-muted-foreground hover:bg-surface-muted rounded-md transition-colors border border-transparent hover:border-border-subtle">
                    Bersihkan
                </button>
            </div>

            <p className="text-xs text-muted-foreground px-0.5">
                {selected.length} dari {allPermNames.length} izin terpilih
            </p>

            <div className="border border-border-subtle rounded-lg overflow-hidden divide-y divide-border-subtle">
                {filtered.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">Tidak ada izin yang cocok dengan pencarian.</div>
                )}
                {filtered.map(({ label, items }) => {
                    const state = getGroupState(label);
                    const isCollapsed = collapsed.has(label);
                    return (
                        <div key={label}>
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-surface-muted/50 hover:bg-surface-muted transition-colors">
                                <TriCheckbox state={state} onChange={() => toggleGroup(label)} />
                                <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-foreground">
                                    {label}
                                </span>
                                <span className="text-xs text-muted-foreground mr-1">
                                    {items.filter((p) => selected.includes(p.name)).length}/{items.length}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => toggleCollapse(label)}
                                    className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                            </div>

                            {!isCollapsed && (
                                <div className="flex flex-wrap gap-1.5 px-4 py-3 bg-background">
                                    {items.map((perm) => {
                                        const active = selected.includes(perm.name);
                                        return (
                                            <button
                                                key={perm.id}
                                                type="button"
                                                onClick={() => togglePerm(perm.name)}
                                                title={perm.name}
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                                                    active
                                                        ? 'ring-2 ring-primary/40 ' + getActionColor(perm)
                                                        : 'opacity-50 ' + getActionColor(perm)
                                                }`}
                                            >
                                                {active && <CheckSquare className="w-3 h-3 shrink-0" />}
                                                {getActionLabel(perm)}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
