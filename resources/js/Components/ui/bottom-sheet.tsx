import React, { useEffect, useState } from 'react';

interface BottomSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function BottomSheet({ open, onOpenChange, title, description, children, className = '' }: BottomSheetProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [render, setRender] = useState(false);

    useEffect(() => {
        if (open) {
            setRender(true);
            setIsClosing(false);
        } else if (render) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setRender(false);
                setIsClosing(false);
            }, 200); // Matches duration-200
            return () => clearTimeout(timer);
        }
    }, [open]);

    const handleClose = () => {
        onOpenChange(false);
    };

    if (!render) return null;

    return (
        <div className={`md:hidden fixed inset-0 z-[100] flex flex-col justify-end ${className}`}>
            <div 
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm duration-300 ease-out fill-mode-forwards ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`} 
                onClick={handleClose}
            />
            <div className={`relative bg-surface w-full rounded-t-3xl p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-border-subtle duration-200 ease-out fill-mode-forwards ${isClosing ? 'animate-out slide-out-to-bottom-full fade-out-0' : 'animate-in slide-in-from-bottom-full fade-in-0'}`}>
                <div className="w-12 h-1.5 bg-border-subtle rounded-full mx-auto mb-5" />
                
                {(title || description) && (
                    <div className="mb-4 text-center">
                        {title && (
                            typeof title === 'string' ? 
                                <p className="font-semibold text-foreground text-lg">{title}</p> 
                                : title
                        )}
                        {description && (
                            typeof description === 'string' ? 
                                <p className="text-sm text-muted-foreground mt-1">{description}</p>
                                : description
                        )}
                    </div>
                )}
                
                {children}
            </div>
        </div>
    );
}
