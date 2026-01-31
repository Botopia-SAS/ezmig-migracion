'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  LogOut,
  ChevronUp,
  ChevronRight,
  Scale,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR, { mutate } from 'swr';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="h-12 animate-pulse rounded-lg bg-sidebar-accent/50" />
        </SidebarMenuItem>
      </SidebarMenu>
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
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                <AvatarFallback className="rounded-lg bg-transparent text-white font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user.name || user.email.split('@')[0]}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {roleBadge}
                </span>
              </div>
              <ChevronUp className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="top"
            align="end"
            sideOffset={4}
          >
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                <AvatarFallback className="rounded-lg bg-transparent text-white font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user.name || user.email.split('@')[0]}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('signOut')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
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

  // Filter navigation items by role
  const visibleLegalItems = getNavItemsForRole(legalNavItems, tenantRole);
  const visibleSettingsItems = getNavItemsForRole(settingsNavItems, tenantRole);
  const visibleBillingItems = getNavItemsForRole(billingNavItems, tenantRole);

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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={homePath} className="flex items-center gap-3">
                <img
                  src={logoSrc}
                  alt={team?.name || 'EZMig'}
                  className="size-8 rounded-md object-cover"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-lg">{team?.name || 'EZMig'}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Immigration Platform
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent>
        {/* Legal Navigation Group - Only show if there are visible items */}
        {visibleLegalItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Scale className="size-3.5" />
              {t('legal')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleLegalItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={t(item.key)}
                      >
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
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings Navigation Group - Only show if there are visible items */}
        {visibleSettingsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('settings')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSettingsItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={t(item.key)}
                      >
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
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Billing Navigation Group - Only show if there are visible items */}
        {visibleBillingItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <CreditCard className="size-3.5" />
              {t('billing')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleBillingItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={t(item.key)}
                      >
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
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter>
        <UserFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
