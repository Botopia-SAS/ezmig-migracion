import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { invitations, teams, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Public endpoint to get invitation details (no auth required).
 * Used by the sign-up page to pre-fill the email field.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inviteId = Number.parseInt(id);

    if (Number.isNaN(inviteId)) {
      return NextResponse.json({ error: 'Invalid invitation ID' }, { status: 400 });
    }

    const [result] = await db
      .select({
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
        teamName: teams.name,
        inviterName: users.name,
        inviterEmail: users.email,
      })
      .from(invitations)
      .innerJoin(teams, eq(invitations.teamId, teams.id))
      .innerJoin(users, eq(invitations.invitedBy, users.id))
      .where(
        and(
          eq(invitations.id, inviteId),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (!result) {
      return NextResponse.json({ error: 'Invitation not found or expired' }, { status: 404 });
    }

    return NextResponse.json({
      email: result.email,
      teamName: result.teamName,
      role: result.role,
      inviterName: result.inviterName || result.inviterEmail,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 });
  }
}
