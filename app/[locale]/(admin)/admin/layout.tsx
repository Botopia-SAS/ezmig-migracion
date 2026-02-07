import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { SystemStatusBadge, NotificationBell } from '@/components/admin';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-gray-50">
        <header className="sticky top-0 z-10 flex h-12 items-center gap-4 px-4 bg-white/30 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1 text-gray-700 hover:text-gray-900" />
          <div id="admin-header-portal" className="flex-1 flex items-center gap-3" />
          <LanguageSwitcher />
          <NotificationBell />
          <SystemStatusBadge status="online" compact />
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 lg:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
