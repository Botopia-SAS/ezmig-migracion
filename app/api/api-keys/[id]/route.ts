import { withOwner } from '@/lib/api/middleware';
import { successResponse, notFoundResponse, handleRouteError } from '@/lib/api/response';
import { requireIntParam } from '@/lib/api/validators';
import { revokeApiKey } from '@/lib/auth/api-keys';
import { securityLog } from '@/lib/api/logger';
import { ActivityType } from '@/lib/db/schema';
import { logActivity } from '@/lib/activity/service';

// DELETE /api/api-keys/[id] - Revoke an API key
export const DELETE = withOwner(async (_req, ctx, params) => {
  try {
    const [keyId, error] = requireIntParam(params?.id, 'id');
    if (error) return error;

    const revoked = await revokeApiKey(keyId, ctx.teamId);
    if (!revoked) {
      return notFoundResponse('API key');
    }

    securityLog({
      level: 'info',
      event: 'api_key_revoked',
      userId: ctx.user.id,
      teamId: ctx.teamId,
      keyId,
    });

    await logActivity({
      teamId: ctx.teamId,
      userId: ctx.user.id,
      action: ActivityType.REVOKE_API_KEY,
      entityType: 'team',
      entityId: ctx.teamId,
      entityName: revoked.name,
    });

    return successResponse({ message: 'API key revoked' });
  } catch (error) {
    return handleRouteError(error, 'Failed to revoke API key');
  }
});
