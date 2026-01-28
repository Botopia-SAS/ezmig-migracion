import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getWalletByTeamId } from '@/lib/tokens/service';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const wallet = await getWalletByTeamId(membership.teamId);

    return NextResponse.json({
      balance: wallet?.balance ?? 0,
      teamId: membership.teamId,
    });
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
