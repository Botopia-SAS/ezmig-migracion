import { withAuth } from '@/lib/api/middleware';
import { successResponse } from '@/lib/api/response';
import { db } from '@/lib/db/drizzle';
import { invitations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET = withAuth(async (_request, { teamId, tenantRole }) => {
  // Only owners can see invitations
  if (tenantRole !== 'owner') {
    return successResponse({ invitations: [] });
  }

  const pendingInvitations = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      status: invitations.status,
      createdAt: invitations.invitedAt,
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.teamId, teamId),
        eq(invitations.status, 'pending')
      )
    )
    .orderBy(invitations.invitedAt);

  return successResponse({ invitations: pendingInvitations });
});
