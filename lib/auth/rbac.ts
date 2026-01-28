import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers, teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type UserRole = 'admin' | 'attorney' | 'staff' | 'end_user';
export type TenantRole = 'owner' | 'staff' | 'client';

/**
 * Check if user is a SaaS admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  return user?.role === 'admin';
}

/**
 * Check if user is an attorney (primary SaaS user)
 */
export async function isAttorney(): Promise<boolean> {
  const user = await getUser();
  return user?.role === 'attorney';
}

/**
 * Check if user has one of the specified global roles
 */
export async function hasRole(...roles: UserRole[]): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;
  return roles.includes(user.role as UserRole);
}

/**
 * Get user's tenant role (owner, staff, client)
 */
export async function getTenantRole(): Promise<TenantRole | null> {
  const user = await getUser();
  if (!user) return null;

  const [membership] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  return membership?.role as TenantRole | null;
}

/**
 * Check if user is team owner
 */
export async function isTeamOwner(): Promise<boolean> {
  const role = await getTenantRole();
  return role === 'owner';
}

/**
 * Check if user has one of the specified tenant roles
 */
export async function hasTenantRole(...roles: TenantRole[]): Promise<boolean> {
  const role = await getTenantRole();
  if (!role) return false;
  return roles.includes(role);
}

/**
 * Get user with their team and role information
 */
export async function getUserWithTeam() {
  const user = await getUser();
  if (!user) return null;

  const [membership] = await db
    .select({
      teamId: teamMembers.teamId,
      tenantRole: teamMembers.role,
    })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  if (!membership) {
    return {
      user,
      team: null,
      tenantRole: null,
    };
  }

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, membership.teamId))
    .limit(1);

  return {
    user,
    team: team || null,
    tenantRole: membership.tenantRole as TenantRole,
  };
}

/**
 * Require admin role - throws if not admin
 */
export async function requireAdmin(): Promise<void> {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    throw new Error('Admin access required');
  }
}

/**
 * Require team owner role - throws if not owner
 */
export async function requireTeamOwner(): Promise<void> {
  const isOwner = await isTeamOwner();
  if (!isOwner) {
    throw new Error('Team owner access required');
  }
}

/**
 * Permission checks for common actions
 */
export const Permissions = {
  // Billing permissions
  canViewBilling: async () => hasTenantRole('owner', 'staff'),
  canManageBilling: async () => hasTenantRole('owner'),
  canPurchaseTokens: async () => hasTenantRole('owner'),
  canConfigureAutoReload: async () => hasTenantRole('owner'),

  // Team permissions
  canViewTeam: async () => hasTenantRole('owner', 'staff'),
  canManageTeam: async () => hasTenantRole('owner'),
  canInviteMembers: async () => hasTenantRole('owner'),
  canRemoveMembers: async () => hasTenantRole('owner'),

  // Admin permissions
  canAccessAdmin: async () => hasRole('admin'),
  canManageTenants: async () => hasRole('admin'),
  canManagePackages: async () => hasRole('admin'),
  canViewGlobalStats: async () => hasRole('admin'),
  canAddBonusTokens: async () => hasRole('admin'),
};
