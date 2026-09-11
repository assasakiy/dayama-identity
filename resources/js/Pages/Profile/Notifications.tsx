import { useForm, usePage, Head } from '@inertiajs/react';
import { Bell, Save } from 'lucide-react';
import AccountSettingsLayout from '@/Layouts/AccountSettingsLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Btn } from '@/Components/ui/btn';

export default function NotificationsIndex() {
    const { preferences } = usePage<any>().props;
    const form = useForm({ email_updates: preferences?.email_updates ?? false });

    return (
        <AccountSettingsLayout title="Notifikasi" description="Kelola preferensi notifikasi akun Anda.">
            <Head title="Pengaturan Notifikasi" />
            <Card>
                <CardHeader className="border-b border-border-subtle">
                    <CardTitle className="flex gap-2 text-sm items-center">
                        <Bell className="w-4 h-4 text-primary" /> Preferensi Notifikasi
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <form className="space-y-5" onSubmit={event => { event.preventDefault(); form.put('/profile/notifications'); }}>
                        <p className="text-sm text-muted-foreground">Preferensi disimpan. Pengiriman notifikasi belum tersedia.</p>
                        <label className="flex items-center gap-3 text-sm cursor-pointer">
                            <input type="checkbox" checked={form.data.email_updates} onChange={event => form.setData('email_updates', event.target.checked)} className="rounded border-border-subtle text-primary focus:ring-primary" />
                            Pembaruan akun melalui email
                        </label>
                        {form.errors.email_updates && <p role="alert" className="text-destructive text-xs">{form.errors.email_updates}</p>}
                        <Btn type="submit" loading={form.processing} icon={<Save className="w-4 h-4" />}>Simpan Preferensi</Btn>
                        {form.recentlySuccessful && <p role="status" className="text-sm text-green-600">Preferensi disimpan.</p>}
                    </form>
                </CardContent>
            </Card>
        </AccountSettingsLayout>
    );
}
