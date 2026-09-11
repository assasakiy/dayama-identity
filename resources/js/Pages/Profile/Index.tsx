import { useForm, usePage, Head } from '@inertiajs/react';
import { Save, Camera } from 'lucide-react';
import AccountSettingsLayout from '@/Layouts/AccountSettingsLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Btn } from '@/Components/ui/btn';

export default function ProfileIndex() {
    const user = usePage<any>().props.auth.user;
    const form = useForm({
        name: user.name,
        display_name: user.profile?.display_name ?? user.name,
        bio: user.profile?.bio ?? '',
        phone: user.profile?.phone ?? '',
        locale: user.profile?.locale ?? 'id',
        theme: user.profile?.theme ?? 'system',
    });

    return (
        <AccountSettingsLayout title="Profil" description="Kelola profil publik Anda.">
            <Head title="Profil Saya" />
            <div className="bg-background border border-border-subtle rounded-xl overflow-hidden mb-6 shadow-sm">
                <div className="h-48 w-full bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40" />
                <div className="px-6 pb-8 flex flex-col items-center text-center">
                    <div className="-mt-16 w-32 h-32 rounded-full bg-background p-1.5 relative">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-4xl font-bold overflow-hidden">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                user.name.charAt(0)
                            )}
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mt-3">{user.profile?.display_name || user.name}</h2>
                    <p className="text-muted-foreground">{user.email}</p>
                    <Btn disabled variant="ghost" icon={<Camera className="w-4 h-4" />} className="mt-3">
                        Unggah foto belum tersedia
                    </Btn>
                </div>
            </div>

            <Card>
                <CardHeader className="border-b border-border-subtle">
                    <CardTitle className="text-sm">Informasi Dasar</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.put('/profile', { preserveScroll: true });
                        }}
                        className="space-y-5"
                    >
                        {(['name', 'display_name', 'phone', 'bio'] as const).map((key) => (
                            <label key={key} className="block text-sm font-medium">
                                {{ name: 'Nama Lengkap', display_name: 'Nama Tampilan', phone: 'Telepon', bio: 'Biografi' }[key]}
                                <input
                                    required={key === 'name' || key === 'display_name'}
                                    value={form.data[key]}
                                    onChange={(e) => form.setData(key, e.target.value)}
                                    className="mt-2 w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm"
                                />
                                {form.errors[key] && <span role="alert" className="text-destructive text-xs mt-1 block">{form.errors[key]}</span>}
                            </label>
                        ))}
                        <label className="block text-sm font-medium">
                            Bahasa
                            <select
                                value={form.data.locale}
                                onChange={(e) => form.setData('locale', e.target.value)}
                                className="mt-2 w-full border border-border rounded-lg bg-background p-3 text-sm"
                            >
                                <option value="id">Indonesia</option>
                                <option value="en">English</option>
                            </select>
                        </label>
                        {form.errors.locale && <p role="alert" className="text-destructive text-xs mt-1">{form.errors.locale}</p>}
                        <Btn type="submit" loading={form.processing} icon={<Save className="w-4 h-4" />}>
                            Simpan Perubahan
                        </Btn>
                        {form.recentlySuccessful && <p role="status" className="text-sm text-green-600">Profil disimpan.</p>}
                    </form>
                </CardContent>
            </Card>
        </AccountSettingsLayout>
    );
}
