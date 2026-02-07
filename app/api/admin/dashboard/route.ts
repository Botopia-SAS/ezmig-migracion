import { withAdmin } from '@/lib/api/middleware';
import { successResponse, handleRouteError } from '@/lib/api/response';
import {
  getAdminDashboardStats,
  getTopTenants,
  getTransactionBreakdown,
  getSystemAlerts,
  getGlobalTokenStats,
} from '@/lib/tokens/service';
import { db } from '@/lib/db/drizzle';
import { users, teams } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export const GET = withAdmin(async () => {
  try {
    const [
      stats,
      topTenants,
      transactionBreakdown,
      alerts,
      globalStats,
      userCount,
      teamCount,
    ] = await Promise.all([
      getAdminDashboardStats(),
      getTopTenants(5),
      getTransactionBreakdown(),
      getSystemAlerts(),
      getGlobalTokenStats(),
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(teams),
    ]);

    return successResponse({
      stats,
      topTenants,
      transactionBreakdown,
      alerts,
      globalStats,
      totalUsers: userCount[0]?.count ?? 0,
      totalTeams: teamCount[0]?.count ?? 0,
    });
  } catch (error) {
    return handleRouteError(error, 'Error fetching admin dashboard data');
  }
});
