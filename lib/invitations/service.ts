import { db } from '@/lib/db/drizzle';
import { invitations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface RevokeInvitationResult {
  success: boolean;
  revokedEmail: string;
}

/**
 * Revoke a pending invitation by setting its status to 'revoked'.
 * Only pending invitations can be revoked.
 */
export async function revokeInvitation(
  invitationId: number,
  teamId: number
): Promise<RevokeInvitationResult> {
  const [invitation] = await db
    .select({ id: invitations.id, email: invitations.email, status: invitations.status })
    .from(invitations)
    .where(
      and(
        eq(invitations.id, invitationId),
        eq(invitations.teamId, teamId)
      )
    )
    .limit(1);

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw new Error('Only pending invitations can be revoked');
  }

  await db
    .update(invitations)
    .set({ status: 'revoked' })
    .where(eq(invitations.id, invitationId));

  return {
    success: true,
    revokedEmail: invitation.email,
  };
}
