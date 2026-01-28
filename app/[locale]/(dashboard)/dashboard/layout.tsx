'use client';

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { LanguageSwitcher } from '@/components/language-switcher';
import { DashboardNotificationBell } from '@/components/dashboard/notification-bell';
import { HeaderActionsProvider, HeaderActions } from '@/components/dashboard/header-actions-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HeaderActionsProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-gray-100">
          {/* Top bar with sidebar trigger, notifications and language switcher */}
          <header className="sticky top-0 z-10 flex h-12 items-center gap-4 px-4 border-b bg-white">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <DashboardNotificationBell />
            <LanguageSwitcher />
            <HeaderActions />
          </header>

          {/* Main content with gray background */}
          <div className="flex-1 p-4 lg:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </HeaderActionsProvider>
  );
}
