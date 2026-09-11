import React from 'react';
import { useForm, router, Head } from '@inertiajs/react';
import AccountSettingsLayout from '@/Layouts/AccountSettingsLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Btn } from '@/Components/ui/btn';
import Toolbar, { CollectionFilters } from '@/Components/Collection/Toolbar';
import Pagination, { Paginated } from '@/Components/Collection/Pagination';
import Records from '@/Components/Collection/Records';
import { Mail, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';

interface Email {
    id: string;
    email: string;
    verified_at: string | null;
    is_primary: boolean;
}

export default function EmailsIndex({ primary_email, emails, filters }: { primary_email: string; emails: Paginated<Email>; filters: CollectionFilters }) {
    const form = useForm({ email: '' });

    const actions = (email: Email) => (
        <div className="flex items-center justify-end gap-2">
            {!email.verified_at && (
                <Btn size="sm" variant="outline" onClick={() => router.post(`/profile/emails/${email.id}/verify`, {}, { preserveScroll: true })}>
                    Verifikasi
                </Btn>
            )}
            {email.verified_at && !email.is_primary && (
                <Btn size="sm" variant="ghost" onClick={() => router.post(`/profile/emails/${email.id}/primary`, {}, { preserveScroll: true })}>
                    Jadikan Utama
                </Btn>
            )}
            {!email.is_primary && email.email !== primary_email && (
                <Btn size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => { if (confirm('Apakah Anda yakin ingin menghapus email ini?')) router.delete(`/profile/emails/${email.id}`, { preserveScroll: true }); }}>
                    Hapus
                </Btn>
            )}
        </div>
    );

    return (
        <AccountSettingsLayout title="Kelola Email" description="Kelola alamat email utama dan sekunder untuk notifikasi dan pemulihan akun.">
            <Head title="Kelola Email" />
            <div className="space-y-6 w-full">
                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" /> Tambah Alamat Email
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">Email utama saat ini: <strong className="text-foreground">{primary_email}</strong></p>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form
                            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                            onSubmit={event => {
                                event.preventDefault();
                                form.post('/profile/emails', { preserveScroll: true, onSuccess: () => form.reset() });
                            }}
                        >
                            <input
                                aria-label="Email baru"
                                type="email"
                                required
                                value={form.data.email}
                                onChange={event => form.setData('email', event.target.value)}
                                placeholder="nama@email.com"
                                className="h-10 flex-1 rounded-md border border-border-subtle bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                            <div className="flex justify-end">
                                <Btn type="submit" loading={form.processing} icon={<Plus className="w-4 h-4" />}>
                                    Tambah Email
                                </Btn>
                            </div>
                        </form>
                        {form.errors.email && <p role="alert" className="mt-2 text-xs text-destructive">{form.errors.email}</p>}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Toolbar
                        path="/profile/emails"
                        filters={filters}
                        definitions={[
                            { key: 'verified', label: 'Semua Status', options: [{ value: 'yes', label: 'Terverifikasi' }, { value: 'no', label: 'Belum Diverifikasi' }] },
                        ]}
                    />

                    <Records
                        records={emails.data}
                        grid={filters.view === 'grid'}
                        columns={[
                            {
                                key: 'email',
                                label: 'Alamat Email',
                                render: email => (
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{email.email}</span>
                                        {email.is_primary && (
                                            <Badge variant="default" className="text-[10px] py-0">Utama</Badge>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: 'status',
                                label: 'Status Verifikasi',
                                render: email => (
                                    <Badge variant={email.verified_at ? 'default' : 'secondary'} className="text-[11px] font-normal">
                                        {email.verified_at ? 'Terverifikasi' : 'Belum Diverifikasi'}
                                    </Badge>
                                ),
                            },
                            { key: 'actions', label: 'Aksi', align: 'right', render: actions },
                        ]}
                        card={email => (
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <h3 className="break-all text-sm font-semibold">{email.email}</h3>
                                    {email.is_primary && <Badge variant="default" className="text-[10px]">Utama</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">{email.verified_at ? 'Terverifikasi' : 'Belum Diverifikasi'}</p>
                                <div className="border-t border-border-subtle pt-2 flex justify-end">
                                    {actions(email)}
                                </div>
                            </div>
                        )}
                        pagination={<Pagination page={emails} path="/profile/emails" filters={filters} />}
                    />
                </div>
            </div>
        </AccountSettingsLayout>
    );
}
