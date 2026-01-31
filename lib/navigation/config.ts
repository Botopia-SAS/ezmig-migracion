import {
  Users,
  Settings,
  Shield,
  Activity,
  Coins,
  History,
  RefreshCcw,
  Package,
  Briefcase,
  UserCircle,
  Link2,
  FolderOpen,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react';
import type { TenantRole } from '@/lib/auth/role-context';

/**
 * Navigation item configuration
 * Following Open/Closed principle: extend by adding items, not modifying logic
 */
export interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
  roles: TenantRole[];
}

/**
 * Legal/Case Management navigation
 * Visible to: owner, staff (full), client (limited)
 */
export const legalNavItems: NavItem[] = [
  {
    key: 'overview',
    href: '/dashboard/overview',
    icon: LayoutDashboard,
    roles: ['owner', 'staff'],
  },
  {
    key: 'clients',
    href: '/dashboard/clients',
    icon: UserCircle,
    roles: ['owner', 'staff'],
  },
  {
    key: 'cases',
    href: '/dashboard/cases',
    icon: Briefcase,
    roles: ['owner', 'staff'],
  },
  {
    key: 'myCases',
    href: '/dashboard/my-cases',
    icon: FolderOpen,
    roles: ['client'],
  },
  {
    key: 'referrals',
    href: '/dashboard/referrals',
    icon: Link2,
    roles: ['owner', 'staff'],
  },
];

/**
 * Settings navigation
 * Visible to: owner (full), staff (limited), client (security only)
 */
export const settingsNavItems: NavItem[] = [
  {
    key: 'team',
    href: '/dashboard',
    icon: Users,
    roles: ['owner'],
  },
  {
    key: 'general',
    href: '/dashboard/general',
    icon: Settings,
    roles: ['owner', 'staff'],
  },
  {
    key: 'activity',
    href: '/dashboard/activity',
    icon: Activity,
    roles: ['owner', 'staff'],
  },
  {
    key: 'security',
    href: '/dashboard/security',
    icon: Shield,
    roles: ['owner', 'staff', 'client'],
  },
];

/**
 * Billing navigation
 * Visible to: owner (full), staff (history only)
 */
export const billingNavItems: NavItem[] = [
  {
    key: 'overview',
    href: '/dashboard/billing',
    icon: Coins,
    roles: ['owner'],
  },
  {
    key: 'buyTokens',
    href: '/dashboard/billing/packages',
    icon: Package,
    roles: ['owner'],
  },
  {
    key: 'history',
    href: '/dashboard/billing/history',
    icon: History,
    roles: ['owner', 'staff'],
  },
  {
    key: 'autoReload',
    href: '/dashboard/billing/settings',
    icon: RefreshCcw,
    roles: ['owner'],
  },
];

/**
 * Filter navigation items by user's tenant role
 * @param items - Array of navigation items
 * @param role - User's tenant role (owner, staff, client)
 * @returns Filtered array of items the user can access
 */
export function getNavItemsForRole(items: NavItem[], role: TenantRole | null): NavItem[] {
  if (!role) return [];
  return items.filter((item) => item.roles.includes(role));
}

/**
 * Check if a route is accessible by a specific role
 * @param href - Route path
 * @param role - User's tenant role
 * @returns Boolean indicating access
 */
export function canAccessRoute(href: string, role: TenantRole | null): boolean {
  if (!role) return false;

  const allItems = [...legalNavItems, ...settingsNavItems, ...billingNavItems];
  const item = allItems.find((i) => href.startsWith(i.href));

  if (!item) return true; // Unknown routes default to accessible
  return item.roles.includes(role);
}

/**
 * Get default redirect path for a role
 * Used when user tries to access unauthorized route
 */
export function getDefaultPathForRole(role: TenantRole | null): string {
  switch (role) {
    case 'owner':
      return '/dashboard/overview';
    case 'staff':
      return '/dashboard/overview';
    case 'client':
      return '/dashboard/my-cases';
    default:
      return '/sign-in';
  }
}
