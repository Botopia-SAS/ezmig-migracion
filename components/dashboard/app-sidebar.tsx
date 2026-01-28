'use client';

import {
  Users,
  CreditCard,
  Settings,
  Shield,
  Activity,
  LogOut,
  ChevronUp,
  Coins,
  History,
  RefreshCcw,
  Package,
  Briefcase,
  UserCircle,
  Scale,
  Link2,
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from '@/app/[locale]/(login)/actions';
import { useRouter } from '@/i18n/routing';
import { User } from '@/lib/db/schema';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Main navigation items (keys for translations)
const mainNavItems = [
  {
    key: 'team',
    href: '/dashboard',
    icon: Users,
  },
  {
    key: 'general',
    href: '/dashboard/general',
    icon: Settings,
  },
  {
    key: 'activity',
    href: '/dashboard/activity',
    icon: Activity,
  },
  {
    key: 'security',
    href: '/dashboard/security',
    icon: Shield,
  },
];

// Legal navigation items (keys for translations)
const legalNavItems = [
  {
    key: 'clients',
    href: '/dashboard/clients',
    icon: UserCircle,
  },
  {
    key: 'cases',
    href: '/dashboard/cases',
    icon: Briefcase,
  },
  {
    key: 'referrals',
    href: '/dashboard/referrals',
    icon: Link2,
  },
];

// Billing navigation items (keys for translations)
const billingNavItems = [
  {
    key: 'overview',
    href: '/dashboard/billing',
    icon: Coins,
  },
  {
    key: 'buyTokens',
    href: '/dashboard/billing/packages',
    icon: Package,
  },
  {
    key: 'history',
    href: '/dashboard/billing/history',
    icon: History,
  },
  {
    key: 'autoReload',
    href: '/dashboard/billing/settings',
    icon: RefreshCcw,
  },
];

function UserFooter() {
  const t = useTranslations('header');
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
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
                  {user.email}
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

  // Remove locale prefix for path matching
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '');

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathWithoutLocale === '/dashboard';
    }
    return pathWithoutLocale.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Logo Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-3">
                <img
                  src="https://res.cloudinary.com/dxzsui9zz/image/upload/e_background_removal/f_png/v1769143142/Generated_Image_January_22_2026_-_11_16PM_ckvy3c.jpg"
                  alt="EZMig"
                  className="size-8"
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

      {/* Navigation Content */}
      <SidebarContent>
        {/* Legal Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Scale className="size-3.5" />
            {t('legal')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {legalNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={t(item.key)}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{t(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Main Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('settings')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={t(item.key)}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{t(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Billing Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <CreditCard className="size-3.5" />
            {t('billing')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {billingNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={t(item.key)}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{t(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter>
        <UserFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
