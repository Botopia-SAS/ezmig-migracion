import { withAdmin } from '@/lib/api/middleware';
import { successResponse, handleRouteError } from '@/lib/api/response';

export const GET = withAdmin(async () => {
  try {
    return successResponse({
      alerts: { critical: [], warnings: [] },
      totalCount: 0,
      hasAlerts: false,
    });
  } catch (error) {
    return handleRouteError(error, 'Error fetching system alerts');
  }
});
