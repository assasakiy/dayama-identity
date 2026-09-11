import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CollectionFilters, visitCollection } from './Toolbar';

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
}

export default function Pagination({
    page,
    path,
    filters,
}: {
    page: Paginated<unknown>;
    path: string;
    filters: CollectionFilters;
}) {
    // Only show pagination when there are 11 or more items
    if (!page || page.total <= 10) {
        return null;
    }

    return (
        <nav aria-label="Navigasi Halaman" className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground w-full">
            <div className="flex items-center gap-2">
                <span>
                    Menampilkan <strong className="font-semibold text-foreground">{page.from ?? 0}–{page.to ?? 0}</strong> dari <strong className="font-semibold text-foreground">{page.total}</strong> data
                </span>
                <span className="text-border-subtle hidden sm:inline">|</span>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Baris:
                    <select
                        value={page.per_page}
                        onChange={(e) => visitCollection(path, filters, { per_page: Number(e.target.value) })}
                        className="h-8 rounded-lg border border-border-subtle bg-background px-2 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                        {[10, 20, 30, 40, 50, 100].map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="flex items-center gap-1.5">
                {page.prev_page_url ? (
                    <Link
                        preserveScroll
                        href={page.prev_page_url}
                        aria-label="Halaman sebelumnya"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-background text-foreground hover:bg-surface-muted transition-colors shadow-xs"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Link>
                ) : (
                    <span aria-disabled="true" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle/50 bg-surface-muted/30 text-muted-foreground/40 cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4" />
                    </span>
                )}

                <div className="px-2.5 py-1 rounded-lg bg-surface-muted/60 text-foreground font-medium text-xs">
                    {page.current_page} / {page.last_page}
                </div>

                {page.next_page_url ? (
                    <Link
                        preserveScroll
                        href={page.next_page_url}
                        aria-label="Halaman berikutnya"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-background text-foreground hover:bg-surface-muted transition-colors shadow-xs"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                ) : (
                    <span aria-disabled="true" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle/50 bg-surface-muted/30 text-muted-foreground/40 cursor-not-allowed">
                        <ChevronRight className="w-4 h-4" />
                    </span>
                )}
            </div>
        </nav>
    );
}
