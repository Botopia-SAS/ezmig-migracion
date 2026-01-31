import { db } from '@/lib/db/drizzle';
import { activityLogs, users } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, or, ilike, sql, count } from 'drizzle-orm';
import type {
  LogActivityInput,
  ActivityLog,
  GetTeamActivityLogsOptions,
  ActivityLogsResponse,
  ActivityChanges,
  EntityType,
} from './types';

/**
 * Log an activity with full context
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  await db.insert(activityLogs).values({
    teamId: input.teamId,
    userId: input.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    entityName: input.entityName,
    metadata: input.metadata,
    changes: input.changes,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });
}

/**
 * Get activity logs for a team with filtering and pagination
 */
export async function getTeamActivityLogs(
  teamId: number,
  options: GetTeamActivityLogsOptions = {}
): Promise<ActivityLogsResponse> {
  const {
    limit = 50,
    offset = 0,
    userId,
    entityType,
    entityId,
    action,
    startDate,
    endDate,
    search,
  } = options;

  // Build conditions
  const conditions = [eq(activityLogs.teamId, teamId)];

  if (userId) {
    conditions.push(eq(activityLogs.userId, userId));
  }

  if (entityType) {
    conditions.push(eq(activityLogs.entityType, entityType));
  }

  if (entityId) {
    conditions.push(eq(activityLogs.entityId, entityId));
  }

  if (action) {
    conditions.push(eq(activityLogs.action, action));
  }

  if (startDate) {
    conditions.push(gte(activityLogs.timestamp, startDate));
  }

  if (endDate) {
    conditions.push(lte(activityLogs.timestamp, endDate));
  }

  if (search) {
    conditions.push(
      or(
        ilike(activityLogs.entityName, `%${search}%`),
        ilike(activityLogs.action, `%${search}%`)
      )!
    );
  }

  // Get total count
  const [countResult] = await db
    .select({ count: count() })
    .from(activityLogs)
    .where(and(...conditions));

  const total = countResult?.count ?? 0;

  // Get logs with user info
  const logs = await db
    .select({
      id: activityLogs.id,
      teamId: activityLogs.teamId,
      userId: activityLogs.userId,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      entityType: activityLogs.entityType,
      entityId: activityLogs.entityId,
      entityName: activityLogs.entityName,
      metadata: activityLogs.metadata,
      changes: activityLogs.changes,
      ipAddress: activityLogs.ipAddress,
      userAgent: activityLogs.userAgent,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(activityLogs.timestamp))
    .limit(limit)
    .offset(offset);

  return {
    logs: logs.map((log) => ({
      ...log,
      metadata: log.metadata as Record<string, unknown> | null,
      changes: log.changes as ActivityChanges | null,
      user: log.user?.id ? log.user : null,
    })),
    total,
    limit,
    offset,
  };
}

/**
 * Get activity logs for a specific entity
 */
export async function getEntityActivityLogs(
  entityType: EntityType,
  entityId: number,
  teamId: number,
  limit = 50
): Promise<ActivityLog[]> {
  const logs = await db
    .select({
      id: activityLogs.id,
      teamId: activityLogs.teamId,
      userId: activityLogs.userId,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      entityType: activityLogs.entityType,
      entityId: activityLogs.entityId,
      entityName: activityLogs.entityName,
      metadata: activityLogs.metadata,
      changes: activityLogs.changes,
      ipAddress: activityLogs.ipAddress,
      userAgent: activityLogs.userAgent,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(
      and(
        eq(activityLogs.teamId, teamId),
        eq(activityLogs.entityType, entityType),
        eq(activityLogs.entityId, entityId)
      )
    )
    .orderBy(desc(activityLogs.timestamp))
    .limit(limit);

  return logs.map((log) => ({
    ...log,
    metadata: log.metadata as Record<string, unknown> | null,
    changes: log.changes as ActivityChanges | null,
    user: log.user?.id ? log.user : null,
  }));
}

/**
 * Detect changes between old and new values for specified fields
 * Returns null if no changes detected
 */
export function detectChanges<T extends Record<string, unknown>>(
  oldValues: T,
  newValues: Partial<T>,
  fieldsToTrack: (keyof T)[]
): ActivityChanges | null {
  const changes: ActivityChanges = {};
  let hasChanges = false;

  for (const field of fieldsToTrack) {
    const oldVal = oldValues[field];
    const newVal = newValues[field];

    // Only track if the field is being updated and value changed
    if (newVal !== undefined && oldVal !== newVal) {
      changes[String(field)] = {
        old: oldVal,
        new: newVal,
      };
      hasChanges = true;
    }
  }

  return hasChanges ? changes : null;
}

/**
 * Parse user agent string to get simplified browser/OS info
 */
export function parseUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null;

  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect browser
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  }

  // Detect OS
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  }

  return `${browser}/${os}`;
}

/**
 * Get activity log stats for a team (counts by action type)
 */
export async function getActivityStats(
  teamId: number,
  days = 30
): Promise<{ action: string; count: number }[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await db
    .select({
      action: activityLogs.action,
      count: count(),
    })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.teamId, teamId),
        gte(activityLogs.timestamp, startDate)
      )
    )
    .groupBy(activityLogs.action)
    .orderBy(desc(count()));

  return stats;
}
