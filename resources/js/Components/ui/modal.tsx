import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-4xl',
};

export function Modal({
    open,
    onOpenChange,
    children,
    className = '',
    maxWidth = 'lg',
}: ModalProps) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    className={cn(
                        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
                        'w-[95vw] sm:w-full bg-background border border-border-subtle rounded-xl shadow-elevated',
                        'flex flex-col overflow-hidden max-h-[90vh] transition-all',
                        maxWidthMap[maxWidth],
                        className
                    )}
                >
                    {children}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

export function ModalHeader({
    title,
    description,
    onClose,
    children,
}: {
    title?: React.ReactNode;
    description?: React.ReactNode;
    onClose?: () => void;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border-subtle bg-surface/50 shrink-0">
            <div className="space-y-1 pr-6">
                {title && <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>}
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
                {children}
            </div>
            <DialogPrimitive.Close
                onClick={onClose}
                aria-label="Tutup"
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors -mr-2 -mt-1"
            >
                <X className="w-4 h-4" />
            </DialogPrimitive.Close>
        </div>
    );
}

export function ModalBody({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('p-6 overflow-y-auto flex-1 space-y-4', className)}>
            {children}
        </div>
    );
}

export function ModalFooter({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex items-center justify-end gap-3 px-6 py-3.5 border-t border-border-subtle bg-surface-muted/30 shrink-0', className)}>
            {children}
        </div>
    );
}
