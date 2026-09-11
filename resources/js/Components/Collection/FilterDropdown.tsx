import { Check, ChevronDown, Filter, Layers, ShieldCheck, CircleCheck, Boxes } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export interface FilterOption { value: string; label: string }
export interface FilterDefinition { key: string; label: string; options: FilterOption[] }

export default function FilterDropdown({ filter, value, onChange }: { filter: FilterDefinition; value: string; onChange: (value: string) => void }) {
    const icons = { role: ShieldCheck, status: CircleCheck, verified: CircleCheck, type: Layers, module: Boxes };
    const Icon = icons[filter.key as keyof typeof icons] ?? Filter;
    return <DropdownMenu.Root>
        <DropdownMenu.Trigger className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border-subtle bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" aria-label={filter.label}>
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{filter.options.find(option => option.value === value)?.label ?? filter.label}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={4} className="z-50 max-h-80 min-w-44 overflow-y-auto rounded-md border border-border-subtle bg-background p-1 shadow-lg">
                <DropdownMenu.RadioGroup value={value} onValueChange={onChange}>
                    {[{ value: '', label: filter.label }, ...filter.options].map(option => <DropdownMenu.RadioItem key={option.value} value={option.value} className="relative flex cursor-pointer items-center rounded px-8 py-2 text-sm outline-none focus:bg-surface-muted">
                        <DropdownMenu.ItemIndicator className="absolute left-2"><Check className="h-4 w-4" /></DropdownMenu.ItemIndicator>
                        {option.label}
                    </DropdownMenu.RadioItem>)}
                </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
        </DropdownMenu.Portal>
    </DropdownMenu.Root>;
}
