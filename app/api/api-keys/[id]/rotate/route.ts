import { withOwner } from '@/lib/api/middleware';
import { successResponse, notFoundResponse, handleRouteError } from '@/lib/api/response';
import { requireIntParam } from '@/lib/api/validators';
import { rotateApiKey } from '@/lib/auth/api-keys';
import { securityLog } from '@/lib/api/logger';
import { ActivityType } from '@/lib/db/schema';
import { logActivity } from '@/lib/activity/service';

// POST /api/api-keys/[id]/rotate - Rotate an API key (revoke old, create new)
export const POST = withOwner(async (_req, ctx, params) => {
  try {
    const [keyId, error] = requireIntParam(params?.id, 'id');
    if (error) return error;

    const result = await rotateApiKey(keyId, ctx.teamId, ctx.user.id);
    if (!result) {
      return notFoundResponse('API key');
    }

    securityLog({
      level: 'info',
      event: 'api_key_rotated',
      userId: ctx.user.id,
      teamId: ctx.teamId,
      oldKeyId: keyId,
      newKeyId: result.record.id,
    });

    await logActivity({
      teamId: ctx.teamId,
      userId: ctx.user.id,
      action: ActivityType.ROTATE_API_KEY,
      entityType: 'team',
      entityId: ctx.teamId,
      entityName: result.record.name,
    });

    return successResponse({
      key: result.key,
      id: result.record.id,
      name: result.record.name,
      keyPrefix: result.record.keyPrefix,
      scopes: result.record.scopes,
      expiresAt: result.record.expiresAt,
      createdAt: result.record.createdAt,
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to rotate API key');
  }
});
