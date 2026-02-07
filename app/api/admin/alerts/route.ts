import { withAdmin } from '@/lib/api/middleware';
import { successResponse, handleRouteError } from '@/lib/api/response';
import { getSystemAlerts } from '@/lib/tokens/service';

export const GET = withAdmin(async () => {
  try {
    const alerts = await getSystemAlerts();
    const totalCount =
      alerts.critical.reduce((sum, a) => sum + a.count, 0) +
      alerts.warnings.reduce((sum, a) => sum + a.count, 0);

    return successResponse({
      alerts,
      totalCount,
      hasAlerts: totalCount > 0,
    });
  } catch (error) {
    return handleRouteError(error, 'Error fetching system alerts');
  }
});
