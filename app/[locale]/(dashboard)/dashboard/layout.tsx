'use client';

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { LanguageSwitcher } from '@/components/language-switcher';
import { DashboardNotificationBell } from '@/components/dashboard/notification-bell';
import { HeaderActionsProvider, HeaderActions } from '@/components/dashboard/header-actions-context';
import { RoleProvider } from '@/lib/auth/role-context';
import { ProfileCompletionBanner } from '@/components/dashboard/profile-completion-banner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProvider>
      <HeaderActionsProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="bg-gray-50">
            <ProfileCompletionBanner />

            {/* Top bar with sidebar trigger, notifications and language switcher */}
            <header className="sticky top-0 z-10 flex h-12 items-center gap-4 px-4 bg-white/30 backdrop-blur-sm">
              <SidebarTrigger className="-ml-1 text-gray-700 hover:text-gray-900" />
              <HeaderActions />
              <div className="flex-1" />
              <DashboardNotificationBell />
              <LanguageSwitcher />
            </header>

            {/* Main content with gray background */}
            <div className="flex-1 p-4 lg:p-6">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </HeaderActionsProvider>
    </RoleProvider>
  );
}
