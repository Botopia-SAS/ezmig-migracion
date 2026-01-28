import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  users,
  teamMembers,
  clients,
  type NewUser,
  type NewTeamMember,
} from '@/lib/db/schema';
import { hashPassword, setSession } from '@/lib/auth/session';
import {
  getReferralLinkByCode,
  validateReferralLink,
  recordReferralLinkUsage,
} from '@/lib/referrals/service';
import { notifyClientRegistered } from '@/lib/notifications/service';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  referralCode: z.string().min(6),
});

/**
 * POST /api/auth/register-with-referral
 * Register a new end user via referral link
 * This is a PUBLIC endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, password, name, referralCode } = validationResult.data;

    // 1. Validate the referral link
    const linkValidation = await validateReferralLink(referralCode);
    if (!linkValidation.valid) {
      return NextResponse.json(
        { error: linkValidation.reason || 'Invalid referral link' },
        { status: 400 }
      );
    }

    // 2. Get the referral link details
    const linkInfo = await getReferralLinkByCode(referralCode);
    if (!linkInfo) {
      return NextResponse.json(
        { error: 'Referral link not found' },
        { status: 404 }
      );
    }

    // 3. Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // 4. Create the user
    const passwordHash = await hashPassword(password);
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    const newUser: NewUser = {
      email,
      passwordHash,
      name,
      role: 'end_user',
    };

    const [createdUser] = await db.insert(users).values(newUser).returning();

    if (!createdUser) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // 5. Add user as team member with 'client' role
    const newTeamMember: NewTeamMember = {
      userId: createdUser.id,
      teamId: linkInfo.teamId,
      role: 'client',
    };

    await db.insert(teamMembers).values(newTeamMember);

    // 6. Link user to the client record if one exists
    if (linkInfo.clientId) {
      await db
        .update(clients)
        .set({ userId: createdUser.id })
        .where(
          and(
            eq(clients.id, linkInfo.clientId),
            eq(clients.teamId, linkInfo.teamId)
          )
        );
    }

    // 7. Record the registration usage
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    await recordReferralLinkUsage(linkInfo.id, 'registered', createdUser.id, {
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });

    // 8. Notify team owners about the new registration
    await notifyClientRegistered(
      linkInfo.teamId,
      name,
      email,
      linkInfo.caseId || undefined
    );

    // 9. Set session for the new user
    await setSession(createdUser);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering user with referral:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
