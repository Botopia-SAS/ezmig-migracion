import { sql, eq, type SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { db } from './drizzle';
import { users, teamMembers, teams } from './schema';
import type { TenantRole } from './types';

/**
 * Count records in a table matching an optional condition
 */
export async function countRecords(
  table: PgTable,
  condition?: SQL
): Promise<number> {
  const query = db.select({ count: sql<number>`count(*)::int` }).from(table);
  const [result] = condition ? await query.where(condition) : await query;
  return result?.count ?? 0;
}

/**
 * Check if a record exists matching a condition
 */
export async function recordExists(
  table: PgTable,
  condition: SQL
): Promise<boolean> {
  const [result] = await db
    .select({ exists: sql<boolean>`exists(select 1)` })
    .from(table)
    .where(condition)
    .limit(1);
  return result?.exists ?? false;
}

/**
 * Get user's team membership and role in a single query.
 * Returns null if user has no team.
 */
export async function getUserTeamMembership(userId: number) {
  const [membership] = await db
    .select({
      teamId: teamMembers.teamId,
      tenantRole: teamMembers.role,
      teamName: teams.name,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId))
    .limit(1);

  if (!membership) return null;

  return {
    teamId: membership.teamId,
    tenantRole: membership.tenantRole as TenantRole,
    teamName: membership.teamName,
  };
}
