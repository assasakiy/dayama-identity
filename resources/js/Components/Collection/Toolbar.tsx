import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Search, Grid2X2, List } from 'lucide-react';
import FilterDropdown, { FilterDefinition } from './FilterDropdown';

export type CollectionFilters = Record<string, string | number | undefined>;

export function visitCollection(path: string, filters: CollectionFilters, changes: CollectionFilters) {
    router.get(path, { ...filters, ...changes, page: 1 }, { preserveState: true, preserveScroll: true, replace: true });
}

export default function Toolbar({ path, filters, definitions = [] }: { path: string; filters: CollectionFilters; definitions?: FilterDefinition[] }) {
    const [search, setSearch] = useState(String(filters.search ?? ''));
    useEffect(() => setSearch(String(filters.search ?? '')), [filters.search]);
    return <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <form className="relative w-full lg:flex-1" onSubmit={event => { event.preventDefault(); visitCollection(path, filters, { search }); }}>
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input aria-label="Search collection" value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari..." className="h-9 w-full rounded-md border border-border-subtle bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </form>
        <div className="grid auto-cols-fr grid-flow-col gap-2 lg:ml-auto lg:auto-cols-auto">
            {definitions.map(filter => <FilterDropdown key={filter.key} filter={filter} value={String(filters[filter.key] ?? '')} onChange={value => visitCollection(path, filters, { [filter.key]: value })} />)}
        </div>
        <div className="flex gap-1" role="group" aria-label="Collection view">
            {(['list', 'grid'] as const).map(view => {
                const Icon = view === 'list' ? List : Grid2X2;
                return <button key={view} type="button" aria-label={`${view} view`} aria-pressed={(filters.view ?? 'list') === view} onClick={() => router.get(path, { ...filters, view }, { preserveState: true, preserveScroll: true })} className="rounded-md border border-border-subtle p-2 aria-pressed:bg-primary/10"><Icon className="h-4 w-4" /></button>;
            })}
        </div>
    </div>;
}
