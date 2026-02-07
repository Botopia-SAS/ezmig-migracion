'use client';

import { ElementType } from 'react';
import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import {
  LayoutDashboard,
  Building,
  UserCircle,
  Coins,
  Package,
  BarChart3,
  FileText,
  Shield,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { signOut } from '@/app/[locale]/(login)/actions';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { User } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Main navigation items for admin
const getAdminNavItems = (t: any) => [
  { href: '/admin', icon: LayoutDashboard, label: t('nav.dashboard') },
  { href: '/admin/tenants', icon: Building, label: t('nav.tenants') },
  { href: '/admin/users', icon: UserCircle, label: t('nav.users') },
  { href: '/admin/transactions', icon: Coins, label: t('nav.transactions') },
  { href: '/admin/packages', icon: Package, label: t('nav.packages') },
  { href: '/admin/forms', icon: FileText, label: t('nav.forms') },
  { href: '/admin/stats', icon: BarChart3, label: t('nav.stats') },
];

function AdminUserFooter() {
  const t = useTranslations('admin.layout');
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
    );
  }

  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : 'AD';

  return (
    <div className="flex flex-col gap-4 py-2 group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:items-center">
      <div className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
        <Avatar className="h-10 w-10 rounded-full bg-violet-100 text-violet-600 border-2 border-white/50 shadow-sm shrink-0">
          <AvatarFallback className="bg-violet-100 text-violet-700 font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate font-bold text-base text-gray-900 dark:text-white">
            {user.name || 'Admin User'}
          </span>
          <span className="truncate text-xs text-muted-foreground font-medium">
            Super Admin
          </span>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="relative flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98] group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0"
      >
        <LogOut className="size-5" />
        <span className="group-data-[collapsible=icon]:hidden">{t('actions.signOut')}</span>
      </button>
    </div>
  );
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations('admin.layout');
  const pathname = usePathname();
  const navItems = getAdminNavItems(t);
  const router = useRouter();

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

  return (
    <Sidebar collapsible="icon" className="border-r-0 shadow-xl" {...props}>
      {/* Logo Header */}
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Link href="/top" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
              alt="EZMig"
              className="h-8 w-auto shrink-0"
            />
            <span className="font-bold text-lg leading-none group-data-[collapsible=icon]:hidden">EZMig</span>
          </Link>
        </div>
        
        {/* Account Info Box */}
        <div className="mx-2 mt-2 rounded-xl bg-violet-50/50 p-3 border border-violet-100 dark:bg-violet-900/20 dark:border-violet-800/50 group-data-[collapsible=icon]:hidden flex items-center justify-between gap-2">
          <div className="flex flex-col overflow-hidden">
            <div className="text-[10px] uppercase font-bold tracking-wider text-violet-600 dark:text-violet-400 mb-0.5">
              Portal
            </div>
            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              Admin Dashboard
            </div>
          </div>
          <Shield className="size-8 text-violet-600 shrink-0 p-1 bg-violet-100 rounded-md" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pb-2 mt-4">
        <SidebarMenu>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                  <Link href={item.href}>
                    <item.icon className="size-4" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <AdminUserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
