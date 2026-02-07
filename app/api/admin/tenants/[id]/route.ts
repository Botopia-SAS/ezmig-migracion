import { withAdmin } from '@/lib/api/middleware';
import { successResponse, badRequestResponse, notFoundResponse, handleRouteError } from '@/lib/api/response';
import { parseIntParam } from '@/lib/api/validators';
import { getWalletByTeamId, getTransactionHistory } from '@/lib/tokens/service';
import { db } from '@/lib/db/drizzle';
import { teams, teamMembers, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = withAdmin(async (_req, _user, params) => {
  try {
    const teamId = parseIntParam(params?.id);
    if (teamId === null) {
      return badRequestResponse('Invalid team ID');
    }

    // Get team
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) {
      return notFoundResponse('Team');
    }

    // Get wallet
    const wallet = await getWalletByTeamId(teamId);

    // Get members with user info
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

    // Get recent transactions
    const recentTransactions = await getTransactionHistory(teamId, 10);

    return successResponse({
      team: {
        id: team.id,
        name: team.name,
        type: team.type,
        autoReloadEnabled: team.autoReloadEnabled,
        autoReloadThreshold: team.autoReloadThreshold,
        autoReloadPackage: team.autoReloadPackage,
        createdAt: team.createdAt,
      },
      wallet: wallet ? { id: wallet.id, balance: wallet.balance } : { id: 0, balance: 0 },
      members,
      recentTransactions,
    });
  } catch (error) {
    return handleRouteError(error, 'Error fetching tenant details');
  }
});
