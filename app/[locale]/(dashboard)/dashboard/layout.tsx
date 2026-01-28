'use client';

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Top bar with sidebar trigger and language switcher */}
        <header className="flex h-14 items-center gap-4 px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <LanguageSwitcher />
        </header>

        {/* Main content */}
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
