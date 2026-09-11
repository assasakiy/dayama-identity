import React, { ReactNode, useEffect, useState } from 'react';

export interface Column<T> {
    key: string;
    label: string;
    render: (record: T) => ReactNode;
    align?: 'left' | 'center' | 'right';
}

export default function Records<T extends { id: string }>({
    records,
    columns,
    grid,
    card,
    selectionActions,
    pagination,
}: {
    records: T[];
    columns: Column<T>[];
    grid: boolean;
    card: (record: T) => ReactNode;
    selectionActions?: (selected: T[]) => ReactNode;
    pagination?: ReactNode;
}) {
    const [selected, setSelected] = useState<string[]>([]);
    useEffect(() => setSelected([]), [records]);
    const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
    const all = records.length > 0 && selected.length === records.length;
    const selectAll = (
        <input
            type="checkbox"
            aria-label="Pilih semua data"
            checked={all}
            onChange={() => setSelected(all ? [] : records.map(record => record.id))}
            className="h-4 w-4 rounded border-border-subtle text-primary accent-primary"
        />
    );
    const actions = (
        <div className="flex items-center gap-3 w-full">
            {selectAll}
            <span aria-live="polite" className="text-xs font-semibold text-foreground">
                {selected.length} dipilih
            </span>
            {selectionActions?.(records.filter(record => selected.includes(record.id)))}
            <button
                type="button"
                onClick={() => setSelected([])}
                className="ml-auto rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
            >
                Batal pilihan
            </button>
        </div>
    );

    if (grid) {
        return (
            <div className="space-y-4">
                {selected.length > 0 && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 shadow-xs">
                        {actions}
                    </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {records.map(record => (
                        <article key={record.id} className="relative rounded-xl border border-border-subtle bg-background p-5 hover:border-primary/40 hover:shadow-xs transition-all">
                            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        aria-label={`Pilih ${record.id}`}
                                        checked={selected.includes(record.id)}
                                        onChange={() => toggle(record.id)}
                                        className="h-4 w-4 rounded border-border-subtle text-primary accent-primary"
                                    />
                                    Pilih
                                </label>
                            </div>
                            {card(record)}
                        </article>
                    ))}
                </div>
                {!records.length && (
                    <div className="rounded-xl border border-border-subtle bg-background p-12 text-center text-sm text-muted-foreground">
                        Tidak ada data.
                    </div>
                )}
                {pagination && (
                    <div className="rounded-xl border border-border-subtle bg-background p-4 shadow-xs">
                        {pagination}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-background shadow-xs">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-border-subtle bg-surface-muted/50">
                        {selected.length > 0 ? (
                            <tr>
                                <th colSpan={columns.length + 1} className="px-4 py-3 text-left font-medium bg-primary/5">
                                    {actions}
                                </th>
                            </tr>
                        ) : (
                            <tr>
                                <th className="w-10 px-4 py-3">{selectAll}</th>
                                {columns.map(column => (
                                    <th
                                        key={column.key}
                                        scope="col"
                                        className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                                            column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                                        }`}
                                    >
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {records.map(record => (
                            <tr key={record.id} className="hover:bg-surface-muted/30 transition-colors">
                                <td className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        aria-label={`Pilih ${record.id}`}
                                        checked={selected.includes(record.id)}
                                        onChange={() => toggle(record.id)}
                                        className="h-4 w-4 rounded border-border-subtle text-primary accent-primary"
                                    />
                                </td>
                                {columns.map(column => (
                                    <td
                                        key={column.key}
                                        className={`px-4 py-3 ${
                                            column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                                        }`}
                                    >
                                        {column.render(record)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {!records.length && (
                            <tr>
                                <td colSpan={columns.length + 1} className="p-10 text-center text-muted-foreground text-sm">
                                    Tidak ada data.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {pagination && (
                <div className="border-t border-border-subtle bg-surface/40 px-4 py-3">
                    {pagination}
                </div>
            )}
        </div>
    );
}
