import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from './ui/use-toast';

export function GlobalToast() {
    const { flash } = usePage<any>().props;

    useEffect(() => {
        if (flash?.toast && (Array.isArray(flash.toast) ? flash.toast.length > 0 : true)) {
            const toasts = Array.isArray(flash.toast) ? flash.toast : [flash.toast];
            
            toasts.forEach((t: any) => {
                const { type, message } = t;
                switch (type) {
                    case 'success': toast.success(message); break;
                    case 'error': toast.error(message); break;
                    case 'warning': toast.warning(message); break;
                    case 'info': toast.info(message); break;
                    case 'loading': toast.loading(message); break;
                    default: toast(message);
                }
            });
        } else if (flash?.success) {
            toast.success(flash.success);
        } else if (flash?.error) {
            toast.error(flash.error);
        } else if (flash?.warning) {
            toast.warning(flash.warning);
        } else if (flash?.info) {
            toast.info(flash.info);
        } else if (flash?.status) {
            toast.success(flash.status); // Alias status as success
        }
    }, [flash]);

    return null; // This is a logic-only component
}
