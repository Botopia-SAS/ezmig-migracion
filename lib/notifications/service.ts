import { db } from '@/lib/db/drizzle';
import {
  notifications,
  teamMembers,
  users,
  type NewNotification,
} from '@/lib/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';

export type NotificationType =
  | 'case_update'
  | 'form_completed'
  | 'deadline'
  | 'uscis_status'
  | 'document_request'
  | 'payment'
  | 'system'
  | 'client_registered';

export interface CreateNotificationInput {
  userId: number;
  teamId?: number;
  type: NotificationType;
  title: string;
  message?: string;
  caseId?: number;
  caseFormId?: number;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a new notification for a user
 */
export async function createNotification(input: CreateNotificationInput) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      teamId: input.teamId,
      type: input.type,
      title: input.title,
      message: input.message,
      caseId: input.caseId,
      caseFormId: input.caseFormId,
      actionUrl: input.actionUrl,
      metadata: input.metadata,
    })
    .returning();

  return notification;
}

/**
 * Create notifications for all team owners
 */
export async function notifyTeamOwners(
  teamId: number,
  notification: Omit<CreateNotificationInput, 'userId' | 'teamId'>
) {
  // Get all team owners
  const owners = await db
    .select({
      userId: teamMembers.userId,
    })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.role, 'owner')
      )
    );

  // Create notification for each owner
  const results = await Promise.all(
    owners.map((owner) =>
      createNotification({
        ...notification,
        userId: owner.userId,
        teamId,
      })
    )
  );

  return results;
}

/**
 * Create notifications for all team owners and staff
 */
export async function notifyTeamOwnersAndStaff(
  teamId: number,
  notification: Omit<CreateNotificationInput, 'userId' | 'teamId'>
) {
  // Get all team owners and staff (exclude clients)
  const members = await db
    .select({
      userId: teamMembers.userId,
      role: teamMembers.role,
    })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));

  // Filter to only owners and staff
  const ownersAndStaff = members.filter(
    (m) => m.role === 'owner' || m.role === 'staff'
  );

  // Create notification for each member
  const results = await Promise.all(
    ownersAndStaff.map((member) =>
      createNotification({
        ...notification,
        userId: member.userId,
        teamId,
      })
    )
  );

  return results;
}

/**
 * Notify team about a new client registration (owners and staff)
 */
export async function notifyClientRegistered(
  teamId: number,
  clientName: string,
  clientEmail: string,
  caseId?: number
) {
  return notifyTeamOwnersAndStaff(teamId, {
    type: 'client_registered',
    title: 'New Client Registered',
    message: `${clientName} (${clientEmail}) has registered via referral link and can now access the portal.`,
    caseId,
    actionUrl: caseId ? `/dashboard/cases/${caseId}` : '/dashboard/clients',
    metadata: {
      clientName,
      clientEmail,
    },
  });
}

/**
 * Get notifications for a user
 */
export async function getNotificationsForUser(userId: number, limit = 50) {
  const results = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return results;
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: number) {
  const result = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );

  return result.length;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number, userId: number) {
  const [updated] = await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
    .returning();

  return updated;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: number) {
  await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );
}
