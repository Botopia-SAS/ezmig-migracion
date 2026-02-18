import { withAdmin } from '@/lib/api/middleware';
import { successResponse, handleRouteError } from '@/lib/api/response';
import { db } from '@/lib/db/drizzle';
import { users, teams, activityLogs } from '@/lib/db/schema';
import { sql, desc } from 'drizzle-orm';

export const GET = withAdmin(async () => {
  try {
    const [userCount, teamCount, recentActivity] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(teams),
      db
        .select({
          id: activityLogs.id,
          action: activityLogs.action,
          timestamp: activityLogs.timestamp,
          userName: users.name,
          userEmail: users.email,
          teamName: teams.name,
        })
        .from(activityLogs)
        .leftJoin(users, sql`${activityLogs.userId} = ${users.id}`)
        .leftJoin(teams, sql`${activityLogs.teamId} = ${teams.id}`)
        .orderBy(desc(activityLogs.timestamp))
        .limit(20),
    ]);

    return successResponse({
      totalUsers: userCount[0]?.count ?? 0,
      totalTeams: teamCount[0]?.count ?? 0,
      recentActivity,
    });
  } catch (error) {
    return handleRouteError(error, 'Error fetching admin dashboard data');
  }
});
