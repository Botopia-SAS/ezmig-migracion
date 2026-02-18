import { db } from '@/lib/db/drizzle';
import {
  notifications,
  teamMembers,
  teams,
  users,
  clients,
  type NewNotification,
} from '@/lib/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import {
  sendWelcomeEmail,
  sendNewClientNotification,
  sendFormCompletedNotification,
  sendFormSubmittedTeamNotification,
  sendFormSubmittedClientConfirmation,
  sendCaseStatusUpdateNotification,
  sendCaseAssignedNotification,
  sendEvidenceUploadedNotification,
} from '@/lib/email/service';

export type NotificationType =
  | 'case_update'
  | 'form_completed'
  | 'form_submitted'
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
 * Notify team about a new client registration (owners and staff) + send emails
 */
export async function notifyClientRegistered(
  teamId: number,
  clientName: string,
  clientEmail: string,
  caseId?: number
) {
  // In-app notification
  const results = await notifyTeamOwnersAndStaff(teamId, {
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

  // Email notifications (fire-and-forget)
  try {
    const [team] = await db.select({ name: teams.name }).from(teams).where(eq(teams.id, teamId)).limit(1);
    const teamName = team?.name || 'Your Team';

    // Welcome email to client
    sendWelcomeEmail({ email: clientEmail, name: clientName, teamName })
      .catch(err => console.error('Failed to send welcome email:', err));

    // Notification email to team owners
    const ownerEmails = await getTeamOwnerEmails(teamId);
    for (const email of ownerEmails) {
      sendNewClientNotification({ attorneyEmail: email, clientName, clientEmail, teamName })
        .catch(err => console.error('Failed to send new client notification email:', err));
    }
  } catch (err) {
    console.error('Failed to send client registration emails:', err);
  }

  return results;
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

// ---------------------------------------------------------------------------
// Email resolution helpers
// ---------------------------------------------------------------------------

/**
 * Get email addresses for all team owners
 */
export async function getTeamOwnerEmails(teamId: number): Promise<string[]> {
  const owners = await db
    .select({ email: users.email })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.role, 'owner')));

  return owners.map((o) => o.email);
}

/**
 * Get email addresses for all team owners and staff
 */
export async function getTeamOwnersAndStaffEmails(teamId: number): Promise<string[]> {
  const members = await db
    .select({ email: users.email, role: teamMembers.role })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId));

  return members
    .filter((m) => m.role === 'owner' || m.role === 'staff')
    .map((m) => m.email);
}

// ---------------------------------------------------------------------------
// Dual-notify functions (in-app + email)
// ---------------------------------------------------------------------------

/**
 * Notify team when a form is completed
 */
export async function notifyFormCompleted(
  teamId: number,
  caseId: number,
  formCode: string,
  clientName: string,
  caseNumber: string
) {
  // In-app
  await notifyTeamOwnersAndStaff(teamId, {
    type: 'form_completed',
    title: `Form ${formCode} Completed`,
    message: `${clientName} has completed form ${formCode} for case #${caseNumber}.`,
    caseId,
    actionUrl: `/dashboard/cases/${caseId}`,
  });

  // Email (fire-and-forget)
  try {
    const emails = await getTeamOwnersAndStaffEmails(teamId);
    for (const email of emails) {
      sendFormCompletedNotification({ email, formCode, clientName, caseNumber, caseId })
        .catch(err => console.error('Failed to send form completed email:', err));
    }
  } catch (err) {
    console.error('Failed to send form completed emails:', err);
  }
}

/**
 * Notify team + client when a form is submitted
 */
export async function notifyFormSubmitted(
  teamId: number,
  caseId: number,
  formCode: string,
  clientName: string,
  clientEmail: string,
  caseNumber: string
) {
  // In-app notification to team
  await notifyTeamOwnersAndStaff(teamId, {
    type: 'form_submitted',
    title: `Form ${formCode} Submitted`,
    message: `${clientName} has submitted form ${formCode} for case #${caseNumber} and it's ready for review.`,
    caseId,
    actionUrl: `/dashboard/cases/${caseId}`,
  });

  // Email to team (fire-and-forget)
  try {
    const emails = await getTeamOwnersAndStaffEmails(teamId);
    for (const email of emails) {
      sendFormSubmittedTeamNotification({ email, formCode, clientName, caseNumber, caseId })
        .catch(err => console.error('Failed to send form submitted team email:', err));
    }
  } catch (err) {
    console.error('Failed to send form submitted team emails:', err);
  }

  // Confirmation email to client (fire-and-forget)
  sendFormSubmittedClientConfirmation({ email: clientEmail, clientName, formCode, caseNumber })
    .catch(err => console.error('Failed to send form submitted client email:', err));
}

/**
 * Notify client when case status changes + in-app to team
 */
export async function notifyCaseStatusChanged(
  teamId: number,
  caseId: number,
  caseNumber: string,
  clientName: string,
  clientEmail: string | null,
  oldStatus: string,
  newStatus: string
) {
  // In-app notification to team
  await notifyTeamOwnersAndStaff(teamId, {
    type: 'case_update',
    title: `Case #${caseNumber} Status Changed`,
    message: `Case status changed from ${oldStatus} to ${newStatus}.`,
    caseId,
    actionUrl: `/dashboard/cases/${caseId}`,
  });

  // Email to client (fire-and-forget)
  if (clientEmail) {
    sendCaseStatusUpdateNotification({
      email: clientEmail,
      clientName,
      caseNumber,
      oldStatus,
      newStatus,
    }).catch(err => console.error('Failed to send case status email:', err));
  }
}

/**
 * Notify staff member when assigned to a case
 */
export async function notifyCaseAssigned(
  teamId: number,
  caseId: number,
  caseNumber: string,
  clientName: string,
  assignedUserId: number
) {
  // In-app notification to assigned user
  await createNotification({
    userId: assignedUserId,
    teamId,
    type: 'case_update',
    title: `Case #${caseNumber} Assigned to You`,
    message: `You have been assigned to case #${caseNumber} for ${clientName}.`,
    caseId,
    actionUrl: `/dashboard/cases/${caseId}`,
  });

  // Email (fire-and-forget)
  try {
    const [assignedUser] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, assignedUserId))
      .limit(1);

    if (assignedUser) {
      sendCaseAssignedNotification({
        email: assignedUser.email,
        staffName: assignedUser.name || assignedUser.email,
        caseNumber,
        clientName,
        caseId,
      }).catch(err => console.error('Failed to send case assigned email:', err));
    }
  } catch (err) {
    console.error('Failed to send case assigned email:', err);
  }
}

/**
 * Notify team when evidence is uploaded
 */
export async function notifyEvidenceUploaded(
  teamId: number,
  caseId: number,
  caseNumber: string,
  fileName: string,
  uploaderName: string
) {
  // In-app
  await notifyTeamOwnersAndStaff(teamId, {
    type: 'document_request',
    title: 'New Document Uploaded',
    message: `${uploaderName} uploaded "${fileName}" for case #${caseNumber}.`,
    caseId,
    actionUrl: `/dashboard/cases/${caseId}`,
  });

  // Email (fire-and-forget)
  try {
    const emails = await getTeamOwnersAndStaffEmails(teamId);
    for (const email of emails) {
      sendEvidenceUploadedNotification({ email, fileName, uploaderName, caseNumber, caseId })
        .catch(err => console.error('Failed to send evidence uploaded email:', err));
    }
  } catch (err) {
    console.error('Failed to send evidence uploaded emails:', err);
  }
}
