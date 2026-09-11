import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/Components/ui/modal';
import { Btn } from '@/Components/ui/btn';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import ConfirmDialog from '@/Components/ui/confirm-dialog';
import { Plus, Copy, Check, RotateCcw, Trash2, Edit, KeyRound, Shield, Globe } from 'lucide-react';

interface OAuthClient {
    id: string;
    name: string;
    redirect_uris: string[];
    grant_types: string[];
    is_confidential?: boolean;
    revoked: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    applicationId: string;
    clients: OAuthClient[];
    canManage: boolean;
}

const GRANT_OPTIONS = ['authorization_code', 'client_credentials', 'refresh_token'] as const;

export default function ClientTab({ applicationId, clients, canManage }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<OAuthClient | null>(null);
    const [rotatingClient, setRotatingClient] = useState<OAuthClient | null>(null);
    const [deletingClient, setDeletingClient] = useState<OAuthClient | null>(null);
    const [newSecret, setNewSecret] = useState<{ id: string; secret: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        name: '',
        type: 'confidential' as 'confidential' | 'public',
        redirect_uris: '',
        grant_types: ['authorization_code', 'refresh_token'] as string[],
    });

    const [editForm, setEditForm] = useState({
        name: '',
        redirect_uris: '',
        grant_types: [] as string[],
    });

    const resetForm = () => {
        setForm({ name: '', type: 'confidential', redirect_uris: '', grant_types: ['authorization_code', 'refresh_token'] });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(`/dashboard/apps/${applicationId}/clients`, form, {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = (page.props as Record<string, unknown>).oauth_client_created as { id: string; client_secret?: string } | undefined;
                if (flash?.client_secret) {
                    setNewSecret({ id: flash.id, secret: flash.client_secret });
                }
                setShowCreate(false);
                resetForm();
                setSubmitting(false);
            },
            onError: () => setSubmitting(false),
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        setSubmitting(true);
        router.put(`/dashboard/apps/${applicationId}/clients/${editing.id}`, editForm, {
            preserveScroll: true,
            onSuccess: () => { setEditing(null); setSubmitting(false); },
            onError: () => setSubmitting(false),
        });
    };

    const handleRotate = () => {
        if (!rotatingClient) return;
        setSubmitting(true);
        router.post(`/dashboard/apps/${applicationId}/clients/${rotatingClient.id}/secret`, {}, {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = (page.props as Record<string, unknown>).oauth_secret_rotated as { id: string; client_secret: string } | undefined;
                if (flash) setNewSecret({ id: flash.id, secret: flash.client_secret });
                setRotatingClient(null);
                setSubmitting(false);
            },
            onError: () => setSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (!deletingClient) return;
        router.delete(`/dashboard/apps/${applicationId}/clients/${deletingClient.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingClient(null),
        });
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openEdit = (client: OAuthClient) => {
        setEditing(client);
        setEditForm({
            name: client.name,
            redirect_uris: (client.redirect_uris || []).join(', '),
            grant_types: client.grant_types || [],
        });
    };

    const toggleGrant = (grant: string, isEdit = false) => {
        const updater = isEdit ? setEditForm : setForm;
        updater((prev: any) => ({
            ...prev,
            grant_types: prev.grant_types.includes(grant)
                ? prev.grant_types.filter((g: string) => g !== grant)
                : [...prev.grant_types, grant],
        }));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{clients.length} OAuth client terdaftar</p>
                {canManage && (
                    <Btn size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setShowCreate(true); }}>
                        Buat Client
                    </Btn>
                )}
            </div>

            <div className="border border-border-subtle rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-surface-muted/50 border-b border-border-subtle text-xs text-muted-foreground uppercase">
                        <tr>
                            <th className="px-4 py-3">Nama & Tipe</th>
                            <th className="px-4 py-3">Client ID</th>
                            <th className="px-4 py-3">Redirect URIs</th>
                            <th className="px-4 py-3">Grant Types</th>
                            <th className="px-4 py-3">Status</th>
                            {canManage && <th className="px-4 py-3 text-right">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {clients.length === 0 ? (
                            <tr><td colSpan={canManage ? 6 : 5} className="px-4 py-6 text-center text-muted-foreground text-xs">Belum ada OAuth client.</td></tr>
                        ) : clients.map(client => (
                            <tr key={client.id} className="hover:bg-surface-muted/30 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-foreground">{client.name}</div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Badge variant={client.is_confidential ? 'default' : 'secondary'} className="text-[10px] py-0 px-1.5">
                                            {client.is_confidential ? 'Confidential' : 'Public (PKCE)'}
                                        </Badge>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <code className="text-xs bg-surface-muted px-1.5 py-0.5 rounded font-mono">{client.id}</code>
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                                    {(client.redirect_uris || []).join(', ') || '-'}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {(client.grant_types || []).map(g => (
                                            <Badge key={g} variant="outline" className="text-[10px]">{g}</Badge>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={client.revoked ? 'destructive' : 'success'} className="text-[10px]">
                                        {client.revoked ? 'Revoked' : 'Active'}
                                    </Badge>
                                </td>
                                {canManage && (
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {!client.revoked && (
                                                <>
                                                    <button type="button" aria-label="Edit client" onClick={() => openEdit(client)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    {client.is_confidential && (
                                                        <button type="button" aria-label="Rotasi secret" onClick={() => setRotatingClient(client)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer">
                                                            <RotateCcw className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            <button type="button" aria-label="Hapus client" onClick={() => setDeletingClient(client)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {newSecret && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
                        <KeyRound className="w-4 h-4" />
                        Client Secret (Hanya ditampilkan sekali)
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400">Simpan sekarang di environment aplikasi client Anda.</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-white dark:bg-black/30 border border-amber-300 dark:border-amber-800 rounded font-mono text-xs break-all select-all">
                            {newSecret.secret}
                        </code>
                        <Btn size="sm" variant="outline" onClick={() => handleCopy(newSecret.secret)} icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}>
                            {copied ? 'Tersalin' : 'Salin'}
                        </Btn>
                    </div>
                </div>
            )}

            <Modal open={showCreate} onOpenChange={setShowCreate} maxWidth="md">
                <ModalHeader title="Buat OAuth Client" onClose={() => setShowCreate(false)} />
                <form onSubmit={handleCreate}>
                    <ModalBody className="space-y-4">
                        <Input label="Nama Client" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} required />
                        
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Tipe Client</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, type: 'confidential' }))}
                                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${form.type === 'confidential' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border-subtle hover:bg-surface-muted'}`}
                                >
                                    <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                                        <Shield className="w-3.5 h-3.5 text-primary" /> Confidential
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Backend server (memiliki secret)</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, type: 'public', grant_types: prev.grant_types.filter(g => g !== 'client_credentials') }))}
                                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${form.type === 'public' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border-subtle hover:bg-surface-muted'}`}
                                >
                                    <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                                        <Globe className="w-3.5 h-3.5 text-amber-500" /> Public (PKCE)
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">SPA, Mobile, CLI (tanpa secret)</p>
                                </button>
                            </div>
                        </div>

                        <Input label="Redirect URIs (pisahkan koma)" value={form.redirect_uris} onChange={e => setForm(prev => ({ ...prev, redirect_uris: e.target.value }))} placeholder="https://app.example.com/callback" />
                        
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Grant Types</label>
                            <div className="flex flex-wrap gap-3">
                                {GRANT_OPTIONS.map(g => (
                                    <label key={g} className={`flex items-center gap-2 text-sm cursor-pointer ${form.type === 'public' && g === 'client_credentials' ? 'opacity-40 pointer-events-none' : ''}`}>
                                        <input type="checkbox" checked={form.grant_types.includes(g)} onChange={() => toggleGrant(g)} disabled={form.type === 'public' && g === 'client_credentials'} className="rounded border-border-subtle" />
                                        {g}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Btn variant="ghost" type="button" onClick={() => setShowCreate(false)}>Batal</Btn>
                        <Btn type="submit" loading={submitting}>Buat Client</Btn>
                    </ModalFooter>
                </form>
            </Modal>

            <Modal open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }} maxWidth="md">
                <ModalHeader title="Edit OAuth Client" onClose={() => setEditing(null)} />
                <form onSubmit={handleEdit}>
                    <ModalBody className="space-y-4">
                        <Input label="Nama Client" value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} required />
                        <Input label="Redirect URIs (pisahkan koma)" value={editForm.redirect_uris} onChange={e => setEditForm(prev => ({ ...prev, redirect_uris: e.target.value }))} />
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Grant Types</label>
                            <div className="flex flex-wrap gap-3">
                                {GRANT_OPTIONS.map(g => (
                                    <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={editForm.grant_types.includes(g)} onChange={() => toggleGrant(g, true)} className="rounded border-border-subtle" />
                                        {g}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Btn variant="ghost" type="button" onClick={() => setEditing(null)}>Batal</Btn>
                        <Btn type="submit" loading={submitting}>Simpan</Btn>
                    </ModalFooter>
                </form>
            </Modal>

            <ConfirmDialog open={!!rotatingClient} onOpenChange={(open) => { if (!open) setRotatingClient(null); }} title="Rotasi Client Secret" message={`Yakin ingin merotasi secret untuk "${rotatingClient?.name}"? Secret lama akan segera berhenti berfungsi.`} confirmLabel="Rotasi Secret" variant="primary" loading={submitting} onConfirm={handleRotate} />
            <ConfirmDialog open={!!deletingClient} onOpenChange={(open) => { if (!open) setDeletingClient(null); }} title="Cabut OAuth Client" message={`Yakin ingin mencabut client "${deletingClient?.name}"?`} confirmLabel="Cabut Client" onConfirm={handleDelete} />
        </div>
    );
}
