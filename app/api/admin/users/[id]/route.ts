import { withAdmin } from '@/lib/api/middleware';
import { successResponse, badRequestResponse, notFoundResponse, handleRouteError } from '@/lib/api/response';
import { parseIntParam } from '@/lib/api/validators';
import { db } from '@/lib/db/drizzle';
import { users, teamMembers, teams, activityLogs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET = withAdmin(async (_req, _user, params) => {
  try {
    const userId = parseIntParam(params?.id);
    if (userId === null) {
      return badRequestResponse('Invalid user ID');
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return notFoundResponse('User');
    }

    // Get team membership
    const [membership] = await db
      .select({
        teamId: teamMembers.teamId,
        role: teamMembers.role,
      })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId))
      .limit(1);

    let teamData = null;
    if (membership) {
      const [team] = await db
        .select({
          id: teams.id,
          name: teams.name,
          type: teams.type,
        })
        .from(teams)
        .where(eq(teams.id, membership.teamId))
        .limit(1);

      if (team) {
        teamData = {
          ...team,
          role: membership.role,
        };
      }
    }

    // Get activity logs
    const logs = await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        ipAddress: activityLogs.ipAddress,
        createdAt: activityLogs.timestamp,
      })
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp))
      .limit(20);

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      team: teamData,
      activityLogs: logs,
    });
  } catch (error) {
    return handleRouteError(error, 'Error fetching user details');
  }
});
