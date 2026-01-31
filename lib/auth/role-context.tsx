'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import useSWR from 'swr';
import type { User, Team } from '@/lib/db/schema';

// Types
export type GlobalRole = 'admin' | 'attorney' | 'staff' | 'end_user';
export type TenantRole = 'owner' | 'staff' | 'client';

export interface UserWithTeamResponse {
  user: User;
  team: Team | null;
  tenantRole: TenantRole | null;
}

export interface RoleContextType {
  // Core data
  user: User | null;
  team: Team | null;
  globalRole: GlobalRole | null;
  tenantRole: TenantRole | null;
  isLoading: boolean;
  error: Error | null;

  // Role checks
  isOwner: boolean;
  isStaff: boolean;
  isClient: boolean;
  isAdmin: boolean;

  // Permission checks (derived from roles)
  canManageTeam: boolean;
  canViewBilling: boolean;
  canManageBilling: boolean;
  canCreateClients: boolean;
  canCreateCases: boolean;
  canCreateReferrals: boolean;
  canViewAllCases: boolean;
  canAssignCases: boolean;
}

const RoleContext = createContext<RoleContextType | null>(null);

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  });

export function RoleProvider({ children }: { children: ReactNode }) {
  const { data, error, isLoading } = useSWR<UserWithTeamResponse>(
    '/api/user/me',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const value = useMemo<RoleContextType>(() => {
    const user = data?.user ?? null;
    const team = data?.team ?? null;
    const globalRole = (user?.role as GlobalRole) ?? null;
    const tenantRole = data?.tenantRole ?? null;

    // Role checks
    const isOwner = tenantRole === 'owner';
    const isStaff = tenantRole === 'staff';
    const isClient = tenantRole === 'client';
    const isAdmin = globalRole === 'admin';

    // Permission checks - following Single Responsibility
    // Each permission is clearly derived from roles
    return {
      // Core data
      user,
      team,
      globalRole,
      tenantRole,
      isLoading,
      error: error ?? null,

      // Role checks
      isOwner,
      isStaff,
      isClient,
      isAdmin,

      // Permissions: Team management
      canManageTeam: isOwner,

      // Permissions: Billing
      canViewBilling: isOwner || isStaff,
      canManageBilling: isOwner,

      // Permissions: Clients & Cases
      canCreateClients: isOwner || isStaff,
      canCreateCases: isOwner || isStaff,
      canCreateReferrals: isOwner || isStaff,

      // Permissions: Case visibility
      canViewAllCases: isOwner, // Staff only sees assigned
      canAssignCases: isOwner,
    };
  }, [data, isLoading, error]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

/**
 * Hook to access role context
 * @throws Error if used outside RoleProvider
 */
export function useRole(): RoleContextType {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}

/**
 * Hook to access role context (nullable version for optional usage)
 */
export function useRoleOptional(): RoleContextType | null {
  return useContext(RoleContext);
}
