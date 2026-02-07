import { withStaffOrOwner } from '@/lib/api/middleware';
import { successResponse, handleRouteError } from '@/lib/api/response';
import { getTeamActivityLogs } from '@/lib/activity';
import type { EntityType } from '@/lib/activity';

export const GET = withStaffOrOwner(async (request, { teamId }) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const userId = searchParams.get('userId')
      ? parseInt(searchParams.get('userId')!, 10)
      : undefined;
    const entityType = searchParams.get('entityType') as EntityType | undefined;
    const entityId = searchParams.get('entityId')
      ? parseInt(searchParams.get('entityId')!, 10)
      : undefined;
    const action = searchParams.get('action') || undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const search = searchParams.get('search') || undefined;

    const result = await getTeamActivityLogs(teamId, {
      limit,
      offset,
      userId,
      entityType,
      entityId,
      action: action as any,
      startDate,
      endDate,
      search,
    });

    return successResponse(result);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch activity logs');
  }
});
