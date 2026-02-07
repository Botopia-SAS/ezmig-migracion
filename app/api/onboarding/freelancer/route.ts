import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import {
  users,
  freelancersProfiles,
  activityLogs,
  type NewFreelancerProfile,
  ActivityType
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createFreelancer } from '@/lib/freelancers/service';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { freelancerData } = body;

    if (!freelancerData) {
      return Response.json({ error: 'Missing freelancer data' }, { status: 400 });
    }

    // Validate critical field for form preparers
    if (freelancerData.professionalType === 'form_preparer' && !freelancerData.disclaimerAccepted) {
      return Response.json({
        error: 'Disclaimer acceptance is required for form preparers',
        message: 'You must accept the disclaimer to continue as a form preparer'
      }, { status: 400 });
    }

    // Check if user already has a freelancer profile
    const existingProfile = await db
      .select()
      .from(freelancersProfiles)
      .where(eq(freelancersProfiles.userId, session.user.id))
      .limit(1);

    if (existingProfile.length > 0) {
      return Response.json({
        error: 'Freelancer profile already exists',
        message: 'You already have a freelancer profile. Redirecting to dashboard...'
      }, { status: 409 });
    }

    // Create freelancer profile using the service
    const result = await createFreelancer(freelancerData, session.user.id.toString());

    // Update user profile type
    await db
      .update(users)
      .set({
        profileType: 'freelancer',
        name: freelancerData.fullName || 'Freelancer',
        updatedAt: new Date()
      })
      .where(eq(users.id, session.user.id));

    // Log activity (freelancers don't have teams, so teamId is null)
    await db.insert(activityLogs).values({
      userId: session.user.id,
      action: ActivityType.CREATE_PROFILE,
      description: `Created freelancer profile as ${freelancerData.professionalType}`,
      metadata: {
        profileType: 'freelancer',
        professionalType: freelancerData.professionalType,
        freelancerId: result.freelancerId
      },
      ipAddress: request.headers.get('x-forwarded-for') || ''
    });

    return Response.json({
      success: true,
      data: {
        freelancerId: result.freelancerId,
        userId: session.user.id.toString(),
        profileType: 'freelancer',
        professionalType: freelancerData.professionalType
      },
      message: 'Freelancer profile created successfully'
    });

  } catch (error) {
    console.error('POST onboarding/freelancer error:', error);
    return Response.json(
      {
        error: 'Failed to create freelancer profile',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}