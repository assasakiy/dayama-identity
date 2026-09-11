import { useToast } from './use-toast';
import { CheckCircle2, XCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Toaster() {
    const toasts = useToast();

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div 
                    key={t.id} 
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border pointer-events-auto transition-all animate-in slide-in-from-bottom-5",
                        t.type === 'success' && "bg-primary text-primary-foreground border-primary",
                        t.type === 'error' && "bg-destructive text-destructive-foreground border-destructive",
                        t.type === 'warning' && "bg-warning text-warning-foreground border-warning",
                        t.type === 'info' && "bg-info text-info-foreground border-info",
                        t.type === 'loading' && "bg-info text-info-foreground border-info"
                    )}
                >
                    {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-primary-foreground" />}
                    {t.type === 'error' && <XCircle className="w-5 h-5 text-destructive-foreground" />}
                    {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-warning-foreground" />}
                    {t.type === 'info' && <Info className="w-5 h-5 text-info-foreground" />}
                    {t.type === 'loading' && <Loader2 className="w-5 h-5 text-info-foreground animate-spin" />}
                    
                    <p className="text-sm font-medium text-inherit/90">{t.message}</p>
                </div>
            ))}
        </div>
    );
}
