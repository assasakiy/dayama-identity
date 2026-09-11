import { useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

let toasts: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

export const toast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, message, type }];
    listeners.forEach((listener) => listener(toasts));

    if (type !== 'loading') {
        setTimeout(() => {
            toasts = toasts.filter((t) => t.id !== id);
            listeners.forEach((listener) => listener(toasts));
        }, 3000);
    }
    
    return id; // Return ID so it can be dismissed if loading
};

toast.success = (message: string) => toast(message, 'success');
toast.error = (message: string) => toast(message, 'error');
toast.warning = (message: string) => toast(message, 'warning');
toast.info = (message: string) => toast(message, 'info');
toast.loading = (message: string) => toast(message, 'loading');
toast.dismiss = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((listener) => listener(toasts));
};

export const useToast = () => {
    const [state, setState] = useState<Toast[]>(toasts);

    useEffect(() => {
        listeners.push(setState);
        return () => {
            listeners = listeners.filter((l) => l !== setState);
        };
    }, []);

    return state;
};
