import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Globe, ExternalLink, FileText, CalendarDays, Phone } from 'lucide-react';

interface Props {
    user: {
        id: string;
        member_since: string;
        last_login_at: string;
        phone: string | null;
        locale: string;
        theme: string;
        biography: string | null;
        website: string | null;
        social_links?: { github?: string; twitter?: string; linkedin?: string } | null;
    };
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-medium text-muted-foreground mb-1">{label}</dt>
            <dd className="text-sm font-medium text-foreground">{children || '—'}</dd>
        </div>
    );
}

export function UserSummaryTab({ user }: Props) {
    const socialLinks = [
        { key: 'github', href: user.social_links?.github, label: 'GitHub' },
        { key: 'twitter', href: user.social_links?.twitter, label: 'Twitter' },
        { key: 'linkedin', href: user.social_links?.linkedin, label: 'LinkedIn' },
    ].filter(s => s.href);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="border-b border-border-subtle pb-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-primary" /> Informasi Umum & Identitas
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                        <Field label="ID Akun (User ID)">
                            <span className="font-mono text-xs text-muted-foreground bg-surface-muted px-2 py-1 rounded">
                                {user.id}
                            </span>
                        </Field>
                        <Field label="Bergabung Sejak">{user.member_since}</Field>
                        <Field label="Aktivitas Terakhir">{user.last_login_at}</Field>
                        <Field label="Nomor Telepon / WhatsApp">{user.phone}</Field>
                        <Field label="Bahasa & Tema Antarmuka">
                            <span className="capitalize">{user.locale}</span> · <span className="capitalize">{user.theme}</span>
                        </Field>
                    </dl>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="border-b border-border-subtle pb-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" /> Catatan & Biografi
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <p className="text-sm text-foreground/90 leading-relaxed">
                        {user.biography || <span className="text-muted-foreground italic">Belum ada biografi yang ditambahkan.</span>}
                    </p>
                </CardContent>
            </Card>

            {(user.website || socialLinks.length > 0) && (
                <Card>
                    <CardHeader className="border-b border-border-subtle pb-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" /> Tautan & Jejaring Sosial
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-3">
                        {user.website && (
                            <div className="flex items-center gap-3 text-sm">
                                <span className="text-xs text-muted-foreground w-20">Situs Web</span>
                                <a href={user.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1">
                                    {user.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        )}
                        {socialLinks.map(s => (
                            <div key={s.key} className="flex items-center gap-3 text-sm">
                                <span className="text-xs text-muted-foreground w-20">{s.label}</span>
                                <a href={s.href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1">
                                    {s.href?.replace(/^https?:\/\//, '')} <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
