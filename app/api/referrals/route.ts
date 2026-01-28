import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserWithTeam } from '@/lib/auth/rbac';
import { db } from '@/lib/db/drizzle';
import { activityLogs, ActivityType } from '@/lib/db/schema';
import {
  createReferralLink,
  getReferralLinksByTeam,
  getReferralLinkUrl,
} from '@/lib/referrals/service';

// Schema for creating a referral link
const createReferralLinkSchema = z.object({
  caseId: z.number().optional(),
  clientId: z.number().optional(),
  expiresAt: z.string().datetime().optional(),
  maxUses: z.number().min(1).max(100).optional(),
  allowedForms: z.array(z.number()).optional(),
  allowedSections: z.array(z.string()).optional(),
});

/**
 * GET /api/referrals
 * List all referral links for the current team
 */
export async function GET() {
  try {
    const userWithTeam = await getUserWithTeam();

    if (!userWithTeam?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userWithTeam.team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const links = await getReferralLinksByTeam(userWithTeam.team.id);

    // Generate full URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const linksWithUrls = links.map((link) => ({
      ...link,
      url: getReferralLinkUrl(link.code, baseUrl),
    }));

    return NextResponse.json({ links: linksWithUrls });
  } catch (error) {
    console.error('Error fetching referral links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral links' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/referrals
 * Create a new referral link
 */
export async function POST(request: NextRequest) {
  try {
    const userWithTeam = await getUserWithTeam();

    if (!userWithTeam?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userWithTeam.team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createReferralLinkSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create the referral link
    const link = await createReferralLink({
      teamId: userWithTeam.team.id,
      caseId: data.caseId,
      clientId: data.clientId,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      maxUses: data.maxUses,
      allowedForms: data.allowedForms,
      allowedSections: data.allowedSections,
      createdBy: userWithTeam.user.id,
    });

    // Log activity
    await db.insert(activityLogs).values({
      teamId: userWithTeam.team.id,
      userId: userWithTeam.user.id,
      action: ActivityType.CREATE_REFERRAL_LINK,
    });

    // Generate full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = getReferralLinkUrl(link.code, baseUrl);

    return NextResponse.json({ link: { ...link, url } }, { status: 201 });
  } catch (error) {
    console.error('Error creating referral link:', error);
    return NextResponse.json(
      { error: 'Failed to create referral link' },
      { status: 500 }
    );
  }
}
