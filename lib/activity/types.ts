import { ActivityType } from '@/lib/db/schema';

/**
 * Entity types that can have activity logs
 */
export type EntityType =
  | 'client'
  | 'case'
  | 'form'
  | 'evidence'
  | 'referral'
  | 'user'
  | 'team'
  | 'token';

/**
 * Represents a change to a field value
 */
export interface FieldChange {
  old: unknown;
  new: unknown;
}

/**
 * Record of changes made in an activity
 */
export type ActivityChanges = Record<string, FieldChange>;

/**
 * Input for logging an activity
 */
export interface LogActivityInput {
  teamId: number;
  userId: number | null;
  action: ActivityType;
  entityType?: EntityType;
  entityId?: number;
  entityName?: string;
  metadata?: Record<string, unknown>;
  changes?: ActivityChanges;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Activity log record with user information
 */
export interface ActivityLog {
  id: number;
  teamId: number;
  userId: number | null;
  action: string;
  timestamp: Date;
  entityType: string | null;
  entityId: number | null;
  entityName: string | null;
  metadata: Record<string, unknown> | null;
  changes: ActivityChanges | null;
  ipAddress: string | null;
  userAgent: string | null;
  // Joined user data
  user?: {
    id: number;
    name: string | null;
    email: string;
  } | null;
}

/**
 * Filters for querying activity logs
 */
export interface ActivityLogFilters {
  userId?: number;
  entityType?: EntityType;
  entityId?: number;
  action?: ActivityType;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

/**
 * Options for querying team activity logs
 */
export interface GetTeamActivityLogsOptions extends ActivityLogFilters {
  limit?: number;
  offset?: number;
}

/**
 * Response from getting team activity logs
 */
export interface ActivityLogsResponse {
  logs: ActivityLog[];
  total: number;
  limit: number;
  offset: number;
}
