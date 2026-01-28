import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { updateAutoReloadSettings } from '@/lib/tokens/service';
import { db } from '@/lib/db/drizzle';
import { teamMembers, teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET auto-reload settings
export async function GET() {
  try {
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

    // Get team settings
    const [team] = await db
      .select({
        autoReloadEnabled: teams.autoReloadEnabled,
        autoReloadThreshold: teams.autoReloadThreshold,
        autoReloadPackage: teams.autoReloadPackage,
        stripeCustomerId: teams.stripeCustomerId,
      })
      .from(teams)
      .where(eq(teams.id, membership.teamId))
      .limit(1);

    return NextResponse.json({
      enabled: team?.autoReloadEnabled ?? false,
      threshold: team?.autoReloadThreshold ?? 5,
      package: team?.autoReloadPackage ?? '10',
      hasPaymentMethod: !!team?.stripeCustomerId,
      isOwner: membership.role === 'owner',
    });
  } catch (error) {
    console.error('Error fetching auto-reload settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST update auto-reload settings
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, threshold, package: packageTokens } = body;

    // Get user's team and check ownership
    const [membership] = await db
      .select({ teamId: teamMembers.teamId, role: teamMembers.role })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    // Only owners can update auto-reload settings
    if (membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only team owners can update auto-reload settings' }, { status: 403 });
    }

    await updateAutoReloadSettings({
      teamId: membership.teamId,
      enabled: enabled ?? false,
      threshold: threshold ?? 5,
      packageTokens: packageTokens ?? '10',
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating auto-reload settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
