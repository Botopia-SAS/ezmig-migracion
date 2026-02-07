'use client';

import { useState, useEffect } from 'react';
import { LogOut, ChevronUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR, { mutate } from 'swr';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { signOut } from '@/app/[locale]/(login)/actions';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useRole } from '@/lib/auth/role-context';
import {
  legalNavItems,
  settingsNavItems,
  billingNavItems,
  getNavItemsForRole,
  getDefaultPathForRole,
  type NavItem,
} from '@/lib/navigation/config';
import { TeamDataWithMembers } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const defaultLogo =
  'https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg';

function SidebarSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-6 w-3/4" />
    </div>
  );
}

function UserFooter() {
  const t = useTranslations('header');
  const { user, tenantRole } = useRole();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    mutate('/api/user/me');
    router.push('/');
  }

  // Wait for client-side mount to avoid hydration mismatch with Radix IDs
  if (!mounted || !user) {
    return (
      <div className="flex flex-col gap-4 p-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    );
  }

  const initials = user.email
    .split('@')[0]
    .split(/[._-]/)
    .map((n) => n[0]?.toUpperCase())
    .slice(0, 2)
    .join('');

  // Role badge for display
  const roleBadge = tenantRole === 'owner' ? 'Owner' : tenantRole === 'staff' ? 'Staff' : tenantRole === 'client' ? 'Client' : '';

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
            {user.name || user.email.split('@')[0]}
          </span>
          <span className="truncate text-xs text-muted-foreground font-medium">
            {roleBadge}
          </span>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="relative flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98] group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0"
      >
        <LogOut className="size-5" />
        <span className="group-data-[collapsible=icon]:hidden">{t('signOut')}</span>
      </button>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations('dashboard.sidebar');
  const { tenantRole, isLoading } = useRole();
  const { data: team } = useSWR<TeamDataWithMembers>('/api/team', fetcher);

  const logoSrc = team?.logoUrl || defaultLogo;

  // Remove locale prefix for path matching
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '');

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathWithoutLocale === '/dashboard';
    }
    return pathWithoutLocale.startsWith(href);
  };

  // Filter navigation items by role and combine into a single list
  const visibleNavItems: NavItem[] = [
    ...getNavItemsForRole(legalNavItems, tenantRole),
    ...getNavItemsForRole(settingsNavItems, tenantRole),
    ...getNavItemsForRole(billingNavItems, tenantRole),
  ];

  // Get default home path for role
  const homePath = getDefaultPathForRole(tenantRole);

  if (isLoading) {
    return (
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/dashboard" className="flex items-center gap-3">
                  <img
                    src={logoSrc}
                    alt={team?.name || 'EZMig'}
                    className="size-8 rounded-md object-cover"
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold text-lg">EZMig</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Immigration Platform
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarSkeleton />
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0 shadow-xl">
      {/* Logo Header */}
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Link href={homePath} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              src={defaultLogo}
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
              Account
            </div>
            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              {team?.name || 'My Organization'}
            </div>
          </div>
          <img 
            src={logoSrc} 
            alt={team?.name || 'Team Logo'} 
            className="size-8 rounded-md object-cover shrink-0" 
          />
        </div>

        {/* Collapsed Team Logo */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center mt-2">
           <img 
            src={logoSrc} 
            alt={team?.name || 'Team Logo'} 
            className="size-8 rounded-md object-cover" 
          />
        </div>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="px-2 pb-2 mt-4">
        <SidebarMenu>
          {visibleNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={t(item.key)}>
                  <Link href={item.href}>
                    <item.icon className="size-4" />
                    <span className="flex-1">{t(item.key)}</span>
                    {active && <ChevronRight className="size-4 ml-auto" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter>
        <UserFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
