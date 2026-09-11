import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/Components/ui/modal';
import { Btn } from '@/Components/ui/btn';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import ConfirmDialog from '@/Components/ui/confirm-dialog';
import { Plus, Copy, Check, RotateCcw, Trash2, Edit, KeyRound } from 'lucide-react';

interface OAuthClient {
    id: string;
    name: string;
    redirect_uris: string[];
    grant_types: string[];
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
        redirect_uris: '',
        grant_types: ['authorization_code'] as string[],
    });

    const [editForm, setEditForm] = useState({
        name: '',
        redirect_uris: '',
        grant_types: [] as string[],
    });

    const resetForm = () => {
        setForm({ name: '', redirect_uris: '', grant_types: ['authorization_code'] });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(`/dashboard/apps/${applicationId}/clients`, {
            ...form,
        }, {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = (page.props as Record<string, unknown>).oauth_client_created as { id: string; client_secret: string } | undefined;
                if (flash) {
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
        router.put(`/dashboard/apps/${applicationId}/clients/${editing.id}`, {
            ...editForm,
        }, {
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
                if (flash) {
                    setNewSecret({ id: flash.id, secret: flash.client_secret });
                }
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
        if (isEdit) {
            setEditForm(prev => ({
                ...prev,
                grant_types: prev.grant_types.includes(grant)
                    ? prev.grant_types.filter(g => g !== grant)
                    : [...prev.grant_types, grant],
            }));
        } else {
            setForm(prev => ({
                ...prev,
                grant_types: prev.grant_types.includes(grant)
                    ? prev.grant_types.filter(g => g !== grant)
                    : [...prev.grant_types, grant],
            }));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    {clients.length} OAuth client terdaftar
                </p>
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
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Client ID</th>
                            <th className="px-4 py-3">Redirect URIs</th>
                            <th className="px-4 py-3">Grant Types</th>
                            <th className="px-4 py-3">Status</th>
                            {canManage && <th className="px-4 py-3 text-right">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {clients.length === 0 ? (
                            <tr>
                                <td colSpan={canManage ? 6 : 5} className="px-4 py-6 text-center text-muted-foreground text-xs">
                                    Belum ada OAuth client.
                                </td>
                            </tr>
                        ) : clients.map(client => (
                            <tr key={client.id} className="hover:bg-surface-muted/30 transition-colors">
                                <td className="px-4 py-3 font-medium text-foreground">{client.name}</td>
                                <td className="px-4 py-3">
                                    <code className="text-xs bg-surface-muted px-1.5 py-0.5 rounded font-mono">{client.id}</code>
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                                    {(client.redirect_uris || []).join(', ') || '-'}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {(client.grant_types || []).map(g => (
                                            <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>
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
                                                    <button type="button" onClick={() => openEdit(client)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" onClick={() => setRotatingClient(client)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer">
                                                        <RotateCcw className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                            <button type="button" onClick={() => setDeletingClient(client)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
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
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                        <KeyRound className="w-4 h-4" />
                        {rotatingClient ? 'Secret Baru' : 'Client Secret (tampilkan sekali saja)'}
                    </div>
                    <p className="text-xs text-amber-700">
                        Simpan secret ini sekarang. Anda tidak akan bisa melihatnya lagi.
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-white border border-amber-200 rounded px-3 py-2 font-mono break-all">
                            {newSecret.secret}
                        </code>
                        <button
                            type="button"
                            onClick={() => handleCopy(newSecret.secret)}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-amber-200 bg-white px-3 text-xs font-medium hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <Btn variant="ghost" size="sm" onClick={() => setNewSecret(null)}>Tutup</Btn>
                </div>
            )}

            <Modal open={showCreate} onOpenChange={setShowCreate} maxWidth="md">
                <ModalHeader title="Buat OAuth Client" onClose={() => setShowCreate(false)} />
                <form onSubmit={handleCreate}>
                    <ModalBody>
                        <Input
                            label="Nama Client"
                            value={form.name}
                            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                            required
                        />
                        <Input
                            label="Redirect URIs (pisahkan koma)"
                            value={form.redirect_uris}
                            onChange={e => setForm(prev => ({ ...prev, redirect_uris: e.target.value }))}
                            placeholder="https://app.example.com/callback"
                        />
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Grant Types</label>
                            <div className="flex flex-wrap gap-3">
                                {GRANT_OPTIONS.map(g => (
                                    <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.grant_types.includes(g)}
                                            onChange={() => toggleGrant(g)}
                                            className="rounded border-border-subtle"
                                        />
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
                    <ModalBody>
                        <Input
                            label="Nama Client"
                            value={editForm.name}
                            onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            required
                        />
                        <Input
                            label="Redirect URIs (pisahkan koma)"
                            value={editForm.redirect_uris}
                            onChange={e => setEditForm(prev => ({ ...prev, redirect_uris: e.target.value }))}
                        />
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Grant Types</label>
                            <div className="flex flex-wrap gap-3">
                                {GRANT_OPTIONS.map(g => (
                                    <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editForm.grant_types.includes(g)}
                                            onChange={() => toggleGrant(g, true)}
                                            className="rounded border-border-subtle"
                                        />
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

            <ConfirmDialog
                open={!!rotatingClient}
                onOpenChange={(open) => { if (!open) setRotatingClient(null); }}
                title="Rotasi Client Secret"
                message={`Yakin ingin merotasi secret untuk "${rotatingClient?.name}"? Secret lama akan segera berhenti berfungsi.`}
                confirmLabel="Rotasi Secret"
                variant="primary"
                loading={submitting}
                onConfirm={handleRotate}
            />

            <ConfirmDialog
                open={!!deletingClient}
                onOpenChange={(open) => { if (!open) setDeletingClient(null); }}
                title="Cabut OAuth Client"
                message={`Yakin ingin mencabut client "${deletingClient?.name}"? Semua token terkait akan berhenti berfungsi.`}
                confirmLabel="Cabut Client"
                onConfirm={handleDelete}
            />
        </div>
    );
}
