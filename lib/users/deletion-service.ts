import { db } from '@/lib/db/drizzle';
import { eq } from 'drizzle-orm';
import {
  users,
  teamMembers,
  activityLogs,
  invitations,
  clients,
  cases,
  formFieldAutosaves,
  formSubmissions,
  evidences,
  referralLinks,
  referralLinkUsage,
  aiLogs,
  pdfVersions,
  notifications,
  teamMembersProfiles,
  freelancersProfiles,
} from '@/lib/db/schema';

export interface DeleteUserAccountResult {
  success: boolean;
  deletedUserId: number;
  deletedEmail: string;
}

/**
 * Hard-delete a user account and clean up all FK references.
 * Must be called within an authorization-checked context.
 * Runs in a single DB transaction for atomicity.
 */
export async function hardDeleteUserAccount(
  targetUserId: number
): Promise<DeleteUserAccountResult> {
  return await db.transaction(async (tx) => {
    // Capture user info before deletion
    const [targetUser] = await tx
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser) {
      throw new Error(`User with id ${targetUserId} not found`);
    }

    // Phase 1: SET NULL on nullable FK columns
    await tx.update(clients).set({ userId: null }).where(eq(clients.userId, targetUserId));
    await tx.update(clients).set({ createdBy: null }).where(eq(clients.createdBy, targetUserId));
    await tx.update(cases).set({ createdBy: null }).where(eq(cases.createdBy, targetUserId));
    await tx.update(cases).set({ assignedTo: null }).where(eq(cases.assignedTo, targetUserId));
    await tx.update(evidences).set({ validatedBy: null }).where(eq(evidences.validatedBy, targetUserId));
    await tx.update(evidences).set({ uploadedBy: null }).where(eq(evidences.uploadedBy, targetUserId));
    await tx.update(formFieldAutosaves).set({ savedBy: null }).where(eq(formFieldAutosaves.savedBy, targetUserId));
    await tx.update(formSubmissions).set({ submittedBy: null }).where(eq(formSubmissions.submittedBy, targetUserId));
    await tx.update(referralLinks).set({ createdBy: null }).where(eq(referralLinks.createdBy, targetUserId));
    await tx.update(referralLinkUsage).set({ userId: null }).where(eq(referralLinkUsage.userId, targetUserId));
    await tx.update(aiLogs).set({ userId: null }).where(eq(aiLogs.userId, targetUserId));
    await tx.update(pdfVersions).set({ generatedBy: null }).where(eq(pdfVersions.generatedBy, targetUserId));

    // Phase 2: DELETE rows with NOT NULL FK or NO ACTION that block deletion
    await tx.delete(activityLogs).where(eq(activityLogs.userId, targetUserId));
    await tx.delete(teamMembers).where(eq(teamMembers.userId, targetUserId));
    await tx.delete(invitations).where(eq(invitations.invitedBy, targetUserId));

    // Phase 3: DELETE CASCADE tables (explicit within tx for safety)
    await tx.delete(notifications).where(eq(notifications.userId, targetUserId));
    await tx.delete(teamMembersProfiles).where(eq(teamMembersProfiles.userId, targetUserId));
    await tx.delete(freelancersProfiles).where(eq(freelancersProfiles.userId, targetUserId));

    // Phase 4: DELETE the user
    await tx.delete(users).where(eq(users.id, targetUserId));

    return {
      success: true,
      deletedUserId: targetUser.id,
      deletedEmail: targetUser.email,
    };
  });
}
