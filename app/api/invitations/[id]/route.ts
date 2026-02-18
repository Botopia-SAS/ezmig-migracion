import { withOwner } from '@/lib/api/middleware';
import { successResponse, handleRouteError, badRequestResponse } from '@/lib/api/response';
import { revokeInvitation } from '@/lib/invitations/service';
import { logActivity } from '@/lib/activity/service';
import { ActivityType } from '@/lib/db/schema';

export const DELETE = withOwner(async (_request, { user, teamId }, params) => {
  try {
    const invitationId = Number(params?.id);
    if (isNaN(invitationId)) {
      return badRequestResponse('Invalid invitation ID');
    }

    const result = await revokeInvitation(invitationId, teamId);

    await logActivity({
      userId: user.id,
      teamId,
      action: ActivityType.REVOKE_INVITATION,
      entityType: 'invitation',
      entityId: invitationId,
      metadata: { revokedEmail: result.revokedEmail },
    });

    return successResponse({ success: true, revokedEmail: result.revokedEmail });
  } catch (error) {
    return handleRouteError(error, 'Failed to revoke invitation');
  }
});
