import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    children?: React.ReactNode;
}

const variantClasses = {
    primary:   'bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent shadow-sm',
    secondary: 'bg-surface-muted text-foreground hover:bg-border/50 border border-border-subtle',
    danger:    'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20',
    ghost:     'text-muted-foreground hover:text-foreground hover:bg-surface-muted border border-transparent',
    outline:   'bg-background text-foreground hover:bg-surface-muted border border-border-subtle shadow-sm',
};

const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2',
};

/**
 * Unified button component for all settings pages.
 * - Shows a spinner inside the button (without resizing) when loading=true
 * - Accepts an icon slot rendered before the label
 * - Accepts variant and size props for consistent styling
 */
export function Btn({
    loading = false,
    icon,
    variant = 'primary',
    size = 'md',
    children,
    disabled,
    className = '',
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <button
            {...props}
            disabled={isDisabled}
            aria-busy={loading}
            className={[
                'inline-flex items-center justify-center font-medium rounded-md transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variantClasses[variant],
                sizeClasses[size],
                className,
            ].join(' ')}
        >
            {(icon || loading) && (
                <span aria-hidden="true" className="w-4 h-4 flex items-center justify-center shrink-0">
                    {loading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : icon
                    }
                </span>
            )}
            {children}
        </button>
    );
}
