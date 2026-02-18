import { withAdmin } from '@/lib/api/middleware';
import { successResponse, badRequestResponse, notFoundResponse, handleRouteError } from '@/lib/api/response';
import { parseIntParam } from '@/lib/api/validators';
import { db } from '@/lib/db/drizzle';
import { teams, teamMembers, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = withAdmin(async (_req, _user, params) => {
  try {
    const teamId = parseIntParam(params?.id);
    if (teamId === null) {
      return badRequestResponse('Invalid team ID');
    }

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) {
      return notFoundResponse('Team');
    }

    const membersData = await db
      .select({
        id: teamMembers.id,
        role: teamMembers.role,
        userId: teamMembers.userId,
      })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    const members = await Promise.all(
      membersData.map(async (member) => {
        const [userData] = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
          })
          .from(users)
          .where(eq(users.id, member.userId))
          .limit(1);

        return {
          id: member.id,
          role: member.role,
          user: userData,
        };
      })
    );

    return successResponse({
      team: {
        id: team.id,
        name: team.name,
        type: team.type,
        createdAt: team.createdAt,
      },
      members,
    });
  } catch (error) {
    return handleRouteError(error, 'Error fetching tenant details');
  }
});
