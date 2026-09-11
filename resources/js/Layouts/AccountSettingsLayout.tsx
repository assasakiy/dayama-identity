import React from 'react';
import DashboardLayout from './DashboardLayout';
export const menuGroups: { title: string; items: { label: string; href: string; icon: React.ElementType; destructive?: boolean; permission?: string }[] }[] = [];
export default function AccountSettingsLayout({ children, title = 'Pengaturan', description }: { children: React.ReactNode; title?: string; description?: string }) {
    return <DashboardLayout><div className="pb-10"><div className="mb-6"><h1 className="text-2xl font-bold tracking-tight">{title}</h1>{description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}</div>{children}</div></DashboardLayout>;
}
