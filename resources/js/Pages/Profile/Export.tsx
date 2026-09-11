import { usePage, Head } from '@inertiajs/react';
import { Download } from 'lucide-react';
import AccountSettingsLayout from '@/Layouts/AccountSettingsLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Btn } from '@/Components/ui/btn';

export default function ExportIndex() {
    const token = usePage().props.csrf_token as string;
    return (
        <AccountSettingsLayout title="Ekspor Data" description="Unduh data akun pribadi Anda.">
            <Head title="Ekspor Data Akun" />
            <Card>
                <CardContent className="pt-6 space-y-5">
                    <p className="text-sm text-muted-foreground">Unduh data akun dalam format JSON. Data layanan lain tidak termasuk.</p>
                    <form method="POST" action="/profile/export">
                        <input type="hidden" name="_token" value={token} />
                        <Btn type="submit" icon={<Download className="w-4 h-4" />}>Unduh Data</Btn>
                    </form>
                </CardContent>
            </Card>
        </AccountSettingsLayout>
    );
}
