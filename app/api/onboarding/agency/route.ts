import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import {
  users,
  teams,
  teamMembers,
  activityLogs,
  type NewTeam,
  type NewTeamMember,
  ActivityType
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createDefaultReferralLinks } from '@/lib/referrals/service';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agencyData } = body;

    if (!agencyData) {
      return Response.json({ error: 'Missing agency data' }, { status: 400 });
    }

    // Check if user already has a team
    const existingMembership = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, session.user.id))
      .limit(1);

    if (existingMembership.length > 0) {
      return Response.json({
        error: 'User already belongs to a team',
        message: 'You already have a profile created. Redirecting to dashboard...'
      }, { status: 409 });
    }

    // Start transaction
    const userId = session.user.id;

    // Create the team (agency)
    const newTeam: NewTeam = {
      name: agencyData.legalBusinessName || `User ${userId}'s Agency`,
      tenantType: agencyData.agencyType || 'law_firm'
    };

    const [createdTeam] = await db.insert(teams).values(newTeam).returning();

    if (!createdTeam) {
      throw new Error('Failed to create agency');
    }

    // Create team member relationship with owner role
    const newTeamMember: NewTeamMember = {
      userId,
      teamId: createdTeam.id,
      role: 'owner',
      joinedAt: new Date()
    };

    await db.insert(teamMembers).values(newTeamMember);

    // Update user profile type
    await db
      .update(users)
      .set({
        profileType: 'agency',
        name: agencyData.ownerName || agencyData.legalBusinessName,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Create default referral links (one per form type)
    await createDefaultReferralLinks(createdTeam.id, userId);

    // Log activity
    await db.insert(activityLogs).values({
      teamId: createdTeam.id,
      userId,
      action: ActivityType.CREATE_TEAM,
      description: `Created agency: ${createdTeam.name}`,
      ipAddress: request.headers.get('x-forwarded-for') || ''
    });

    // TODO: Create full agency profile with all details
    // This would involve creating the agency profile in a separate agencies table
    // For now, we're just creating the basic team structure

    return Response.json({
      success: true,
      data: {
        teamId: createdTeam.id,
        userId,
        profileType: 'agency'
      },
      message: 'Agency profile created successfully'
    });

  } catch (error) {
    console.error('POST onboarding/agency error:', error);
    return Response.json(
      {
        error: 'Failed to create agency profile',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}