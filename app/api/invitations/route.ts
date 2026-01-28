import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { invitations, teamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's team
  const [membership] = await db
    .select({ teamId: teamMembers.teamId, role: teamMembers.role })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  if (!membership) {
    return NextResponse.json({ error: 'No team found' }, { status: 404 });
  }

  // Only owners can see invitations
  if (membership.role !== 'owner') {
    return NextResponse.json({ invitations: [] });
  }

  // Get pending invitations for this team
  const pendingInvitations = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      status: invitations.status,
      createdAt: invitations.invitedAt,
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.teamId, membership.teamId),
        eq(invitations.status, 'pending')
      )
    )
    .orderBy(invitations.invitedAt);

  return NextResponse.json({ invitations: pendingInvitations });
}
