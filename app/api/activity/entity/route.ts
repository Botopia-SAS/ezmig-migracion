import { withStaffOrOwner } from '@/lib/api/middleware';
import { successResponse, handleRouteError, badRequestResponse } from '@/lib/api/response';
import { getEntityActivityLogs } from '@/lib/activity';
import type { EntityType } from '@/lib/activity';

export const GET = withStaffOrOwner(async (request, { teamId }) => {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('type') as EntityType;
    const entityId = searchParams.get('id')
      ? parseInt(searchParams.get('id')!, 10)
      : null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!entityType || !entityId) {
      return badRequestResponse('Missing required params: type and id');
    }

    const logs = await getEntityActivityLogs(entityType, entityId, teamId, limit);

    return successResponse({ logs });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch entity activity logs');
  }
});
