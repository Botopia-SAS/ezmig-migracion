import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getWalletByTeamId, getTransactionHistory } from '@/lib/tokens/service';
import { db } from '@/lib/db/drizzle';
import { teams, teamMembers, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const teamId = parseInt(id);

    // Get team
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
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

    return NextResponse.json({
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
    console.error('Error fetching tenant details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
