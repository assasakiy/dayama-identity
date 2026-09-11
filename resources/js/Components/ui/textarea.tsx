import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, id, ...props }, ref) => {
        const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
        return (
            <div className="space-y-1.5">
                {label && <label htmlFor={textareaId} className="text-sm font-medium">{label}</label>}
                <textarea
                    id={textareaId}
                    ref={ref}
                    className={cn(
                        'flex min-h-[80px] w-full rounded-sm border border-border-subtle bg-background px-3 py-2 text-sm transition-colors',
                        'placeholder:text-muted-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error && 'border-destructive focus-visible:ring-destructive',
                        className,
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        );
    },
);
Textarea.displayName = 'Textarea';

export { Textarea };
