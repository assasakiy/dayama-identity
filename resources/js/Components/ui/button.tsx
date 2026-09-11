import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'ghost' | 'link';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'md', asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
                    {
                        'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80': variant === 'default' || variant === 'primary',
                        'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80': variant === 'destructive',
                        'border border-border-subtle bg-background text-foreground hover:bg-surface-muted active:bg-surface-muted/80': variant === 'outline',
                        'hover:bg-surface-muted active:bg-surface-muted/80 shadow-none': variant === 'ghost',
                        'text-primary underline-offset-4 hover:underline shadow-none': variant === 'link',
                    },
                    {
                        'h-8 px-3 text-xs': size === 'sm',
                        'h-9 px-4': size === 'md',
                        'h-10 px-6': size === 'lg',
                        'h-9 w-9': size === 'icon',
                    },
                    className,
                )}
                {...props}
            />
        );
    },
);
Button.displayName = 'Button';

export { Button };
