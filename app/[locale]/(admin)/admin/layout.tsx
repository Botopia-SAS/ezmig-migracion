'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SystemStatusBadge, NotificationBell } from '@/components/admin';
import { LanguageSwitcher } from '@/components/language-switcher';
import { signOut } from '@/app/[locale]/(login)/actions';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Building,
  UserCircle,
  Coins,
  Package,
  BarChart3,
  Menu,
  LogOut,
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { User } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('admin.layout');
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: t('nav.dashboard') },
    { href: '/admin/tenants', icon: Building, label: t('nav.tenants') },
    { href: '/admin/users', icon: UserCircle, label: t('nav.users') },
    { href: '/admin/transactions', icon: Coins, label: t('nav.transactions') },
    { href: '/admin/packages', icon: Package, label: t('nav.packages') },
    { href: '/admin/stats', icon: BarChart3, label: t('nav.stats') },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return (
        pathname === '/admin' ||
        pathname === '/en/admin' ||
        pathname === '/es/admin' ||
        pathname === '/pt/admin'
      );
    }
    return pathname.includes(href);
  };

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  const getUserInitials = () => {
    if (!user) return 'AD';
    if (user.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden cursor-default"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 h-screen bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-4">
          <Link href="/admin" className="flex items-center gap-2">
            <img
              src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
              alt={t('logoAlt')}
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-gray-900">EZMig</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-violet-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10 border-2 border-violet-200">
              <AvatarFallback className="bg-violet-100 text-violet-600 font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || t('fallback.userName')}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email || t('fallback.userEmail')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('actions.signOut')}
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Desktop header */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 items-center justify-end gap-4">
          <LanguageSwitcher />
          <NotificationBell />
          <SystemStatusBadge status="online" compact />
        </header>

        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-600"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">{t('mobile.openMenu')}</span>
              </Button>
              <div className="flex items-center gap-2">
                <img
                  src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
                  alt="EZMig"
                  className="h-6 w-auto"
                />
                <span className="font-semibold text-gray-900">{t('mobile.title')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationBell />
              <SystemStatusBadge status="online" compact />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
