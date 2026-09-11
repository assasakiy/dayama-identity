import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { ShieldCheck, Loader2 } from 'lucide-react';

export interface UserEmail {
    id: string;
    email: string;
    email_verified_at: string | null;
    is_primary: boolean;
    verification_sent_at: string | null;
    verification_code_expires_at: string | null;
}

export default function VerifyPanel({ email, onDone, onExpired }: { email: UserEmail; onDone: () => void; onExpired: () => void }) {
    const [code, setCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState<number>(0);
    const [expired, setExpired] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (email.verification_code_expires_at) {
            const expiresAt = new Date(email.verification_code_expires_at).getTime();
            if (Date.now() >= expiresAt) {
                onExpired();
                return;
            }
            const msUntilExpiry = expiresAt - Date.now();
            const expireTimer = setTimeout(() => {
                setExpired(true);
                onExpired();
            }, msUntilExpiry);
            setTimeout(() => inputRef.current?.focus(), 50);
            return () => clearTimeout(expireTimer);
        }
        if (email.verification_sent_at) {
            const sentAt = new Date(email.verification_sent_at).getTime();
            const elapsed = Math.floor((Date.now() - sentAt) / 1000);
            const remaining = Math.max(0, 60 - elapsed);
            if (remaining > 0) setCooldown(remaining);
        }
        setTimeout(() => inputRef.current?.focus(), 50);
    }, [email.verification_code_expires_at, email.verification_sent_at, onExpired]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const submitCode = () => {
        if (code.length !== 6) return;
        setSubmitting(true);
        router.post(`/profile/emails/${email.id}/verify`, { code }, {
            preserveScroll: true,
            onSuccess: () => { setSubmitting(false); onDone(); },
            onError: () => setSubmitting(false),
        });
    };

    const resend = () => {
        setResending(true);
        router.post(`/profile/emails/${email.id}/verify`, {}, {
            preserveScroll: true,
            onSuccess: () => { setResending(false); setCode(''); setCooldown(60); setExpired(false); },
            onError: () => setResending(false),
        });
    };

    if (expired) return null;

    return (
        <div className="mt-3 p-4 rounded-lg border border-warning/30 bg-warning/5 space-y-3">
            <p className="text-xs text-warning dark:text-amber-400 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Masukkan kode 6 digit yang dikirim ke <strong>{email.email}</strong>
            </p>
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={e => e.key === 'Enter' && submitCode()}
                    placeholder="000000"
                    className="w-36 px-3 py-2 border border-border rounded-lg bg-background text-sm font-mono tracking-widest text-center focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                    type="button"
                    onClick={submitCode}
                    disabled={code.length !== 6 || submitting}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Verifikasi
                </button>
                <button
                    type="button"
                    onClick={resend}
                    disabled={resending || cooldown > 0}
                    className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors disabled:opacity-50"
                >
                    {resending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : cooldown > 0
                            ? `Kirim Ulang (${cooldown}s)`
                            : 'Kirim Ulang Kode'
                    }
                </button>
            </div>
        </div>
    );
}
